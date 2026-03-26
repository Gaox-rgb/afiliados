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
     * Pinta la tabla de miembros en su contenedor.
     */
    function renderRoster(roster, sector) {
        const container = document.getElementById('roster-container');
        if (!container) return;

        if (!roster || roster.length === 0) {
            container.innerHTML = '<p>Aún no hay miembros en tu equipo. ¡Usa el formulario para reclutar!</p>';
            return;
        }

        const kpiHeaderMap = {
            fitness: 'Asistencia (7d)',
            health: 'Adherencia (%)',
            corporate: 'Engagement',
        };
        const kpiHeader = kpiHeaderMap[sector] || 'KPI';
        
        const headers = ['Miembro', 'Email', 'Rol', kpiHeader, 'Acciones'];
        const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');

        const tableRows = roster.map(member => {
            const isSelf = firebase.auth().currentUser.uid === member.uid;
            const roleSelector = generateRoleSelector(member, isSelf);
            const kpiValue = member.kpi ? member.kpi.value : 'N/A';
            const actionCell = isSelf 
                ? `<td><button class="portal-logout-btn" style="background-color: #555; cursor: not-allowed;" disabled>Tú</button></td>`
                : `<td><button class="portal-logout-btn" data-uid="${member.uid}" data-name="${member.name}">Revocar</button></td>`;
            
            return `<tr>
                        <td>${member.name}</td>
                        <td>${member.email}</td>
                        <td>${roleSelector}</td>
                        <td>${kpiValue}</td>
                        ${actionCell}
                    </tr>`;
        }).join('');

        container.innerHTML = `<table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>`;
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