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
  region: "us-central1",
  memory: "512MiB",
  maxInstances: 10,
  timeoutSeconds: 60,
  invoker: "public",
  cors: true,
  secrets: [
    paypalClientId, 
    paypalClientSecret, 
    paypalMode, 
    resendApiKey, 
    adminEmail,
    paypalWebhookId
  ],
};

exports.getPayPalConfig = onCall({
  region: "us-central1",
  memory: "128MiB",
  cors: true,
  invoker: "public",
  secrets: [paypalClientId],
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Acceso denegado.");
  if (process.env.FUNCTIONS_EMULATOR === "true") return { clientId: "MOCK_PAYPAL_CLIENT_ID" };
  return { clientId: paypalClientId.value() };
});

exports.createAffiliatePaypalOrder = onCall(paymentOpts, async (request) => {
    try {
        const { planId } = request.data;
        if (!planId) {
            throw new HttpsError("invalid-argument", "Falta el ID del plan.");
        }

        const { PRODUCT_CATALOG } = require("./product-catalog.js");
        const plan = PRODUCT_CATALOG[planId];
        if (!plan || plan.type !== "affiliate_plan") {
            throw new HttpsError("not-found", "Plan corporativo no encontrado.");
        }

        const orderData = {
            intent: "CAPTURE",
            purchase_units: [{
                description: `Suscripción MAKUMOTO Afiliados: ${plan.name}`,
                amount: { currency_code: "USD", value: plan.price },
                custom_id: planId,
            }],
            application_context: {
                return_url: `https://afiliados.makumoto.com/success.html?planId=${planId}&amount=${plan.price}&currency=USD`,
                cancel_url: "https://afiliados.makumoto.com/index.html",
                brand_name: "MAKUMOTO",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
            },
        };

        const order = await utils.createPayPalOrder(orderData);
        const approveUrl = order.links?.find(link => link.rel === "approve")?.href;
        
        if (!approveUrl) {
            throw new HttpsError("internal", "No se pudo obtener la URL de aprobación de PayPal.");
        }
        
        return { approveUrl };

    } catch (error) {
        logger.error("Error catastrófico creando orden B2B:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "No se pudo procesar la orden.");
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

async function createAffiliateManager(orderID, email, name, planId) {
    const { Timestamp } = require("firebase-admin/firestore");

    const processedRef = db.collection("processedB2BOrders").doc(orderID);
    const doc = await processedRef.get();

    if (doc.exists) {
        throw new HttpsError('aborted', 'Esta orden ya ha sido procesada anteriormente.');
    }

    const companyRef = db.collection("companies").doc();
    const convenioCode = `MK${companyRef.id.substring(0, 6).toUpperCase()}`;

    const tempPassword = Math.random().toString(36).slice(-8);
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({ email: email, password: tempPassword, displayName: name });
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'El correo ya está registrado.');
        }
        throw error;
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
    
    await db.collection("users").doc(userRecord.uid).set({
        name: name, 
        email: email, 
        plan: managerPlanData,
        corporateData: { isAffiliate: true, role: 'manager', companyId: companyRef.id },
        requiresPasswordChange: true, 
        createdAt: Timestamp.now(), 
        tempPassword: tempPassword,
    }, { merge: true });

    await processedRef.set({ processedAt: new Date(), planId, email, userId: userRecord.uid });
    
    // --- DISPARO DE SINCRONIZACIÓN AUTOMÁTICA EN TIEMPO REAL HACIA EL CORE ---
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + 30); // Límite estándar de 30 días de vigencia

    // Sincronizar de forma asíncrona para no retrasar la carga de la pantalla
    sendSyncRequestToCore({
        convenioCode: convenioCode,
        companyName: name,
        activePlan: planId,
        status: "active",
        expirationDate: planEndDate.toISOString(),
        userLimit: 50 // Límite de miembros de la tribu
    }).catch(e => logger.error("[SYNC_FAIL] No se pudo sincronizar de forma caliente.", e));

    const supportMail = { to: "soporte@makumoto.com", subject: `✅ Nuevo Gerente (Cliente): ${name}`, html: `<p>Venta B2B: ${name} (${email}) compró el plan: ${planId}. Código: ${convenioCode}</p>` };
    utils.sendConfirmationEmail(supportMail.to, { subject: supportMail.subject, html: supportMail.html }).catch(e => logger.error("Fallo email a soporte", e));
    
    const clientMail = { to: email, subject: "Tus credenciales de Makumoto", html: `<p>Hola ${name}, bienvenido. Tu código de acceso es <b>${convenioCode}</b> y tu contraseña temporal es <b>${tempPassword}</b>.</p>` };
    utils.sendConfirmationEmail(clientMail.to, { subject: clientMail.subject, html: clientMail.html }).catch(e => logger.error("Fallo email al cliente", e));

    return { email, tempPassword, convenioCode };
}

exports.finalizeAffiliatePurchase = onCall(paymentOpts, async (request) => {
    const { orderID } = request.data;
    if (!orderID) throw new HttpsError("invalid-argument", "Falta el ID de la orden.");

    let orderDetails;
    try {
        orderDetails = await utils.capturePayPalOrder(orderID);
    } catch (error) {
        throw new HttpsError('aborted', 'El pago no pudo ser verificado.');
    }

    if (orderDetails.status !== "COMPLETED") {
        throw new HttpsError("failed-precondition", "Pago no completado.");
    }
    
    const email = orderDetails.payer.email_address;
    const name = `${orderDetails.payer.name.given_name} ${orderDetails.payer.name.surname}`;
    const planId = orderDetails.purchase_units[0].custom_id;

    if (!planId) throw new HttpsError('data-loss', 'ID del plan no recuperado.');

    return await createAffiliateManager(orderID, email, name, planId);
});

exports.getManagerEmailByCode = onCall({
    region: "us-central1",
    memory: "128MiB",
    cors: true,
    invoker: "public",
}, async (request) => {
    const { convenioCode } = request.data;
    if (!convenioCode) {
        throw new HttpsError("invalid-argument", "Falta el código de convenio.");
    }

    const companySnapshot = await db.collection("companies").where("convenioCode", "==", convenioCode.toUpperCase()).limit(1).get();

    if (companySnapshot.empty) {
        throw new HttpsError("not-found", "Código de convenio no válido o no encontrado.");
    }

    const companyId = companySnapshot.docs[0].id;
    const userSnapshot = await db.collection("users")
                              .where("corporateData.companyId", "==", companyId)
                              .where("corporateData.role", "==", "manager")
                              .limit(1).get();

    if (userSnapshot.empty) {
        throw new HttpsError("internal", "No se pudo encontrar un gerente para este código.");
    }

    const userData = userSnapshot.docs[0].data();
    return { email: userData.email };
});

exports.getAffiliateCredentialsByOrder = onCall(paymentOpts, async (request) => {
    const { orderID } = request.data;
    if (!orderID) throw new HttpsError("invalid-argument", "Falta el ID de la orden.");

    const processedDoc = await db.collection("processedB2BOrders").doc(orderID).get();
    if (!processedDoc.exists) {
        throw new HttpsError("not-found", "No se encontró registro para esta orden.");
    }

    const processedData = processedDoc.data();
    let userId = processedData.userId;
    let userDoc;

    if (userId) {
        userDoc = await db.collection("users").doc(userId).get();
    }

    if (!userDoc || !userDoc.exists) {
        throw new HttpsError("not-found", `No se encontró un usuario asociado para la orden ${orderID}.`);
    }
    
    const userData = userDoc.data();
    const { email, tempPassword, corporateData } = userData;

    const companyDoc = await db.collection("companies").doc(corporateData.companyId).get();
    if (!companyDoc.exists) {
        throw new HttpsError("not-found", `No se encontró la compañía.`);
    }

    const companyData = companyDoc.data();
    return { email, tempPassword, convenioCode: companyData.convenioCode };
});

exports.sendRecoveryCredentials = onCall(paymentOpts, async (request) => {
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
            
            // Ejecutamos la creación automática del Gerente
            await createAffiliateManager(orderID, email, name, customId);
            logger.info(`[WH_B2B] ¡ÉXITO! Orden ${orderID} procesada de forma automática.`);
        }

        return res.status(200).send("OK");

    } catch (e) {
        logger.error("Error catastrófico en Webhook Handler B2B:", e);
        return res.status(500).send("Error");
    }
});