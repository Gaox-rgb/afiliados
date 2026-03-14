// js/config.js
// Configuración centralizada de Firebase para aplicaciones Makumoto® y Robotiax.
// Este archivo es fundamental para la inicialización del SDK.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_7mUw2TD5YvPMBOFeGAgRgSKcikfSXog",
  authDomain: "makumoto-app-2026.firebaseapp.com", // Dominio de autenticación Makumoto®
  projectId: "makumoto-app-2026", // ID del proyecto Makumoto®
  storageBucket: "makumoto-app-2026.appspot.com", // Bucket de almacenamiento Makumoto®
  messagingSenderId: "398366272130",
  appId: "1:398366272130:web:073b05e75ed299534ce29b"
};

const app = initializeApp(firebaseConfig);
// Hacemos las funciones de Firebase disponibles globalmente para nuestros otros scripts
window.firebase = {
    functions: getFunctions(app)
};