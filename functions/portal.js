// =================================================================================
// ARCHIVO: functions/portal.js - LÓGICA DE CONTROL Y GESTIÓN CORPORATIVA (B2B)
// =================================================================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, admin } = require("./firebase-admin.js");
const { createPayPalOrder } = require("./utils.js");

const portalOpts = {
  region: "us-central1",
  memory: "256MiB",
  maxInstances: 10,
  cors: true,
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

    let planDetails = {
        name: userData.plan?.planId || "Suscripción Activa",
        memberLimit: 50,
        price: 0
    };

    return {
      company: {
        name: companyData.companyName,
        planDetails: planDetails,
        sector: sector,
        convenioCode: companyData.convenioCode,
        planEndDate: userData.plan?.planEndDate || null,
      },
      roster: roster,
      powerUps: availablePowerUps
    };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Error procesando el panel.");
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