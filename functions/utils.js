// ==================================================================================
// ARCHIVO: functions/utils.js - HELPER CENTRALIZADO EXCLUSIVO B2B
// ==================================================================================

const dns = require('node:dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const https = require('https');
const { HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const { 
    db, 
    paypalClientId, 
    paypalClientSecret, 
    paypalWebhookId, 
    paypalMode,
    resendApiKey
} = require("./firebase-admin.js");

let resend = null;

function getSecret(secretObj, fallbackEnv = "") {
  const envVar = (typeof secretObj === 'object' ? secretObj.name : secretObj) || fallbackEnv;
  if (process.env[envVar]) {
    return process.env[envVar];
  }
  try {
    if (typeof secretObj === 'object' && secretObj.value) {
      return secretObj.value();
    }
  } catch (e) {}
  return "";
}

// --- 1. SEGURIDAD Y FIREWALL DE ORIGEN ---
/**
 * Bloquea peticiones que no provengan de los dominios B2B autorizados.
 */
function validateRequestOrigin(request) {
  const allowedOrigins = [
    "https://afiliados.makumoto.com",
    "https://afiliados-makumoto.web.app",
    "https://afiliados-makumoto.firebaseapp.com"
  ];
  
  const origin = request.rawRequest.headers.origin;
  const isLocal = origin?.includes("localhost") || origin?.includes("127.0.0.1");

  if (!isLocal && !allowedOrigins.includes(origin)) {
    logger.error(`🚫 ORIGEN BLOQUEADO POR FIREWALL B2B: ${origin}`);
    throw new HttpsError("permission-denied", "Origen no autorizado para operaciones corporativas.");
  }
}

function handleError(error, context) {
  console.error(`❌ Error en '${context}':`, error);
  if (error instanceof HttpsError) throw error;
  const msg = process.env.FUNCTIONS_EMULATOR ? error.message : "Error interno de servidor B2B.";
  throw new HttpsError("internal", msg);
}

// --- 2. COMUNICADOS DE EMAIL (RESEND) ---
function sendEmailViaHttps(apiKey, payload) {
    return new Promise((resolve, reject) => {
        const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        const postData = JSON.stringify(payload);

        const options = {
            hostname: 'api.resend.com',
            port: 443,
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanApiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => { reject(e); });
        req.write(postData);
        req.end();
    });
}

async function sendConfirmationEmail(to, emailOptions) {
  try {
    let apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      apiKey = getSecret(resendApiKey, "RESEND_API_KEY");
    }

    if (!apiKey) {
      logger.error("❌ [REST RESEND] Falla crítica: No se detectó ninguna clave RESEND_API_KEY.");
      return;
    }

    let fromSender = "Makumoto Afiliados <soporte@makumoto.com>";
    let attempt = 1;
    let success = false;

    while (attempt <= 2 && !success) {
      logger.info(`📧 [REST RESEND] Intento ${attempt} con remitente: ${fromSender}`);
      
      const payload = {
        from: fromSender,
        to: [to],
        subject: emailOptions.subject,
        html: emailOptions.html
      };

      try {
        const result = await sendEmailViaHttps(apiKey, payload);
        let responseData;
        try {
          responseData = JSON.parse(result.body);
        } catch (e) {
          responseData = { rawResponse: result.body };
        }

        if (result.statusCode >= 200 && result.statusCode < 300) {
          success = true;
          logger.info(`✅ [REST RESEND EXITO] Correo enviado en intento ${attempt}. ID: ${responseData.id}`);
        } else {
          logger.warn(`⚠️ [REST RESEND INTENTO ${attempt} FALLIDO - HTTP ${result.statusCode}]:`, JSON.stringify(responseData));
          if (attempt === 1) {
            fromSender = "Makumoto Onboarding <onboarding@resend.dev>";
            attempt++;
          } else {
            break;
          }
        }
      } catch (reqErr) {
        logger.error(`❌ [REST RESEND REQ ERROR] Intento ${attempt} falló por red:`, reqErr.message || reqErr);
        if (attempt === 1) {
          fromSender = "Makumoto Onboarding <onboarding@resend.dev>";
          attempt++;
        } else {
          break;
        }
      }
    }

    if (!success) {
      logger.error(`❌ [REST RESEND ERROR DEFINITIVO] Todos los intentos de envío fallaron.`);
    }

  } catch (error) {
    logger.error(`❌ [REST RESEND EXCEPCIÓN] Error crítico en el flujo de envío hacia ${to}:`, error.message || error);
  }
}

// --- 3. PROCESADOR DE PAGOS DE PAYPAL ---
async function getPayPalAccessToken() {
    console.log("[DIAGNOSTICO] 1. Obteniendo Client ID...");
    let clientId = getSecret(paypalClientId);
    console.log("[DIAGNOSTICO] 2. Obteniendo Client Secret...");
    let clientSecret = getSecret(paypalClientSecret);
    const mode = getSecret(paypalMode) || "sandbox";

    console.log("[DIAGNOSTICO] 3. Credenciales cargadas localmente. Modo:", mode);
    const baseUrl = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log("[DIAGNOSTICO] 4. Intentando conectar y hacer fetch a PayPal:", `${baseUrl}/v1/oauth2/token`);

    try {
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: "POST",
            headers: { 
                "Authorization": `Basic ${authKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ "grant_type": "client_credentials" })
        });

        console.log("[DIAGNOSTICO] 5. ¡Respuesta de red recibida de PayPal! Status:", response.status);
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Error de autenticación de PayPal: ${response.status} - ${text}`);
        }

        const data = JSON.parse(text);
        return data.access_token;
    } catch (error) {
        logger.error("[DIAGNOSTICO_PAYPAL_B2B]", error.message);
        throw new Error(`Fallo de conexión con pasarela: ${error.message}`); 
    }
}

async function callPayPal(endpoint, method = 'GET', body = null, requestId = null) {
    const accessToken = await getPayPalAccessToken();
    const mode = getSecret(paypalMode) || "sandbox";
    const baseUrl = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
    if (requestId) headers["PayPal-Request-Id"] = requestId;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { message: text }; }

    if (!response.ok) {
        if (data.name === "ORDER_ALREADY_CAPTURED") return { status: "COMPLETED", alreadyProcessed: true };
        throw new Error(data.message || `PayPal Error ${response.status}`);
    }
    return data;
}

async function createPayPalOrder(orderData) {
    return callPayPal('/v2/checkout/orders', 'POST', orderData);
}

async function getPayPalOrderDetails(orderId) {
    return callPayPal(`/v2/checkout/orders/${orderId}`, 'GET');
}

async function capturePayPalOrder(orderId) {
    try {
        logger.info(`[PAYPAL_B2B] Capturando orden: ${orderId}`);
        return await callPayPal(`/v2/checkout/orders/${orderId}/capture`, 'POST', {}, orderId);
    } catch (error) {
        logger.error("[PAYPAL_CAPTURE_B2B_FAIL]", error);
        throw new HttpsError("internal", `Fallo de captura: ${error.message}`);
    }
}

async function verifyPayPalWebhook(req) {
  try {
    const accessToken = await getPayPalAccessToken();
    const mode = getSecret(paypalMode) || "sandbox";
    const baseUrl = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const webhookId = getSecret(paypalWebhookId);

    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({
        auth_algo: req.headers["paypal-auth-algo"],
        cert_url: req.headers["paypal-cert-url"],
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        transmission_time: req.headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: req.body,
      })
    });
    
    const data = await verifyRes.json();
    return data.verification_status === "SUCCESS";
  } catch (error) {
    return false;
  }
}

module.exports = {
  getPayPalAccessToken,
  getPayPalOrderDetails,
  capturePayPalOrder,
  createPayPalOrder,
  verifyPayPalWebhook,
  sendConfirmationEmail,
  validateRequestOrigin,
  handleError,
  getSecret 
};