// js/payments.js
console.log("MAKUMOTO® DEBUG: payments.js comenzando. (Asume window.app ya inicializado por app.js).");
// VERSIÓN DE COMBATE FINAL - PROTOCOLO DE RE-ENSAMBLAJE de Makumoto®
// NO inicializar window.app aquí. Se inicializa en app.js
window.app.payments = {
    loadPayPalSDK: function(clientId, callback) {
        console.log("MAKUMOTO® DEBUG: payments.js - loadPayPalSDK iniciado.");
        if (window.paypal) {
            console.log("MAKUMOTO® DEBUG: SDK de PayPal ya cargado. Callback ejecutado.");
            if (callback) callback();
            return;
        }
        console.log(`MAKUMOTO® DEBUG: Cargando SDK de PayPal desde: https://www.paypal.com/sdk/js?client-id=${clientId.substring(0, 10)}...&currency=USD&components=buttons`);
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
        script.onload = () => {
            console.log("MAKUMOTO® DEBUG: SDK de PayPal cargado con éxito. Callback ejecutado.");
            if (callback) callback();
        };
        script.onerror = (e) => {
            console.error("MAKUMOTO® ERROR CRÍTICO: El SDK de PayPal no pudo cargarse. Verifique el Client ID de PayPal y su conexión a internet.", e);
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error al cargar PayPal. Asegúrate de tener conexión a internet.</p>`;
            }
        };
        document.body.appendChild(script);
        console.log("MAKUMOTO® DEBUG: payments.js - loadPayPalSDK finalizado.");
    },

    renderButton: function(containerId, planData, clientId) {
        console.log("MAKUMOTO® DEBUG: payments.js - renderButton iniciado para containerId:", containerId);
        this.loadPayPalSDK(clientId, () => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`MAKUMOTO® ERROR CRÍTICO: Contenedor de pago #${containerId} no encontrado.`);
                return;
            }
            
            container.innerHTML = ''; // Limpiar el "Cargando..."

            if (!window.paypal || !window.paypal.Buttons) {
                console.error("MAKUMOTO® ERROR CRÍTICO: window.paypal o window.paypal.Buttons no disponibles después de cargar SDK.");
                container.innerHTML = `<p style="color:var(--color-secondary);">Error al inicializar la pasarela de pago de PayPal.</p>`;
            } else { // Añadido else para envolver el renderizado si PayPal es válido
                console.log("MAKUMOTO® DEBUG: Inicializando botones de PayPal.");
                window.paypal.Buttons({
                    style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'pay' },

                    createOrder: (data, actions) => {
                        console.log("MAKUMOTO® DEBUG: PayPal createOrder ejecutado. Creando orden para:", planData);
                        return actions.order.create({
                            purchase_units: [{
                                description: `Suscripción al Plan ${planData.name} de Makumoto®`,
                                amount: {
                                    value: String(planData.price),
                                    currency_code: "USD"
                                },
                                custom_id: planData.id
                            }]
                        });
                    },

                    onApprove: (data, actions) => {
                        console.log("MAKUMOTO® DEBUG: PayPal onApprove ejecutado. Orden ID:", data.orderID);
                        container.innerHTML = `<div style="text-align:center; padding:15px; color:var(--color-primary);"><i class="fas fa-spinner fa-spin"></i> Verificando pago Makumoto®...</div>`;
                        
                        // --- LLAMADA AL CUARTEL GENERAL (BACKEND) CON FUEGO REAL ---
                        if (!window.firebase || !window.firebase.functions) {
                            console.error("MAKUMOTO® ERROR CRÍTICO: Enlace de comando con Firebase no establecido.");
                             container.innerHTML = `<p style="color:var(--color-secondary);">Error: Enlace de comando con Firebase no establecido.</p>`;
                             return;
                        }
                        
                        const httpsCallable = window.firebase.functions.httpsCallable;
                        const processPurchase = httpsCallable(window.firebase.functions, 'processAffiliatePurchase');
                        
                        console.log("MAKUMOTO® DEBUG: Invocando función Firebase 'processAffiliatePurchase' con orderID:", data.orderID);
                        processPurchase({ orderID: data.orderID })
                            .then(result => {
                                console.log("MAKUMOTO® DEBUG: Respuesta de Firebase:", result);
                                if (result.data.success) {
                                    container.innerHTML = `<div style="text-align:center; padding:15px; color:#2ecc71;"><i class="fas fa-check-circle"></i> ¡Pago Verificado por Makumoto®!</div>`;
                                    setTimeout(() => {
                                        alert(`¡Gracias por tu compra Makumoto®! Revisa tu correo electrónico para obtener tus credenciales de acceso.`);
                                        const modal = document.getElementById('payment-gateway-modal');
                                        if(modal) modal.remove();
                                    }, 2000);
                                } else {
                                    console.error("MAKUMOTO® ERROR CRÍTICO: La verificación del pago falló en el backend.", result.data.error);
                                    throw new Error('La verificación del pago falló en el backend.');
                                }
                            })
                            .catch(error => {
                                console.error('MAKUMOTO® ERROR CRÍTICO: Error al procesar la compra con Firebase:', error);
                                container.innerHTML = `<p style="color:var(--color-secondary); font-size:0.8rem;">Hubo un error al verificar tu pago. Por favor, contacta a soporte de Makumoto®.</p>`;
                            });
                    },

                    onCancel: (data) => {
                        console.warn("MAKUMOTO® DEBUG: Transacción de PayPal cancelada por el usuario.", data);
                        container.innerHTML = `<p style="color:var(--color-text);">Transacción cancelada. Puedes intentarlo de nuevo.</p>`;
                    },

                    onError: (err) => {
                        console.error('MAKUMOTO® ERROR CRÍTICO: Error de PayPal durante la transacción:', err);
                        container.innerHTML = `<p style="color:var(--color-secondary); font-size:0.8rem;">Ocurrió un error. Intenta de nuevo o contacta a soporte.</p>`;
                    }
                }).render(`#${containerId}`);
                console.log("MAKUMOTO® DEBUG: Botones de PayPal renderizados en:", containerId);
            }
        });
        console.log("MAKUMOTO® DEBUG: payments.js - renderButton finalizado.");
    }
};
console.log("MAKUMOTO® DEBUG: payments.js finalizado.");