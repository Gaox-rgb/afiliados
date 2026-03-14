// js/segment.data.js
// Datos centralizados para las páginas de segmento de Makumoto®.
// Esto permite la renderización dinámica del contenido.

window.app = window.app || {};

window.app.segmentData = {
    empresa: {
        title: "Makumoto® - Para Empresas",
        heroH1: "Deja de Perder Talento.<br>Empieza a Construir una Tribu Imparable.",
        heroSubtitle: "Con Makumoto®, convierte el agotamiento en productividad y la apatía en una cultura de equipo legendaria.",
        ebookTitle: "El Manual Anti-Burnout",
        ebookDescription: "Descarga nuestra guía táctica y aprende 5 estrategias para transformar un equipo agotado en una legión imparable en 30 días.",
        ebookLink: "ebooks/manual-anti-burnout.pdf",
        socialProofTitle: "Inteligencia desde el Frente Corporativo",
        testimonials: [
            { img: "imagenes/testimonio1.jpg", alt: "Laura M.", quote: "En dos semanas, la energía en la oficina cambió por completo. La gente viene más feliz.", cite: "Laura M. - Directora de Talento" },
            { img: "imagenes/testimonio5.jpg", alt: "Miguel A.", quote: "El Power-Up de analítica me mostró quién estaba a punto de renunciar. Salvé a dos talentos clave. Se pagó solo en un mes.", cite: "Miguel A. - CEO de TechCorp" }
        ],
        finalCtaH2: "La inacción es la estrategia más cara.",
        finalCtaButtonText: "ACTIVAR MI PLAN AHORA"
    },
    gimnasio: {
        title: "Makumoto® - Para Gimnasios",
        heroH1: "Deja de Vender Clases.<br>Empieza a Construir una Comunidad Adicta.",
        heroSubtitle: "La competencia vende máquinas, tú vendes pertenencia. Makumoto® convierte a tus miembros en una legión que no puede concebir entrenar en otro lugar.",
        ebookTitle: "La Guía Anti-Fuga",
        ebookDescription: "Descarga el sistema definitivo para sellar la \"puerta trasera\" de tu gimnasio y convertir nuevos clientes en miembros de por vida.",
        ebookLink: "ebooks/guia-anti-fuga.pdf",
        socialProofTitle: "Inteligencia desde el Campo de Entrenamiento",
        testimonials: [
            { img: "imagenes/testimonio2.jpg", alt: "Carlos R.", quote: "Mis clientes ahora compiten en la app. La retención se ha disparado. Increíble.", cite: "Carlos R. - Fundador de PowerFit Gym" },
            { img: "imagenes/testimonio4.jpg", alt: "Sofía G.", quote: "Honestamente, ahora me dan ganas de venir al gym todos los días. Los retos por equipos son adictivos.", cite: "Sofía G. - Miembro de Gimnasio" }
        ],
        finalCtaH2: "Un miembro que se va es una victoria para tu competencia.",
        finalCtaButtonText: "BLINDAR MI GIMNASIO AHORA"
    },
    clinica: {
        title: "Makumoto® - Para Clínicas y Consultorios",
        heroH1: "Deja de Gestionar Citas.<br>Empieza a Orquestar la Lealtad del Paciente.",
        heroSubtitle: "Makumoto® ofrece un seguimiento que tus pacientes amarán. Reduce las ausencias y multiplica la adherencia al tratamiento.",
        ebookTitle: "El Plan de Experiencia del Paciente",
        ebookDescription: "Descarga el protocolo de 5 estrellas para eliminar las ausencias y convertir pacientes en embajadores de tu clínica.",
        ebookLink: "ebooks/plan-experiencia-paciente.pdf",
        socialProofTitle: "Inteligencia desde la Sala de Consulta",
        testimonials: [
            { img: "imagenes/testimonio3.jpg", alt: "Dr. Soto", quote: "La adherencia al tratamiento de mis pacientes subió un 30%. Makumoto® es mi nuevo asistente.", cite: "Dr. Soto - Clínica Dental Soto" },
            { img: "imagenes/testimonio4.jpg", alt: "Paciente", quote: "Ahora entiendo mi tratamiento. La app me recuerda todo y puedo hacer preguntas. Me siento más seguro.", cite: "Paciente Anónimo - Clínica Soto" }
        ],
        finalCtaH2: "Un paciente que no vuelve es una confianza que no se construyó.",
        finalCtaButtonText: "FORTALECER MI CLÍNICA AHORA"
    }
};