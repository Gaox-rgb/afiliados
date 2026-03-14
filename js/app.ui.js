// js/app.ui.js
console.log("MAKUMOTO® DEBUG: app.ui.js comenzando. (Asume window.app ya inicializado).");
// NO inicializar window.app aquí. Se inicializa en app.js

window.app.ui = {
    // Selectores del DOM
    // `heroSection` ya no se usa directamente aquí.

    // Las funciones personalizeView, resetView y populateContent han sido expurgadas.
    // La página ahora sigue una lógica estática y unificada.

    // La función toggleStickyBar y sus llamadas han sido eliminadas ya que no se usaba o estaba comentada.

    // Las funciones showExitIntentModal y hideExitIntentModal han sido expurgadas.

    // --- LÓGICA DE LA QUIJADA IMPLANTADA Y MEJORADA ---
    initLandingDynamics: function() {
        console.log("MAKUMOTO® DEBUG: app.ui.js - initLandingDynamics iniciado.");
        this.initDialogPlayer(); // PROTOCOLO TIERRA QUEMADA ACTIVO
        this.initTestimonialSlider();
        this.initFomoBubbles();
        this.initOfferCounter();
        this.initSmoothScroll(); // Lógica de scroll movida a su ubicación correcta
        console.log("MAKUMOTO® DEBUG: app.ui.js - initLandingDynamics finalizado.");
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
        console.log("MAKUMOTO® DEBUG: app.ui.js - showPaymentGateway iniciado para plan:", planData);
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
            console.log("MAKUMOTO® DEBUG: Modal de pago cerrado por el usuario.");
            modal.remove();
        });

        // INVOCAR AL ESPECIALISTA DE PAGOS
        const PAYPAL_LIVE_CLIENT_ID = 'AXZ8W2MQaEjQK5lIORlA8l4OoOCWm3UATWeWGqtt1NSEnrYIlKsyjxWOUca6j5qzNhx2o9smjCnU2A6q';
        
        // --- MAKUMOTO® VERIFICACIÓN DE INTEGRIDAD DE MÓDULOS DE PAGO ---
        // debugger; // DETENEDOR CRÍTICO: ACTIVADO PARA INSPECCIÓN MANUAL
        console.log("MAKUMOTO® DEBUG: app.ui.js - Verificando integridad de window.app:", window.app);
        console.log("MAKUMOTO® DEBUG: app.ui.js - Verificando integridad de window.app.payments:", window.app.payments);

        if (!window.app || !window.app.payments) {
            console.error("MAKUMOTO® ERROR CRÍTICO: El objeto global 'window.app' o 'window.app.payments' no está disponible. Posible error de carga de scripts.");
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error crítico: Fallo en la inicialización de Makumoto®. Contacte a soporte.</p>`;
            }
            return;
        }

        if (typeof window.app.payments.renderButton !== 'function') {
            console.error("MAKUMOTO® ERROR CRÍTICO: La función 'renderButton' no existe en window.app.payments. Verifique 'payments.js'.");
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error crítico: Función de pago no encontrada. Contacte a soporte.</p>`;
            }
            return;
        }
        // --- FIN VERIFICACIÓN DE INTEGRIDAD ---

        console.log("MAKUMOTO® DEBUG: app.ui.js - Iniciando renderizado de botón PayPal a través de window.app.payments.");
        window.app.payments.renderButton('paypal-button-container', planData, PAYPAL_LIVE_CLIENT_ID);
        console.log("MAKUMOTO® DEBUG: app.ui.js - showPaymentGateway finalizado.");
    },

    initTestimonialSlider: function() { // Revertida a la función original sin selector
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
    },
    
    // ===== PROTOCOLO DE CONSOLIDACIÓN DE LA SECCIÓN DE PRECIOS =====
    renderPricingSection: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <section id="seccion-precios" class="seccion-precios">
                <div class="container">
                    <h2 class="titulo-seccion">Elige tu Arsenal. (Spoiler: Cuesta menos que tu paciencia)</h2>
                    <div class="precios-grid">
                        <!-- Paquete starter_10 -->
                        <div class="precio-tarjeta">
                            <h3>Equipo Semilla</h3>
                            <p class="lema-paquete">"El primer paso para una cultura invencible."</p>
                            <p class="precio-valor">$2 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 10</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Acceso Total a la Plataforma</li>
                                <li><i class="fas fa-tachometer-alt"></i> Dashboard Esencial</li>
                            </ul>
                            <button class="cta-precio" data-plan="starter_10" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete growth_50 -->
                        <div class="precio-tarjeta">
                            <h3>Acelerador de Tribu</h3>
                            <p class="lema-paquete">"De un equipo a una tribu imparable."</p>
                            <p class="precio-valor">$5 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 50</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Semilla +</li>
                                <li><i class="fas fa-fist-raised"></i> <strong>Power-Up:</strong> Kit de Comunidad</li>
                            </ul>
                            <button class="cta-precio" data-plan="growth_50" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete business_200 - Recomendado -->
                        <div class="precio-tarjeta recomendada">
                            <span class="etiqueta-recomendada">NÚCLEO ESTRATEGA</span>
                            <h3>Business</h3>
                            <p class="lema-paquete">"La herramienta definitiva para la retención de talento."</p>
                            <p class="precio-valor">$10 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 200</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Acelerador +</li>
                                <li><i class="fas fa-chart-line"></i> <strong>Power-Up:</strong> Kit de Analítica</li>
                                <li><i class="fas fa-headset"></i> Soporte Prioritario</li>
                            </ul>
                            <button class="cta-precio cta-recomendada" data-plan="business_200" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete enterprise_500 -->
                        <div class="precio-tarjeta">
                            <h3>Flota Conquistador</h3>
                            <p class="lema-paquete">"Domine su industria desde adentro."</p>
                            <p class="precio-valor">$20 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 500</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Business +</li>
                                <li><i class="fas fa-bullhorn"></i> <strong>Power-Up:</strong> Mando y Control</li>
                                <li><i class="fas fa-robot"></i> <strong>Power-Up:</strong> Automatización</li>
                            </ul>
                            <button class="cta-precio" data-plan="enterprise_500" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                    </div>
                    <div class="apologia-precios">
                        <p><strong>Seamos honestos.</strong> El plan de $2. ¿Qué compras con eso? Aquí, compras la lealtad de 10 personas por un mes. El plan de $10 es lo que gastas en un almuerzo. Nosotros te damos inteligencia de negocios para 200 personas. <strong>Esto no es un gasto, es el robo del siglo... a tu favor.</strong></p>
                    </div>
                </div>
            </section>
        `;
    },

    initSmoothScroll: function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};
console.log("MAKUMOTO® DEBUG: app.ui.js finalizado.");

    // Las funciones personalizeView, resetView y populateContent han sido expurgadas.
    // La página ahora sigue una lógica estática y unificada.

    // La función toggleStickyBar y sus llamadas han sido eliminadas ya que no se usaba o estaba comentada.

    // Las funciones showExitIntentModal y hideExitIntentModal han sido expurgadas.

    // --- LÓGICA DE LA QUIJADA IMPLANTADA Y MEJORADA ---
    initLandingDynamics: function() {
        console.log("MAKUMOTO® DEBUG: app.ui.js - initLandingDynamics iniciado.");
        this.initDialogPlayer(); // PROTOCOLO TIERRA QUEMADA ACTIVO
        this.initTestimonialSlider();
        this.initFomoBubbles();
        this.initOfferCounter();
        this.initSmoothScroll(); // Lógica de scroll movida a su ubicación correcta
        console.log("MAKUMOTO® DEBUG: app.ui.js - initLandingDynamics finalizado.");
    },

    // PROTOCOLO DE DOMINACIÓN ABSOLUTA
    // PROTOCOLO DE OCUPACIÓN PERSISTENTE
    initDialogPlayer: function() {
        // ... (contenido existente, no se modifica) ...
    },
    
    // ===== INTERFAZ DE PASARELA DE PAGO =====
    showPaymentGateway: function(planData) {
        console.log("MAKUMOTO® DEBUG: app.ui.js - showPaymentGateway iniciado para plan:", planData);
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
            console.log("MAKUMOTO® DEBUG: Modal de pago cerrado por el usuario.");
            modal.remove();
        });

        // INVOCAR AL ESPECIALISTA DE PAGOS
        const PAYPAL_LIVE_CLIENT_ID = 'AXZ8W2MQaEjQK5lIORlA8l4OoOCWm3UATWeWGqtt1NSEnrYIlKsyjxWOUca6j5qzNhx2o9smjCnU2A6q';
        
        // --- MAKUMOTO® VERIFICACIÓN DE INTEGRIDAD DE MÓDULOS DE PAGO ---
        console.log("MAKUMOTO® DEBUG: Verificando integridad de window.app:", window.app);
        console.log("MAKUMOTO® DEBUG: Verificando integridad de window.app.payments:", window.app.payments);

        if (!window.app || !window.app.payments) {
            console.error("MAKUMOTO® ERROR CRÍTICO: El objeto global 'window.app' o 'window.app.payments' no está disponible. Posible error de carga de scripts.");
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error crítico: Fallo en la inicialización de Makumoto®. Contacte a soporte.</p>`;
            }
            return;
        }

        if (typeof window.app.payments.renderButton !== 'function') {
            console.error("MAKUMOTO® ERROR CRÍTICO: La función 'renderButton' no existe en window.app.payments. Verifique 'payments.js'.");
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error crítico: Función de pago no encontrada. Contacte a soporte.</p>`;
            }
            return;
        }
        // --- FIN VERIFICACIÓN DE INTEGRIDAD ---

        console.log("MAKUMOTO® DEBUG: app.ui.js - Iniciando renderizado de botón PayPal a través de window.app.payments.");
        window.app.payments.renderButton('paypal-button-container', planData, PAYPAL_LIVE_CLIENT_ID);
        console.log("MAKUMOTO® DEBUG: app.ui.js - showPaymentGateway finalizado.");
    },

    initTestimonialSlider: function() {
        // ... (contenido existente, no se modifica) ...
    },

    initFomoBubbles: function() {
        // ... (contenido existente, no se modifica) ...
    },

    initOfferCounter: function() {
        // ... (contenido existente, no se modifica) ...
    },
    
    initSmoothScroll: function() {
        // ... (contenido existente, no se modifica) ...
    },

    renderPricingSection: function(containerId) {
        // ... (contenido existente, no se modifica) ...
    }
};
console.log("MAKUMOTO® DEBUG: app.ui.js finalizado.");

    // Las funciones personalizeView, resetView y populateContent han sido expurgadas.
    // La página ahora sigue una lógica estática y unificada.

    // La función toggleStickyBar y sus llamadas han sido eliminadas ya que no se usaba o estaba comentada.

    // Las funciones showExitIntentModal y hideExitIntentModal han sido expurgadas.

    // --- LÓGICA DE LA QUIJADA IMPLANTADA Y MEJORADA ---
    initLandingDynamics: function() {
        this.initDialogPlayer(); // PROTOCOLO TIERRA QUEMADA ACTIVO
        this.initTestimonialSlider();
        this.initFomoBubbles();
        this.initOfferCounter();
        this.initSmoothScroll(); // Lógica de scroll movida a su ubicación correcta
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
        
        // Ejecutar el especialista de pagos directamente, ya que payments.js se carga antes en el HTML
        if (window.app.payments && typeof window.app.payments.renderButton === 'function') {
            console.log("MAKUMOTO® DEBUG: Iniciando renderizado de botón PayPal.");
            window.app.payments.renderButton('paypal-button-container', planData, PAYPAL_LIVE_CLIENT_ID);
        } else {
            console.error("MAKUMOTO® ERROR CRÍTICO: El módulo de pagos (window.app.payments) no está disponible o no tiene la función renderButton.");
            // Opcional: Mostrar un mensaje de error al usuario en el modal
            const container = document.getElementById('paypal-button-container');
            if (container) {
                container.innerHTML = `<p style="color:var(--color-secondary);">Error crítico: No se pudo cargar la pasarela de pago. Por favor, recargue la página o contacte a soporte.</p>`;
            }
        }
    },

    // La función renderPayPalButton (simulación) ha sido eliminada.

    initTestimonialSlider: function() { // Revertida a la función original sin selector
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
    },
    
    // ===== PROTOCOLO DE CONSOLIDACIÓN DE LA SECCIÓN DE PRECIOS =====
    renderPricingSection: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <section id="seccion-precios" class="seccion-precios">
                <div class="container">
                    <h2 class="titulo-seccion">Elige tu Arsenal. (Spoiler: Cuesta menos que tu paciencia)</h2>
                    <div class="precios-grid">
                        <!-- Paquete starter_10 -->
                        <div class="precio-tarjeta">
                            <h3>Equipo Semilla</h3>
                            <p class="lema-paquete">"El primer paso para una cultura invencible."</p>
                            <p class="precio-valor">$2 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 10</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Acceso Total a la Plataforma</li>
                                <li><i class="fas fa-tachometer-alt"></i> Dashboard Esencial</li>
                            </ul>
                            <button class="cta-precio" data-plan="starter_10" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete growth_50 -->
                        <div class="precio-tarjeta">
                            <h3>Acelerador de Tribu</h3>
                            <p class="lema-paquete">"De un equipo a una tribu imparable."</p>
                            <p class="precio-valor">$5 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 50</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Semilla +</li>
                                <li><i class="fas fa-fist-raised"></i> <strong>Power-Up:</strong> Kit de Comunidad</li>
                            </ul>
                            <button class="cta-precio" data-plan="growth_50" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete business_200 - Recomendado -->
                        <div class="precio-tarjeta recomendada">
                            <span class="etiqueta-recomendada">NÚCLEO ESTRATEGA</span>
                            <h3>Business</h3>
                            <p class="lema-paquete">"La herramienta definitiva para la retención de talento."</p>
                            <p class="precio-valor">$10 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 200</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Acelerador +</li>
                                <li><i class="fas fa-chart-line"></i> <strong>Power-Up:</strong> Kit de Analítica</li>
                                <li><i class="fas fa-headset"></i> Soporte Prioritario</li>
                            </ul>
                            <button class="cta-precio cta-recomendada" data-plan="business_200" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                        <!-- Paquete enterprise_500 -->
                        <div class="precio-tarjeta">
                            <h3>Flota Conquistador</h3>
                            <p class="lema-paquete">"Domine su industria desde adentro."</p>
                            <p class="precio-valor">$20 <span class="precio-mes">/mes</span></p>
                            <ul>
                                <li><i class="fas fa-users"></i> <strong>Hasta 500</strong> Licencias</li>
                                <li><i class="fas fa-check"></i> Todo lo de Business +</li>
                                <li><i class="fas fa-bullhorn"></i> <strong>Power-Up:</strong> Mando y Control</li>
                                <li><i class="fas fa-robot"></i> <strong>Power-Up:</strong> Automatización</li>
                            </ul>
                            <button class="cta-precio" data-plan="enterprise_500" onclick="window.app.events.handlePlanPurchase(this)">ELEGIR PLAN</button>
                        </div>
                    </div>
                    <div class="apologia-precios">
                        <p><strong>Seamos honestos.</strong> El plan de $2. ¿Qué compras con eso? Aquí, compras la lealtad de 10 personas por un mes. El plan de $10 es lo que gastas en un almuerzo. Nosotros te damos inteligencia de negocios para 200 personas. <strong>Esto no es un gasto, es el robo del siglo... a tu favor.</strong></p>
                    </div>
                </div>
            </section>
        `;
    },

    initSmoothScroll: function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};