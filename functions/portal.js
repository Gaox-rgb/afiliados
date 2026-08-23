// =================================================================================
// ARCHIVO: functions/portal.js - LÓGICA DE CONTROL Y GESTIÓN CORPORATIVA (B2B)
// =================================================================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, admin } = require("./firebase-admin.js");
const { createPayPalOrder } = require("./utils.js");
const { PRODUCT_CATALOG } = require("./product-catalog.js");

const portalOpts = {
  cors: true,
  region: "us-central1",
  memory: "256MiB",
  maxInstances: 10,
  invoker: "public",
};

exports.getPortalData = onCall(portalOpts, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Acceso denegado.");
  }

  const userId = request.auth.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "No se encontró el registro del usuario.");
    }
    const userData = userDoc.data();
    const corporateData = userData.corporateData;

    if (!corporateData || corporateData.role !== "manager") {
      throw new HttpsError("permission-denied", "No tienes permisos de administrador.");
    }
    const companyId = corporateData.companyId;

    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      throw new HttpsError("not-found", "La empresa no fue encontrada.");
    }
    const companyData = companyDoc.data();
    const sector = companyData.sector || '';

    const rosterSnapshot = await db.collection("users").where("corporateData.companyId", "==", companyId).get();
    
    const roster = rosterSnapshot.docs.map(doc => {
        const memberData = doc.data();
        return {
            uid: doc.id,
            name: memberData.name || "Sin Nombre",
            email: memberData.email,
            role: memberData.corporateData?.role || 'member'
        };
    });

    const ownedPowerUps = companyData.powerUps || {};
    let availablePowerUps = [];
    if (sector) {
        const catalogSnapshot = await db.collection("powerUpCatalog").where("targetSectors", "array-contains", sector).get();
        catalogSnapshot.forEach(doc => {
            availablePowerUps.push({ id: doc.id, ...doc.data(), isOwned: ownedPowerUps[doc.id] === true });
        });
    }

    const planId = companyData.activePlan || "opus_10";
            const catalogItem = PRODUCT_CATALOG[planId] || { name: "Plan Opus 10", price: 5.00, affiliateLimit: 10 };

            const mxnPrices = {
                "opus_10": 99.00,
                "starter_10": 99.00,
                "nucleo_50": 199.00,
                "growth_50": 199.00,
                "zenith_200": 299.00,
                "business_200": 299.00,
                "master_500": 499.00,
                "enterprise_500": 499.00
            };

            const baseUSD = catalogItem.price || 5.00;
            const baseMXN = mxnPrices[planId] || (baseUSD * 20.00);

            const usdWithIva = (baseUSD * 1.16).toFixed(2);
            const mxnWithIva = (baseMXN * 1.16).toFixed(2);

            let cleanPlanName = catalogItem.name || "Plan Opus 10";
            if (cleanPlanName.includes("Plan Opus") || cleanPlanName.includes("opus_10")) cleanPlanName = "Plan Opus 10";
            else if (cleanPlanName.includes("Plan Núcleo") || cleanPlanName.includes("Plan Nucleo") || cleanPlanName.includes("nucleo_50")) cleanPlanName = "Plan Núcleo 50";
            else if (cleanPlanName.includes("Plan Zenith") || cleanPlanName.includes("zenith_200")) cleanPlanName = "Plan Zenith 200";
            else if (cleanPlanName.includes("Plan Master") || cleanPlanName.includes("master_500")) cleanPlanName = "Plan Master 500";

            let planDetails = {
                name: cleanPlanName,
                memberLimit: catalogItem.affiliateLimit || 10,
                price: `${usdWithIva} USD / $${mxnWithIva} MXN`
            };

            let planEndDate = null;
            if (userData.createdAt) {
                const createdDate = typeof userData.createdAt.toDate === "function" 
                    ? userData.createdAt.toDate() 
                    : new Date(userData.createdAt._seconds * 1000);
                const endDate = new Date(createdDate);
                endDate.setDate(endDate.getDate() + 30);
                planEndDate = endDate.toISOString();
            }

            return {
              company: {
                name: companyData.companyName,
                planDetails: planDetails,
                sector: sector,
                convenioCode: companyData.convenioCode,
                planEndDate: planEndDate,
              },
              roster: roster,
              powerUps: availablePowerUps
            };

 } catch (error) {
            console.error("❌ ERROR DETECTADO EN GETPORTALDATA:", error);
            if (error instanceof HttpsError) throw error;
            throw new HttpsError("internal", `Fallo interno en el portal: ${error.message}. Stack: ${error.stack}`);
          }
        });

exports.addMemberToMasterList = onCall(portalOpts, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticación requerida.");
    const managerId = request.auth.uid;
    const { firstName, lastName, memberId } = request.data;

    if (!firstName || !lastName || !memberId) {
        throw new HttpsError("invalid-argument", "Campos incompletos.");
    }

    try {
        const managerDoc = await db.collection("users").doc(managerId).get();
        if (!managerDoc.exists || managerDoc.data().corporateData?.role !== 'manager') {
            throw new HttpsError("permission-denied", "Solo administradores.");
        }

        const companyId = managerDoc.data().corporateData.companyId;
        const memberRef = db.collection("companies").doc(companyId).collection("employees").doc(memberId.toString());
        const memberDoc = await memberRef.get();

        if (memberDoc.exists) {
            throw new HttpsError("already-exists", "ID de miembro ya registrado.");
        }

        await memberRef.set({
            name: `${firstName} ${lastName}`,
            firstName: firstName,
            lastName: lastName,
            addedBy: managerId,
            addedAt: new Date(),
            claimedBy: null,
        });

        return { success: true };

    } catch (error) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "No se pudo añadir al miembro.");
    }
});

exports.getCompanyMasterList = onCall(portalOpts, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticación requerida.");
    const managerId = request.auth.uid;

    try {
        const managerDoc = await db.collection("users").doc(managerId).get();
        if (!managerDoc.exists || managerDoc.data().corporateData?.role !== 'manager') {
            throw new HttpsError("permission-denied", "Acción no autorizada.");
        }
        const companyId = managerDoc.data().corporateData.companyId;

        const snapshot = await db.collection("companies").doc(companyId).collection("employees").orderBy("addedAt", "desc").get();

        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                status: data.claimedBy ? 'Activo' : 'Pendiente'
            };
        });
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Error al leer lista.");
    }
});

exports.getMissionCheckIns = onCall(portalOpts, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticación requerida.");
    const managerId = request.auth.uid;

    try {
        const managerDoc = await db.collection("users").doc(managerId).get();
        if (!managerDoc.exists || managerDoc.data().corporateData?.role !== 'manager') {
            throw new HttpsError("permission-denied", "Acción no autorizada.");
        }
        const companyId = managerDoc.data().corporateData.companyId;

        const snapshot = await db.collection("companies").doc(companyId).collection("checkIns").orderBy("timestamp", "desc").limit(100).get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userName: data.userName,
                description: data.description,
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                timestamp: data.timestamp.toDate().toISOString(),
            };
        });

    } catch (error) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "No se pudieron obtener check-ins.");
    }
});

exports.createCompanyBroadcast = onCall(portalOpts, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticación requerida.");
    const managerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!managerDoc.exists || managerDoc.data().corporateData?.role !== 'manager') {
        throw new HttpsError("permission-denied", "Acción denegada.");
    }
    const companyId = managerDoc.data().corporateData.companyId;
    const { type, title, content, isPinned } = request.data;

    const broadcast = {
        type,
        title,
        content,
        author: managerDoc.data().name || 'Gerencia',
        createdAt: new Date(),
        isActive: true,
        isPinned: isPinned === true,
    };

    await db.collection('companies').doc(companyId).collection('broadcasts').add(broadcast);
    return { success: true };
});

exports.setCompanySector = onCall(portalOpts, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Autenticación requerida.");
    const managerId = request.auth.uid;
    const { sector } = request.data;

    const allowedSectors = ['corporate', 'fitness', 'health'];
    if (!sector || !allowedSectors.includes(sector)) {
        throw new HttpsError("invalid-argument", "Sector no válido.");
    }

    try {
        const managerDoc = await db.collection("users").doc(managerId).get();
        if (!managerDoc.exists || managerDoc.data().corporateData?.role !== 'manager') {
            throw new HttpsError("permission-denied", "Privilegios insuficientes.");
        }

        const companyId = managerDoc.data().corporateData.companyId;
        const companyRef = db.collection("companies").doc(companyId);
        const companyDoc = await companyRef.get();

        if (companyDoc.data().sector) {
            throw new HttpsError("failed-precondition", "Sector ya establecido.");
        }

        await companyRef.update({ sector: sector });
        return { success: true };

    } catch (error) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Error al configurar sector.");
    }
});