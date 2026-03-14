window.app = window.app || {};

window.app.ui = {
    // Selectores del DOM
    // `heroSection` no es global; se accede localmente si es necesario.
   
    // Las funciones personalizeView, resetView y populateContent han sido expurgadas.
    // La página ahora sigue una lógica estática y unificada.

    toggleStickyBar: function() {
        // La barra aparece después de que el usuario ha pasado el 'hero'
        const hero = document.getElementById('seccion-hero');
        // Se asume que this.stickyBar existe y se maneja por separado si es necesario.
        // En esta refactorización, la sticky bar ya no es parte del flujo principal si se usaba así.
        // Si necesitas una sticky bar, debe ser parte del _template.html y manejarse globalmente.
        if (hero && window.scrollY > hero.offsetHeight && this.stickyBar) {
            this.stickyBar.classList.add('visible');
        } else if (this.stickyBar) {
            this.stickyBar.classList.remove('visible');
        }
    },

    // Las funciones showExitIntentModal y hideExitIntentModal han sido expurgadas.

    // --- LÓGICA DE LA QUIJADA IMPLANTADA Y MEJORADA ---
    initLandingDynamics: function() {
        this.initDialogPlayer(); // PROTOCOLO TIERRA QUEMADA ACTIVO
        this.initTestimonialSlider('.testimonios-slider'); // Para el slider del index
        this.initFomoBubbles();
        this.initOfferCounter();
        this.initSmoothScroll(); // Lógica de scroll movida a su ubicación correcta
    },

    // --- LÓGICA DE DINÁMICAS PARA PÁGINAS DE SEGMENTO ---
    initSegmentPageDynamics: function() {
        this.initTestimonialSlider('#segment-testimonials-slider'); // Inicializar slider para los testimonios dinámicos
        this.initSmoothScroll();
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

    initTestimonialSlider: function(containerSelector = '.testimonios-slider') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const testimonios = container.querySelectorAll('.testimonio');
        if (testimonios.length > 0) {
            let testimonioActual = 0;
            // Asegurarse de que solo el primer testimonio está activo al inicio
            testimonios.forEach((t, i) => {
                if (i === 0) t.classList.add('active');
                else t.classList.remove('active');
            });

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
    },

    // ===== Lógica para cargar contenido de segmento dinámicamente =====
    loadSegmentContent: async function(segmentId) {
        const dynamicContentContainer = document.getElementById('dynamic-segment-content');
        if (!dynamicContentContainer) {
            console.error('Contenedor dinámico de segmento no encontrado.');
            return;
        }

        try {
            const response = await fetch('_template.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const templateHtml = await response.text();

            // Insertar el contenido del _template.html en el contenedor dinámico
            dynamicContentContainer.innerHTML = templateHtml;

            // Ahora, rellenar con los datos específicos del segmento
            const data = window.app.segmentData[segmentId];
            if (!data) throw new Error(`Datos para el segmento '${segmentId}' de Makumoto® no encontrados.`);

            document.getElementById('dynamic-title').textContent = data.title;
            document.getElementById('segment-hero-h1').innerHTML = data.heroH1;
            document.getElementById('segment-hero-subtitle').innerHTML = data.heroSubtitle;

            document.getElementById('segment-ebook-title').textContent = data.ebookTitle;
            document.getElementById('segment-ebook-description').textContent = data.ebookDescription;
            const ebookLinkElement = document.getElementById('segment-ebook-link');
            if (ebookLinkElement) {
                ebookLinkElement.href = data.ebookLink;
                // Opcional: Actualizar el texto del botón si es necesario o mantener el genérico
                // ebookLinkElement.innerHTML = `<i class="fas fa-download"></i> ${data.ebookButtonText}`;
            }

            document.getElementById('segment-social-proof-title').textContent = data.socialProofTitle;
            const testimonialsSlider = document.getElementById('segment-testimonials-slider');
            if (testimonialsSlider) {
                testimonialsSlider.innerHTML = ''; // Limpiar testimonios existentes
                data.testimonials.forEach((t, index) => {
                    const testimonioDiv = document.createElement('div');
                    testimonioDiv.className = `testimonio ${index === 0 ? 'active' : ''}`;
                    testimonioDiv.innerHTML = `
                        <img src="${t.img}" alt="${t.alt}">
                        <blockquote>"${t.quote}"</blockquote>
                        <cite>${t.cite}</cite>
                    `;
                    testimonialsSlider.appendChild(testimonioDiv);
                });
            }

            document.getElementById('segment-final-cta-h2').textContent = data.finalCtaH2;
            document.getElementById('segment-final-cta-button').textContent = data.finalCtaButtonText;

            console.log(`Contenido del segmento '${segmentId}' cargado y rellenado exitosamente para Makumoto®.`);
            window.scrollTo(0, 0); // Ir al inicio de la página tras cargar
        } catch (error) {
            console.error('Error al cargar o rellenar el contenido del segmento:', error);
            // Opcional: mostrar un mensaje de error en la página
            dynamicContentContainer.innerHTML = `<p style="color:var(--color-secondary); text-align:center;">Error al cargar el contenido del segmento. Por favor, intente de nuevo más tarde o regrese a la <a href="index.html" style="color:var(--color-primary);">página principal de Makumoto®</a>.</p>`;
        }
    }
};