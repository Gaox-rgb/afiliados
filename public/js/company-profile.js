// ==================================================================================
// ARCHIVO: public/js/company-profile.js
// FUNCIÓN: Carga y muestra los datos de una empresa específica desde Firestore.
// ==================================================================================

window.app = window.app || {};

window.app.profile = {
    // Referencias a elementos del DOM
    elements: {
        loader: null,
        profileContent: null,
        companyLogo: null,
        companyName: null,
        companyTagline: null,
        companyDescription: null,
        contactInfo: null,
        container: null
    },

    // Inicializa el módulo
    init: function() {
        // Inicializar Firebase
        if (!window.firebase || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Cachear elementos del DOM
        this.elements.loader = document.getElementById('loader');
        this.elements.profileContent = document.getElementById('profile-content');
        this.elements.companyLogo = document.getElementById('company-logo');
        this.elements.companyName = document.getElementById('company-name');
        this.elements.companyTagline = document.getElementById('company-tagline');
        this.elements.companyDescription = document.getElementById('company-description');
        this.elements.contactInfo = document.getElementById('contact-info');
        this.elements.container = document.querySelector('#profile-section .container');

        const companyId = this.getCompanyIdFromURL();

        if (companyId) {
            this.loadProfile(companyId);
        } else {
            this.renderError('No se ha especificado un perfil de empresa válido.');
        }
    },

    // Obtiene el ID de la empresa de los parámetros de la URL
    getCompanyIdFromURL: function() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    },

    // Carga los datos del perfil desde Firestore
    loadProfile: async function(companyId) {
        const db = firebase.firestore();
        
        try {
            const docRef = db.collection('companies').doc(companyId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                this.renderProfile(docSnap.data());
            } else {
                this.renderError('El perfil solicitado no existe o no está disponible.');
            }
        } catch (error) {
            console.error("Error al cargar el perfil:", error);
            this.renderError('Hubo un problema al conectar con la base de datos.');
        }
    },

    // Renderiza los datos del perfil en la página
    renderProfile: function(companyData) {
        const data = companyData.landingPageData || {};

        // Actualizar título de la página para SEO y usabilidad
        document.title = `${data.companyName || 'Perfil'} - Makumoto®`;
        
        // Rellenar elementos
        this.elements.companyLogo.src = data.logoUrl || 'https://placehold.co/150x150/FFD700/000000?text=Logo';
        this.elements.companyLogo.alt = `Logo de ${data.companyName || 'empresa'}`;
        this.elements.companyName.textContent = data.companyName || 'Nombre no disponible';
        this.elements.companyTagline.textContent = data.tagline || '';
        this.elements.companyDescription.textContent = data.description || 'No hay descripción disponible.';

        // Construir información de contacto
        let contactHTML = '';
        if (data.contactWebsite) {
            contactHTML += `
                <div class="contact-item">
                    <i class="fas fa-globe"></i>
                    <a href="${data.contactWebsite}" target="_blank" rel="noopener noreferrer">${data.contactWebsite}</a>
                </div>
            `;
        }
        if (data.contactPhone) {
            contactHTML += `
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <a href="tel:${data.contactPhone}">${data.contactPhone}</a>
                </div>
            `;
        }
        this.elements.contactInfo.innerHTML = contactHTML;
        
        // Ocultar loader y mostrar contenido
        this.elements.loader.style.display = 'none';
        this.elements.profileContent.style.display = 'block';
    },

    // Muestra un mensaje de error en la página
    renderError: function(message) {
        this.elements.loader.style.display = 'none';
        this.elements.container.innerHTML = `<p class="error-text"><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
    }
};

// Punto de entrada: ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app.profile.init();
});