let activeDevice = null;
let selectedButtonId = null;
let selectedButtonElement = null;

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const saveBtn = document.getElementById('save-btn');
const deviceNameEl = document.getElementById('device-name');
const mapperCard = document.getElementById('mapper-card');
const visualCard = document.getElementById('visual-card');
const visualContainer = document.getElementById('visual-container');
const selectedDisplay = document.getElementById('selected-display');
const logOutput = document.getElementById('log-output');

// Definicja przycisków dla myszki Razer Basilisk / Standardowej myszki
const mouseButtons = [
  { id: 1, label: "LPM (Lewy)", cssClass: "btn-left" },
  { id: 2, label: "PPM (Prawy)", cssClass: "btn-right" },
  { id: 3, label: "Rolka (Click)", cssClass: "btn-wheel" },
  { id: 4, label: "Boczny Przód", cssClass: "btn-side-1" },
  { id: 5, label: "Boczny Tył", cssClass: "btn-side-2" },
  { id: 6, label: "DPI Clutch", cssClass: "btn-side-3" }
];

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent += `\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

// 1. Łączenie z urządzeniem
connectBtn.addEventListener('click', async () => {
  try {
    log('Otwieranie okna wyboru urządzenia...');
    const devices = await navigator.hid.requestDevice({ filters: [] });

    if (!devices || devices.length === 0) return;

    activeDevice = devices[0];

    if (!activeDevice.opened) {
      await activeDevice.open();
    }

    const isRazer = activeDevice.vendorId === 5426 || activeDevice.vendorId === 0x1532;
    deviceNameEl.textContent = `Połączono: ${activeDevice.productName || 'Urządzenie HID'} (VID: ${activeDevice.vendorId})`;

    // Wybór odpowiedniego interfejsu graficznego
    renderMouseUI();

    visualCard.classList.remove('hidden');
    mapperCard.classList.remove('hidden');
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');

    log(`Pomyślnie połączono! Urządzenie rozpoznane jako: ${isRazer ? 'Mysz Razer' : 'Standardowe HID'}`);

  } catch (error) {
    console.error('Błąd WebHID:', error);
    log(`Błąd połączenia: ${error.message}`);
  }
});

// 2. Generowanie wizualnego układu myszki
function renderMouseUI() {
  visualContainer.className = "mouse-wrapper";
  visualContainer.innerHTML = '<div class="mouse-body"></div>';
  
  const mouseBody = visualContainer.querySelector('.mouse-body');

  mouseButtons.forEach((btnData) => {
    const btnEl = document.createElement('button');
    btnEl.className = `mouse-btn ${btnData.cssClass}`;
    btnEl.textContent = btnData.label;

    btnEl.addEventListener('click', () => {
      if (selectedButtonElement) selectedButtonElement.classList.remove('active');
      btnEl.classList.add('active');
      selectedButtonElement = btnEl;
      selectedButtonId = btnData.id;

      selectedDisplay.value = `Wybrano: ${btnData.label} (ID: ${btnData.id})`;
    });

    mouseBody.appendChild(btnEl);
  });
}

// 3. Rozłączanie
disconnectBtn.addEventListener('click', async () => {
  if (activeDevice) {
    await activeDevice.close();
    log('Rozłączono z urządzeniem.');
  }

  activeDevice = null;
  deviceNameEl.textContent = 'Brak połączonego urządzenia';
  visualCard.classList.add('hidden');
  mapperCard.classList.add('hidden');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
});

// 4. Zapis do myszki (Przykładowy protokół Razer/Generic HID)
saveBtn.addEventListener('click', async () => {
  if (!activeDevice) return;

  if (selectedButtonId === null) {
    alert('Najpierw kliknij przycisk na wizualizacji myszki!');
    return;
  }

  const keyCode = parseInt(document.getElementById('action-select').value);

  // Budowanie pakietu dla myszki (Razer/Standard HID Feature Report)
  // [Report ID, Command, Button ID, KeyCode]
  const reportData = new Uint8Array(16);
  reportData[0] = 0x07;             // Feature Report ID dla sterowników myszy
  reportData[1] = selectedButtonId; // Numer przycisku
  reportData[2] = keyCode;          // KeyCode akcji

  try {
    await activeDevice.sendReport(0x00, reportData);
    log(`Zapisano do myszki: Przycisk ${selectedButtonId} -> KeyCode ${keyCode}`);
  } catch (error) {
    log(`Uwaga: Przeglądarka wysłała pakiet, ale profil myszki Razer wymaga dedykowanego podpisania sterownika WebUSB. Błąd: ${error.message}`);
  }
});
