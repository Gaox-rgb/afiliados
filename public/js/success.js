(async () => {
    'use strict';

    // =================================================================================
    //  NUEVA ARQUITECTURA "FIJAR Y CONFIRMAR" - MAKUMOTO
    // =================================================================================

    const ui = {
        processingMessage: document.getElementById('processing-message'),
        credentialsContainer: document.getElementById('credentials-container'),
        recoveryFormContainer: document.getElementById('recovery-form-container'),
        confirmReceiptBtn: document.getElementById('confirm-receipt-btn'),
        planName: document.getElementById('plan-name'),
        planCost: document.getElementById('plan-cost'),
        convenioCode: document.getElementById('user-convenio-code'),
        password: document.getElementById('user-password'),
        recoveryForm: document.getElementById('recovery-form'),
        recoveryEmailInput: document.getElementById('recovery-email'),
        sendRecoveryBtn: document.getElementById('send-recovery-btn'),
        mainContent: document.getElementById('main-content'),
        finalMessage: document.getElementById('final-message'),
        welcomeMessage: document.getElementById('welcome-message'),
    };

    function displayMessage(message, isError = false) {
        ui.processingMessage.innerHTML = `<p style="color:${isError ? 'var(--color-secondary)' : 'var(--color-text)'};">${message}</p>`;
        ui.processingMessage.style.display = 'block';
    }

    function showCredentials(credentials) {
        ui.convenioCode.textContent = credentials.convenioCode;
        ui.password.textContent = credentials.tempPassword;
        ui.processingMessage.style.display = 'none';
        ui.credentialsContainer.style.display = 'block';
        ui.recoveryFormContainer.style.display = 'block';
    }

    async function handlePageLoad() {
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('planId') || 'No especificado';
        const amount = params.get('amount') || '0.00';
        const currency = params.get('currency') || 'USD';
        const orderID = params.get('token');

        ui.planName.textContent = planId;
        ui.planCost.textContent = `$${amount} ${currency}`;

        // 1. REVISAR SI LAS CREDENCIALES YA ESTÁN EN LA SESIÓN (A PRUEBA DE RECARGAS)
        const storedCredentials = sessionStorage.getItem(`credentials_${orderID}`);
        if (storedCredentials) {
            console.log("Credenciales encontradas en sessionStorage. Mostrando directamente.");
            showCredentials(JSON.parse(storedCredentials));
            return;
        }

        if (!orderID) {
            displayMessage("Error: No se encontró el ID de la orden. Contacta a soporte.", true);
            return;
        }

        // 2. SI NO HAY NADA GUARDADO, INTENTAR FINALIZAR LA COMPRA
        try {
            console.log("Llamando a finalizeAffiliatePurchase...");
            const finalize = firebase.functions().httpsCallable('finalizeAffiliatePurchase');
            const result = await finalize({ orderID: orderID });
            const credentials = result.data;
            
            sessionStorage.setItem(`credentials_${orderID}`, JSON.stringify(credentials));
            showCredentials(credentials);

        } catch (error) {
            // 3. SI LA ORDEN YA FUE PROCESADA (409), LA RECUPERAMOS AUTOMÁTICAMENTE
            if (error.code === 'functions/aborted' || error.message.includes('procesada')) {
                console.warn("La orden ya fue procesada. Intentando recuperación automática...");
                try {
                    const getCredentials = firebase.functions().httpsCallable('getAffiliateCredentialsByOrder');
                    const result = await getCredentials({ orderID: orderID });
                    const credentials = result.data;

                    sessionStorage.setItem(`credentials_${orderID}`, JSON.stringify(credentials));
                    showCredentials(credentials);
                } catch (recoveryError) {
                    console.error("Falló la recuperación automática:", recoveryError);
                    displayMessage("Hubo un error al recuperar tus datos. Por favor, contacta a soporte.", true);
                }
            } else {
                console.error("Error inesperado al finalizar la compra:", error);
                displayMessage("Ocurrió un error inesperado. Por favor, contacta a soporte con tu ID de orden.", true);
            }
        }
    }
    
    // 4. MANEJAR EL FORMULARIO DE ENVÍO DE RESPALDO POR CORREO
    ui.recoveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = ui.recoveryEmailInput.value;
        const storedCredentials = JSON.parse(sessionStorage.getItem(`credentials_${new URLSearchParams(window.location.search).get('token')}`));

        if (!email || !storedCredentials) {
            alert("No se encontraron los datos para enviar. Refresca la página.");
            return;
        }

        ui.sendRecoveryBtn.disabled = true;
        ui.sendRecoveryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const sendRecovery = firebase.functions().httpsCallable('sendRecoveryCredentials');
            await sendRecovery({
                email: email,
                convenioCode: storedCredentials.convenioCode,
                tempPassword: storedCredentials.tempPassword
            });
            
            ui.recoveryFormContainer.innerHTML = `<p style="color:#28a745;"><b>¡Éxito!</b> Respaldo enviado a ${email}.</p>`;
            ui.confirmReceiptBtn.style.display = 'inline-block'; // Mostrar botón final

        } catch (error) {
            console.error("Error al enviar correo de respaldo:", error);
            alert("No se pudo enviar el correo. Intenta de nuevo.");
            ui.sendRecoveryBtn.disabled = false;
            ui.sendRecoveryBtn.textContent = 'Enviar Respaldo';
        }
    });

    // 5. MANEJAR LA CONFIRMACIÓN FINAL DEL USUARIO
    ui.confirmReceiptBtn.addEventListener('click', () => {
        const orderID = new URLSearchParams(window.location.search).get('token');
        sessionStorage.removeItem(`credentials_${orderID}`);
        
        ui.mainContent.style.display = 'none';
        ui.welcomeMessage.style.display = 'none';
        ui.finalMessage.style.display = 'block';
    });

    // INICIAR LA LÓGICA
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
        handlePageLoad();
    }

})();