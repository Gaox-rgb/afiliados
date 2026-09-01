// =======================================================================
//  NÚCLEO DEL CENTRO DE MANDO Makumoto
//  "OPERACIÓN GÉNESIS": FLUJO DE INICIACIÓN Y DASHBOARD DINÁMICO
// =======================================================================
/**
 * Crea u obtiene un contenedor dinámico posicionado inmediatamente debajo de la tarjeta clickeada (Ámbito Global).
 * Soporta conmutación (Toggle): Si se presiona el bloque activo, se cierra.
 */
function getDashboardContentContainer(buttonId) {
    const existingPanel = document.getElementById('active-panel-container');
    if (existingPanel) {
        const openedUnder = existingPanel.dataset.activeButton;
        existingPanel.remove();

        // Limpiar el enfoque visual de todos los botones
        document.querySelectorAll('.action-card').forEach(card => {
            card.style.border = "none";
            card.style.boxShadow = "none";
        });

        // Si se presionó el mismo botón, se cierra y retorna un contenedor huérfano para evitar colisiones
        if (openedUnder === buttonId) {
            return document.createElement('div');
        }
    }

    const clickedCard = document.getElementById(buttonId);
    if (!clickedCard) return document.getElementById('dashboard-content');

    const panelContainer = document.createElement('div');
    panelContainer.id = 'active-panel-container';
    panelContainer.dataset.activeButton = buttonId; // Almacenar el ID del botón activo
    panelContainer.style.cssText = "grid-column: 1 / -1; width: 100%; margin-top: 1rem; margin-bottom: 1rem; transition: all 0.3s ease;";
    
    clickedCard.insertAdjacentElement('afterend', panelContainer);

    clickedCard.style.border = "2px solid var(--color-primary)";
    clickedCard.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.2)";

    setTimeout(() => {
        panelContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    return panelContainer;
}

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        portalContainer: document.getElementById('portal-container'),
        logoutButton: document.getElementById('btn-logout-footer'),
    };

    const functions = firebase.app().functions("us-central1");

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

    // Contenedor dinámico configurado a nivel global.

    /**
     * Renderiza el formulario de comunicados en línea para una plantilla del Arsenal.
     */
    function renderInlineBroadcastForm(type, label, company) {
        const contentContainer = getDashboardContentContainer('btn-arsenal-' + type);
        contentContainer.innerHTML = `
            <div style="background: var(--color-light-dark); padding: 25px; border-radius: 10px; border-top: 3px solid var(--color-primary); margin-top: 15px; position: relative; text-align: left;">
                <span id="close-inline-broadcast" style="position: absolute; top: 10px; right: 15px; cursor: pointer; font-size: 1.5rem; color: #888;">&times;</span>
                <h3>Nuevo Comunicado: ${label}</h3>
                <form id="inline-broadcast-form" data-type="${type}" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                    <input type="text" id="inline-broadcast-title" placeholder="Título del comunicado" required style="padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;">
                    <textarea id="inline-broadcast-content" placeholder="Escribe tu mensaje aquí..." required rows="5" style="padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;"></textarea>
                    <div><input type="checkbox" id="inline-broadcast-pinned" style="margin-right: 10px;"><label for="inline-broadcast-pinned">Fijar como aviso importante (Tablón)</label></div>
                    <button type="submit" class="cta-button" style="background: var(--color-primary); color: var(--color-dark); border: none; padding: 12px; font-weight: bold;">Enviar Transmisión</button>
                </form>
            </div>
        `;

        document.getElementById('close-inline-broadcast').onclick = () => {
            contentContainer.remove();
            document.querySelectorAll('.action-card').forEach(card => {
                card.style.border = "none";
                card.style.boxShadow = "none";
            });
        };

        document.getElementById('inline-broadcast-form').onsubmit = async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-paper-plane"></i> Enciendo...';

            const payload = {
                type: type,
                title: document.getElementById('inline-broadcast-title').value,
                content: document.getElementById('inline-broadcast-content').value,
                isPinned: document.getElementById('inline-broadcast-pinned').checked
            };

            try {
                const createCompanyBroadcast = functions.httpsCallable('createCompanybroadcast');
                await createCompanyBroadcast(payload);
                alert('¡Comunicado enviado con éxito!');
                contentContainer.remove();
                document.querySelectorAll('.action-card').forEach(card => {
                    card.style.border = "none";
                    card.style.boxShadow = "none";
                });
            } catch (error) {
                console.error("Error al enviar broadcast:", error);
                alert(`Error: ${error.message}`);
                button.disabled = false;
                button.innerText = 'Enviar Transmisión';
            }
        };
    }

    /**
     * Controlador principal: Llama al backend y decide qué vista renderizar.
     */
    function loadPortalData() {
        ui.portalContainer.innerHTML = `<p class="loader-text" style="text-align: center; padding: 40px 0;"><i class="fas fa-spinner fa-spin"></i> Cargando Centro de Mando...</p>`;
        
        console.log('[DEBUG] Preparando la llamada a getPortalData...');
        const getPortalData = functions.httpsCallable('getPortalData');

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
                   renderArsenalHome(company, roster, powerUps);
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
            const setCompanySector = functions.httpsCallable('setCompanySector');
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
                <p style="margin-bottom: 2.5rem; opacity: 0.8;">Estas son tus 5 herramientas de comunicación iniciales para conectar con tu equipo.</p>
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
     * Renderiza la sub-pantalla dedicada al Arsenal de Comunicación.
     */
    function renderArsenalSubView(company, roster, powerUps) {
        const templates = broadcastTemplates[company.sector] || [];
        const arsenalItemsHTML = templates.map(t => `
            <div class="kpi-card action-card" id="btn-arsenal-${t.type}" style="cursor: pointer; background: #1E1E1E; padding: 25px; transition: transform 0.2s;">
                <div class="value" style="color: #00ecff; font-size: 2.2rem;"><i class="fas ${t.icon}"></i></div>
                <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.9rem;">${t.label}</div>
            </div>
        `).join('');

        ui.portalContainer.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
                <button id="btn-back-to-home" class="cta-button" style="background: transparent; color: #fff; border: 2px solid #555; margin-bottom: 2rem; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 20px;">
                    <i class="fas fa-arrow-left"></i> REGRESAR AL CENTRO DE MANDO
                </button>
                
                <h2 style="color: #00ecff; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; text-align: center;"><i class="fas fa-satellite-dish"></i> Arsenal de Comunicación</h2>
                <p style="text-align: center; color: #aaa; margin-bottom: 2.5rem; font-size: 0.95rem;">Selecciona una de las plantillas de comunicación rápida para transmitir contenido directamente al celular de tu comunidad.</p>
                
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 2.5rem;">
                    ${arsenalItemsHTML}
                    <div class="kpi-card action-card" id="btn-arsenal-dm" style="cursor: pointer; background: #1E1E1E; padding: 25px; transition: transform 0.2s;">
                        <div class="value" style="color: #00ecff; font-size: 2.2rem;"><i class="fas fa-envelope"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.9rem;">Mensajes Directos</div>
                    </div>
                </div>
                
                <div id="dashboard-content" style="margin-top: 2rem;"></div>
            </div>
        `;

        document.getElementById('btn-back-to-home').onclick = () => renderArsenalHome(company, roster, powerUps);

        templates.forEach(t => {
            const cardEl = document.getElementById(`btn-arsenal-${t.type}`);
            if (cardEl) {
                cardEl.onclick = () => renderInlineBroadcastForm(t.type, t.label, company);
            }
        });

        const arsenalDmCard = document.getElementById('btn-arsenal-dm');
        if (arsenalDmCard) {
            arsenalDmCard.onclick = () => renderDirectMessagesConsole(roster, 'btn-arsenal-dm');
        }
    }

    /**
     * Renderiza la sub-pantalla dedicada a las Herramientas de Gestión.
     */
    function renderGestionSubView(company, roster, powerUps) {
        ui.portalContainer.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto; padding: 20px;">
                <button id="btn-back-to-home" class="cta-button" style="background: transparent; color: #fff; border: 2px solid #555; margin-bottom: 2rem; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 20px;">
                    <i class="fas fa-arrow-left"></i> REGRESAR AL CENTRO DE MANDO
                </button>
                
                <h2 style="color: #FFD700; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; text-align: center;"><i class="fas fa-tools"></i> Herramientas de Gestión</h2>
                <p style="text-align: center; color: #aaa; margin-bottom: 2.5rem; font-size: 0.95rem;">Accede a tus tableros operativos de control de personal, visualización satelital de misiones y configuraciones técnicas.</p>
                
                <div id="dashboard-actions" class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 2.5rem;">
                    <div class="kpi-card action-card" id="btn-show-broadcast" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-bullhorn"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Consola de Comunicados</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-direct-messages" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-envelope"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Bandeja de Mensajes</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-roster-management" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-users-cog"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Gestión de Altas</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-mission-map" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-map-marked-alt"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Mapa de Misión</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-premium-upgrades" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-rocket"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Mejoras Premium</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-content-manager" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-feather-alt"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Gestor de Contenido</div>
                    </div>
                    <div class="kpi-card action-card" id="btn-show-security-settings" style="cursor: pointer; background: #1E1E1E; padding: 20px; transition: transform 0.2s;">
                        <div class="value" style="color: #FFD700; font-size: 2rem;"><i class="fas fa-shield-alt"></i></div>
                        <div class="label" style="font-weight: bold; margin-top: 10px; font-size: 0.85rem;">Cambiar Contraseña</div>
                    </div>
                </div>
                
                <div id="dashboard-content" style="margin-top: 2rem;"></div>
            </div>
        `;

        document.getElementById('btn-back-to-home').onclick = () => renderArsenalHome(company, roster, powerUps);

        document.getElementById('btn-show-broadcast').onclick = () => renderBroadcastConsole(company);
        document.getElementById('btn-show-direct-messages').onclick = () => renderDirectMessagesConsole(roster);
        document.getElementById('btn-show-roster-management').onclick = () => renderRosterManagementConsole();
        document.getElementById('btn-show-mission-map').onclick = renderMissionMapConsole;
        document.getElementById('btn-show-premium-upgrades').onclick = () => renderPremiumUpgradesConsole(powerUps);
        document.getElementById('btn-show-content-manager').onclick = renderContentManagerConsole;
        document.getElementById('btn-show-security-settings').onclick = renderPasswordChangeModal;
    }

    /**
     * Renderiza el Arsenal Home, la nueva pantalla principal para gerentes configurados.
     */
    function renderArsenalHome(company, roster, powerUps) {
        const sectorNames = {
            corporate: 'Corporativo',
            fitness: 'Fitness',
            health: 'Salud y Bienestar'
        };
        const sectorName = sectorNames[company.sector] || 'General';
        const logoHTML = company.logoUrl 
            ? `<div style="text-align:center; margin-bottom:15px;"><img src="${company.logoUrl}" alt="Logo Empresa" style="max-height:60px; max-width:200px; object-fit:contain; border-radius:6px; border:1px solid var(--color-primary); padding:4px; background:#121212;"></div>` 
            : '';

        const arsenalHomeHTML = `
            ${logoHTML}
            <h1 id="portal-title">Centro de Mando: ${company.name}</h1>
            <h2 style="text-align:center; font-weight: 500; color: var(--color-primary); margin-bottom: 2rem;">Sector: ${sectorName}</h2>

            <!-- NUEVO BLOQUE DE INFORMACIÓN DE PLAN HORIZONTAL -->
            <div class="plan-info-bar" style="background: #222; padding: 12px 20px; border-radius: 6px; margin-bottom: 2.5rem; display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div class="plan-info-item" style="text-align: center;">
                    <span style="font-size: 0.75rem; opacity: 0.7; text-transform: uppercase;">Plan Actual:</span>
                    <strong style="font-size: 0.9rem; display: block; color: var(--color-primary);">${company.planDetails.name}</strong>
                </div>
                <div class="plan-info-item" style="text-align: center;">
                    <span style="font-size: 0.75rem; opacity: 0.7; text-transform: uppercase;">Límite de Afiliados:</span>
                    <strong style="font-size: 0.9rem; display: block;">${company.planDetails.memberLimit}</strong>
                </div>
                <div class="plan-info-item" style="text-align: center;">
                    <span style="font-size: 0.75rem; opacity: 0.7; text-transform: uppercase;">Costo:</span>
                    <strong style="font-size: 0.9rem; display: block;">${company.planDetails.price}</strong>
                </div>
            </div>
            
            <div class="kpi-card" style="margin-bottom: 2.5rem; text-align: center; padding: 15px; background: #222;">
                <div class="label" style="font-size: 0.9rem;">VIGENCIA DEL PLAN</div>
                <div id="plan-countdown" style="font-size: 1.5rem; letter-spacing: 1px; margin-top: 0.5rem;">Cargando...</div>
                <div id="renewal-btn-container"></div>
            </div>

            <div class="kpi-card" style="margin-bottom: 2.5rem; text-align: center; padding: 15px; background: #222;">
                <div class="label" style="font-size: 0.9rem;">TU CÓDIGO DE CONVENIO (para tus miembros)</div>
                <div class="value" style="font-size: 2rem; letter-spacing: 3px;">${company.convenioCode}</div>
            </div>

            <!-- SECCIÓN DE ACCESO CON DOS GRANDES PANELES LLAMATIVOS EN COLORES DIFERENTES -->
            <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-top: 2rem; margin-bottom: 3rem;">
                <!-- Botón Arsenal de Comunicación (Cian Táctico) -->
                <div id="btn-open-arsenal-sub" class="action-card" style="background: linear-gradient(135deg, #00ecff 0%, #0072ff 100%); color: #000; padding: 35px 20px; border-radius: 12px; cursor: pointer; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: none;">
                    <div style="font-size: 3.5rem; margin-bottom: 12px; color: #000;"><i class="fas fa-satellite-dish"></i></div>
                    <h3 style="font-weight: 900; text-transform: uppercase; margin-bottom: 10px; font-size: 1.15rem; letter-spacing: 1px;">Arsenal de Comunicación</h3>
                    <p style="font-size: 0.85rem; line-height: 1.5; opacity: 0.9; font-weight: 500;">Redacta saludos, transmite anuncios masivos, lanza retos interactivos y chatea con tu comunidad para elevar su participación.</p>
                </div>

                <!-- Botón Herramientas de Gestión (Oro Imperial) -->
                <div id="btn-open-gestion-sub" class="action-card" style="background: linear-gradient(135deg, #FFD700 0%, #ffae00 100%); color: #000; padding: 35px 20px; border-radius: 12px; cursor: pointer; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: none;">
                    <div style="font-size: 3.5rem; margin-bottom: 12px; color: #000;"><i class="fas fa-tools"></i></div>
                    <h3 style="font-weight: 900; text-transform: uppercase; margin-bottom: 10px; font-size: 1.15rem; letter-spacing: 1px;">Herramientas de Gestión</h3>
                    <p style="font-size: 0.85rem; line-height: 1.5; opacity: 0.9; font-weight: 500;">Administra el padrón de altas de miembros, visualiza el mapa de calor de asistencia, gestiona la seguridad y accede a mejoras premium.</p>
                </div>
            </div>
        `;
        ui.portalContainer.innerHTML = arsenalHomeHTML;

        // Bindeos para abrir las sub-vistas dedicadas
        document.getElementById('btn-open-arsenal-sub').onclick = () => renderArsenalSubView(company, roster, powerUps);
        document.getElementById('btn-open-gestion-sub').onclick = () => renderGestionSubView(company, roster, powerUps);

        startCountdown('plan-countdown', company.planEndDate);
    }

    /**
     * Inicia un contador regresivo y lo renderiza en un elemento del DOM.
     * Muestra un botón de renovación si el tiempo restante es menor a 10 días.
     */
    function startCountdown(elementId, endDateStr) {
        const targetElement = document.getElementById(elementId);
        if (!targetElement || !endDateStr) {
            if(targetElement) targetElement.innerHTML = `<span style="opacity: 0.7;">No definido</span>`;
            return;
        }

        let dateObject;
        if (endDateStr && typeof endDateStr.seconds === 'number') {
            dateObject = new Date(endDateStr.seconds * 1000);
        } else if (endDateStr && typeof endDateStr._seconds === 'number') {
            dateObject = new Date(endDateStr._seconds * 1000);
        } else {
            dateObject = new Date(endDateStr);
        }
        const endDate = dateObject.getTime();

        if (isNaN(endDate)) {
            targetElement.innerHTML = `<span style="color: var(--color-secondary);">Fecha Inválida</span>`;
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                targetElement.innerHTML = `<span style="color: var(--color-secondary);">PLAN EXPIRADO</span>`;
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            targetElement.innerHTML = `
                <div style="display: flex; justify-content: center; gap: 1rem; font-weight: bold;">
                    <div>${days}<span style="font-size: 0.7rem; display: block; opacity: 0.7;">Días</span></div>
                    <div>${hours}<span style="font-size: 0.7rem; display: block; opacity: 0.7;">Hrs</span></div>
                    <div>${minutes}<span style="font-size: 0.7rem; display: block; opacity: 0.7;">Min</span></div>
                    <div>${seconds}<span style="font-size: 0.7rem; display: block; opacity: 0.7;">Seg</span></div>
                </div>`;

            // Lógica para el botón de renovación (10 días = 864,000,000 ms)
            if (distance < 864000000) {
                const renewalBtn = document.getElementById('renewal-btn-container');
                if (renewalBtn && !renewalBtn.innerHTML) { // Evita re-renderizar
                    renewalBtn.innerHTML = `<button class="cta-button" style="background: var(--color-primary); color: var(--color-dark); margin-top: 1rem;">Actualizar Plan</button>`;
                }
            }

        }, 1000);
    }

    /**
     * Renderiza la consola para la Gestión de Altas.
     */
    async function renderRosterManagementConsole() {
        const contentContainer = getDashboardContentContainer('btn-show-roster-management');
        contentContainer.innerHTML = `
            <style>
                .master-list-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .master-list-table th, .master-list-table td { padding: 12px; border: 1px solid #333; text-align: left; }
                .master-list-table th { background-color: #2c3e50; }
                .status-active { color: #28a745; font-weight: bold; }
                .status-pending { color: #ffc107; }
            </style>
            <div style="background-color: var(--color-light-dark); padding: 20px; border-radius: 8px;">
                <h3>Gestión de Altas de la Comunidad</h3>
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
            const getCompanyMasterList = functions.httpsCallable('getCompanyMasterList');
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
            const addMemberToMasterList = functions.httpsCallable('addMemberToMasterList');
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
    function renderDirectMessagesConsole(roster, anchorId = 'btn-show-direct-messages') {
        const contentContainer = getDashboardContentContainer(anchorId);
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
        contentContainer.innerHTML = consoleHTML;

        contentContainer.querySelector('.member-list').addEventListener('click', (e) => {
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
            const getDirectMessageHistory = functions.httpsCallable('getDirectMessageHistory');
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
            const sendDirectMessage = functions.httpsCallable('sendDirectMessage');
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
        const contentContainer = getDashboardContentContainer('btn-show-broadcast');
        contentContainer.innerHTML = `
            <div style="background-color: var(--color-light-dark); padding: 20px; border-radius: 8px;">
                <h3>Consola de Transmisiones</h3>
                <p>Envía comunicados a toda tu comunidad. Los avisos fijados aparecerán de forma destacada.</p>
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
            const createCompanyBroadcast = functions.httpsCallable('createCompanybroadcast');
        await createCompanyBroadcast(payload);
            alert('¡Comunicado enviado a tu comunidad!');
            document.getElementById('broadcast-modal').remove();
            renderBroadcastConsole(company); // Re-renderiza la consola
        } catch (error) {
            console.error("Error al enviar broadcast:", error);
            alert(`Error: ${error.message}`);
            button.disabled = false;
            button.innerText = 'Enviar Transmisión';
        }
    }

    /**
     * Muestra una alerta estilizada dentro del modal de cambio de contraseña.
     */
    function showModalAlert(message, type = 'error') {
        const container = document.getElementById('modal-alert-container');
        if (!container) return;

        const alertTypeClass = type === 'success' ? 'alert-success' : 'alert-error';
        container.innerHTML = `<div class="modal-alert ${alertTypeClass}">${message}</div>`;
        container.style.display = 'block';

        setTimeout(() => {
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
        }, 5000); // La alerta desaparece después de 5 segundos
    }
    
    /**
     * Renderiza el modal para el cambio de contraseña con todas las mejoras.
     */
    function renderPasswordChangeModal() {
        const contentContainer = getDashboardContentContainer('btn-show-security-settings');

        const modalHTML = `
            <style>
                .password-input-wrapper { position: relative; display: flex; align-items: center; }
                .password-input-wrapper input { padding-right: 40px !important; }
                .toggle-password-btn { position: absolute; right: 10px; background: none; border: none; color: #888; cursor: pointer; font-size: 1.2rem; }
                .modal-alert { padding: 12px; margin-bottom: 1rem; border-radius: 5px; font-weight: 500; }
                .alert-error { background-color: #4d1a1a; color: #ffcccc; border-left: 4px solid var(--color-secondary); }
                .alert-success { background-color: #1a4d2e; color: #ccffdd; border-left: 4px solid #28a745; }
            </style>
            <div id="password-change-modal" style="background: var(--color-light-dark); padding: 25px; border-radius: 10px; border-top: 3px solid var(--color-primary); margin-top: 15px; position: relative;">
                <span id="close-password-modal" class="modal-close-btn" style="position: absolute; top: 10px; right: 15px; cursor: pointer; font-size: 1.5rem;">&times;</span>
                <h3>Cambio de Contraseña Segura</h3>
                <p style="opacity: 0.7; margin-top: 0.5rem; font-size: 0.9rem;">Tu contraseña debe tener: Mínimo 8 caracteres, mayúsculas, minúsculas, números y un símbolo (@$!%*?&).</p>
                <p style="opacity: 0.7; margin-top: 0.5rem; font-size: 0.9rem;">Solo puedes realizar esta acción una vez cada 30 días.</p>
                <div id="modal-alert-container" style="display: none; margin-top: 1rem;"></div>
                <form id="password-change-form" style="margin-top: 1rem;">
                    <div class="password-input-wrapper" style="margin-bottom: 1rem;">
                        <input type="password" id="new-password" placeholder="Nueva Contraseña" required style="width: 100%; padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;">
                        <button type="button" class="toggle-password-btn" data-target="new-password"><i class="fas fa-eye"></i></button>
                    </div>
                    <div class="password-input-wrapper" style="margin-bottom: 1rem;">
                        <input type="password" id="confirm-password" placeholder="Confirmar Nueva Contraseña" required style="width: 100%; padding: 12px; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;">
                        <button type="button" class="toggle-password-btn" data-target="confirm-password"><i class="fas fa-eye"></i></button>
                    </div>
                    <input type="email" id="target-email" placeholder="Correo para enviar la notificación" required style="width: 100%; padding: 12px; margin-bottom: 1.5rem; border-radius: 5px; border: 1px solid #444; background: #333; color: white; font-size: 1rem;">
                    
                    <button type="submit" class="cta-button" style="width: 100%; background: linear-gradient(145deg, var(--color-primary), #ffc107); color: var(--color-dark); font-weight: bold; border: none; text-shadow: 0 1px 1px rgba(0,0,0,0.2);">
                        <i class="fas fa-shield-alt"></i> Actualizar Contraseña y Notificar
                    </button>
                </form>
            </div>`;
        
        contentContainer.innerHTML = modalHTML;

        const modal = document.getElementById('password-change-modal');
        document.getElementById('close-password-modal').onclick = () => {
            contentContainer.innerHTML = '';
            document.querySelectorAll('.action-card').forEach(card => {
                card.style.border = "none";
                card.style.boxShadow = "none";
            });
        };

        modal.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.onclick = () => {
                const targetInput = document.getElementById(btn.dataset.target);
                const icon = btn.querySelector('i');
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    targetInput.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            };
        });
    }

    /**
     * Maneja el envío del formulario de cambio de contraseña.
     */
    async function handlePasswordChangeSubmit(event) {
        event.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const targetEmail = document.getElementById('target-email').value;

        if (!targetEmail) {
            return showModalAlert('Por favor, ingresa un correo para la notificación.');
        }
        if (newPass !== confirmPass) {
            return showModalAlert('Las contraseñas no coinciden.');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPass)) {
            return showModalAlert("La contraseña no cumple con los requisitos de seguridad.");
        }
        
        const button = event.target.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';

        try {
            const changeManagerPassword = functions.httpsCallable('changeManagerPassword');
        await changeManagerPassword({ newPassword: newPass, targetEmail: targetEmail });

            showModalAlert('¡Contraseña actualizada con éxito! Se ha enviado una notificación.', 'success');
            setTimeout(() => {
                const modal = document.getElementById('password-change-modal');
                if(modal) modal.remove();
            }, 3000); // Cerrar modal automáticamente después del éxito

        } catch (error) {
            console.error("Error al cambiar la contraseña:", error);
            showModalAlert(error.message); // Mostrar el error del backend
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-shield-alt"></i> Actualizar Contraseña y Notificar';
        }
    }
});

/**
     * [NUEVO] Renderiza la consola de "Mejoras Premium" (Power-Ups).
     */
    function renderPremiumUpgradesConsole(powerUps) {
        const contentContainer = getDashboardContentContainer('btn-show-premium-upgrades');
        contentContainer.innerHTML = `
            <style>
                .powerup-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .powerup-card {
                    background-color: var(--color-light-dark);
                    border-radius: 8px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    border-left: 4px solid #444;
                }
                .powerup-card.owned {
                    border-left-color: #28a745; /* Verde para los adquiridos */
                }
                .powerup-card h4 {
                    font-size: 1.2rem;
                    color: var(--color-primary);
                    margin-bottom: 0.5rem;
                }
                .powerup-card p {
                    opacity: 0.8;
                    flex-grow: 1; /* Empuja el botón hacia abajo */
                    margin-bottom: 1.5rem;
                }
                .powerup-card .price {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                }
                .powerup-card .cta-button {
                    width: 100%;
                }
                .powerup-card .cta-button:disabled {
                    background-color: #28a745;
                    cursor: default;
                    opacity: 1;
                }
            </style>
            <h3><i class="fas fa-rocket"></i> Mejoras Premium</h3>
            <p style="margin-bottom: 2rem; opacity: 0.8;">Desbloquea nuevas capacidades para tu Centro de Mando y potencia a tu comunidad.</p>
            <div id="powerup-grid" class="powerup-grid">
                <!-- Las tarjetas de mejoras se renderizarán aquí -->
            </div>
        `;

        const grid = document.getElementById('powerup-grid');
        if (!powerUps || powerUps.length === 0) {
            grid.innerHTML = '<p>No hay mejoras disponibles para tu sector en este momento.</p>';
            return;
        }

        const powerUpsHTML = powerUps.map(p => `
            <div class="powerup-card ${p.isOwned ? 'owned' : ''}">
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <div class="price">$${p.price} <span style="font-size: 0.9rem; opacity: 0.7;">USD (Pago único)</span></div>
                <button 
                    class="cta-button btn-purchase-powerup" 
                    data-powerup-id="${p.id}"
                    ${p.isOwned ? 'disabled' : ''}
                >
                    ${p.isOwned ? '<i class="fas fa-check"></i> Activado' : 'Desbloquear Ahora'}
                </button>
            </div>
        `).join('');

        grid.innerHTML = powerUpsHTML;

        // Asignar listeners a los botones de compra
        grid.querySelectorAll('.btn-purchase-powerup:not([disabled])').forEach(button => {
            button.onclick = handlePowerUpPurchase;
        });
    }

    /**
     * [NUEVO] Maneja el clic en el botón de compra de un Power-Up.
     */
    async function handlePowerUpPurchase(event) {
        const button = event.target;
        const powerUpId = button.dataset.powerupId;
        
        if (!confirm('Serás redirigido a PayPal para completar la compra de esta mejora. ¿Deseas continuar?')) {
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

        try {
            const createPowerUpPurchaseOrder = functions.httpsCallable('createPowerUpPurchaseOrder');
        const result = await createPowerUpPurchaseOrder({ powerUpId });
            
            const approveUrl = result.data.approveUrl;
            if (approveUrl) {
                // Redirigir al usuario a PayPal para el pago
                window.location.href = approveUrl;
            } else {
                throw new Error('No se recibió la URL de aprobación de PayPal.');
            }
        } catch (error) {
            console.error('Error al iniciar la compra del Power-Up:', error);
            alert(`Error: ${error.message}`);
            button.disabled = false;
            button.innerText = 'Desbloquear Ahora';
        }
    }

    /**
     * [NUEVO] Renderiza la consola del "Mapa de Misión" y carga los datos.
     */
    async function renderMissionMapConsole() {
        const contentContainer = getDashboardContentContainer('btn-show-mission-map');
        contentContainer.innerHTML = `
            <style>
                #mission-map { height: 60vh; width: 100%; border-radius: 8px; background-color: #333; }
                .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--color-light-dark); color: var(--color-text); }
                .leaflet-popup-content h5 { color: var(--color-primary); margin-bottom: 5px; }
                .leaflet-container a { color: var(--color-primary); }
            </style>
            <h3><i class="fas fa-map-marked-alt"></i> Mapa de Misión</h3>
            <p style="margin-bottom: 1.5rem; opacity: 0.8;">Visualiza los últimos check-ins de tu equipo en el campo.</p>
            <div id="mission-map-container" style="position: relative;">
                <div id="mission-map"></div>
                <div id="map-loader" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; border-radius: 8px;">
                    <p class="loader-text"><i class="fas fa-spinner fa-spin"></i> Cargando datos geoespaciales...</p>
                </div>
            </div>
        `;

        const mapLoader = document.getElementById('map-loader');
        
        try {
            // Inicializar el mapa
            const map = L.map('mission-map').setView([20.5, -100.5], 5); // Vista inicial centrada en México
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Llamar al backend para obtener los check-ins
            const getMissionCheckIns = functions.httpsCallable('getMissionCheckIns');
        const result = await getMissionCheckIns();
            const checkIns = result.data;

            if (checkIns.length === 0) {
                mapLoader.innerHTML = `<p class="loader-text"><i class="fas fa-info-circle"></i> No hay check-ins registrados todavía.</p>`;
                return;
            }

            // Añadir marcadores al mapa
            const markers = [];
            checkIns.forEach(checkIn => {
                const marker = L.marker([checkIn.latitude, checkIn.longitude]).addTo(map);
                marker.bindPopup(`
                    <h5>${checkIn.userName}</h5>
                    <b>Misión:</b> ${checkIn.description}<br>
                    <b>Fecha:</b> ${new Date(checkIn.timestamp).toLocaleString()}
                `);
                markers.push(marker);
            });

            // Ajustar el zoom del mapa para que todos los marcadores sean visibles
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.2)); // pad(0.2) añade un pequeño margen
            }

            mapLoader.style.display = 'none'; // Ocultar el loader al finalizar

        } catch (error) {
            console.error("Error al renderizar el Mapa de Misión:", error);
            mapLoader.innerHTML = `<p class="error-text">Error Crítico: ${error.message}</p>`;
        }
    }

    /**
     * [NUEVO] Renderiza la consola para gestionar el contenido premium.
     */
    async function renderContentManagerConsole() {
        const contentContainer = getDashboardContentContainer('btn-show-content-manager');
        contentContainer.innerHTML = `
            <style>
                .content-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .content-table th, .content-table td { padding: 12px; border: 1px solid #333; text-align: left; }
                .content-table th { background-color: #2c3e50; }
                .content-table .actions { text-align: right; }
                .content-table .actions button { margin-left: 5px; }
            </style>
            <div style="background-color: var(--color-light-dark); padding: 20px; border-radius: 8px;">
                <h3><i class="fas fa-feather-alt"></i> Gestor de Contenido Premium</h3>
                <p>Aquí puedes crear, editar y eliminar los consejos y mensajes que se entregarán a tu tribu.</p>
                <button id="btn-create-content" class="cta-button" style="margin-top: 1rem;"><i class="fas fa-plus"></i> Crear Nuevo Contenido</button>
            </div>
            <div id="content-list-container" style="margin-top: 2rem;">
                <h4>Base de Datos de Contenido</h4>
                <div id="content-list-content" class="placeholder"><i class="fas fa-spinner fa-spin"></i> Cargando contenido...</div>
            </div>
        `;

        document.getElementById('btn-create-content').onclick = () => renderContentFormModal();

        try {
            const getPremiumContent = functions.httpsCallable('getPremiumContent');
        const result = await getPremiumContent();
            const contentList = result.data;
            const listContainer = document.getElementById('content-list-content');

            if (contentList.length === 0) {
                listContainer.innerHTML = '<p>No has creado ningún contenido todavía. ¡Haz clic en "Crear Nuevo Contenido" para empezar!</p>';
                return;
            }

            const tableRows = contentList.map(item => `
                <tr>
                    <td>${item.title}</td>
                    <td>${item.type}</td>
                    <td>${item.segment}</td>
                    <td class="actions">
                        <button class="cta-button-small" onclick="window.app.portal.editContent('${item.id}')">Editar</button>
                        <button class="cta-button-small-danger" onclick="window.app.portal.deleteContent('${item.id}')">Eliminar</button>
                    </td>
                </tr>
            `).join('');

            listContainer.innerHTML = `
                <table class="content-table">
                    <thead><tr><th>Título</th><th>Tipo</th><th>Segmento</th><th>Acciones</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `;
            
            // Exponer funciones en un namespace global para los onclick
            window.app = window.app || {};
            window.app.portal = {
                editContent: (id) => {
                    const itemData = contentList.find(item => item.id === id);
                    renderContentFormModal(itemData);
                },
                deleteContent: async (id) => {
                    if (!confirm('¿Estás seguro de que quieres eliminar este contenido de forma permanente?')) return;
                    try {
                        const managePremiumContent = functions.httpsCallable('managePremiumContent');
                await managePremiumContent({ mode: 'delete', payload: { id } });
                        alert('Contenido eliminado.');
                        renderContentManagerConsole(); // Recargar la lista
                    } catch (error) {
                        alert(`Error al eliminar: ${error.message}`);
                    }
                }
            };

        } catch (error) {
            document.getElementById('content-list-content').innerHTML = `<p class="error-text">Error al cargar el contenido: ${error.message}</p>`;
        }
    }

    /**
     * [NUEVO] Renderiza el modal para crear o editar contenido premium.
     */
    function renderContentFormModal(contentData = null) {
        const isEditing = contentData !== null;
        const title = isEditing ? 'Editar Contenido' : 'Crear Nuevo Contenido';

        const modalHTML = `
            <div id="content-modal" class="modal-overlay visible">
                <div class="modal-content" style="max-width: 600px;">
                    <span id="close-content-modal" class="modal-close-btn">&times;</span>
                    <h3>${title}</h3>
                    <form id="content-form" style="text-align: left; margin-top: 1.5rem;">
                        <label for="content-title">Título</label>
                        <input type="text" id="content-title" required value="${isEditing ? contentData.title : ''}" style="width: 100%; margin-bottom: 1rem;">
                        
                        <label for="content-text">Contenido del Mensaje</label>
                        <textarea id="content-text" required rows="4" style="width: 100%; margin-bottom: 1rem;">${isEditing ? contentData.content : ''}</textarea>
                        
                        <label for="content-type">Tipo de Contenido</label>
                        <select id="content-type" required style="width: 100%; margin-bottom: 1rem;">
                            <option value="beauty">Belleza</option>
                            <option value="exercise">Ejercicio</option>
                            <option value="nutrition">Nutrición</option>
                            <option value="news">Flash Informativo</option>
                            <option value="entertainment">Cine/Música</option>
                            <option value="health_alert">Alerta de Salud/Clima</option>
                            <option value="motivation">Frase/Chiste</option>
                        </select>
                        
                        <label for="content-segment">Segmento</label>
                        <select id="content-segment" required style="width: 100%; margin-bottom: 1.5rem;">
                            <option value="general">General</option>
                            <option value="male">Hombre</option>
                            <option value="female">Mujer</option>
                            <option value="diverse">Diverso</option>
                            <option value="home">Ejercicio en Casa</option>
                            <option value="gym">Ejercicio en Gym</option>
                        </select>
                        
                        <button type="submit" class="cta-button" style="width: 100%;">${isEditing ? 'Guardar Cambios' : 'Crear Contenido'}</button>
                    </form>
                </div>
            </div>
        `;
        if (document.getElementById('content-modal')) document.getElementById('content-modal').remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        if (isEditing) {
            document.getElementById('content-type').value = contentData.type;
            document.getElementById('content-segment').value = contentData.segment;
        }

        const modal = document.getElementById('content-modal');
        document.getElementById('close-content-modal').onclick = () => modal.remove();
        document.getElementById('content-form').onsubmit = (e) => handleContentFormSubmit(e, contentData ? contentData.id : null);
    }
    
    /**
     * [NUEVO] Maneja el envío del formulario de creación/edición de contenido.
     */
    async function handleContentFormSubmit(event, contentId) {
        event.preventDefault();
        const isEditing = contentId !== null;
        const button = event.target.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        const payload = {
            title: document.getElementById('content-title').value,
            content: document.getElementById('content-text').value,
            type: document.getElementById('content-type').value,
            segment: document.getElementById('content-segment').value,
        };

        if (isEditing) {
            payload.id = contentId;
        }

        try {
            const managePremiumContent = functions.httpsCallable('managePremiumContent');
        const result = await managePremiumContent({
            mode: isEditing ? 'update' : 'create',
            payload: payload
        });
            alert(result.data.message);
            document.getElementById('content-modal').remove();
            renderContentManagerConsole(); // Recargar la lista de contenido
        } catch (error) {
            alert(`Error al guardar: ${error.message}`);
            button.disabled = false;
            button.innerHTML = isEditing ? 'Guardar Cambios' : 'Crear Contenido';
        }
    }
    