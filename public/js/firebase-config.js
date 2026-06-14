// ESTE ARCHIVO NUNCA DEBE SER SUBIDO A GITHUB.
// Contiene las claves de configuración de Firebase.

const firebaseConfig = {
  apiKey: "AIzaSyAPLpOe3YD0D7YgPYD8YCUhjnekQG7X5-I",
  authDomain: "afiliados-makumoto.firebaseapp.com",
  projectId: "afiliados-makumoto",
  storageBucket: "afiliados-makumoto.firebasestorage.app",
  messagingSenderId: "522354303224",
  appId: "1:522354303224:web:c9da3e4ecaf5dd7ad29b0d"
};

// Inicializa la aplicación de Firebase de forma segura si aún no existe
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}