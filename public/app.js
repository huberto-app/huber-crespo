import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
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

let currentUser = null;
let currentRole = null;

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
  
  // Limpiar mensaje de error previo
  registerError.classList.add("hidden");
  registerError.textContent = "";

  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const rol = document.getElementById("reg-rol").value;

  // 1. Validar campos requeridos
  if (!nombre) {
    mostrarErrorRegistro("Ingresa tu nombre completo.");
    return;
  }
  if (!email) {
    mostrarErrorRegistro("Ingresa tu correo electrónico.");
    return;
  }
  
  // 2. Validar formato de email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    mostrarErrorRegistro("El formato del correo electrónico no es válido.");
    return;
  }

  // 3. Validar longitud de contraseña
  if (!password) {
    mostrarErrorRegistro("Ingresa una contraseña.");
    return;
  }
  if (password.length < 6) {
    mostrarErrorRegistro("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  // 4. Validar selección de rol
  if (!rol) {
    mostrarErrorRegistro("Selecciona un tipo de cuenta (Pasajero o Conductor).");
    return;
  }

  // 5. Intento de registro en Firebase
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Guardar usuario en Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      nombre: nombre,
      email: email,
      rol: rol
    });

    registerForm.reset();
  } catch (error) {
    let mensaje = "Ocurrió un error al crear la cuenta.";

    switch (error.code) {
      case "auth/email-already-in-use":
        mensaje = "Este correo electrónico ya está registrado.";
        break;
      case "auth/invalid-email":
        mensaje = "El formato del correo electrónico no es válido.";
        break;
      case "auth/weak-password":
        mensaje = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
        break;
      case "auth/network-request-failed":
        mensaje = "Error de conexión a internet.";
        break;
    }

    mostrarErrorRegistro(mensaje);
  }
});

// Función auxiliar para mostrar el error de registro
function mostrarErrorRegistro(texto) {
  registerError.textContent = texto;
  registerError.classList.remove("hidden");
}

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Resetear mensaje de error previo
  loginError.classList.add("hidden");
  loginError.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  // 1. Validar campos vacíos
  if (!email && !password) {
    mostrarErrorLogin("Por favor, ingresa tu correo y contraseña.");
    return;
  }
  if (!email) {
    mostrarErrorLogin("Ingresa tu correo electrónico.");
    return;
  }
  if (!password) {
    mostrarErrorLogin("Ingresa tu contraseña.");
    return;
  }

  // 2. Validar formato de email básico
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    mostrarErrorLogin("El formato del correo electrónico no es válido.");
    return;
  }

  // 3. Intento de inicio de sesión en Firebase
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

// Función auxiliar para mostrar el error de forma limpia
function mostrarErrorLogin(texto) {
  loginError.textContent = texto;
  loginError.classList.remove("hidden");
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
  }
});

// PASAJERO: SOLICITAR VIAJE
tripForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const origin = document.getElementById("trip-origin").value;
  const destination = document.getElementById("trip-destination").value;

  const newTripRef = push(ref(db, "trips"));
  await set(newTripRef, {
    tripId: newTripRef.key,
    pasajeroId: currentUser.uid,
    origen: origin,
    destino: destination,
    estado: "pendiente", // "pendiente", "aceptado", "finalizado"
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
            <p><strong>Estado del viaje:</strong> ${trip.estado.toUpperCase()}</p>
            <p><strong>Origen:</strong> ${trip.origen}</p>
            <p><strong>Destino:</strong> ${trip.destino}</p>
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
            <p><strong>Origen:</strong> ${trip.origen}</p>
            <p><strong>Destino:</strong> ${trip.destino}</p>
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

// ACEPTAR VIAJE (Función global para el onclick)
window.aceptarViaje = async (tripId) => {
  await update(ref(db, `trips/${tripId}`), {
    estado: "aceptado",
    conductorId: currentUser.uid
  });
  alert("Viaje aceptado correctamente");
};
