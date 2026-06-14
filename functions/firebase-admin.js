// =================================================================================
// ARCHIVO: functions/firebase-admin.js - INICIALIZACIÓN Y SECRETOS B2B
// =================================================================================

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = getFirestore();
const auth = admin.auth();
const storage = admin.storage();

// CENTRALIZACIÓN DE SECRETOS CORPORATIVOS B2B
const paypalClientId = defineSecret("PAYPAL_CLIENT_ID");
const paypalClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");
const paypalWebhookId = defineSecret("PAYPAL_WEBHOOK_ID");
const paypalMode = defineSecret("PAYPAL_MODE");
const resendApiKey = defineSecret("RESEND_API_KEY");
const adminEmail = defineSecret("ADMIN_EMAIL");

module.exports = { 
    db, 
    auth, 
    storage, 
    admin,
    getDb: () => db, 
    getAuth: () => auth,
    paypalClientId, 
    paypalClientSecret, 
    paypalWebhookId, 
    paypalMode, 
    resendApiKey, 
    adminEmail
};