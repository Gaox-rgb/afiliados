window.app = window.app || {};

window.app.events = {
    init: function() {
        // Los listeners del modal han sido aniquilados.
        // --- CONEXIÓN DE LOS DETONADORES DE TRIAJE ---
        document.querySelectorAll('.triage-btn').forEach(button => {
            button.addEventListener('click', this.handleTriageClick);
        });

        // Lógica de inicialización condicional
        if (document.getElementById('fortaleza-makumoto®')) { // Detecta la landing principal por su ID específico
            window.app.ui.initLandingDynamics(); // Inicializa dinámicas específicas de la landing principal
        } else if (document.getElementById('fortaleza-makumoto-segmento')) { // Detecta las páginas de segmento por su ID
            const urlParams = new URLSearchParams(window.location.search);
            const segmentId = urlParams.get('id');
            if (segmentId && window.app.segmentData && window.app.segmentData[segmentId]) {
                window.app.ui.loadSegmentContent(segmentId);
                window.app.ui.initSegmentPageDynamics(); // Inicializa dinámicas específicas de segmento (ej. slider de testimonios)
            } else {
                // Si no hay ID de segmento válido, redirige a la página principal o muestra error
                console.error('ID de segmento no válido o no encontrado. Redirigiendo a index.html de Makumoto®.');
                window.location.href = 'index.html';
            }
        }
    },

    // EL ANTIGUO MÉTODO DE SCROLL HA SIDO ELIMINADO. ERA INEFICIENTE Y FRÁGIL.
    // LA NUEVA LÓGICA VIVE DIRECTAMENTE EN app.ui.js CON UN OBSERVER.

    // ===== NUEVO CONTROLADOR DE TRIAJE =====
    handleTriageClick: function(e) {
        const segment = e.currentTarget.dataset.segment;
        console.log(`Redirigiendo a portal dedicado para el segmento: ${segment}`);
        
        // Redirige a la página de segmento genérica con un parámetro ID
        window.location.href = `segment.html?id=${segment}`;
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