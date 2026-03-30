// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO MAKUMOTO®
//  FASE 2: REINTEGRACIÓN FUNCIONAL (ROSTER)
// =======================================================================
// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO MAKUMOTO®
//  "OPERACIÓN GÉNESIS": FLUJO DE INICIACIÓN Y DASHBOARD DINÁMICO
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        portalContainer: document.getElementById('portal-container'),
        logoutButton: document.getElementById('btn-logout'),
    };

    const broadcastTemplates = {
        corporate: [
            { type: 'greeting', label: 'Saludo / Despedida', icon: 'fa-hand-sparkles' },
            { type: 'announcement', label: 'Anuncio Interno', icon: 'fa-bullhorn' },
            { type: 'challenge', label: 'Micro-Reto', icon: 'fa-flag-checkered' },
            { type: 'recognition', label: 'Reconocimiento Público', icon: 'fa-award' }
        ],
        fitness: [
            { type: 'greeting', label: 'Saludo / Motivación', icon: 'fa-hand-sparkles' },
            { type: 'challenge', label: 'Reto del Día', icon: 'fa-trophy' },
            { type: 'announcement', label: 'Anuncio del Gym', icon: 'fa-bullhorn' },
            { type: 'health_tip', label: 'Tip de Entrenamiento', icon: 'fa-lightbulb' }
        ],
        health: [
            { type: 'greeting', label: 'Saludo / Mensaje de Apoyo', icon: 'fa-hand-sparkles' },
            { type: 'reminder', label: 'Recordatorio General (Citas, etc.)', icon: 'fa-bell' },
            { type: 'health_tip', label: 'Tip de Salud', icon: 'fa-notes-medical' },
            { type: 'announcement', label: 'Aviso Importante', icon: 'fa-exclamation-triangle' }
        ]
    };

    // --- GUARDIÁN DE SESIÓN ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("Acceso autorizado. Iniciando 'Operación Génesis'...");
            if (ui.logoutButton) ui.logoutButton.onclick = () => firebase.auth().signOut();
            loadPortalData();
        } else {
            console.warn("Acceso no autorizado. Redirigiendo a index.html");
            window.location.href = 'index.html';
        }
    });

    /**
     * Controlador principal: Llama al backend y decide qué vista renderizar.
     */
    function loadPortalData() {
        ui.portalContainer.innerHTML = `<p class="loader-text" style="text-align: center; padding: 40px 0;"><i class="fas fa-spinner fa-spin"></i> Cargando Centro de Mando...</p>`;
        
        console.log('[DEBUG] Preparando la llamada a getPortalData...');
        const getPortalData = firebase.functions().httpsCallable('getPortalData');

        getPortalData()
            .then(result => {
                console.log('[DEBUG] ¡Llamada completada! Resultado recibido:', result);
                const { company, roster, powerUps } = result.data;

                const validSectors = ['corporate', 'fitness', 'health'];
                const hasValidSector = validSectors.includes(company.sector);

                if (!hasValidSector) {
                    console.log('[DEBUG] Sector no válido o ausente. Renderizando flujo de bienvenida.');
                    renderWelcomeAndSectorChoice(company);
                } else {
                    console.log('[DEBUG] Sector válido. Renderizando dashboard.');
                    renderDashboard(company, roster);
                }
            })
            .catch(error => {
                console.error('[DEBUG] LA LLAMADA FALLÓ. Este es el error:', error);
                ui.portalContainer.innerHTML = `<p class="error-text" style="text-align: center; padding: 40px 0;">Error Crítico: ${error.message}</p>`;
            });
    }

    // [FUNCIONES DE RENDERIZADO DEL FLUJO DE BIENVENIDA OMITIDAS POR BREVEDAD, SIN CAMBIOS]
    function renderWelcomeAndSectorChoice(company) {
        const welcomeHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: 1.8rem; margin-bottom: 1rem;">¡Bienvenido a Makumoto, ${company.name}!</h1>
                <p style="margin-bottom: 2rem;">Para optimizar tu Centro de Mando, primero debemos definir el sector de tu negocio.</p>
                <p style="margin-bottom: 2rem; font-size: 1rem; color: var(--color-primary); font-weight: bold;">Atención: Esta decisión es permanente y no podrá cambiarse.</p>
                <button id="btn-start-setup" class="cta-button" style="padding: 15px 30px; font-size: 1.2rem;">Comenzar Configuración</button>
            </div>
        `;
        ui.portalContainer.innerHTML = welcomeHTML;
        
        // Asignamos el evento al nuevo botón
        document.getElementById('btn-start-setup').onclick = renderSectorSelection;
    }
    function renderSectorSelection() {
        const selectionHTML = `
            <div style="text-align: center;">
                <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Paso 2: Selecciona tu Arena</h2>
                <p style="margin-bottom: 2.5rem; opacity: 0.8;">Esta elección definirá las métricas y herramientas disponibles en tu portal.</p>
                <div id="sector-options-container" class="kpi-grid">
                    <div class="kpi-card action-card sector-card" data-sector="corporate">
                        <div class="value" style="font-size: 2.5rem;"><i class="fas fa-briefcase"></i></div>
                        <div class="label" style="font-size: 1rem; margin-top: 1rem;">Corporativo</div>
                        <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Enfoque en engagement, productividad y cultura organizacional.</p>
                    </div>
                    <div class="kpi-card action-card sector-card" data-sector="fitness">
                        <div class="value" style="font-size: 2.5rem;"><i class="fas fa-dumbbell"></i></div>
                        <div class="label" style="font-size: 1rem; margin-top: 1rem;">Fitness</div>
                        <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Métricas de asistencia, rendimiento físico y retención de miembros.</p>
                    </div>
                    <div class="kpi-card action-card sector-card" data-sector="health">
                        <div class="value" style="font-size: 2.5rem;"><i class="fas fa-heartbeat"></i></div>
                        <div class="label" style="font-size: 1rem; margin-top: 1rem;">Salud y Bienestar</div>
                        <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Seguimiento a la adherencia de planes, citas y bienestar general.</p>
                    </div>
                </div>
            </div>
        `;
        ui.portalContainer.innerHTML = selectionHTML;
        
       document.getElementById('sector-options-container').onclick = handleSectorSelection;
    }

    async function handleSectorSelection(event) {
        const selectedCard = event.target.closest('.sector-card');
        if (!selectedCard) return;

        const sector = selectedCard.dataset.sector;
        
        ui.portalContainer.innerHTML = `<p class="loader-text" style="text-align: center; padding: 40px 0;"><i class="fas fa-save"></i> Guardando tu elección como punto de no retorno...</p>`;

        try {
            const setCompanySector = firebase.functions().httpsCallable('setCompanySector');
            await setCompanySector({ sector: sector });

            // ¡Éxito! En lugar de recargar, llamamos a la nueva pantalla.
            renderInitialArsenalSetup(sector);
        } catch (error) {
            console.error("Error al guardar el sector:", error);
            ui.portalContainer.innerHTML = `<p class="error-text" style="text-align: center; padding: 40px 0;">Error Crítico: ${error.message}. Por favor, recarga la página e intenta de nuevo.</p>`;
        }
    }

    function renderInitialArsenalSetup(sector) {
        const sectorNames = {
            corporate: 'Corporativo',
            fitness: 'Fitness',
            health: 'Salud y Bienestar'
        };
        const templates = broadcastTemplates[sector] || [];
        const arsenalItemsHTML = templates.map(t => `
            <div class="kpi-card" style="text-align: left; padding: 15px;">
                <div class="value" style="font-size: 1.5rem;"><i class="fas ${t.icon}"></i> ${t.label}</div>
            </div>
        `).join('');

        const arsenalHTML = `
            <div style="text-align: center;">
                <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">¡Arsenal para ${sectorNames[sector]} Desbloqueado!</h2>
                <p style="margin-bottom: 2.5rem; opacity: 0.8;">Estas son tus 5 herramientas de comunicación iniciales para conectar con tu tribu.</p>
                <div class="kpi-grid">
                    ${arsenalItemsHTML}
                    <div class="kpi-card" style="text-align: left; padding: 15px;">
                         <div class="value" style="font-size: 1.5rem;"><i class="fas fa-envelope"></i> Mensajes Directos</div>
                    </div>
                </div>
                <button id="btn-goto-dashboard" class="cta-button" style="margin-top: 2.5rem; padding: 15px 30px; font-size: 1.2rem;">Entendido, llévame a mi Centro de Mando</button>
            </div>
        `;
        ui.portalContainer.innerHTML = arsenalHTML;
        document.getElementById('btn-goto-dashboard').onclick = loadPortalData;
    }


    /**
     * Renderiza el dashboard principal una vez que el sector ha sido elegido.
     */
    function renderDashboard(company, roster) {
        const dashboardHTML = `
            <h1 id="portal-title">Centro de Mando: ${company.name}</h1>
            <div class="kpi-card" style="margin-bottom: 2rem; text-align: center; padding: 15px; background: #222;">
                <div class="label" style="font-size: 0.9rem;">TU CÓDIGO DE CONVENIO (para tus miembros)</div>
                <div class="value" style="font-size: 2rem; letter-spacing: 3px;">${company.convenioCode}</div>
            </div>
            
            <div id="dashboard-actions" class="kpi-grid">
                <div class="kpi-card action-card" id="btn-show-broadcast">
                    <div class="value"><i class="fas fa-bullhorn"></i></div>
                    <div class="label">Comunicados a la Tribu</div>
                </div>
                <div class="kpi-card action-card" id="btn-show-direct-messages">
                    <div class="value"><i class="fas fa-envelope"></i></div>
                    <div class="label">Mensajes Directos</div>
                </div>
                <div class="kpi-card action-card" id="btn-show-roster-management">
                    <div class="value"><i class="fas fa-users-cog"></i></div>
                    <div class="label">Gestión de Altas</div>
                </div>
            </div>
            <div id="dashboard-content" style="margin-top: 2rem; border-top: 1px solid #444; padding-top: 2rem;">
                 <p class="placeholder">Selecciona una acción para comenzar.</p>
            </div>
        `;
        ui.portalContainer.innerHTML = dashboardHTML;
        
        document.getElementById('btn-show-broadcast').onclick = () => renderBroadcastConsole(company);
        document.getElementById('btn-show-direct-messages').onclick = () => renderDirectMessagesConsole(roster);
        document.getElementById('btn-show-roster-management').onclick = () => renderRosterManagementConsole();
    }
    
    /**
     * Renderiza la consola para la Gestión de Altas.
     */
    async function renderRosterManagementConsole() {
        const contentContainer = document.querySelector('#dashboard-content');
        contentContainer.innerHTML = `
            <style>
                .master-list-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .master-list-table th, .master-list-table td { padding: 12px; border: 1px solid #333; text-align: left; }
                .master-list-table th { background-color: #2c3e50; }
                .status-active { color: #28a745; font-weight: bold; }
                .status-pending { color: #ffc107; }
            </style>
            <div style="background-color: var(--color-light-dark); padding: 20px; border-radius: 8px;">
                <h3>Gestión de Altas de la Tribu</h3>
                <p>Añade miembros a tu lista maestra. Ellos podrán unirse usando su ID y tu Código de Convenio desde la app.</p>
                <form id="add-member-form" style="display: flex; gap: 10px; margin-top: 1rem; flex-wrap: wrap;">
                    <input type="text" id="member-firstname" placeholder="Nombre(s)" required style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white;">
                    <input type="text" id="member-lastname" placeholder="Apellido(s)" required style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white;">
                    <input type="text" id="member-id" placeholder="ID de Empleado/Cliente" required style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white;">
                    <button type="submit" class="cta-button" style="margin: 0;">Añadir Miembro</button>
                </form>
            </div>
            <div id="master-list-container" style="margin-top: 2rem;">
                <h4>Lista Maestra Actual</h4>
                <div id="master-list-content" class="placeholder"><i class="fas fa-spinner fa-spin"></i> Cargando lista...</div>
            </div>
        `;

        document.getElementById('add-member-form').onsubmit = handleAddMemberSubmit;
        
        try {
            const getCompanyMasterList = firebase.functions().httpsCallable('getCompanyMasterList');
            const result = await getCompanyMasterList();
            const masterList = result.data;
            
            const listContent = document.getElementById('master-list-content');
            if (masterList.length === 0) {
                listContent.innerHTML = '<p>Tu lista maestra está vacía. ¡Añade a tu primer miembro!</p>';
                return;
            }

            const tableRows = masterList.map(member => `
                <tr>
                    <td>${member.id}</td>
                    <td>${member.name}</td>
                    <td><span class="status-${member.status.toLowerCase()}">${member.status}</span></td>
                </tr>
            `).join('');
            
            listContent.innerHTML = `
                <table class="master-list-table">
                    <thead><tr><th>ID de Miembro</th><th>Nombre</th><th>Estado</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `;

        } catch (error) {
            document.getElementById('master-list-content').innerHTML = `<p class="error-text">Error al cargar la lista: ${error.message}</p>`;
        }
    }

    /**
     * Maneja el envío del formulario para añadir un nuevo miembro.
     */
    async function handleAddMemberSubmit(event) {
        event.preventDefault();
        const button = event.target.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-plus"></i> Añadiendo...';

        const payload = {
            firstName: document.getElementById('member-firstname').value,
            lastName: document.getElementById('member-lastname').value,
            memberId: document.getElementById('member-id').value
        };

        try {
            const addMemberToMasterList = firebase.functions().httpsCallable('addMemberToMasterList');
            await addMemberToMasterList(payload);
            event.target.reset(); // Limpiar el formulario
            renderRosterManagementConsole(); // Recargar la vista para mostrar el nuevo miembro
        } catch (error) {
            alert(`Error al añadir miembro: ${error.message}`);
            button.disabled = false;
            button.innerText = 'Añadir Miembro';
        }
    }

    /**
     * Renderiza la consola de Mensajes Directos.
     */
    function renderDirectMessagesConsole(roster) {
        const memberListHTML = roster.map(member => `
            <div class="member-list-item" data-uid="${member.uid}" data-name="${member.name}">
                ${member.name}
            </div>
        `).join('');

        const consoleHTML = `
            <style>
                .dm-container { display: grid; grid-template-columns: 250px 1fr; gap: 20px; height: 60vh; }
                .member-list { background-color: #1a1a1a; border-radius: 8px; padding: 10px; overflow-y: auto; }
                .member-list-item { padding: 10px; border-radius: 5px; cursor: pointer; border-bottom: 1px solid #333; }
                .member-list-item:hover, .member-list-item.active { background-color: var(--color-primary); color: var(--color-dark); font-weight: bold; }
                .chat-view { background-color: var(--color-light-dark); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; }
                .message-history { flex-grow: 1; overflow-y: auto; margin-bottom: 1rem; }
                .message-bubble { background: #333; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px; max-width: 80%; align-self: flex-start; }
                .message-bubble strong { color: var(--color-primary); display: block; margin-bottom: 5px; }
            </style>
            <h3>Mensajes Directos</h3>
            <div class="dm-container">
                <div class="member-list">${memberListHTML}</div>
                <div class="chat-view" id="chat-view-content">
                    <p class="placeholder">Selecciona un miembro de la lista para ver el historial y enviar un mensaje.</p>
                </div>
            </div>
        `;
        document.querySelector('#dashboard-content').innerHTML = consoleHTML;

        document.querySelector('.member-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('member-list-item')) {
                document.querySelectorAll('.member-list-item').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                const targetUid = e.target.dataset.uid;
                const targetName = e.target.dataset.name;
                renderChatView(targetUid, targetName);
            }
        });
    }
    
    /**
     * Renderiza la vista de chat para un miembro específico.
     */
    async function renderChatView(targetUid, targetName) {
        const chatContainer = document.getElementById('chat-view-content');
        chatContainer.innerHTML = `<p class="loader-text"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</p>`;
        
        try {
            const getDirectMessageHistory = firebase.functions().httpsCallable('getDirectMessageHistory');
            const result = await getDirectMessageHistory({ targetUid });
            const history = result.data;

            const historyHTML = history.length > 0
                ? history.map(msg => `
                    <div class="message-bubble">
                        <strong>${msg.title}</strong>
                        <span>${msg.content}</span>
                    </div>`).join('')
                : '<p class="placeholder">No hay mensajes en este historial.</p>';
            
            const chatViewHTML = `
                <div class="message-history">${historyHTML}</div>
                <form id="direct-message-form">
                    <input type="text" id="dm-title" placeholder="Título del mensaje" required style="padding: 10px; width: 100%; margin-bottom: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white;">
                    <textarea id="dm-content" placeholder="Escribe tu mensaje privado aquí..." required rows="3" style="padding: 10px; width: 100%; margin-bottom: 10px; border-radius: 5px; border: 1px solid #444; background: #333; color: white;"></textarea>
                    <button type="submit" class="cta-button" style="width: 100%;">Enviar Mensaje a ${targetName}</button>
                </form>
            `;
            chatContainer.innerHTML = chatViewHTML;
            document.getElementById('direct-message-form').onsubmit = (e) => handleDirectMessageSubmit(e, targetUid, targetName);
        } catch (error) {
            chatContainer.innerHTML = `<p class="error-text">Error al cargar el historial: ${error.message}</p>`;
        }
    }

    /**
     * Maneja el envío de un mensaje directo al backend.
     */
    async function handleDirectMessageSubmit(event, targetUid, targetName) {
        event.preventDefault();
        const button = event.target.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Enviando...';

        const payload = {
            targetUid,
            title: document.getElementById('dm-title').value,
            content: document.getElementById('dm-content').value,
        };

        try {
            const sendDirectMessage = firebase.functions().httpsCallable('sendDirectMessage');
            await sendDirectMessage(payload);
            // Refrescar la vista de chat para mostrar el nuevo mensaje
            renderChatView(targetUid, targetName);
        } catch (error) {
            alert(`Error al enviar mensaje: ${error.message}`);
            button.disabled = false;
            button.innerText = `Enviar Mensaje a ${targetName}`;
        }
    }
    
    /**
     * Renderiza la consola de comunicados.
     */
    function renderBroadcastConsole(company) {
        document.querySelector('#dashboard-content').innerHTML = `
            <div style="background-color: var(--color-light-dark); padding: 20px; border-radius: 8px;">
                <h3>Consola de Transmisiones</h3>
                <p>Envía comunicados a toda tu tribu. Los avisos fijados aparecerán de forma destacada.</p>
                <button id="btn-new-broadcast" class="cta-button" style="margin-top: 1rem;"><i class="fas fa-plus-circle"></i> Enviar Nuevo Comunicado</button>
            </div>
            <div id="broadcast-history" style="margin-top: 2rem;">
                <h4>Historial Reciente</h4>
                <div class="placeholder">El historial de comunicados se mostrará aquí.</div>
            </div>
        `;
        document.getElementById('btn-new-broadcast').onclick = () => renderBroadcastModal(company);
    }
    
    /**
     * Renderiza el modal de dos pasos para crear un comunicado.
     */
    function renderBroadcastModal(company) {
        const templates = broadcastTemplates[company.sector] || [];
        const templateButtonsHTML = templates.map(t => `<button class="triage-btn" data-type="${t.type}" data-label="${t.label}"><i class="fas ${t.icon}"></i> ${t.label}</button>`).join('');

        const modalHTML = `
            <div id="broadcast-modal" class="modal-overlay visible">
                <div class="modal-content" style="background: #1E1E1E; padding: 30px; border-radius: 10px; max-width: 600px; border-top: 5px solid #FFD700;">
                    <span id="close-broadcast-modal" class="modal-close-btn" style="top: 10px; right: 15px; font-size: 2rem; cursor: pointer;">&times;</span>
                    <div id="modal-step-1">
                        <h3>Paso 1: Elige una Plantilla</h3>
                        <div class="triage-buttons" style="flex-direction: column; align-items: stretch; gap: 15px; margin-top: 20px;">${templateButtonsHTML}</div>
                    </div>
                    <div id="modal-step-2" style="display: none; text-align: left;">
                        <h3 id="form-title"></h3>
                        <form id="broadcast-form" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                            <input type="text" id="broadcast-title" placeholder="Título del comunicado" required style="padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;">
                            <textarea id="broadcast-content" placeholder="Escribe tu mensaje aquí..." required rows="5" style="padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;"></textarea>
                            <div><input type="checkbox" id="broadcast-pinned" style="margin-right: 10px;"><label for="broadcast-pinned">Fijar como aviso importante (Tablón)</label></div>
                            <button type="submit" class="cta-button" style="background: var(--color-primary); color: var(--color-dark); border: none; padding: 12px; font-weight: bold;">Enviar Transmisión</button>
                            <button type="button" id="back-to-templates" class="back-link" style="display: block; text-align: center;">&larr; Volver a las plantillas</button>
                        </form>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('broadcast-modal');
        document.getElementById('close-broadcast-modal').onclick = () => modal.remove();
        document.getElementById('back-to-templates').onclick = () => {
            modal.querySelector('#modal-step-2').style.display = 'none';
            modal.querySelector('#modal-step-1').style.display = 'block';
        };

        modal.querySelectorAll('#modal-step-1 .triage-btn').forEach(button => {
            button.onclick = () => {
                const type = button.dataset.type;
                modal.querySelector('#modal-step-1').style.display = 'none';
                modal.querySelector('#modal-step-2').style.display = 'block';
                modal.querySelector('#form-title').innerText = `Nuevo Comunicado: ${button.dataset.label}`;
                const form = modal.querySelector('#broadcast-form');
                form.dataset.type = type;
                form.onsubmit = (e) => handleBroadcastSubmit(e, company);
            };
        });
    }
    
    /**
     * Maneja el envío del formulario de comunicado al backend.
     */
    async function handleBroadcastSubmit(event, company) {
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Enviando...';

        const payload = {
            type: form.dataset.type,
            title: document.getElementById('broadcast-title').value,
            content: document.getElementById('broadcast-content').value,
            isPinned: document.getElementById('broadcast-pinned').checked
        };

        try {
            const createCompanyBroadcast = firebase.functions().httpsCallable('createCompanybroadcast');
            await createCompanyBroadcast(payload);
            alert('¡Comunicado enviado a tu tribu!');
            document.getElementById('broadcast-modal').remove();
            renderBroadcastConsole(company); // Re-renderiza la consola
        } catch (error) {
            console.error("Error al enviar broadcast:", error);
            alert(`Error: ${error.message}`);
            button.disabled = false;
            button.innerText = 'Enviar Transmisión';
        }
    }

    function getMemberLimitFromPlan(planId) { /* ... sin cambios ... */ }
});