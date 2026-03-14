// js/app.js
console.log("MAKUMOTO® DEBUG: app.js comenzando.");
// window.app ya se inicializa en app.base.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("MAKUMOTO® DEBUG: DOMContentLoaded disparado. Iniciando app.");
    // Armar todos los gatillos
    window.app.events.init();
    // Inyectar la sección de precios en todas las páginas de aterrizaje que la requieran
    window.app.ui.renderPricingSection('pricing-section-container');
    console.log("MAKUMOTO® DEBUG: app.js - DOMContentLoaded finalizado.");
});
console.log("MAKUMOTO® DEBUG: app.js finalizado.");