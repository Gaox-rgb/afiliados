(async () => {
    'use strict';

    // =================================================================================
    //  NUEVA ARQUITECTURA "FIJAR Y CONFIRMAR" - MAKUMOTO
    // =================================================================================

    // Invocación segura mediante Firebase SDK Callable, eliminando dependencias de rutas de Hosting
    async function callCallableFunction(functionName, data) {
        try {
            const response = await fetch(`https://us-central1-afiliados-makumoto.cloudfunctions.net/${functionName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: data })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Fallo en la comunicación con el servidor.");
            }
            const resData = await response.json();
            return resData.result || resData.data;
        } catch (error) {
            throw new Error(error.message || "Fallo en la comunicación con el servidor.");
        }
    }

    const ui = {
        processingMessage: document.getElementById('processing-message'),
        credentialsContainer: document.getElementById('credentials-container'),
        activationFormContainer: document.getElementById('activation-form-container'),
        confirmReceiptBtn: document.getElementById('confirm-receipt-btn'),
        planName: document.getElementById('plan-name'),
        planCost: document.getElementById('plan-cost'),
        convenioCode: document.getElementById('user-convenio-code'),
        password: document.getElementById('user-password'),
        activationForm: document.getElementById('activation-form'),
        activationCodeInput: document.getElementById('activation-code'),
        activateBtn: document.getElementById('activate-btn'),
        mainContent: document.getElementById('main-content'),
        finalMessage: document.getElementById('final-message'),
        welcomeMessage: document.getElementById('welcome-message'),
    };

    function displayMessage(message, isError = false) {
        ui.processingMessage.innerHTML = `<p style="color:${isError ? 'var(--color-secondary)' : 'var(--color-text)'};">${message}</p>`;
        ui.processingMessage.style.display = 'block';
    }

    function showCredentials(credentials) {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('planId');
    const isIndividual = planId === 'plan_plus' || planId === 'arsenal_plus';

    ui.processingMessage.style.display = 'none';

    if (isIndividual) {
        ui.welcomeMessage.innerHTML = `
            <h1 style="color: #00ecff;"><i class="fas fa-check-circle"></i> ¡Operación Exitosa!</h1>
            <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Hemos enviado tus instrucciones y datos de acceso oficiales de tu membresía a tu correo electrónico. Úsalos para entrar directamente en makumoto.com</p>
        `;

        ui.mainContent.innerHTML = `
            <div style="background: rgba(0,236,255,0.05); border: 1px solid rgba(0,236,255,0.3); padding: 25px; border-radius: 10px; margin-bottom: 25px; text-align: left;">
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #00ecff; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Membresía Individual Plus</p>
                <p style="margin: 5px 0; font-size: 0.95rem; line-height: 1.4;">Tus datos de acceso para activar tus 25 herramientas tácticas en <b>makumoto.com</b> ya están listos y han sido transmitidos a tu buzón.</p>
            </div>
            <button id="btn-understood-b2c" class="cta-button" style="width: 100%; padding: 15px; background-color: #00ecff; color: #000; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; font-size: 1.1rem; text-transform: uppercase; box-shadow: 0 0 15px rgba(0,236,255,0.4);">ENTENDIDO</button>
        `;

        document.getElementById('btn-understood-b2c').onclick = () => {
            window.location.replace('index.html');
        };
    } else {
        ui.convenioCode.textContent = credentials.convenioCode;
        ui.password.textContent = credentials.tempPassword;
        ui.credentialsContainer.style.display = 'block';
        ui.activationFormContainer.style.display = 'block';
    }
}

    async function handlePageLoad() {
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('planId') || 'No especificado';
        const amount = params.get('amount') || '0.00';
        const currency = params.get('currency') || 'USD';
        const orderID = params.get('token');

        ui.planName.textContent = planId;
        ui.planCost.textContent = `$${amount} ${currency}`;

        // 1. REVISAR SI LAS CREDENCIALES YA ESTÁN EN LA SESIÓN (A PRUEBA DE RECARGAS - ZERO LATENCY)
        const storedCredentials = sessionStorage.getItem(`credentials_${orderID}`) || sessionStorage.getItem('pending_manager_credentials');
        if (storedCredentials) {
            console.log("Credenciales encontradas localmente en caché. Mostrando inmediatamente.");
            const parsedCreds = JSON.parse(storedCredentials);
            showCredentials(parsedCreds);
            
            // Si el código de confirmación final aún no está activo, igual gatillamos la llamada de captura en background
            if (orderID) {
                callCallableFunction('finalizeAffiliatePurchase', { orderID: orderID })
                    .then(res => console.log("Captura de PayPal completada en segundo plano con éxito:", res))
                    .catch(err => console.warn("Llamada en background de control, posiblemente capturada ya por Webhook:", err));
            }
            return;
        }

        if (!orderID) {
            displayMessage("Error: No se encontró el ID de la orden. Contacta a soporte.", true);
            return;
        }

        // 2. SI NO HAY CACHÉ, INTENTAR CAPTURA DE FORMA DIRECTA USANDO CALLABLE SDK (SEGURO CONTRA 404 DE HOSTING)
       try {
            console.log("Gatillando finalizeAffiliatePurchase mediante SDK Callable directo...");
            const result = await callCallableFunction('finalizeAffiliatePurchase', { orderID: orderID });
            
            if (result && result.success) {
                const credentials = result.credentials;
                sessionStorage.setItem(`credentials_${orderID}`, JSON.stringify(credentials));
                showCredentials(credentials);
            } else {
                const errMsg = result ? result.error : "Respuesta vacía del servidor.";
                throw new Error(errMsg);
            }

        } catch (error) {
            console.warn("Fallo en captura primaria SDK, intentando recuperación automática...", error);
            try {
                const result = await callCallableFunction('getAffiliateCredentialsByOrder', { orderID: orderID });
                
                if (result && result.success) {
                    const credentials = result.credentials;
                    sessionStorage.setItem(`credentials_${orderID}`, JSON.stringify(credentials));
                    showCredentials(credentials);
                } else {
                    const recErrMsg = result ? result.error : "No se halló registro de la orden.";
                    throw new Error(recErrMsg);
                }
            } catch (recoveryError) {
                console.error("Fallo definitivo de recuperación:", recoveryError);
                displayMessage(`Error Primario de Pasarela: ${error.message || error} <br><br><span style="color:#ff4d4d; font-weight:bold;">Causa raíz:</span> ${recoveryError.message || recoveryError}`, true);
            }
        }
    }
    
    // 4. ENVIAR CÓDIGO DE ACTIVACIÓN DE 6 DÍGITOS PARA PROBAR EMAIL Y ENVIAR CREDENCIALES FINALES
    ui.activationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = ui.activationCodeInput.value;
        const storedCredentials = JSON.parse(sessionStorage.getItem(`credentials_${new URLSearchParams(window.location.search).get('token')}`) || sessionStorage.getItem('pending_manager_credentials'));

        if (!code || !storedCredentials) {
            alert("Los datos de esta transacción expiraron. Por favor, recarga o inicia sesión.");
            return;
        }

        ui.activateBtn.disabled = true;
        ui.activateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        try {
            const response = await callCallableFunction('activateAffiliateAccount', {
                email: storedCredentials.email,
                code: code
            });
            
            if (response && response.success) {
                ui.activationFormContainer.innerHTML = `
                    <div style="background: rgba(40,167,69,0.05); border: 1px solid rgba(40,167,69,0.4); padding: 20px; border-radius: 8px; color: #2ecc71; font-weight: 500; text-align: center; margin-top: 15px; font-size: 0.9rem; line-height: 1.5;">
                        <i class="fas fa-check-circle fa-lg" style="color: #2ecc71; margin-right: 5px;"></i>
                        ¡Cuenta Verificada e Inmunizada!<br>
                        Enviamos un instructivo a: <span style="color:#fff; font-weight:bold;">${storedCredentials.email}</span> con los accesos oficiales.
                    </div>`;
                ui.confirmReceiptBtn.style.display = 'inline-block'; // Mostrar botón de confirmación final
            } else {
                throw new Error("Respuesta inválida del servidor.");
            }

        } catch (error) {
            console.error("Error en activación de cuenta:", error);
            alert("Código de activación inválido. Por favor, revisa el correo e intenta de nuevo.");
            ui.activateBtn.disabled = false;
            ui.activateBtn.innerHTML = 'Activar Cuenta y Convenio';
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