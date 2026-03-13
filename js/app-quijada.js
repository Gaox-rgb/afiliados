document.addEventListener('DOMContentLoaded', () => {

    // ===== LÓGICA DEL DIÁLOGO FIJO CON SCROLL REVEAL (PUNTO 4) =====
    const seccionDialogo = document.querySelector('#seccion-dialogo-container');
    const burbujas = document.querySelectorAll('.mensaje-burbuja');

    if (seccionDialogo && burbujas.length > 0) {
        window.addEventListener('scroll', () => {
            const { top, height } = seccionDialogo.getBoundingClientRect();
            // Solo ejecutar si la sección está a la vista para optimizar
            if (top < window.innerHeight && top > -height) {
                const scrollProfundidad = window.innerHeight - top;
                const progresoScroll = Math.min(Math.max(0, scrollProfundidad / (height - window.innerHeight)), 1);

                burbujas.forEach((burbuja, index) => {
                    const puntoEncendido = (index + 0.5) / burbujas.length;
                    if (progresoScroll >= puntoEncendido) {
                        burbuja.classList.add('encendido');
                    } else {
                        burbuja.classList.remove('encendido');
                    }
                });
            }
        });
    }


    // ===== LÓGICA DE LA GALERÍA DE TESTIMONIOS (PUNTO 7) =====
    const testimonios = document.querySelectorAll('.testimonio');
    if (testimonios.length > 0) {
        let testimonioActual = 0;
        setInterval(() => {
            testimonios[testimonioActual].classList.remove('active');
            testimonioActual = (testimonioActual + 1) % testimonios.length;
            testimonios[testimonioActual].classList.add('active');
        }, 6000); // Rota cada 6 segundos
    }


    // ===== LÓGICA DE BURBUJAS FOMO CON BANDERAS (PUNTO 7 REFORZADO) =====
    const fomoContainer = document.getElementById('fomo-container');
    if (fomoContainer) {
        const comprasFalsas = [
            { nombre: "María G.", ciudad: "Bogotá", plan: "Business", pais: "🇨🇴" },
            { nombre: "Carlos R.", ciudad: "Miami", plan: "Team", pais: "🇺🇸" },
            { nombre: "Ana S.", ciudad: "Madrid", plan: "Growth", pais: "🇪🇸" },
            { nombre: "Juan P.", ciudad: "Ciudad de México", plan: "Starter", pais: "🇲🇽" },
            { nombre: "Laura M.", ciudad: "Santiago", plan: "Business", pais: "🇨🇱" },
            { nombre: "David L.", ciudad: "Buenos Aires", plan: "Enterprise", pais: "🇦🇷" },
        ];
        let compraIndex = 0;

        const mostrarBurbuja = () => {
            const compra = comprasFalsas[compraIndex];
            compraIndex = (compraIndex + 1) % comprasFalsas.length;
            
            const burbuja = document.createElement('div');
            burbuja.className = 'fomo-burbuja';
            burbuja.innerHTML = `<span class="fomo-bandera">${compra.pais}</span><div>🔥 <strong>${compra.nombre}</strong> de ${compra.ciudad} acaba de comprar el <strong>Plan ${compra.plan}</strong>.</div>`;
            
            fomoContainer.appendChild(burbuja);

            setTimeout(() => { burbuja.classList.add('visible'); }, 100);

            setTimeout(() => {
                burbuja.classList.remove('visible');
                setTimeout(() => { burbuja.remove(); }, 500);
            }, 6000); // La burbuja dura 6 segundos visible
        };

        // Inicia 5 segundos después de cargar y luego cada 30 segundos
        setTimeout(() => {
            mostrarBurbuja();
            setInterval(mostrarBurbuja, 30000);
        }, 5000);
    }
    
    // ===== LÓGICA DEL CONTADOR DE LA OFERTA (PUNTO 6) =====
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
        }, 15000); // Cada 15 segundos para más realismo
    }

    // ===== LÓGICA DE SCROLL SUAVE =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

});