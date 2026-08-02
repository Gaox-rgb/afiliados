window.app = window.app || {};
window.app.tools = {
    // 1. BASE DE DATOS LOCAL (Zero-Latency)
    data: {
        calories: [
            { n: "Huevo (1 pza)", c: 78, p: "6g" },
            { n: "Pechuga Pollo (100g)", c: 165, p: "31g" },
            { n: "Arroz Blanco (100g)", c: 130, p: "2.7g" },
            { n: "Aguacate (100g)", c: 160, p: "2g" },
            { n: "Manzana (1 pza)", c: 95, p: "0.5g" }
        ],
        emergency: {
            "RCP": "1. Comprobar respiración. 2. Llamar 911. 3. Presiones fuertes en centro del pecho (100/min).",
            "Atragantamiento": "1. Maniobra de Heimlich. 2. Rodear por la cintura. 3. Presionar arriba del ombligo.",
            "Quemaduras": "1. Enfriar con agua corriente (no hielo). 2. No reventar ampollas. 3. Cubrir con gasa limpia."
        }
    },

    // 2. LÓGICA DE HARDWARE (Linterna SOS)
    flashlight: {
        stream: null,
        isOn: false,
        async toggle() {
            window.app.tools.vibrate(); // Feedback al accionar
            try {
                if (!this.stream) {
                    this.stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'environment' } 
                    });
                }
                const track = this.stream.getVideoTracks()[0];
                this.isOn = !this.isOn;
                await track.applyConstraints({ 
                    advanced: [{ torch: this.isOn }] 
                });
                return this.isOn;
            } catch (e) {
                console.error("Error linterna:", e);
                alert("La linterna requiere HTTPS o no es compatible con este dispositivo.");
                return false;
            }
        }
    },

    // 3. UTILIDADES DE SISTEMA Y NAVEGACIÓN
    vibrate() {
        if ("vibrate" in navigator) {
            navigator.vibrate(50);
        }
    },

    logout() {
        this.vibrate();
        sessionStorage.removeItem('arsenal_access');
        window.location.replace('gana-dinero.html');
    },

    // 4. LÓGICA DE BÚSQUEDA (Zero-Latency)
    searchCalories(query) {
        if (!query) return [];
        return this.data.calories.filter(i => 
            i.n.toLowerCase().includes(query.toLowerCase())
        );
    },

    // 5. MENSAJERÍA Y NOTIFICACIONES
    sendDailyNotification() {
        if (!("Notification" in window)) return;
        
        Notification.requestPermission().then(p => {
            if (p === "granted") {
                new Notification("Makumoto Disciplina", {
                    body: "Tu cuerpo es tu templo. Haz 20 sentadillas ahora.",
                    icon: "imagenes/logo.png"
                });
            } else {
                alert("Debes habilitar las notificaciones para esta función.");
            }
        });
    }
};