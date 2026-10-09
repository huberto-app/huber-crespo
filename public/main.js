document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar iconos
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Coordenadas de Crespo, Entre Ríos
  const crespoCenter = [-32.0289, -60.3086];      // Centro de Crespo (Plaza Sarmiento aprox)
  const destinationCoords = [-32.0350, -60.3150]; // Punto B de ejemplo dentro de la ciudad

  // 3. Inicializar el mapa
  const map = L.map('map', {
    zoomControl: false // Sin botones de zoom para interfaz limpia
  }).setView(crespoCenter, 15);

  // Capa estándar universal de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 5. Ajustar el tamaño del mapa inmediatamente
  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  window.addEventListener('resize', () => {
    map.invalidateSize();
  });

  // 6. Iconos personalizados para pines
  const createCustomIcon = (color) => L.divIcon({
    className: 'custom-pin-container',
    html: `<div style="
      width: 16px;
      height: 16px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  // Marcadores de origen y destino
  const originMarker = L.marker(crespoCenter, { icon: createCustomIcon('#10B981') }).addTo(map);
  const destMarker = L.marker(destinationCoords, { icon: createCustomIcon('#EF4444') }).addTo(map);

  // 7. Línea de ruta
  const routeLine = L.polyline([crespoCenter, destinationCoords], {
    color: '#FF5E00',
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(map);

  // Enfocar ambos puntos
  map.fitBounds(routeLine.getBounds(), { padding: [100, 100] });

  // 8. Interacción de la tarjeta inferior (Opciones de viaje)
  const rideOptions = document.querySelectorAll('.ride-option');
  rideOptions.forEach(option => {
    option.addEventListener('click', () => {
      rideOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    });
  });

  // 9. Botón Confirmar
  const btnConfirm = document.querySelector('.btn-primary');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      const activeOption = document.querySelector('.ride-option.active h4');
      const rideName = activeOption ? activeOption.innerText : 'Viaje';

      btnConfirm.innerText = 'Buscando chofer en Crespo...';
      btnConfirm.style.backgroundColor = '#10B981';
      btnConfirm.disabled = true;

      setTimeout(() => {
        alert(`¡Viaje solicitado en ${rideName}! Tu chofer va en camino.`);
        btnConfirm.innerText = 'Confirmar Viaje';
        btnConfirm.style.backgroundColor = '#0F172A';
        btnConfirm.disabled = false;
      }, 2500);
    });
  }
});
