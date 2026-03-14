document.addEventListener('DOMContentLoaded', () => {
    // Armar todos los gatillos
    window.app.events.init();
    // Inyectar la sección de precios en todas las páginas de aterrizaje que la requieran
    window.app.ui.renderPricingSection('pricing-section-container');
});