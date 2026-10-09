// Configuración de Firebase
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const CRESPO_COORDS = [-32.0298, -60.3086];
let userLocation = CRESPO_COORDS;
let selectedRideType = 'GO Express';
let currentUser = null;
let isSignUpMode = false;

// Inicialización del Mapa claro en Zoom 16
const map = L.map('map', { zoomControl: false }).setView(CRESPO_COORDS, 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Pin oscuro discreto
const userIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `<div style="background:#000000; width:16px; height:16px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16]
});

const userMarker = L.marker(CRESPO_COORDS, { icon: userIcon }).addTo(map);

// Control Modal Autenticación
const authModal = document.getElementById('auth-modal');
const btnOpenAuth = document.getElementById('btn-open-auth');
const btnCloseAuth = document.getElementById('btn-close-auth');
const authFormContainer = document.getElementById('auth-form-container');
const userProfileContainer = document.getElementById('user-profile-container');
const userEmailDisplay = document.getElementById('user-email-display');

btnOpenAuth.addEventListener('click', () => authModal.classList.add('active'));
btnCloseAuth.addEventListener('click', () => authModal.classList.remove('active'));

const btnToggleMode = document.getElementById('btn-toggle-mode');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const authSwitchText = document.getElementById('auth-switch-text');

btnToggleMode.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  if (isSignUpMode) {
    authTitle.innerText = "Crear Cuenta";
    authSubtitle.innerText = "Ingresa tus datos para registrarte";
    btnAuthSubmit.innerText = "Registrarse";
    authSwitchText.innerText = "¿Ya tienes cuenta?";
    btnToggleMode.innerText = "Iniciar sesión";
  } else {
    authTitle.innerText = "Iniciar Sesión";
    authSubtitle.innerText = "Ingresa a tu cuenta para continuar";
    btnAuthSubmit.innerText = "Ingresar";
    authSwitchText.innerText = "¿No tienes cuenta?";
    btnToggleMode.innerText = "Registrarme";
  }
});

const authForm = document.getElementById('auth-form');
authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (isSignUpMode) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => authModal.classList.remove('active'))
      .catch(err => alert("Error: " + err.message));
  } else {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => authModal.classList.remove('active'))
      .catch(err => alert("Error: " + err.message));
  }
});

document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user && !user.isAnonymous) {
    authFormContainer.classList.add('hidden');
    userProfileContainer.classList.remove('hidden');
    userEmailDisplay.innerText = user.email;
  } else {
    authFormContainer.classList.remove('hidden');
    userProfileContainer.classList.add('hidden');
  }
});

// Selección de Vehículos
const rideOptions = document.querySelectorAll('.ride-option');
rideOptions.forEach(option => {
  option.addEventListener('click', () => {
    rideOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    selectedRideType = option.querySelector('h4').innerText;
  });
});

// Confirmar Viaje
const btnConfirm = document.getElementById('btn-confirm-ride');
const inputDestination = document.querySelectorAll('.input-group input')[1];

btnConfirm.addEventListener('click', () => {
  const destinationText = inputDestination.value.trim();

  if (!destinationText) {
    alert("Ingresa un destino.");
    return;
  }

  if (!currentUser) {
    authModal.classList.add('active');
    alert("Inicia sesión para solicitar un viaje.");
    return;
  }

  const rideRequestRef = db.ref('rides/').push();
  const rideData = {
    userId: currentUser.uid,
    userEmail: currentUser.email || 'Anónimo',
    origin: { lat: userLocation[0], lng: userLocation[1] },
    destinationName: destinationText,
    rideType: selectedRideType,
    status: 'REQUESTED',
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  btnConfirm.disabled = true;
  btnConfirm.innerText = "Solicitando...";

  rideRequestRef.set(rideData)
    .then(() => {
      btnConfirm.innerText = "¡Viaje Solicitado!";
    })
    .catch((err) => {
      alert("Error en la conexión.");
      btnConfirm.disabled = false;
      btnConfirm.innerText = "Confirmar Viaje";
    });
});
