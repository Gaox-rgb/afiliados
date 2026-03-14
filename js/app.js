// js/app.js
console.log("MAKUMOTO® DEBUG: app.js comenzando. Este es el punto de entrada principal.");

// PROTOCOLO DE INICIALIZACIÓN DE MAKUMOTO®: Asegurar que window.app exista primero y solo una vez.
window.app = window.app || {};
console.log("MAKUMOTO® DEBUG: window.app inicializado en app.js como:", window.app);

document.addEventListener('DOMContentLoaded', () => {
    console.log("MAKUMOTO® DEBUG: DOMContentLoaded disparado. Iniciando el arsenal Makumoto®.");
    debugger; // DETENEDOR CRÍTICO: Activado para inspección manual al inicio del DOMContentLoaded

    // Verificación final de la integridad de los módulos cargados
    console.log("MAKUMOTO® DEBUG: Estado final de window.app.state:", window.app.state);
    console.log("MAKUMOTO® DEBUG: Estado final de window.app.payments:", window.app.payments);
    console.log("MAKUMOTO® DEBUG: Estado final de window.app.ui:", window.app.ui);
    console.log("MAKUMOTO® DEBUG: Estado final de window.app.events:", window.app.events);

    // Armar todos los gatillos
    if (window.app.events && typeof window.app.events.init === 'function') {
        window.app.events.init();
    } else {
        console.error("MAKUMOTO® ERROR CRÍTICO: window.app.events.init no está disponible. Fallo en la carga de módulos.");
    }
    
    // Inyectar la sección de precios en todas las páginas de aterrizaje que la requieran
    if (window.app.ui && typeof window.app.ui.renderPricingSection === 'function') {
        window.app.ui.renderPricingSection('pricing-section-container');
    } else {
        console.error("MAKUMOTO® ERROR CRÍTICO: window.app.ui.renderPricingSection no está disponible. Fallo en la carga de módulos.");
    }
    
    console.log("MAKUMOTO® DEBUG: app.js - DOMContentLoaded finalizado. Preparado para la batalla.");
});
console.log("MAKUMOTO® DEBUG: app.js finalizado.");