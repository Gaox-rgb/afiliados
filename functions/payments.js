// =================================================================================
// ARCHIVO: functions/payments.js - PASARELA DE COBROS Y CONTROLADOR B2B
// =================================================================================

const { db, auth, admin } = require("./firebase-admin.js");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const utils = require("./utils.js");
const adminProps = require("./firebase-admin.js");
const { 
    paypalClientId, paypalClientSecret, paypalMode, resendApiKey, adminEmail, paypalWebhookId 
} = adminProps;

const paymentOpts = {
  cors: true,
  region: "us-central1",
  memory: "512MiB",
  maxInstances: 10,
  timeoutSeconds: 60,
  invoker: "public",
  secrets: [paypalClientId, paypalClientSecret, paypalWebhookId, resendApiKey],
};

// Configuración optimizada exclusiva para correo y autenticación (Cura definitiva a CORS por preflight)
const emailOpts = {
  cors: true,
  region: "us-central1",
  memory: "256MiB",
  maxInstances: 10,
  timeoutSeconds: 60,
  invoker: "public",
  secrets: [resendApiKey],
};

exports.getPayPalConfig = onCall({
  region: "us-central1",
  memory: "128MiB",
  invoker: "public",
  secrets: [paypalClientId],
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Acceso denegado.");
  if (process.env.FUNCTIONS_EMULATOR === "true") return { clientId: "MOCK_PAYPAL_CLIENT_ID" };
  return { clientId: paypalClientId.value() };
});

exports.createAffiliatePaypalOrder = onRequest(paymentOpts, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        let params = req.body || {};
        if (req.body?.data) params = req.body.data;

        const { planId, uid, name, email, convenioCode, password } = params;
        if (!planId || !uid) {
            return res.status(400).json({ error: { message: "Faltan parámetros indispensables de compra." } });
        }

        const { PRODUCT_CATALOG } = require("./product-catalog.js");
        const plan = PRODUCT_CATALOG[planId];
        if (!plan) {
            return res.status(404).json({ error: { message: "Plan o membresía no encontrada." } });
        }

        const priceWithIva = (plan.price * 1.16).toFixed(2);
        const customIdPayload = `${planId}|${uid}|${encodeURIComponent(name || "")}|${encodeURIComponent(email || "")}|${convenioCode || ""}|${encodeURIComponent(password || "")}`;
        const isIndividual = plan.type === "individual_plan";
        const returnPage = "success.html";

        if (process.env.FUNCTIONS_EMULATOR === "true") {
            logger.info("[EMULATOR] Generando compra simulada local para desarrollo.");
            const mockToken = "EC-MOCKTOKEN" + Math.floor(100000 + Math.random() * 900000);
            const mockApproveUrl = `http://127.0.0.1:5000/${returnPage}?planId=${planId}&amount=${priceWithIva}&currency=USD&token=${mockToken}`;
            
            await db.collection("pendingB2BOrders").doc(mockToken).set({
                planId,
                uid,
                name,
                email,
                convenioCode,
                password,
                customIdPayload,
                createdAt: new Date()
            });

            return res.status(200).json({ data: { approveUrl: mockApproveUrl } });
        }

        const orderData = {
            intent: "CAPTURE",
            purchase_units: [{
                description: `Suscripción MAKUMOTO: ${plan.name}`,
                amount: { currency_code: "USD", value: priceWithIva },
                custom_id: customIdPayload,
            }],
            application_context: {
                return_url: `https://afiliados.makumoto.com/${returnPage}?planId=${planId}&amount=${priceWithIva}&currency=USD`,
                cancel_url: "https://afiliados.makumoto.com/index.html",
                brand_name: "MAKUMOTO",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
            },
        };

        const order = await utils.createPayPalOrder(orderData);
        const approveUrl = order.links?.find(link => link.rel === "approve")?.href;
        
        if (!approveUrl) {
            return res.status(500).json({ error: { message: "No se pudo obtener la URL de aprobación de PayPal." } });
        }

        await db.collection("pendingB2BOrders").doc(order.id).set({
            planId,
            uid,
            name,
            email,
            convenioCode,
            password,
            customIdPayload,
            createdAt: new Date()
        });
        
        return res.status(200).json({ data: { approveUrl } });

    } catch (error) {
        logger.error("Error catastrófico creando orden B2B:", error);
        return res.status(500).json({ error: { message: error.message || "No se pudo procesar la orden." } });
    }
});

async function sendSyncRequestToCore(syncData) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
        logger.info("[SYNC_EMULATOR] Simulando sincronización con Makumoto Core:", syncData);
        return;
    }
    const coreUrl = "https://syncaffiliatelicense-cliwsxyura-uc.a.run.app";
    try {
        const response = await fetch(coreUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: syncData })
        });
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Core status ${response.status}: ${txt}`);
        }
        logger.info("[SYNC_SUCCESS] Sincronización caliente con el Core completada.");
    } catch (e) {
        logger.error("[SYNC_FAIL] Error de sincronización al Core:", e);
        throw e;
    }
}

async function createAffiliateManager(orderID, email, name, planId, uid = null, preApprovedConvenio = null, chosenPassword = null) {
    const { Timestamp } = require("firebase-admin/firestore");

    const processedRef = db.collection("processedB2BOrders").doc(orderID);
    const isIndividual = planId === "plan_plus" || planId === "arsenal_plus";
    const doc = await processedRef.get();

    if (doc.exists) {
        logger.info(`[REDUNDANCIA] Orden ${orderID} ya procesada. Retornando credenciales...`);
        const procData = doc.data();
        let existingConvenio = preApprovedConvenio || "REGISTRADO";
        if (procData?.userId) {
            const uDoc = await db.collection("users").doc(procData.userId).get();
            if (uDoc.exists) {
                const companyId = uDoc.data().corporateData?.companyId;
                if (companyId) {
                    const cDoc = await db.collection("companies").doc(companyId).get();
                    if (cDoc.exists) existingConvenio = cDoc.data().convenioCode;
                }
            }
        }
        return { email, tempPassword: chosenPassword || "La que elegiste al registrarte", convenioCode: existingConvenio };
    }

    let companyRef = db.collection("companies").doc();
    let convenioCode = preApprovedConvenio ? preApprovedConvenio.toUpperCase() : `MK${companyRef.id.substring(0, 6).toUpperCase()}`;

    let userRecord;
    let finalTempPassword = chosenPassword || "La que elegiste al registrarte";
    try {
        if (uid) {
            userRecord = await admin.auth().getUser(uid);
        } else {
            const tempPassword = Math.random().toString(36).slice(-8);
            finalTempPassword = tempPassword;
            userRecord = await admin.auth().createUser({ email: email, password: tempPassword, displayName: name });
        }
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            logger.info(`[IDEMPOTENCIA] El usuario ${email} ya existe en Auth. Recuperando cuenta...`);
            userRecord = await admin.auth().getUserByEmail(email);
            
            const existingUserDoc = await db.collection("users").doc(userRecord.uid).get();
            if (existingUserDoc.exists) {
                const extData = existingUserDoc.data();
                const companyId = extData.corporateData?.companyId;
                if (companyId) {
                    const companyDoc = await db.collection("companies").doc(companyId).get();
                    if (companyDoc.exists) {
                        logger.info(`[IDEMPOTENCIA] Recuperada compañía ${companyId} con éxito para el test.`);
                        await processedRef.set({ processedAt: new Date(), planId, email, userId: userRecord.uid }, { merge: true });
                        companyRef = db.collection("companies").doc(companyId);
                        convenioCode = companyDoc.data().convenioCode || convenioCode;
                    }
                }
            }
        } else {
            logger.error("[CREATE_MANAGER_FAIL] Error fatal creando usuario auth:", error);
            throw new HttpsError("internal", "No se pudo registrar el gerente administrador.");
        }
    }

    await companyRef.set({
        companyName: name, 
        activePlan: planId,
        powerUps: {}, 
        convenioCode: convenioCode, 
        createdAt: new Date(),
    });
    
    const managerPlanData = {
        partnerName: name,
        planId: "affiliate",
        planStatus: "active"
    };
    
    // Generación del código aleatorio de 6 dígitos de activación
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.collection("users").doc(userRecord.uid).set({
                name: name, 
                email: email, 
                plan: managerPlanData,
                corporateData: { 
                    isAffiliate: true, 
                    role: 'manager', 
                    companyId: companyRef.id,
                    activationCode: activationCode,
                    isActivated: false
                },
                requiresPasswordChange: false, 
                createdAt: Timestamp.now(), // Uso directo del módulo síncrono importado
                tempPassword: finalTempPassword,
            }, { merge: true });

    await processedRef.set({ processedAt: new Date(), planId, email: email, userId: userRecord.uid });
    
    try {
        const planEndDate = new Date();
        planEndDate.setDate(planEndDate.getDate() + 30);
        sendSyncRequestToCore({
            convenioCode: convenioCode,
            companyName: name,
            activePlan: planId,
            status: "active",
            expirationDate: planEndDate.toISOString(),
            userLimit: 50
        }).catch(e => logger.error("[SYNC_FAIL] Error asíncrono de sincronización Core:", e));
    } catch (syncErr) {
        logger.error("[SYNC_CRASH] Excepción en disparo síncrono de sincronización:", syncErr);
    }

   const { PRODUCT_CATALOG } = require("./product-catalog.js");
    const plan = PRODUCT_CATALOG[planId] || { name: planId, price: 0.00 };
    const priceWithIva = (plan.price * 1.16).toFixed(2);
    
    const mxnPrices = {
        "opus_10": 99.00,
        "starter_10": 99.00,
        "nucleo_50": 199.00,
        "growth_50": 199.00,
        "zenith_200": 299.00,
        "business_200": 299.00,
        "master_500": 499.00,
        "enterprise_500": 499.00,
        "plan_plus": 50.00,
        "arsenal_plus": 50.00
    };
    const baseMXN = mxnPrices[planId] || (plan.price * 20.00);
    const mxnWithIva = (baseMXN * 1.16).toFixed(2);
    const purchaseDate = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

    // 1. INTENTAR ENVIAR NOTIFICACIÓN ADMINISTRATIVA DE FORMA AISLADA (try/catch autocontenido)
    const subtotalUSD = plan.price.toFixed(2);
    const ivaUSD = (plan.price * 0.16).toFixed(2);
    const totalUSD = priceWithIva;

    const subtotalMXN = baseMXN.toFixed(2);
    const ivaMXN = (baseMXN * 0.16).toFixed(2);
    const totalMXN = mxnWithIva;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const expirationString = expirationDate.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: '2-digit', month: '2-digit', year: 'numeric' });

    const tableB2C = `
        <div style="background-color: rgba(0, 236, 255, 0.05); border: 1px solid rgba(0, 236, 255, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 0.9rem; line-height: 1.5; text-align: left;">
            <h3 style="color: #00ecff; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid rgba(0, 236, 255, 0.3); padding-bottom: 5px;">Detalles de Compra (Individual):</h3>
            <p style="margin: 4px 0;"><strong>Concepto:</strong> Membresía ${plan.name || planId} (Vigencia 30 Días)</p>
            <p style="margin: 4px 0;"><strong>Vigencia hasta:</strong> ${expirationString}</p>
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${subtotalUSD} USD / $${subtotalMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>IVA (16%):</strong> $${ivaUSD} USD / $${ivaMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>Total Cobrado:</strong> <span style="color: #2ecc71; font-weight: bold;">$${totalUSD} USD / $${totalMXN} MXN</span></p>
            <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: #888; font-style: italic;">Nota: Su comprobante fiscal oficial corresponde al recibo de pago expedido por PayPal.</p>
        </div>
    `;

    const tableB2B = `
        <div style="background-color: rgba(255, 215, 0, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 0.9rem; line-height: 1.5; text-align: left;">
            <h3 style="color: #FFD700; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 215, 0, 0.3); padding-bottom: 5px;">Detalles de Compra (Gerente):</h3>
            <p style="margin: 4px 0;"><strong>Concepto:</strong> Licencia Corporativa ${plan.name || planId} (Vigencia 30 Días)</p>
            <p style="margin: 4px 0;"><strong>Vigencia hasta:</strong> ${expirationString}</p>
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${subtotalUSD} USD / $${subtotalMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>IVA (16%):</strong> $${ivaUSD} USD / $${ivaMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>Total Cobrado:</strong> <span style="color: #2ecc71; font-weight: bold;">$${totalUSD} USD / $${totalMXN} MXN</span></p>
            <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: #888; font-style: italic;">Nota: Su comprobante fiscal oficial corresponde al recibo de pago expedido por PayPal.</p>
        </div>
    `;

    try {
        logger.info(`[MAIL_B2B] Preparando notificación de venta para soporte@makumoto.com...`);
        const supportSubject = isIndividual ? `✅ Nueva Compra Individual (Cliente): ${name}` : `✅ Nuevo Gerente (Cliente): ${name}`;
        const supportHtml = `
            <div style="font-family: sans-serif; background-color: #101010; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #FFD700; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">⚡ NUEVA VENTA REGISTRADA ⚡</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Tipo de Venta:</td>
                        <td style="padding: 10px 0; text-align: right;">${isIndividual ? 'Individual (B2C)' : 'Gerente (B2B)'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Nombre del Comprador:</td>
                        <td style="padding: 10px 0; text-align: right;">${name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Email del Comprador:</td>
                        <td style="padding: 10px 0; text-align: right;">${email}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Plan Adquirido:</td>
                        <td style="padding: 10px 0; text-align: right;">${plan.name || planId}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Precio (IVA Incluido):</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #2ecc71;">$${priceWithIva} USD / $${mxnWithIva} MXN</td>
                    </tr>
                    ${!isIndividual ? `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Código de Convenio:</td>
                        <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 1.1rem; color: #00ecff;">${convenioCode}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold; color: #FFD700;">Fecha de Compra:</td>
                        <td style="padding: 10px 0; text-align: right;">${purchaseDate}</td>
                    </tr>
                </table>
                <hr style="border: 0; border-top: 1px solid #333; margin: 25px 0;">
                <p style="font-size: 0.8rem; text-align: center; opacity: 0.6;">Makumoto Notification System</p>
            </div>
        `;
        await utils.sendConfirmationEmail("soporte@makumoto.com", { subject: supportSubject, html: supportHtml });
        logger.info(`[MAIL_B2B_SUCCESS] Notificación administrativa enviada con éxito.`);
    } catch (adminMailErr) {
        logger.error(`❌ [MAIL_B2B_FAIL] Error crítico al notificar a administración:`, adminMailErr);
    }

    try {
        if (isIndividual) {
            logger.info(`[MAIL_B2C] Preparando envío de credenciales B2C directas para: ${email}...`);
            const clientMailSubject = "🔑 Tus Datos de Acceso Oficiales - Plan Plus MAKUMOTO";
            const clientMailHtml = `
                <div style="font-family: sans-serif; background-color: #1E1E1E; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #00ecff; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #00ecff; text-align: center;">¡Acceso Activado con Éxito!</h1>
                    <p>Hola <b>${name}</b>,</p>
                    <p>Tu cuenta individual ha sido activada de forma segura. Aquí tienes tus datos de acceso oficiales para ingresar a tu suite de 25 herramientas tácticas:</p>
                    <div style="background-color: rgba(0, 236, 255, 0.1); border: 1px solid #00ecff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 5px 0; font-size: 1.15rem;"><strong>Código de Afiliado Plus:</strong> <span style="color: #00ecff; font-size: 1.3rem; letter-spacing: 2px; font-family: monospace; font-weight: bold;">${convenioCode}</span></p>
                        <p style="margin: 5px 0; font-size: 1.15rem;"><strong>Tu Email Registrado:</strong> <span style="color: #00ecff; font-size: 1.2rem;">${email}</span></p>
                    </div>
                    ${tableB2C}
                    <h3 style="color: #00ecff; margin-top: 30px;">Instrucciones de Entrada:</h3>
                    <ol style="line-height: 1.6; padding-left: 20px; font-size: 0.95rem;">
                        <li>Haz clic en el siguiente enlace de acceso directo para ingresar: <br><a href="https://makumoto.com/?view=portal&affiliate=true" target="_blank" style="color: #00ecff; text-decoration: underline; font-weight: bold;">https://makumoto.com/?view=portal&affiliate=true</a></li>
                        <li>Busca la letra <b>"A"</b> que se encuentra en la barra de navegación inferior de tu pantalla y púlsala de inmediato.</li>
                        <li>Esto te llevará al formulario de inicio de sesión. Ahí, pulsa sobre la pestaña o botón de <b>"Plan Individual"</b> o <b>"Plus"</b>.</li>
                        <li>Introduce tu <b>Código de Afiliado Plus</b> (<span style="font-family: monospace;">${convenioCode}</span>) junto a tu <b>Email Registrado</b> (${email}).</li>
                        <li>¡Listo! Accederás de inmediato a tu panel de control de las 25 maravillosas funciones tácticas de bienestar, asistencia y productividad.</li>
                    </ol>
                    <hr style="border: 0; border-top: 1px solid #444; margin: 30px 0;">
                    <p style="font-size: 0.85rem; opacity: 0.7; text-align: center;">Tus Herramientas. Tu Disciplina. &copy; Makumoto</p>
                </div>
            `;
            await utils.sendConfirmationEmail(email, { subject: clientMailSubject, html: clientMailHtml });
            logger.info(`[MAIL_B2C_SUCCESS] Correo de credenciales enviado al comprador.`);
        } else {
            logger.info(`[MAIL_B2B] Preparando envío de código de activación para el gerente: ${email}...`);
            const clientMailSubject = "⚡ Código de Activación de Gerentes o Dueños - MAKUMOTO";
            const clientMailHtml = `
                <div style="font-family: sans-serif; background-color: #1E1E1E; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #FFD700; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #FFD700; text-align: center;">¡Paso Final de Registro!</h2>
                    <p>Hola <b>${name}</b>,</p>
                    <p>Tu pago ha sido completado con éxito. Para verificar y activar tu cuenta corporativa, ingresa el siguiente código de activación de 6 dígitos en tu pantalla de confirmación:</p>
                    <div style="background-color: rgba(255, 215, 0, 0.1); border: 1px solid #FFD700; padding: 15px; border-radius: 8px; font-size: 2.2rem; font-weight: bold; text-align: center; color: #FFD700; letter-spacing: 5px; margin: 25px 0;">
                        ${activationCode}
                    </div>
                    ${tableB2B}
                    <p>Una vez verificado el código en el portal, recibirás un segundo correo con tus datos oficiales de acceso e instructivos para ingresar a tu Centro de Mando.</p>
                </div>
            `;
            await utils.sendConfirmationEmail(email, { subject: clientMailSubject, html: clientMailHtml });
            logger.info(`[MAIL_B2B_SUCCESS] Correo de activación de gerente enviado con éxito.`);
        }
    } catch (buyerMailErr) {
        logger.error(`❌ [MAIL_BUYER_FAIL] Error crítico al enviar el email correspondiente al comprador (${email}):`, buyerMailErr);
    }

    return { email, tempPassword: finalTempPassword, convenioCode };
}

exports.finalizeAffiliatePurchase = onRequest(paymentOpts, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        let params = req.body || {};
        if (req.body?.data) params = req.body.data;

        const { orderID } = params;
        if (!orderID) {
            return res.status(200).json({ data: { success: false, error: "Falta el ID de la orden en la petición." } });
        }

        const processedDoc = await db.collection("processedB2BOrders").doc(orderID).get();
        if (processedDoc.exists) {
            const processedData = processedDoc.data();
            const userId = processedData?.userId;
            
            if (!userId) {
                return res.status(200).json({ data: { success: false, error: "La orden fue procesada pero no contiene ID de usuario." } });
            }

            const userDoc = await db.collection("users").doc(userId).get();
            if (!userDoc.exists) {
                return res.status(200).json({ data: { success: false, error: "No se encontró el registro del gerente." } });
            }

            const userData = userDoc.data();
            const companyId = userData?.corporateData?.companyId;
            if (!companyId) {
                return res.status(200).json({ data: { success: false, error: "El usuario no tiene una compañía asociada." } });
            }

            const companyDoc = await db.collection("companies").doc(companyId).get();
            if (!companyDoc.exists) {
                return res.status(200).json({ data: { success: false, error: "La compañía asociada no fue encontrada." } });
            }

            return res.status(200).json({
                data: {
                    success: true,
                    credentials: {
                        email: userData.email,
                        tempPassword: "La que elegiste al registrarte",
                        convenioCode: companyDoc.data().convenioCode
                    }
                }
            });
        }

        let planId, uid, finalName, finalEmail, preApprovedConvenio, chosenPassword;
        const pendingDoc = await db.collection("pendingB2BOrders").doc(orderID).get();
        if (pendingDoc.exists) {
            const pData = pendingDoc.data();
            planId = pData.planId;
            uid = pData.uid;
            finalName = pData.name;
            finalEmail = pData.email;
            preApprovedConvenio = pData.convenioCode;
            chosenPassword = pData.password;
        }

        if (process.env.FUNCTIONS_EMULATOR === "true" || orderID.startsWith("EC-MOCKTOKEN")) {
            logger.info("[EMULATOR] Procesando finalización local de compra ficticia.");
            if (!finalEmail) {
                return res.status(200).json({ data: { success: false, error: "No se pudieron recuperar las credenciales locales." } });
            }
            const creds = await createAffiliateManager(orderID, finalEmail, finalName, planId, uid, preApprovedConvenio, chosenPassword);
            return res.status(200).json({ data: { success: true, credentials: creds } });
        }

        let orderDetails;
        try {
            orderDetails = await utils.capturePayPalOrder(orderID);
        } catch (error) {
            logger.error("[FINALIZE_CAPTURE_FAIL] Error capturando orden PayPal:", error);
            return res.status(200).json({ data: { success: false, error: `Fallo de pasarela PayPal al capturar: ${error.message}` } });
        }

        if (orderDetails.status === "COMPLETED" || orderDetails.alreadyProcessed) {
            const paypalUser = orderDetails.payer || orderDetails.payment_source?.paypal;
        const email = paypalUser?.email_address;
        const givenName = paypalUser?.name?.given_name || "";
        const surname = paypalUser?.name?.surname || "";
        const name = `${givenName} ${surname}`.trim() || "Cliente Makumoto";
        
        if (!planId) planId = "starter_10";
        if (!uid) uid = null;
        if (!finalEmail) finalEmail = email;
        if (!finalName) finalName = name;

        const customId = orderDetails.purchase_units?.[0]?.custom_id;
        if (customId && customId.includes('|')) {
            const parts = customId.split('|');
            planId = parts[0];
            uid = parts[1];
            if (parts[2]) finalName = decodeURIComponent(parts[2]);
            if (parts[3]) finalEmail = decodeURIComponent(parts[3]);
            if (parts[4]) preApprovedConvenio = parts[4];
            if (parts[5]) chosenPassword = decodeURIComponent(parts[5]);
        } else {
            if (planId === "starter_10") planId = customId || "starter_10";
        }

        if (!finalEmail) {
                return res.status(200).json({ data: { success: false, error: "El email del comprador no pudo ser recuperado." } });
            }

            const creds = await createAffiliateManager(orderID, finalEmail, finalName, planId, uid, preApprovedConvenio, chosenPassword);
            return res.status(200).json({ data: { success: true, credentials: creds } });
        }

        return res.status(200).json({ data: { success: false, error: `Estado de orden PayPal inválido: ${orderDetails.status}` } });
    } catch (error) {
        logger.error("[FATAL_FINALIZE_PURCHASE]", error);
        return res.status(500).json({ error: { message: error.message || "Excepción interna del servidor." } });
    }
});

exports.resolveManagerEmailByCode = onCall({
    region: "us-central1",
    memory: "128MiB",
    invoker: "public"
}, async (request) => {
    const { convenioCode } = request.data || {};

    if (!convenioCode) {
        throw new HttpsError("invalid-argument", "Falta el código de convenio.");
    }

    try {
        const companySnapshot = await db.collection("companies")
            .where("convenioCode", "==", convenioCode.toUpperCase())
            .limit(1)
            .get();

        if (companySnapshot.empty) {
            throw new HttpsError("not-found", "Código de convenio no válido o no encontrado.");
        }

        const companyId = companySnapshot.docs[0].id;
        const userSnapshot = await db.collection("users")
            .where("corporateData.companyId", "==", companyId)
            .where("corporateData.role", "==", "manager")
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            throw new HttpsError("not-found", "No se pudo encontrar un gerente para este código.");
        }

        const userData = userSnapshot.docs[0].data();
        return { email: userData.email };

    } catch (error) {
        logger.error("Error en resolveManagerEmailByCode:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Error interno del servidor.");
    }
});

// Duplicación corrupta removida con éxito.

exports.getAffiliateCredentialsByOrder = onCall(paymentOpts, async (request) => {
    try {
        const { orderID } = request.data || {};
        if (!orderID) return { success: false, error: "Falta el ID de la orden en la petición." };

        const processedDoc = await db.collection("processedB2BOrders").doc(orderID).get();
        if (!processedDoc.exists) {
            return { success: false, error: `No se encontró registro de compra para la orden ${orderID}.` };
        }

        const processedData = processedDoc.data();
        let userId = processedData.userId;
        let userDoc;

        if (userId) {
            userDoc = await db.collection("users").doc(userId).get();
        }

        if (!userDoc || !userDoc.exists) {
            return { success: false, error: `No se encontró el documento de usuario en users para el ID: ${userId}` };
        }
        
        const userData = userDoc.data();
        const { email, tempPassword, corporateData } = userData;

        if (!corporateData || !corporateData.companyId) {
            return { success: false, error: "El usuario recuperado no contiene datos corporativos (corporateData) o un companyId asignado." };
        }

        const companyDoc = await db.collection("companies").doc(corporateData.companyId).get();
        if (!companyDoc.exists) {
            return { success: false, error: `La compañía ${corporateData.companyId} asociada al gerente no existe en Firestore.` };
        }

        const companyData = companyDoc.data();
        return { 
            success: true, 
            credentials: { email, tempPassword, convenioCode: companyData.convenioCode } 
        };
    } catch (error) {
        logger.error("[FATAL_GET_CREDENTIALS]", error);
        return { success: false, error: `Excepción interna al buscar credenciales: ${error.message}`, stack: error.stack };
    }
});

// Actualizada a emailOpts para inmunidad preflight/CORS
exports.sendRecoveryCredentials = onCall(emailOpts, async (request) => {
    const { email, convenioCode, tempPassword } = request.data;
    if (!email || !convenioCode || !tempPassword) {
        throw new HttpsError("invalid-argument", "Faltan datos.");
    }
    
    const clientMail = {
        to: email,
        subject: "Tus Credenciales de Acceso a MAKUMOTO",
        html: `
            <div style="font-family: sans-serif; background-color: #1E1E1E; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #FFD700;">
                <h1 style="color: #FFD700;">Tus credenciales de acceso.</h1>
                <p>Úsalas para acceder a tu Centro de Mando.</p>
                <ul>
                    <li><strong>Código de Convenio:</strong> ${convenioCode}</li>
                    <li><strong>Contraseña Temporal:</strong> ${tempPassword}</li>
                </ul>
            </div>
        `,
    };

    await utils.sendConfirmationEmail(email, clientMail).catch(e => logger.error("Fallo envío recovery", e));
    return { success: true };
});

// NUEVA FUNCIÓN: Verifica el código de activación y envía el Email 2 con las credenciales finales
exports.activateAffiliateAccount = onCall(emailOpts, async (request) => {
    const { email, code } = request.data || {};
    if (!email || !code) {
        throw new HttpsError("invalid-argument", "Faltan parámetros indispensables.");
    }
    
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (userSnapshot.empty) {
        throw new HttpsError("not-found", "No se encontró ningún usuario con ese correo electrónico.");
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.corporateData?.activationCode !== code) {
        throw new HttpsError("permission-denied", "El código de activación ingresado es incorrecto.");
    }
    
    const companyId = userData.corporateData.companyId;
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
        throw new HttpsError("not-found", "La compañía asociada no existe.");
    }
    
    const companyData = companyDoc.data();
    
    // Activar formalmente el estado en base de datos de forma segura (dot-notation)
    await userDoc.ref.update({
        "corporateData.isActivated": true
    });
    
    // EMAIL 2: Envío de las credenciales finales y del instructivo oficial de acceso
    const convenioCode = companyData.convenioCode;
    const password = userData.tempPassword || "La que elegiste al registrarte";
    
    const planId = userData.plan?.planId || "plan_plus";
    const isIndividual = planId === "plan_plus" || planId === "arsenal_plus";

    const { PRODUCT_CATALOG } = require("./product-catalog.js");
    const plan = PRODUCT_CATALOG[planId] || { name: planId, price: 0.00 };
    const priceWithIva = (plan.price * 1.16).toFixed(2);

    const mxnPrices = {
        "opus_10": 99.00,
        "starter_10": 99.00,
        "nucleo_50": 199.00,
        "growth_50": 199.00,
        "zenith_200": 299.00,
        "business_200": 299.00,
        "master_500": 499.00,
        "enterprise_500": 499.00,
        "plan_plus": 50.00,
        "arsenal_plus": 50.00
    };
    const baseMXN = mxnPrices[planId] || (plan.price * 20.00);
    const mxnWithIva = (baseMXN * 1.16).toFixed(2);

    const subtotalUSD = plan.price.toFixed(2);
    const ivaUSD = (plan.price * 0.16).toFixed(2);
    const totalUSD = priceWithIva;

    const subtotalMXN = baseMXN.toFixed(2);
    const ivaMXN = (baseMXN * 0.16).toFixed(2);
    const totalMXN = mxnWithIva;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const expirationString = expirationDate.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: '2-digit', month: '2-digit', year: 'numeric' });

    const tableB2C = `
        <div style="background-color: rgba(0, 236, 255, 0.05); border: 1px solid rgba(0, 236, 255, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 0.9rem; line-height: 1.5; text-align: left;">
            <h3 style="color: #00ecff; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid rgba(0, 236, 255, 0.3); padding-bottom: 5px;">Detalles de Compra (Individual):</h3>
            <p style="margin: 4px 0;"><strong>Concepto:</strong> Membresía ${plan.name || planId} (Vigencia 30 Días)</p>
            <p style="margin: 4px 0;"><strong>Vigencia hasta:</strong> ${expirationString}</p>
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${subtotalUSD} USD / $${subtotalMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>IVA (16%):</strong> $${ivaUSD} USD / $${ivaMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>Total Cobrado:</strong> <span style="color: #2ecc71; font-weight: bold;">$${totalUSD} USD / $${totalMXN} MXN</span></p>
            <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: #888; font-style: italic;">Nota: Su comprobante fiscal oficial corresponde al recibo de pago expedido por PayPal.</p>
        </div>
    `;

    const tableB2B = `
        <div style="background-color: rgba(255, 215, 0, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 0.9rem; line-height: 1.5; text-align: left;">
            <h3 style="color: #FFD700; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 215, 0, 0.3); padding-bottom: 5px;">Detalles de Compra (Gerente):</h3>
            <p style="margin: 4px 0;"><strong>Concepto:</strong> Licencia Corporativa ${plan.name || planId} (Vigencia 30 Días)</p>
            <p style="margin: 4px 0;"><strong>Vigencia hasta:</strong> ${expirationString}</p>
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${subtotalUSD} USD / $${subtotalMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>IVA (16%):</strong> $${ivaUSD} USD / $${ivaMXN} MXN</p>
            <p style="margin: 4px 0;"><strong>Total Cobrado:</strong> <span style="color: #2ecc71; font-weight: bold;">$${totalUSD} USD / $${totalMXN} MXN</span></p>
            <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: #888; font-style: italic;">Nota: Su comprobante fiscal oficial corresponde al recibo de pago expedido por PayPal.</p>
        </div>
    `;

    let mailSubject = "🔑 Tus Datos de Acceso Oficiales - Centro de Mando MAKUMOTO";
    let mailHtml = `
        <div style="font-family: sans-serif; background-color: #1E1E1E; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #FFD700; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FFD700; text-align: center;">¡Tribu Activada con Éxito!</h1>
            <p>Hola <b>${userData.name || 'Gerente'}</b>,</p>
            <p>Tu cuenta corporativa ha sido verificada y activada de forma segura. Aquí tienes tus credenciales de acceso oficiales para ingresar al Centro de Mando:</p>
            <div style="background-color: rgba(255, 215, 0, 0.1); border: 1px solid #FFD700; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Código de Convenio:</strong> <span style="color: #FFD700; font-size: 1.3rem; letter-spacing: 2px;">${convenioCode}</span></p>
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Contraseña:</strong> <span style="color: #FFD700; font-size: 1.3rem;">${password}</span></p>
            </div>
            ${tableB2B}
            <h3 style="color: #FFD700; margin-top: 30px;">Instrucciones de Entrada:</h3>
            <ol style="line-height: 1.6; padding-left: 20px;">
                <li>Visita la web principal: <a href="https://afiliados.makumoto.com" style="color: #FFD700; text-decoration: underline;">afiliados.makumoto.com</a></li>
                <li>Presiona el botón de <b>Acceso de Gerente</b> situado en la barra superior.</li>
                <li>Introduce tu <b>Código de Convenio</b> (${convenioCode}) junto a tu contraseña.</li>
            </ol>
            <hr style="border: 0; border-top: 1px solid #444; margin: 30px 0;">
            <p style="font-size: 0.85rem; opacity: 0.7; text-align: center;">Forjamos Líderes. Creamos Ganadores. &copy; Makumoto</p>
        </div>
    `;

    if (isIndividual) {
        mailSubject = "🔑 Tus Datos de Acceso Oficiales - Plan Plus MAKUMOTO";
        mailHtml = `
            <div style="font-family: sans-serif; background-color: #1E1E1E; color: #E0E0E0; padding: 30px; border-radius: 10px; border-top: 5px solid #00ecff; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #00ecff; text-align: center;">¡Suite Activada con Éxito!</h1>
                <p>Hola <b>${userData.name || 'Emprendedor'}</b>,</p>
                <p>Tu cuenta individual ha sido verificada y activada de forma segura. Aquí tienes tus credenciales de acceso oficiales para ingresar a tu suite de 25 herramientas tácticas:</p>
                <div style="background-color: rgba(0, 236, 255, 0.1); border: 1px solid #00ecff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Código de Afiliado Plus:</strong> <span style="color: #00ecff; font-size: 1.3rem; letter-spacing: 2px; font-family: monospace; font-weight: bold;">${convenioCode}</span></p>
                    <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Tu Email Registrado:</strong> <span style="color: #00ecff; font-size: 1.2rem;">${email}</span></p>
                </div>
                ${tableB2C}
                <h3 style="color: #00ecff; margin-top: 30px;">Instrucciones de Entrada:</h3>
                <ol style="line-height: 1.6; padding-left: 20px;">
                    <li>Haz clic en el siguiente enlace de acceso directo para ingresar o cópialo en tu navegador: <br><a href="https://makumoto.com/?view=portal&affiliate=true" target="_blank" style="color: #00ecff; text-decoration: underline; font-weight: bold;">https://makumoto.com/?view=portal&affiliate=true</a></li>
                    <li>Busca la letra <b>"A"</b> que se encuentra en la barra de navegación inferior de tu pantalla y púlsala de inmediato.</li>
                    <li>Esto te llevará al formulario de inicio de sesión. Ahí, pulsa sobre la pestaña o botón de <b>"Plan Individual"</b> o <b>"Plus"</b>.</li>
                    <li>Introduce tu <b>Código de Afiliado Plus</b> (<span style="font-family: monospace;">${convenioCode}</span>) junto a tu <b>Email Registrado</b> (${email}).</li>
                    <li>¡Listo! Accederás de inmediato a tu panel de control de las 25 maravillosas funciones tácticas de bienestar, asistencia y productividad.</li>
                </ol>
                <hr style="border: 0; border-top: 1px solid #444; margin: 30px 0;">
                <p style="font-size: 0.85rem; opacity: 0.7; text-align: center;">Tus Herramientas. Tu Disciplina. &copy; Makumoto</p>
            </div>
        `;
    }

    const mailOptions = { subject: mailSubject, html: mailHtml };
    await utils.sendConfirmationEmail(email, mailOptions).catch(e => logger.error("Fallo envío Email 2", e));
    
    return { success: true };
});

exports.paypalWebhookHandler = onRequest(paymentOpts, async (req, res) => {
    try {
        const { Timestamp } = require("firebase-admin/firestore");

        const isVerified = await utils.verifyPayPalWebhook(req);
        if (!isVerified) {
            logger.warn("Webhook Handler B2B: Firma inválida. Rechazada.");
            return res.status(401).send("Unauthorized");
        }

        const event = req.body;

        if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
            const resource = event.resource;
            const orderID = resource.id;
            const email = resource.payer.email_address;
            const name = `${resource.payer.name.given_name} ${resource.payer.name.surname}`;
            const customId = resource.purchase_units?.[0]?.custom_id || 
                             resource.custom_id || 
                             resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

            logger.info(`[WH_B2B] Procesando Orden ${orderID}. Plan: ${customId}`);

            if (!customId) {
                logger.error(`[WH_B2B] No se encontró custom_id en la orden ${orderID}`);
                return res.status(200).send("No Custom ID");
            }

            const processedRef = db.collection("processedB2BOrders").doc(orderID);
            const doc = await processedRef.get();
            if (doc.exists) {
                logger.info(`Webhook Handler B2B: Orden ${orderID} ya procesada. Ignorando.`);
                return res.status(200).send("OK");
            }
            
            let planId = "starter_10";
            let uid = null;
            let finalEmail = email;
            let finalName = name;

            let preApprovedConvenio = null;
            let chosenPassword = null;
            if (customId && customId.includes('|')) {
                const parts = customId.split('|');
                planId = parts[0];
                uid = parts[1];
                if (parts[2]) finalName = decodeURIComponent(parts[2]);
                if (parts[3]) finalEmail = decodeURIComponent(parts[3]);
                if (parts[4]) preApprovedConvenio = parts[4];
                if (parts[5]) chosenPassword = decodeURIComponent(parts[5]);
            } else {
                planId = customId || "starter_10";
            }

            await createAffiliateManager(orderID, finalEmail, finalName, planId, uid, preApprovedConvenio, chosenPassword);
            logger.info(`[WH_B2B] ¡ÉXITO! Orden ${orderID} procesada de forma automática.`);
        }

        return res.status(200).send("OK");

    } catch (e) {
        logger.error("Error catastrófico en Webhook Handler B2B:", e);
        return res.status(500).send("Error");
    }
});