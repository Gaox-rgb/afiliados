// js/app.events.js
console.log("MAKUMOTO® DEBUG: app.events.js comenzando.");
// window.app ya se inicializa en app.base.js

window.app.events = {
    init: function() {
        console.log("MAKUMOTO® DEBUG: app.events.js - init iniciado.");
        // Los listeners del modal han sido aniquilados.
        // --- CONEXIÓN DE LOS DETONADORES DE TRIAJE ---
        document.querySelectorAll('.triage-btn').forEach(button => {
            button.addEventListener('click', this.handleTriageClick);
        });

        // --- LÓGICA DE LANDING FUSIONADA ---
        window.app.ui.initLandingDynamics(); // Llama a los inicializadores de UI (testimonios, fomo, etc)
        console.log("MAKUMOTO® DEBUG: app.events.js - init finalizado.");
    },

    // EL ANTIGUO MÉTODO DE SCROLL HA SIDO ELIMINADO. ERA INEFICIENTE Y FRÁGIL.
    // LA NUEVA LÓGICA VIVE DIRECTAMENTE EN app.ui.js CON UN OBSERVER.

    // ===== NUEVO CONTROLADOR DE TRIAJE =====
    handleTriageClick: function(e) {
        const segment = e.currentTarget.dataset.segment;
        console.log(`MAKUMOTO® DEBUG: Abriendo portal dedicado para el segmento: ${segment}`);
        
        window.location.href = `${segment}.html`;
    },

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
        window.app.ui.showPaymentGateway(planData);
        console.log("MAKUMOTO® DEBUG: app.events.js - handlePlanPurchase finalizado.");
    },

    // La función handleEbookFormSubmit ha sido aniquilada.
};
console.log("MAKUMOTO® DEBUG: app.events.js finalizado.");
        document.querySelectorAll('.triage-btn').forEach(button => {
            button.addEventListener('click', this.handleTriageClick);
        });

        // --- LÓGICA DE LANDING FUSIONADA ---
        window.app.ui.initLandingDynamics(); // Llama a los inicializadores de UI (testimonios, fomo, etc)
    },

    // EL ANTIGUO MÉTODO DE SCROLL HA SIDO ELIMINADO. ERA INEFICIENTE Y FRÁGIL.
    // LA NUEVA LÓGICA VIVE DIRECTAMENTE EN app.ui.js CON UN OBSERVER.

    // ===== NUEVO CONTROLADOR DE TRIAJE =====
    handleTriageClick: function(e) {
        const segment = e.currentTarget.dataset.segment;
        console.log(`Abriendo portal dedicado para el segmento: ${segment}`);
        
        window.location.href = `${segment}.html`;
    },

    // ===== MOTOR DE COMPRA DE PLANES =====
    handlePlanPurchase: function(buttonElement) {
        const card = buttonElement.closest('.precio-tarjeta');
        if (!card) return;

        const planId = buttonElement.dataset.plan;
        const planName = card.querySelector('h3').textContent;
        // Extraer solo el número del precio
        const planPrice = card.querySelector('.precio-valor').textContent.replace('$', '').replace('/mes', '').trim();

        const planData = {
            id: planId,
            name: planName,
            price: parseFloat(planPrice)
        };

        console.log("Iniciando compra para:", planData);
        
        // Delegar la renderización de la pasarela de pago a la UI
        window.app.ui.showPaymentGateway(planData);
    },

    // La función handleEbookFormSubmit ha sido aniquilada.
};