// js/payments.js
// VERSIÓN DE COMBATE FINAL - PROTOCOLO DE RE-ENSAMBLAJE de Makumoto®
// js/payments.js
// VERSIÓN DE COMBATE FINAL - PROTOCOLO DE RE-ENSAMBLAJE de Makumoto®
window.app = window.app || {};
console.log("MAKUMOTO® DEBUG: payments.js cargado.");

window.app.payments = {
    loadPayPalSDK: function(clientId, callback) {
        if (window.paypal) {
            console.log("MAKUMOTO® DEBUG: SDK de PayPal ya cargado.");
            if (callback) callback();
            return;
        }
        console.log("MAKUMOTO® DEBUG: Cargando SDK de PayPal desde:", `https://www.paypal.com/sdk/js?client-id=${clientId.substring(0, 10)}...&currency=USD&components=buttons`);
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
        script.onload = () => {
            console.log("MAKUMOTO® DEBUG: SDK de PayPal cargado con éxito.");
            if (callback) callback();
        };
        script.onerror = (e) => {
            console.error("MAKUMOTO® ERROR CRÍTICO: El SDK de PayPal no pudo cargarse.", e);
            console.error("Verifique el Client ID de PayPal y su conexión a internet.");
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error al cargar PayPal. Asegúrate de tener conexión a internet.</p>`;
            }
        };
        document.body.appendChild(script);
    },
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
        script.onload = () => {
            if (callback) callback();
        };
        script.onerror = () => {
            console.error("Error crítico: El SDK de PayPal no pudo cargarse. Verifique el Client ID y la conexión a internet.");
        };
        document.body.appendChild(script);
    },

    renderButton: function(containerId, planData, clientId) {
        this.loadPayPalSDK(clientId, () => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Contenedor de pago #${containerId} no encontrado.`);
                return;
            }
            
            container.innerHTML = ''; // Limpiar el "Cargando..."

            if (!window.paypal || !window.paypal.Buttons) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error al inicializar la pasarela de pago.</p>`;
                return;
            }

            window.paypal.Buttons({
                style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'pay' },

                createOrder: (data, actions) => {
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
                    container.innerHTML = `<div style="text-align:center; padding:15px; color:var(--color-primary);"><i class="fas fa-spinner fa-spin"></i> Verificando pago...</div>`;
                    
                    // --- LLAMADA AL CUARTEL GENERAL (BACKEND) CON FUEGO REAL ---
                    // Asegúrese de que el SDK de Firebase está inicializado en la página HTML
                    if (!window.firebase || !window.firebase.functions) {
                         container.innerHTML = `<p style="color:var(--color-secondary);">Error: Enlace de comando con Firebase no establecido.</p>`;
                         return;
                    }
                    
                    const httpsCallable = window.firebase.functions.httpsCallable;
                    const processPurchase = httpsCallable(window.firebase.functions, 'processAffiliatePurchase');
                    
                    processPurchase({ orderID: data.orderID })
                        .then(result => {
                            if (result.data.success) {
                                container.innerHTML = `<div style="text-align:center; padding:15px; color:#2ecc71;"><i class="fas fa-check-circle"></i> ¡Pago Verificado!</div>`;
                                setTimeout(() => {
                                    alert(`¡Gracias por tu compra! Revisa tu correo electrónico para obtener tus credenciales de acceso.`);
                                    const modal = document.getElementById('payment-gateway-modal');
                                    if(modal) modal.remove();
                                }, 2000);
                            } else {
                                throw new Error('La verificación del pago falló en el backend.');
                            }
                        })
                        .catch(error => {
                            console.error('Error al procesar la compra:', error);
                            container.innerHTML = `<p style="color:var(--color-secondary); font-size:0.8rem;">Hubo un error al verificar tu pago. Por favor, contacta a soporte.</p>`;
                        });
                },

                onError: (err) => {
                    console.error('Error de PayPal:', err);
                    container.innerHTML = `<p style="color:var(--color-secondary); font-size:0.8rem;">Ocurrió un error. Intenta de nuevo.</p>`;
                }
            }).render(`#${containerId}`);
        });
    }
};