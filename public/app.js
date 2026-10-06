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

let currentUser = null;
let currentRole = null;

// REGISTRO
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("reg-nombre").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const rol = document.getElementById("reg-rol").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Guardar usuario en Realtime Database (/users/uid)
    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      nombre: nombre,
      email: email,
      rol: rol
    });

    alert("Cuenta creada con éxito");
    registerForm.reset();
  } catch (error) {
    alert("Error al registrar: " + error.message);
  }
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
});

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
