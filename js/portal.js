// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO MAKUMOTO®
//  FASE 1: ESTRATEGIA DEL PIZARRÓN (VISUALIZACIÓN MÍNIMA)
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- GUARDIÁN DE SESIÓN ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("Acceso autorizado. Iniciando carga del Pizarrón...");
            document.getElementById('manager-portal').style.display = 'block';
            
            // Asignar evento de logout
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.onclick = () => firebase.auth().signOut();
            }
            
            // Iniciar la carga de datos
            loadPizarronData();

        } else {
            console.warn("Acceso no autorizado. Redirigiendo a index.html");
            window.location.href = 'index.html';
        }
    });

    /**
     * Llama a la Cloud Function y pasa los datos a la función de renderizado.
     */
    async function loadPizarronData() {
        try {
            const getPortalData = firebase.functions().httpsCallable('getPortalData');
            const portalResult = await getPortalData();
            
            console.log("Datos recibidos para el Pizarrón:", portalResult.data);
            const { company, dashboardMetrics } = portalResult.data;
            
            renderPizarron(company, dashboardMetrics);

        } catch (error) {
            document.getElementById('portal-title').textContent = "Error Crítico de Conexión";
            const kpiGrid = document.querySelector('#dashboard-kpis .kpi-grid');
            if (kpiGrid) {
                kpiGrid.innerHTML = `<p style="color: var(--color-secondary);">No se pudo cargar el Pizarrón: ${error.message}</p>`;
            }
            console.error("Fallo catastrófico en loadPizarronData:", error);
        }
    }

    /**
     * Pinta únicamente el título y el dashboard de KPIs. Nada más.
     */
    function renderPizarron(company, metrics) {
        if (!company || !metrics) {
            console.error("Fallo al renderizar: Los datos de compañía o métricas están vacíos.");
            return;
        }

        // 1. Renderizar Títulos
        const portalTitleEl = document.getElementById('portal-title');
        const sectorNameEl = document.getElementById('portal-sector-name');
        
        portalTitleEl.textContent = `Centro de Mando: ${company.name}`;
        sectorNameEl.textContent = `MAKUMOTO® // ${company.sector.toUpperCase()}`;

        // 2. Renderizar Dashboard de KPIs
        const kpiGrid = document.querySelector('#dashboard-kpis .kpi-grid');
        if (kpiGrid) {
            kpiGrid.innerHTML = `
                <div class="kpi-card">
                    <div class="value">${metrics.average.toFixed(1)}</div>
                    <div class="label">Rendimiento Promedio</div>
                </div>
                <div class="kpi-card">
                    <div class="value">${metrics.topMemberName}</div>
                    <div class="label">Miembro Destacado</div>
                </div>
                <div class="kpi-card">
                    <div class="value">${metrics.atRiskCount}</div>
                    <div class="label">Miembros en Riesgo</div>
                </div>
            `;
        }
        
        // Limpiamos el loader de la sección de roster para que no confunda
        const rosterContainer = document.getElementById('roster-container');
        if(rosterContainer) rosterContainer.innerHTML = '';
        
        console.log("¡Pizarrón renderizado con éxito!");
    }
});