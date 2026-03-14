// js/app.events.js
console.log("MAKUMOTO® DEBUG: app.events.js comenzando. (Asume window.app ya inicializado por app.js).");
// NO inicializar window.app aquí. Se inicializa en app.js

window.app.events = {
    init: function() {
        console.log("MAKUMOTO® DEBUG: app.events.js - init iniciado.");
        // Los listeners del modal han sido aniquilados.
        // --- CONEXIÓN DE LOS DETONADORES DE TRIAJE ---
        document.querySelectorAll('.triage-btn').forEach(button => {
            button.addEventListener('click', this.handleTriageClick);
        });

        // --- LÓGICA DE LANDING FUSIONADA ---
        if (window.app.ui && typeof window.app.ui.initLandingDynamics === 'function') {
            window.app.ui.initLandingDynamics(); // Llama a los inicializadores de UI (testimonios, fomo, etc)
        } else {
            console.error("MAKUMOTO® ERROR CRÍTICO: window.app.ui.initLandingDynamics no está disponible. Fallo en la carga de módulos.");
        }
        console.log("MAKUMOTO® DEBUG: app.events.js - init finalizado.");
    },

    // EL ANTIGUO MÉTODO DE SCROLL HA SIDO ELIMINADO. ERA INEFICIENTE Y FRÁGIL.
    // LA NUEVA LÓGICA VIVE DIRECTAMENTE EN app.ui.js CON UN OBSERVER.

    // ===== NUEVO CONTROLADOR DE TRIAJE =====
    handleTriageClick: function(e) {
        const segment = e.currentTarget.dataset.segment;
        console.log(`MAKUMOTO® DEBUG: Abriendo portal dedicado para el segmento: ${segment}`);
        
        window.location.href = `${segment}.html`;
    }, // <-- ¡COMA DE SINTAXIS CRÍTICA AQUI! ¡ABSOLUTAMENTE NECESARIA! (Línea 66 según tu error, por el cierre de handlePlanPurchase)

    // ===== MOTOR DE COMPRA DE PLANES =====
    handlePlanPurchase: function(buttonElement) {
        console.log("MAKUMOTO® DEBUG: app.events.js - handlePlanPurchase iniciado.");
        const card = buttonElement.closest('.precio-tarjeta');
        if (!card) {
            console.error("MAKUMOTO® ERROR CRÍTICO: No se encontró la tarjeta de precio para el botón de compra.");
            return;
        }

        const planId = buttonElement.dataset.plan;
        const planName = card.querySelector('h3').textContent;
        // Extraer solo el número del precio
        const planPrice = card.querySelector('.precio-valor').textContent.replace('$', '').replace('/mes', '').trim();

        const planData = {
            id: planId,
            name: planName,
            price: parseFloat(planPrice)
        };

        console.log("MAKUMOTO® DEBUG: Iniciando compra para:", planData);
        
        // Delegar la renderización de la pasarela de pago a la UI
        if (window.app.ui && typeof window.app.ui.showPaymentGateway === 'function') {
            window.app.ui.showPaymentGateway(planData);
        } else {
            console.error("MAKUMOTO® ERROR CRÍTICO: window.app.ui.showPaymentGateway no está disponible. Fallo en la carga de módulos.");
        }
        console.log("MAKUMOTO® DEBUG: app.events.js - handlePlanPurchase finalizado.");
    },

    // La función handleEbookFormSubmit ha sido aniquilada.
};
console.log("MAKUMOTO® DEBUG: app.events.js finalizado.");