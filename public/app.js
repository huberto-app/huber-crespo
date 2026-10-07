import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  push, 
  onValue, 
  update 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcoSGseTGdxZOKYLjJvPWuH9QvFnHqXrQ",
  authDomain: "huber-crespo.firebaseapp.com",
  projectId: "huber-crespo",
  storageBucket: "huber-crespo.firebasestorage.app",
  messagingSenderId: "142971999676",
  appId: "1:142971999676:web:57157aff78b997fbd9c7b9",
  measurementId: "G-QDCKQ1HG3H",
  databaseURL: "https://huber-crespo-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Referencias del DOM
const authSection = document.getElementById("auth-section");
const userPanel = document.getElementById("user-panel");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");

const userNameSpan = document.getElementById("user-name");
const userRoleSpan = document.getElementById("user-role");

const panelPasajero = document.getElementById("panel-pasajero");
const panelConductor = document.getElementById("panel-conductor");
const tripForm = document.getElementById("trip-form");
const pasajeroStatus = document.getElementById("pasajero-status");
const tripsList = document.getElementById("trips-list");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");

const resetCard = document.getElementById("reset-card");
const resetForm = document.getElementById("reset-form");
const resetEmailInput = document.getElementById("reset-email");
const resetError = document.getElementById("reset-error");
const resetSuccess = document.getElementById("reset-success");
const showResetLink = document.getElementById("show-reset");
const showLoginFromResetLink = document.getElementById("show-login-from-reset");

const toggleLoginPasswordBtn = document.getElementById("toggle-login-password");
const loginPasswordInput = document.getElementById("login-password");

// SVGs para ojo abierto y cerrado
const svgEyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

const svgEyeClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

if (toggleLoginPasswordBtn && loginPasswordInput) {
  toggleLoginPasswordBtn.addEventListener("click", () => {
    const esPassword = loginPasswordInput.type === "password";
    loginPasswordInput.type = esPassword ? "text" : "password";
    
    // Cambiamos el SVG
    toggleLoginPasswordBtn.innerHTML = esPassword ? svgEyeClosed : svgEyeOpen;
  });
}

let currentUser = null;
let currentRole = null;

// Función auxiliar para escapar textos (Prevenir XSS)
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Eventos para alternar visibilidad
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginCard.classList.add("hidden");
  registerCard.classList.remove("hidden");
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerError.classList.add("hidden");
  registerCard.classList.add("hidden");
  loginCard.classList.remove("hidden");
});

// REGISTRO
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  registerError.classList.add("hidden");
  registerError.textContent = "";

  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const telefono = document.getElementById("reg-telefono").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const confirmPassword = document.getElementById("reg-confirm-password").value.trim();
  const rol = document.getElementById("reg-rol").value;

  if (!nombre) return mostrarErrorRegistro("Ingresa tu nombre completo.");
  if (!email) return mostrarErrorRegistro("Ingresa tu correo electrónico.");
  
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) return mostrarErrorRegistro("El formato del correo electrónico no es válido.");

  if (telefono !== "") {
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, "");
    const regexTelefono = /^\+?[0-9]{7,15}$/;
    if (!regexTelefono.test(telefonoLimpio)) {
      return mostrarErrorRegistro("El teléfono ingresado no tiene un formato válido.");
    }
  }

  if (!password) return mostrarErrorRegistro("Ingresa una contraseña.");
  if (password.length < 6) return mostrarErrorRegistro("La contraseña debe tener al menos 6 caracteres.");
  if (!confirmPassword) return mostrarErrorRegistro("Por favor, repite la contraseña.");
  if (password !== confirmPassword) return mostrarErrorRegistro("Las contraseñas no coinciden.");
  if (!rol) return mostrarErrorRegistro("Selecciona un tipo de cuenta (Pasajero o Conductor).");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      nombre: nombre,
      email: email,
      telefono: telefono || "Sin especificar",
      rol: rol
    });

    registerForm.reset();
  } catch (error) {
    let mensaje = "Ocurrió un error al crear la cuenta.";
    switch (error.code) {
      case "auth/email-already-in-use": mensaje = "Este correo electrónico ya está registrado."; break;
      case "auth/invalid-email": mensaje = "El formato del correo electrónico no es válido."; break;
      case "auth/weak-password": mensaje = "La contraseña es muy débil. Debe tener al menos 6 caracteres."; break;
      case "auth/network-request-failed": mensaje = "Error de conexión a internet."; break;
    }
    mostrarErrorRegistro(mensaje);
  }
});

function mostrarErrorRegistro(texto) {
  registerError.textContent = texto;
  registerError.classList.remove("hidden");
}

// LOGIN (Corregido)
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  loginError.classList.add("hidden");
  loginError.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email && !password) return mostrarErrorLogin("Por favor, ingresa tu correo y contraseña.");
  if (!email) return mostrarErrorLogin("Ingresa tu correo electrónico.");
  if (!password) return mostrarErrorLogin("Ingresa tu contraseña.");

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) return mostrarErrorLogin("El formato del correo electrónico no es válido.");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    let mensaje = "Ocurrió un error al iniciar sesión.";
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        mensaje = "Correo o contraseña incorrectos.";
        break;
      case "auth/invalid-email":
        mensaje = "El formato del correo electrónico no es válido.";
        break;
      case "auth/user-disabled":
        mensaje = "Esta cuenta ha sido deshabilitada.";
        break;
      case "auth/too-many-requests":
        mensaje = "Demasiados intentos fallidos. Intenta más tarde.";
        break;
      case "auth/network-request-failed":
        mensaje = "Error de conexión a internet.";
        break;
    }
    mostrarErrorLogin(mensaje);
  }
});

function mostrarErrorLogin(texto) {
  loginError.textContent = texto;
  loginError.classList.remove("hidden");
}

// RECUPERACIÓN DE CONTRASEÑA
showResetLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginCard.classList.add("hidden");
  resetCard.classList.remove("hidden");
  resetError.classList.add("hidden");
  resetSuccess.classList.add("hidden");
});

showLoginFromResetLink.addEventListener("click", (e) => {
  e.preventDefault();
  resetCard.classList.add("hidden");
  loginCard.classList.remove("hidden");
});

resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetError.classList.add("hidden");
  resetSuccess.classList.add("hidden");

  const email = resetEmailInput.value.trim();
  if (!email) return mostrarErrorReset("Ingresa tu correo electrónico.");

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) return mostrarErrorReset("El formato del correo electrónico no es válido.");

  try {
    await sendPasswordResetEmail(auth, email);
    resetSuccess.textContent = "¡Correo enviado! Revisa tu bandeja de entrada o spam.";
    resetSuccess.classList.remove("hidden");
    resetForm.reset();
  } catch (error) {
    let mensaje = "Ocurrió un error al intentar enviar el correo.";
    switch (error.code) {
      case "auth/user-not-found": mensaje = "No existe ninguna cuenta registrada con este correo."; break;
      case "auth/invalid-email": mensaje = "El correo electrónico no es válido."; break;
      case "auth/network-request-failed": mensaje = "Error de conexión a internet."; break;
    }
    mostrarErrorReset(mensaje);
  }
});

function mostrarErrorReset(texto) {
  resetError.textContent = texto;
  resetError.classList.remove("hidden");
}

// LOGOUT
logoutBtn.addEventListener("click", () => signOut(auth));

// OBSERVADOR DE SESIÓN
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnapshot = await get(ref(db, `users/${user.uid}`));
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      currentRole = userData.rol;

      userNameSpan.textContent = userData.nombre;
      userRoleSpan.textContent = userData.rol;

      authSection.classList.add("hidden");
      userPanel.classList.remove("hidden");

      if (currentRole === "conductor") {
        panelConductor.classList.remove("hidden");
        panelPasajero.classList.add("hidden");
        escucharViajesDisponibles();
      } else {
        panelPasajero.classList.remove("hidden");
        panelConductor.classList.add("hidden");
        escucharMiViajePasajero(user.uid);
      }
    }
  } else {
    currentUser = null;
    currentRole = null;
    
    authSection.classList.remove("hidden");
    userPanel.classList.add("hidden");

    loginCard.classList.remove("hidden");
    registerCard.classList.add("hidden");
    resetCard.classList.add("hidden");
  }
});

// PASAJERO: SOLICITAR VIAJE
tripForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const origin = document.getElementById("trip-origin").value.trim();
  const destination = document.getElementById("trip-destination").value.trim();

  if (!origin || !destination) return;

  const newTripRef = push(ref(db, "trips"));
  await set(newTripRef, {
    tripId: newTripRef.key,
    pasajeroId: currentUser.uid,
    origen: origin,
    destino: destination,
    estado: "pendiente",
    fecha: new Date().toISOString()
  });

  tripForm.reset();
});

// PASAJERO: ESCUCHAR ESTADO DE SU VIAJE
function escucharMiViajePasajero(userId) {
  const tripsRef = ref(db, "trips");
  onValue(tripsRef, (snapshot) => {
    pasajeroStatus.innerHTML = "No tienes viajes activos.";
    if (snapshot.exists()) {
      const trips = snapshot.val();
      for (let id in trips) {
        const trip = trips[id];
        if (trip.pasajeroId === userId && trip.estado !== "finalizado") {
          pasajeroStatus.innerHTML = `
            <p><strong>Estado del viaje:</strong> ${escapeHTML(trip.estado.toUpperCase())}</p>
            <p><strong>Origen:</strong> ${escapeHTML(trip.origen)}</p>
            <p><strong>Destino:</strong> ${escapeHTML(trip.destino)}</p>
          `;
          break;
        }
      }
    }
  });
}

// CONDUCTOR: ESCUCHAR Y ACEPTAR VIAJES
function escucharViajesDisponibles() {
  const tripsRef = ref(db, "trips");
  onValue(tripsRef, (snapshot) => {
    tripsList.innerHTML = "";
    if (snapshot.exists()) {
      const trips = snapshot.val();
      let hayViajes = false;

      for (let id in trips) {
        const trip = trips[id];
        if (trip.estado === "pendiente") {
          hayViajes = true;
          const tripDiv = document.createElement("div");
          tripDiv.className = "trip-item";
          tripDiv.innerHTML = `
            <p><strong>Origen:</strong> ${escapeHTML(trip.origen)}</p>
            <p><strong>Destino:</strong> ${escapeHTML(trip.destino)}</p>
            <button onclick="aceptarViaje('${trip.tripId}')">Aceptar Viaje</button>
          `;
          tripsList.appendChild(tripDiv);
        }
      }

      if (!hayViajes) {
        tripsList.innerHTML = "No hay viajes pendientes por ahora.";
      }
    } else {
      tripsList.innerHTML = "No hay viajes pendientes por ahora.";
    }
  });
}

// ACEPTAR VIAJE
window.aceptarViaje = async (tripId) => {
  if (!currentUser) return alert("Debes estar autenticado para aceptar viajes.");

  try {
    await update(ref(db, `trips/${tripId}`), {
      estado: "aceptado",
      conductorId: currentUser.uid
    });
    alert("¡Viaje aceptado correctamente!");
  } catch (err) {
    console.error("Error al aceptar viaje:", err);
    alert("Hubo un problema al aceptar el viaje.");
  }
};
