// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO MAKUMOTO®
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {

    const btnLogout = document.getElementById('btn-logout');
    const mainPortalContent = document.getElementById('manager-portal');
    const rosterContainer = document.getElementById('roster-container');
    const powerUpGrid = document.getElementById('power-up-grid');

    // --- EVENT DELEGATION para el Arsenal Estratégico ---
    if (powerUpGrid) {
        powerUpGrid.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-contratar')) {
                e.preventDefault(); // Prevenir cualquier acción por defecto del enlace
                const powerUpId = e.target.dataset.powerupid;
                // La función handlePowerUpPurchase no estaba definida, se deja pendiente o se elimina la llamada.
                // await handlePowerUpPurchase(powerUpId, e.target); 
                console.warn('Función handlePowerUpPurchase no implementada.');
            }
        });
    }

    // --- EVENT DELEGATION para acciones en la tabla de miembros ---
    if (rosterContainer) {
        rosterContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const memberUid = e.target.dataset.uid;
                const memberName = e.target.dataset.name;
                
                if (confirm(`¿Estás seguro de que quieres revocar el acceso a ${memberName}? Esta acción no se puede deshacer.`)) {
                    await handleRemoveMember(memberUid, e.target);
                }
            }
        });

        rosterContainer.addEventListener('change', async (e) => {
            if (e.target.classList.contains('role-selector')) {
                const selector = e.target;
                const uidToUpdate = selector.dataset.uid;
                const newRole = selector.value;
                const currentRole = selector.dataset.currentRole;

                if (confirm(`¿Estás seguro de que quieres cambiar el rol de este miembro a "${newRole}"?`)) {
                    await handleUpdateRole(uidToUpdate, newRole, selector);
                } else {
                    selector.value = currentRole;
                }
            }
        });
    }
    
    async function handleUpdateRole(uid, newRole, selectorElement) {
        selectorElement.disabled = true;
        try {
            const updateTeamMemberRole = firebase.functions().httpsCallable('updateTeamMemberRole');
            const result = await updateTeamMemberRole({ uidToUpdate: uid, newRole: newRole });
            alert(result.data.message);
            selectorElement.dataset.currentRole = newRole;
        } catch (error) {
            alert(`Error: ${error.message}`);
            selectorElement.value = selectorElement.dataset.currentRole;
        } finally {
            selectorElement.disabled = false;
        }
    }

    async function handleRemoveMember(uid, buttonElement) {
        buttonElement.textContent = 'Procesando...';
        buttonElement.disabled = true;
        try {
            const removeTeamMember = firebase.functions().httpsCallable('removeTeamMember');
            const result = await removeTeamMember({ uidToRemove: uid });
            alert(result.data.message);
            loadPortalData(); // Recargamos para ver la lista actualizada
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error("Fallo al revocar acceso:", error);
            buttonElement.textContent = 'Revocar';
            buttonElement.disabled = false;
        }
    }

    // --- GUARDIÁN DE SESIÓN ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("Acceso autorizado para:", user.email);
            mainPortalContent.style.display = 'block';
            loadPortalData();
        } else {
            console.warn("Acceso no autorizado. Redirigiendo a index.html");
            window.location.href = 'index.html';
        }
    });

    // --- MANEJADOR DE EVENTOS ---
    if (btnLogout) {
        btnLogout.onclick = async () => {
            await firebase.auth().signOut();
        };
    }

    const inviteForm = document.getElementById('invite-form');
    if (inviteForm) {
        inviteForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('invite-email');
            const email = emailInput.value;
            const button = e.target.querySelector('button');
            const originalButtonText = button.textContent;
            button.textContent = 'Enviando...';
            button.disabled = true;

            try {
                const inviteTeamMember = firebase.functions().httpsCallable('inviteTeamMember');
                const result = await inviteTeamMember({ email: email });
                alert(result.data.message);
                emailInput.value = '';
                loadPortalData();
            } catch (error) {
                alert(`Error: ${error.message}`);
                console.error("Fallo al invitar miembro:", error);
            } finally {
                button.textContent = originalButtonText;
                button.disabled = false;
            }
        };
    }

    const broadcastForm = document.getElementById('broadcast-form');
    if (broadcastForm) {
        broadcastForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Transmitiendo...';

            const payload = {
                type: document.getElementById('broadcast-type').value,
                title: document.getElementById('broadcast-title').value,
                content: document.getElementById('broadcast-content').value,
            };

            try {
                const createCompanyBroadcast = firebase.functions().httpsCallable('createCompanyBroadcast');
                await createCompanyBroadcast(payload);
                alert('¡Transmisión enviada con éxito!');
                e.target.reset();
            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
    }

    async function loadPortalData() {
        const container = document.getElementById('roster-container');
        try {
            const getPortalData = firebase.functions().httpsCallable('getPortalData');
            const portalResult = await getPortalData();
            const { company, roster, powerUps } = portalResult.data;
            
            renderPortal(company, roster, powerUps);

        } catch (error) {
            container.innerHTML = `<p style="color: var(--color-secondary);">Error de conexión con el Centro de Mando: ${error.message}</p>`;
            document.getElementById('portal-title').textContent = "Error de Carga";
            console.error(error);
        }
    }

    function renderPortal(company, roster, powerUps) {
        // ... (Aquí iría la lógica completa de renderPortal, renderRoster, etc.)
        // La pego directamente desde tu archivo refactorizado.
        let config = {};
        switch (company.sector) {
            case 'fitness':
                config = { portalTitle: 'Centro de Coach', rosterTitle: 'Miembros Activos', headers: ['Miembro', 'Email', 'Asistencia (7d)'], logoText: `MAKUMOTO® // ${company.name}` };
                break;
            case 'health':
                config = { portalTitle: 'Portal de Terapeuta', rosterTitle: 'Pacientes en Seguimiento', headers: ['Paciente', 'Email', 'Adherencia al Plan'], logoText: `MAKUMOTO® // ${company.name}` };
                break;
            default:
                config = { portalTitle: 'Panel de Gerente', rosterTitle: 'Miembros del Equipo', headers: ['Empleado', 'Email', 'Rol'], logoText: `MAKUMOTO® // ${company.name}` };
                break;
        }
        document.getElementById('portal-title').textContent = config.portalTitle;
        document.getElementById('roster-title').textContent = config.rosterTitle;
        document.getElementById('portal-sector-name').textContent = config.logoText;
        renderRoster(roster, config);
        renderPowerUps(powerUps);
        activatePowerUpConsoles(powerUps, roster);
    }

    function renderRoster(roster, config) {
        const container = document.getElementById('roster-container');
        if (!roster || roster.length === 0) {
            container.innerHTML = '<p>Aún no hay miembros en tu equipo. ¡Es hora de reclutar!</p>';
            return;
        }
        const headers = [...config.headers, 'XP Acumulado', 'Misiones', 'Acciones'];
        const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
        const tableRows = roster.map(member => {
            const isSelf = firebase.auth().currentUser.uid === member.uid;
            const roleSelector = generateRoleSelector(member, isSelf);
            const actionCell = isSelf 
                ? `<td><button class="btn-action" disabled>Tú</button></td>`
                : `<td><button class="btn-action btn-remove" data-uid="${member.uid}" data-name="${member.name}">Revocar</button></td>`;
            return `<tr><td>${member.name}</td><td>${member.email}</td><td>${roleSelector}</td><td>${member.xp || 0}</td><td>${member.missions || 0}</td>${actionCell}</tr>`;
        }).join('');
        container.innerHTML = `<table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>`;
    }

    function generateRoleSelector(member, isSelf) {
        if (isSelf) return `<strong>${member.role}</strong>`;
        const roles = ['member', 'leader'];
        const options = roles.map(role => `<option value="${role}" ${member.role === role ? 'selected' : ''}>${role}</option>`).join('');
        return `<select class="role-selector" data-uid="${member.uid}" data-current-role="${member.role}">${options}</select>`;
    }

    function activatePowerUpConsoles(powerUps, roster) {
        const impulseConsole = document.getElementById('impulse-console');
        const ownedImpulse = powerUps.find(p => p.id === 'impulse_custom' && p.isOwned);
        if (ownedImpulse && impulseConsole) {
            impulseConsole.style.display = 'block';
            const targetSelect = document.getElementById('challenge-target');
            targetSelect.innerHTML = '<option value="all">Para Todo el Equipo</option>';
            roster.forEach(member => {
                targetSelect.innerHTML += `<option value="${member.uid}">${member.name}</option>`;
            });
            const challengeForm = document.getElementById('challenge-form');
            challengeForm.onsubmit = handleChallengeSubmit;
        }
    }
    
    async function handleChallengeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button');
        button.textContent = 'Lanzando...';
        button.disabled = true;
        const payload = {
            title: form.querySelector('#challenge-title').value,
            description: form.querySelector('#challenge-desc').value,
            targetUid: form.querySelector('#challenge-target').value,
        };
        try {
            const createMicroChallenge = firebase.functions().httpsCallable('createMicroChallenge');
            const result = await createMicroChallenge(payload);
            alert(result.data.message);
            form.reset();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            button.textContent = 'Lanzar Reto';
            button.disabled = false;
        }
    }

    function renderPowerUps(powerUps) {
        const grid = document.getElementById('power-up-grid');
        if (!grid) return;
        if (powerUps.length === 0) {
            grid.innerHTML = "<p>No hay Power-Ups disponibles para tu sector en este momento.</p>";
            return;
        }
        grid.innerHTML = powerUps.map(pu => `
            <div class="power-up-card">
                ${pu.isOwned ? '<span class="tag-active">ACTIVO</span>' : ''}
                <div class="icon"><i class="fas ${pu.icon || 'fa-star'}"></i></div>
                <h3>${pu.name}</h3>
                <p>${pu.description}</p>
                ${!pu.isOwned ? `<a href="#" class="btn-contratar" data-powerupid="${pu.id}">ADQUIRIR PODER</a>` : ''}
            </div>
        `).join('');
    }
});