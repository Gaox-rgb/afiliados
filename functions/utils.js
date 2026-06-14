// ==================================================================================
// ARCHIVO: functions/utils.js - HELPER CENTRALIZADO EXCLUSIVO B2B
// ==================================================================================

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
  try {
    if (typeof secretObj === 'object' && secretObj.value) {
      return secretObj.value();
    }
  } catch (e) {
    const envVar = (typeof secretObj === 'object' ? secretObj.name : secretObj) || fallbackEnv;
    return process.env[envVar] || "";
  }
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
function ensureResendInitialized() {
  if (resend) return true;
  const { Resend } = require("resend");

  let apiKey = "";
  try {
    apiKey = resendApiKey.value();
  } catch (e) {
    apiKey = process.env.RESEND_API_KEY;
  }

  if (apiKey) {
    resend = new Resend(apiKey);
    return true;
  }
  logger.warn("⚠️ FALTA RESEND_API_KEY: Los correos se simularán en logs.");
  return false;
}

async function sendConfirmationEmail(to, emailOptions) {
  const isReady = ensureResendInitialized();
  if (!isReady) {
    logger.log(`📧 [EMAIL SIMULADO B2B] Para: ${to} | Asunto: ${emailOptions.subject}`);
    return;
  }

  try {
    const response = await resend.emails.send({
      from: "Makumoto Afiliados <soporte@makumoto.com>",
      to: [to],
      subject: emailOptions.subject,
      html: emailOptions.html,
    });
    logger.info(`Email corporativo enviado a ${to}. ID: ${response.data.id}`);
  } catch (error) {
    logger.error(`Error enviando correo a ${to}:`, error);
  }
}

// --- 3. PROCESADOR DE PAGOS DE PAYPAL ---
async function getPayPalAccessToken() {
    let clientId = getSecret(paypalClientId);
    let clientSecret = getSecret(paypalClientSecret);
    const mode = getSecret(paypalMode) || "sandbox";

    const baseUrl = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: "POST",
            headers: { 
                "Authorization": `Basic ${authKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ "grant_type": "client_credentials" })
        });

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