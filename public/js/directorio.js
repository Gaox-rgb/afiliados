// ==================================================================================
// ARCHIVO: public/js/directorio.js
// FUNCIÓN: Carga y muestra dinámicamente las empresas afiliadas desde Firestore.
// ==================================================================================

window.app = window.app || {};

window.app.directory = {
    // Referencias a elementos del DOM
    elements: {
        listContainer: null,
    },

    // Inicializa el módulo del directorio
    init: function() {
        // Inicializar Firebase
        if (!window.firebase || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        this.elements.listContainer = document.getElementById('directory-list');

        if (!this.elements.listContainer) {
            console.error('Error fatal: Contenedor #directory-list no encontrado.');
            return;
        }
        
        this.loadCompanies();
    },

    // Carga las empresas desde Firestore
    loadCompanies: async function() {
        const db = firebase.firestore();
        
        try {
            // Consulta simplificada para evitar errores de permisos por índice inexistente
            const querySnapshot = await db.collection('companies')
                .where('landingPageData.isEnabledForDirectory', '==', true)
                .get();
            
            this.renderCompanies(querySnapshot.docs);

        } catch (error) {
            console.error("Error al cargar las empresas:", error);
            this.renderError('No se pudo conectar con el directorio. Inténtelo más tarde.');
        }
    },

    // Renderiza las tarjetas de las empresas en el DOM
    renderCompanies: function(companyDocs) {
        // Limpiar el estado de carga
        this.elements.listContainer.innerHTML = '';

        if (companyDocs.length === 0) {
            this.renderEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();
        companyDocs.forEach(doc => {
            const companyData = doc.data();
            const landingData = companyData.landingPageData || {}; // Fallback por si no existe
            
            const card = document.createElement('a');
            card.href = `company-profile.html?id=${doc.id}`;
            card.className = 'company-card';
            card.innerHTML = `
                <h3>${landingData.companyName || companyData.companyName}</h3>
                <p>${landingData.tagline || 'Descubre más sobre nosotros.'}</p>
                <div class="company-card-footer">
                    Ver Perfil <i class="fas fa-arrow-right"></i>
                </div>
            `;
            fragment.appendChild(card);
        });

        this.elements.listContainer.appendChild(fragment);
    },

    // Muestra un mensaje cuando el directorio está vacío
    renderEmpty: function() {
        this.elements.listContainer.innerHTML = `
            <p class="subtitulo-seccion">Aún no hay empresas en nuestro directorio. ¡Sé el primero en unirte y destacar!</p>
        `;
    },

    // Muestra un mensaje de error
    renderError: function(message) {
        this.elements.listContainer.innerHTML = `
            <p class="error-text"><i class="fas fa-exclamation-triangle"></i> ${message}</p>
        `;
    }
};

// Punto de entrada: ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app.directory.init();
});