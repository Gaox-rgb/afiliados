// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO MAKUMOTO®
//  FASE 2: REINTEGRACIÓN FUNCIONAL (ROSTER)
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- GUARDIÁN DE SESIÓN ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("Acceso autorizado. Iniciando carga del Portal...");
            document.getElementById('manager-portal').style.display = 'block';
            
            // Asignar eventos de la página
            setupEventListeners();
            
            // Iniciar la carga de datos
            loadPortalData();

        } else {
            console.warn("Acceso no autorizado. Redirigiendo a index.html");
            window.location.href = 'index.html';
        }
    });

    /**
     * Llama a la Cloud Function y pasa los datos a la función de renderizado.
     */
    async function loadPortalData() {
        try {
            const getPortalData = firebase.functions().httpsCallable('getPortalData');
            const portalResult = await getPortalData();
            
            console.log("Datos completos recibidos:", portalResult.data);
            const { company, dashboardMetrics, roster } = portalResult.data;
            
            // Orquestador principal de renderizado
            renderPortalHeader(company, dashboardMetrics);
            renderRoster(roster, company.sector);
            renderPowerUps(portalResult.data.powerUps); // <<< Reactivamos el renderizado del Arsenal

        } catch (error) {
            document.getElementById('portal-title').textContent = "Error Crítico de Conexión";
            console.error("Fallo catastrófico en loadPortalData:", error);
        }
    }

    /**
     * Pinta el Pizarrón (título y dashboard).
     */
    function renderPortalHeader(company, metrics) {
        if (!company || !metrics) return;

        document.getElementById('portal-title').textContent = `Centro de Mando: ${company.name}`;
        document.getElementById('portal-sector-name').textContent = `MAKUMOTO® // ${company.sector.toUpperCase()}`;

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
    }

    /**
     * Pinta las filas de miembro (Mobile-First) en su contenedor.
     */
    function renderRoster(roster, sector) {
        const container = document.getElementById('roster-container');
        if (!container) return;

        if (!roster || roster.length === 0) {
            container.innerHTML = '<p>Aún no hay miembros en tu equipo. ¡Usa el formulario para reclutar!</p>';
            return;
        }

        const kpiLabelMap = {
            fitness: 'Asistencia',
            health: 'Adherencia',
            corporate: 'Engagement',
        };
        const kpiLabel = kpiLabelMap[sector] || 'KPI';
        
        const memberRowsHTML = roster.map(member => {
            const isSelf = firebase.auth().currentUser.uid === member.uid;
            const roleSelector = generateRoleSelector(member, isSelf);
            const kpiValue = member.kpi ? member.kpi.value : 'N/A';
            const actionButton = isSelf 
                ? `<button disabled>Tú</button>`
                : `<button data-uid="${member.uid}" data-name="${member.name}">Revocar</button>`;

            return `
            <div class="member-row">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-email">${member.email}</div>
                </div>
                <div class="member-role">
                    <span class="kpi-label">Rol</span>
                    ${roleSelector}
                </div>
                <div class="member-kpi">
                    <span class="kpi-label">${kpiLabel}</span>
                    <span class="kpi-value">${kpiValue}</span>
                </div>
                <div class="member-action">${actionButton}</div>
            </div>`;
        }).join('');

        container.innerHTML = `<div class="roster-grid">${memberRowsHTML}</div>`;
    }

    /**
     * Pinta las filas de Power-Ups (Mobile-First) en su contenedor.
     */
    function renderPowerUps(powerUps) {
        const grid = document.getElementById('power-up-grid');
        if (!grid) return;

        if (!powerUps || powerUps.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:#888;">No hay Power-Ups disponibles para tu sector.</p>';
            return;
        }

        const powerUpsHTML = powerUps.map(pu => {
            const actionHTML = !pu.isOwned 
                ? `<div class="power-up-action"><a href="#" class="power-up-button" data-powerupid="${pu.id}">ADQUIRIR</a></div>` 
                : '';
            
            return `
            <div class="power-up-row">
                ${pu.isOwned ? '<span class="tag-active">ACTIVO</span>' : ''}
                <div class="power-up-icon"><i class="fas ${pu.icon || 'fa-star'}"></i></div>
                <div class="power-up-info">
                    <h3>${pu.name}</h3>
                    <p>${pu.description}</p>
                </div>
                ${actionHTML}
            </div>
            `;
        }).join('');

        // Usamos una clase de lista en lugar de grid para el contenedor
        grid.className = 'power-up-list';
        grid.innerHTML = powerUpsHTML;
    }

    function generateRoleSelector(member, isSelf) {
        if (isSelf || !member.role) return `<strong>${member.role || 'manager'}</strong>`;
        const roles = ['member', 'leader'];
        const options = roles.map(role => `<option value="${role}" ${member.role === role ? 'selected' : ''}>${role}</option>`).join('');
        return `<select class="role-selector" data-uid="${member.uid}" data-current-role="${member.role}">${options}</select>`;
    }

    /**
     * Centraliza todos los manejadores de eventos de la página.
     */
    function setupEventListeners() {
        // Botón de Logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.onclick = () => firebase.auth().signOut();

        // Event Delegation para el Arsenal Estratégico
        const powerUpGrid = document.getElementById('power-up-grid');
        if (powerUpGrid) {
            powerUpGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('power-up-button')) {
                    e.preventDefault();
                    const powerUpId = e.target.dataset.powerupid;
                    alert(`Funcionalidad de compra para '${powerUpId}' se habilitará próximamente.`);
                }
            });
        }
        
        // Formulario de Invitación
        const inviteForm = document.getElementById('invite-form');
        if (inviteForm) {
            inviteForm.onsubmit = async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('invite-email');
                const button = e.target.querySelector('button');
                button.textContent = 'Enviando...';
                button.disabled = true;

                try {
                    const inviteTeamMember = firebase.functions().httpsCallable('inviteTeamMember');
                    const result = await inviteTeamMember({ email: emailInput.value });
                    alert(result.data.message || 'Invitación enviada.');
                    emailInput.value = '';
                    loadPortalData(); // Recargar datos para ver al nuevo miembro
                } catch (error) {
                    alert(`Error: ${error.message}`);
                } finally {
                    button.textContent = 'Enviar Invitación';
                    button.disabled = false;
                }
            };
        }

        // Event Delegation para acciones en la tabla de miembros (Revocar y Cambiar Rol)
        const rosterContainer = document.getElementById('roster-container');
        if(rosterContainer) {
            rosterContainer.addEventListener('click', async (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.dataset.uid) {
                    const memberName = e.target.dataset.name;
                    if (confirm(`¿Seguro que quieres revocar el acceso a ${memberName}?`)) {
                        e.target.textContent = '...'; e.target.disabled = true;
                        try {
                            const removeTeamMember = firebase.functions().httpsCallable('removeTeamMember');
                            await removeTeamMember({ uidToRemove: e.target.dataset.uid });
                            loadPortalData(); // Recargar para ver el cambio
                        } catch (error) {
                            alert(`Error: ${error.message}`);
                            e.target.textContent = 'Revocar'; e.target.disabled = false;
                        }
                    }
                }
            });

            rosterContainer.addEventListener('change', async (e) => {
                if (e.target.classList.contains('role-selector')) {
                    const selector = e.target;
                    const newRole = selector.value;
                    selector.disabled = true;
                    try {
                        const updateTeamMemberRole = firebase.functions().httpsCallable('updateTeamMemberRole');
                        await updateTeamMemberRole({ uidToUpdate: selector.dataset.uid, newRole: newRole });
                        selector.dataset.currentRole = newRole; // Actualizar el estado actual
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                        selector.value = selector.dataset.currentRole; // Revertir al rol anterior
                    } finally {
                        selector.disabled = false;
                    }
                }
            });
        }
    }
});