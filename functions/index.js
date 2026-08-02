// =================================================================================
// ARCHIVO: functions/index.js - REGISTRO Y EXPORTACIÓN DE FUNCIONES B2B
// =================================================================================

const portal = require("./portal.js");
const payments = require("./payments.js");

// Grupo Portal B2B
exports.getPortalData = portal.getPortalData;
exports.addMemberToMasterList = portal.addMemberToMasterList;
exports.getCompanyMasterList = portal.getCompanyMasterList;
exports.getMissionCheckIns = portal.getMissionCheckIns;
exports.createCompanyBroadcast = portal.createCompanyBroadcast;
exports.setCompanySector = portal.setCompanySector;

// Grupo Pagos y Licencias B2B
exports.getPayPalConfig = payments.getPayPalConfig;
exports.createAffiliatePaypalOrder = payments.createAffiliatePaypalOrder;
exports.finalizeAffiliatePurchase = payments.finalizeAffiliatePurchase;
exports.resolveManagerEmailByCode = payments.resolveManagerEmailByCode;
exports.getAffiliateCredentialsByOrder = payments.getAffiliateCredentialsByOrder;
exports.sendRecoveryCredentials = payments.sendRecoveryCredentials;
exports.activateAffiliateAccount = payments.activateAffiliateAccount;
exports.paypalWebhookHandler = payments.paypalWebhookHandler;