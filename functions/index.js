// =================================================================================
// ARCHIVO: functions/index.js - REGISTRO Y EXPORTACIÓN DE FUNCIONES B2B
// =================================================================================

const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({
  region: "us-central1",
  cors: true, // <--- HABILITA CORS GLOBAL AUTOMÁTICO EN LA INFRAESTRUCTURA DE GOOGLE
});

const functionGroups = {
  portal: "./portal",
  payments: "./payments",
};

const functionManifest = {
    portal: [
        'getPortalData', 
        'addMemberToMasterList', 
        'getCompanyMasterList', 
        'getMissionCheckIns', 
        'createCompanyBroadcast',
        'setCompanySector'
    ],
    payments: [
        'getPayPalConfig', 
        'createAffiliatePaypalOrder', 
        'finalizeAffiliatePurchase', 
        'getManagerEmailByCode', 
        'getAffiliateCredentialsByOrder',
        'sendRecoveryCredentials',
        'paypalWebhookHandler'
    ]
};

for (const group in functionManifest) {
    const filePath = functionGroups[group];
    if (!filePath) continue;

    functionManifest[group].forEach(functionName => {
        Object.defineProperty(exports, functionName, {
            get: () => {
                const module = require(filePath);
                return module[functionName];
            },
            enumerable: true,
            configurable: true
        });
    });
}