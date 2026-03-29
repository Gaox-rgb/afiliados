(async () => {
    'use strict';

    // Esta función se autoejecuta en un scope aislado, protegiéndonos de scripts externos.

    function displayMessage(message, isError = false) {
        const container = document.getElementById('processing-message');
        container.innerHTML = `<p style="color:${isError ? 'var(--color-secondary)' : 'var(--color-text)'};">${message}</p>`;
    }

    async function finalizePurchase() {
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('planId');
        const amount = params.get('amount');
        const currency = params.get('currency');
        const orderID = params.get('token'); // PayPal devuelve el ID de la orden como 'token'

        document.getElementById('plan-name').textContent = planId || 'No especificado';
        document.getElementById('plan-cost').textContent = `$${amount || '0.00'} ${currency || 'USD'}`;

        if (!orderID) {
            displayMessage("Error: No se encontró el ID de la orden. Contacta a soporte.", true);
            return;
        }

        try {
            // Aseguramos que Firebase esté listo
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                console.error("Firebase no está inicializado.");
                displayMessage("Error de configuración. No se pudo contactar al servidor.", true);
                return;
            }

            const finalize = firebase.functions().httpsCallable('finalizeAffiliatePurchase');
            const result = await finalize({ orderID: orderID });

            const { email, tempPassword, convenioCode } = result.data;
            
            document.getElementById('user-email').textContent = email;
            document.getElementById('user-password').textContent = tempPassword;
            document.getElementById('user-convenio-code').textContent = convenioCode;
            
            document.getElementById('processing-message').style.display = 'none';
            document.getElementById('credentials-container').style.display = 'block';

        } catch (error) {
            console.error("Error al finalizar la compra:", error);
            let errorMessage = "Ocurrió un error inesperado. Por favor, contacta a soporte con tu ID de orden.";
            if (error.message.includes('already-exists') || error.message.includes('aborted')) {
                errorMessage = "Esta compra ya ha sido procesada. Revisa tu correo electrónico (incluyendo spam) o intenta iniciar sesión.";
            }
            // Corrección: Los errores de Firebase Functions se identifican por 'code', no por 'message'.
            if (error.code === 'functions/already-exists' || error.code === 'functions/aborted') {
                errorMessage = "Esta compra ya ha sido procesada. Revisa tu correo electrónico (incluyendo spam) donde deben estar tus credenciales, o intenta iniciar sesión.";
                // ¡AQUÍ LA MAGIA! Mostramos el botón de reenvío
                document.getElementById('resend-credentials-btn').style.display = 'inline-block';
            }
            displayMessage(errorMessage, true);
        }
    }

    function setupResendButton() {
        const resendBtn = document.getElementById('resend-credentials-btn');
        if (!resendBtn) return;
        resendBtn.textContent = "Mostrar Credenciales de Nuevo"; // Texto más preciso

        resendBtn.addEventListener('click', async () => {
            const params = new URLSearchParams(window.location.search);
            const orderID = params.get('token');
            if (!orderID) {
                alert("No se pudo encontrar el ID de la orden para recuperar los datos.");
                return;
            }

            displayMessage('<i class="fas fa-spinner fa-spin"></i> Recuperando tus datos...', false);
            resendBtn.style.display = 'none';

            try {
                const getCredentials = firebase.functions().httpsCallable('getAffiliateCredentialsByOrder');
                const result = await getCredentials({ orderID: orderID });
                const { email, tempPassword, convenioCode } = result.data;

                // REUTILIZAMOS LA LÓGICA DE VISUALIZACIÓN
                document.getElementById('user-email').textContent = email;
                document.getElementById('user-password').textContent = tempPassword;
                document.getElementById('user-convenio-code').textContent = convenioCode;
                document.getElementById('processing-message').style.display = 'none';
                document.getElementById('credentials-container').style.display = 'block';

            } catch (error) {
                console.error("Error al recuperar credenciales:", error);
                displayMessage("Hubo un error al recuperar los datos. Por favor, contacta a soporte.", true);
            }
        });
    }

    // Esperar a que el DOM esté completamente cargado antes de ejecutar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            finalizePurchase();
            setupResendButton();
        });
    } else {
        finalizePurchase();
        setupResendButton();
    }

})();
