window.app = window.app || {};

window.app.ui = {
    // Selectores del DOM
    heroSection: document.getElementById('seccion-hero'),
    // Los selectores de Calculadora y Sandbox han sido eliminados.
   
    // Las funciones personalizeView, resetView y populateContent han sido expurgadas.
    // La página ahora sigue una lógica estática y unificada.

    toggleStickyBar: function() {
        // La barra aparece después de que el usuario ha pasado el 'hero'
        if (window.scrollY > this.heroSection.offsetHeight) {
            this.stickyBar.classList.add('visible');
        } else {
            this.stickyBar.classList.remove('visible');
        }
    },

    // Las funciones showExitIntentModal y hideExitIntentModal han sido expurgadas.

    // --- LÓGICA DE LA QUIJADA IMPLANTADA Y MEJORADA ---
    initLandingDynamics: function() {
        this.initDialogPlayer(); // PROTOCOLO TIERRA QUEMADA ACTIVO
        this.initTestimonialSlider();
        this.initFomoBubbles();
        this.initOfferCounter();
    },

    // PROTOCOLO DE DOMINACIÓN ABSOLUTA
    // PROTOCOLO DE OCUPACIÓN PERSISTENTE
    initDialogPlayer: function() {
        const controlBtn = document.getElementById('dialogo-control-btn');
        const container = document.getElementById('dialogo-player-container');
        if (!controlBtn || !container) return;
        
        const burbujas = Array.from(container.querySelectorAll('.mensaje-burbuja'));
        let isPlaying = false;
        let hasPlayedOnce = false;
        let dialogoInterval = null;

        const playSequence = () => {
            if (isPlaying) return;
            isPlaying = true;
            
            controlBtn.style.display = 'inline-block';
            controlBtn.innerHTML = `<i class="fas fa-pause"></i> DETENER ANIMACIÓN`;
            
            const runLoop = () => {
                // Reset e inicio de secuencia
                let delay = 0;
                burbujas.forEach(b => b.classList.remove('visible'));
                
                burbujas.forEach(burbuja => {
                    setTimeout(() => {
                        burbuja.classList.add('visible');
                    }, delay);
                    delay += 1500;
                });
            };

            runLoop(); // Ejecutar inmediatamente la primera vez
            dialogoInterval = setInterval(runLoop, burbujas.length * 1500 + 1000); // Repetir el bucle
        };

        const stopSequence = () => {
            if (!isPlaying) return;
            clearInterval(dialogoInterval);
            isPlaying = false;
            controlBtn.innerHTML = `<i class="fas fa-play"></i> REANUDAR DIÁLOGO`;
            // IMPORTANTE: No ocultamos las burbujas. Se quedan estáticas donde paró el ciclo.
        };

        controlBtn.addEventListener('click', () => {
            if (isPlaying) {
                stopSequence();
            } else {
                playSequence();
            }
        });
        
        // El francotirador re-activado para el primer asalto
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasPlayedOnce) {
                    hasPlayedOnce = true;
                    playSequence();
                    observer.unobserve(entry.target); // El francotirador dispara una sola vez y se retira.
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(container);
    // ... Lógica del initDialogPlayer ...
    },
    
    // ===== INTERFAZ DE PASARELA DE PAGO =====
    showPaymentGateway: function(planData) {
        // Eliminar cualquier modal de pago anterior para evitar duplicados
        const oldModal = document.getElementById('payment-gateway-modal');
        if (oldModal) oldModal.remove();

        const modalHTML = `
            <div id="payment-gateway-modal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close-btn">&times;</button>
                    <h3>Confirmación de Arsenal</h3>
                    <p>Estás a punto de activar el <strong>Plan ${planData.name}</strong> por <strong>$${planData.price.toFixed(2)} USD/mes</strong>.</p>
                    <div id="paypal-button-container">
                        <div style="text-align:center; padding:15px; color:#aaa;">
                            <i class="fas fa-spinner fa-spin"></i> Cargando pasarela de pago...
                        </div>
                    </div>
                    <p style="font-size: 0.8rem; color: #888; margin-top: 15px;">Serás redirigido a PayPal para completar una transacción segura.</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('payment-gateway-modal');

        // Hacer visible el modal
        setTimeout(() => modal.classList.add('visible'), 10);

        // Añadir listener de cierre
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });

        // INVOCAR AL ESPECIALISTA DE PAGOS
        // Esto asume que el backend tiene una función `processB2bPurchase` lista.
        // Aquí simularemos el flujo, pero en producción, el `onApprove` llamaría a esa función.
        // Sustituya 'TU_CLIENT_ID_DE_PAYPAL_LIVE' con la llave que obtuvo en la FASE 1
        const PAYPAL_LIVE_CLIENT_ID = 'AXZ8W2MQaEjQK5lIORlA8l4OoOCWm3UATWeWGqtt1NSEnrYIlKsyjxWOUca6j5qzNhx2o9smjCnU2A6q';
        
        // Importar y usar el nuevo especialista en pagos
        import('./payments.js').then(module => {
            module.default.renderButton('paypal-button-container', planData, PAYPAL_LIVE_CLIENT_ID);
        }).catch(err => console.error("Fallo al cargar el módulo de pagos:", err));
    },

    // La función renderPayPalButton (simulación) ha sido eliminada.

    initTestimonialSlider: function() {
        const testimonios = document.querySelectorAll('.testimonio');
        if (testimonios.length > 0) {
            let testimonioActual = 0;
            setInterval(() => {
                testimonios[testimonioActual].classList.remove('active');
                testimonioActual = (testimonioActual + 1) % testimonios.length;
                testimonios[testimonioActual].classList.add('active');
            }, 6000);
        }
    },

    initFomoBubbles: function() {
        const fomoContainer = document.getElementById('fomo-container');
        if (fomoContainer) {
            const comprasFalsas = [
                { emoji: '🚀', nombre: "TechCorp", ciudad: "Bogotá", plan: "Business", pais: "🇨🇴" },
                { emoji: '💪', nombre: "PowerFit Gym", ciudad: "Miami", plan: "Acelerador de Tribu", pais: "🇺🇸" },
                { emoji: '✨', nombre: "Clínica Dental Soto", ciudad: "Madrid", plan: "Equipo Semilla", pais: "🇪🇸" },
                { emoji: '🔥', nombre: "Juan P.", ciudad: "CDMX", plan: "Equipo Semilla", pais: "🇲🇽" },
                { emoji: '🏆', nombre: "Laura M.", ciudad: "Santiago", plan: "Business", pais: "🇨🇱" },
            ];
            let compraIndex = 0;

            const mostrarBurbuja = () => {
                const compra = comprasFalsas[compraIndex];
                compraIndex = (compraIndex + 1) % comprasFalsas.length;
                
                const burbuja = document.createElement('div');
                burbuja.className = 'fomo-burbuja';
                burbuja.innerHTML = `<span class="fomo-bandera">${compra.pais}</span><div>${compra.emoji} <strong>${compra.nombre}</strong> de ${compra.ciudad} se unió con el <strong>Plan ${compra.plan}</strong>.</div>`;
                
                fomoContainer.appendChild(burbuja);

                setTimeout(() => { burbuja.classList.add('visible'); }, 100);

                setTimeout(() => {
                    burbuja.classList.remove('visible');
                    setTimeout(() => { burbuja.remove(); }, 500);
                }, 6000);
            };

            setTimeout(() => {
                mostrarBurbuja();
                setInterval(mostrarBurbuja, 30000);
            }, 5000);
        }
    },

    initOfferCounter: function() {
        const contadorElemento = document.getElementById('contador-paquetes');
        if (contadorElemento) {
            let paquetesRestantes = 47;
            const intervaloContador = setInterval(() => {
                paquetesRestantes -= 1;
                if (paquetesRestantes < 10) {
                    paquetesRestantes = 10;
                    clearInterval(intervaloContador);
                }
                contadorElemento.textContent = paquetesRestantes;
            }, 15000);
        }
    }
};