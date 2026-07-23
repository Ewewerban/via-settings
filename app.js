let activeDevice = null;
let selectedKeyElement = null;
let selectedKeyIndex = null;

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const saveBtn = document.getElementById('save-btn');
const deviceNameEl = document.getElementById('device-name');
const mapperCard = document.getElementById('mapper-card');
const keyboardCard = document.getElementById('keyboard-card');
const keyboardGrid = document.getElementById('keyboard-grid');
const selectedKeyDisplay = document.getElementById('selected-key-display');
const logOutput = document.getElementById('log-output');

// Standardowy układ 75% (np. Rainy 75)
const layout75 = [
  { label: "Esc", w: "w-1" }, { label: "F1", w: "w-1" }, { label: "F2", w: "w-1" }, { label: "F3", w: "w-1" }, { label: "F4", w: "w-1" }, { label: "F5", w: "w-1" }, { label: "F6", w: "w-1" }, { label: "F7", w: "w-1" }, { label: "F8", w: "w-1" }, { label: "F9", w: "w-1" }, { label: "F10", w: "w-1" }, { label: "F11", w: "w-1" }, { label: "F12", w: "w-1" }, { label: "Prt", w: "w-1" }, { label: "Del", w: "w-1" }, { label: "Knob", w: "w-1" },
  { label: "`", w: "w-1" }, { label: "1", w: "w-1" }, { label: "2", w: "w-1" }, { label: "3", w: "w-1" }, { label: "4", w: "w-1" }, { label: "5", w: "w-1" }, { label: "6", w: "w-1" }, { label: "7", w: "w-1" }, { label: "8", w: "w-1" }, { label: "9", w: "w-1" }, { label: "0", w: "w-1" }, { label: "-", w: "w-1" }, { label: "=", w: "w-1" }, { label: "Back", w: "w-2" }, { label: "Home", w: "w-1" },
  { label: "Tab", w: "w-15" }, { label: "Q", w: "w-1" }, { label: "W", w: "w-1" }, { label: "E", w: "w-1" }, { label: "R", w: "w-1" }, { label: "T", w: "w-1" }, { label: "Y", w: "w-1" }, { label: "U", w: "w-1" }, { label: "I", w: "w-1" }, { label: "O", w: "w-1" }, { label: "P", w: "w-1" }, { label: "[", w: "w-1" }, { label: "]", w: "w-1" }, { label: "\\", w: "w-15" }, { label: "PgUp", w: "w-1" },
  { label: "Caps", w: "w-175" }, { label: "A", w: "w-1" }, { label: "S", w: "w-1" }, { label: "D", w: "w-1" }, { label: "F", w: "w-1" }, { label: "G", w: "w-1" }, { label: "H", w: "w-1" }, { label: "J", w: "w-1" }, { label: "K", w: "w-1" }, { label: "L", w: "w-1" }, { label: ";", w: "w-1" }, { label: "'", w: "w-1" }, { label: "Enter", w: "w-225" }, { label: "PgDn", w: "w-1" },
  { label: "Shift", w: "w-225" }, { label: "Z", w: "w-1" }, { label: "X", w: "w-1" }, { label: "C", w: "w-1" }, { label: "V", w: "w-1" }, { label: "B", w: "w-1" }, { label: "N", w: "w-1" }, { label: "M", w: "w-1" }, { label: ",", w: "w-1" }, { label: ".", w: "w-1" }, { label: "/", w: "w-1" }, { label: "Shift", w: "w-175" }, { label: "↑", w: "w-1" }, { label: "End", w: "w-1" },
  { label: "Ctrl", w: "w-125" }, { label: "Win", w: "w-125" }, { label: "Alt", w: "w-125" }, { label: "Space", w: "w-625" }, { label: "Alt", w: "w-1" }, { label: "Fn", w: "w-1" }, { label: "←", w: "w-1" }, { label: "↓", w: "w-1" }, { label: "→", w: "w-1" }
];

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent += `\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

// Generowanie Wirtualnej Klawiatury
function renderVirtualKeyboard() {
  keyboardGrid.innerHTML = '';
  layout75.forEach((keyData, index) => {
    const keyEl = document.createElement('div');
    keyEl.className = `key ${keyData.w}`;
    keyEl.textContent = keyData.label;
    keyEl.dataset.keyIndex = index;

    keyEl.addEventListener('click', () => {
      if (selectedKeyElement) selectedKeyElement.classList.remove('active');
      keyEl.classList.add('active');
      selectedKeyElement = keyEl;
      selectedKeyIndex = index;
      
      selectedKeyDisplay.value = `Klawisz: ${keyData.label} (Index: ${index})`;
    });

    keyboardGrid.appendChild(keyEl);
  });
}

// Połączenie VIA
connectBtn.addEventListener('click', async () => {
  try {
    log('Otwieranie okna wyboru klawiatury...');
    const devices = await navigator.hid.requestDevice({ filters: [] });

    if (!devices || devices.length === 0) return;

    activeDevice = devices[0];

    if (!activeDevice.opened) {
      await activeDevice.open();
    }

    deviceNameEl.textContent = `Połączono: ${activeDevice.productName} (VID: ${activeDevice.vendorId})`;
    activeDevice.addEventListener('inputreport', handleViaInputReport);

    renderVirtualKeyboard();

    keyboardCard.classList.remove('hidden');
    mapperCard.classList.remove('hidden');
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');

    log('Pomyślnie połączono z klawiaturą!');

    // Odpytanie o wersję protokołu VIA
    const viaGetVersion = new Uint8Array(32);
    viaGetVersion[0] = 0x01; 
    await activeDevice.sendReport(0x00, viaGetVersion);

  } catch (error) {
    console.error('Błąd WebHID:', error);
    log(`Błąd połączenia: ${error.message}`);
  }
});

function handleViaInputReport(event) {
  const { data } = event;
  const bytes = new Uint8Array(data.buffer);
  
  if (bytes[0] === 0x01) {
    log(`Klawiatura odpowiada VIA Protocol Version: ${bytes[1]}.${bytes[2]}`);
  }
}

disconnectBtn.addEventListener('click', async () => {
  if (activeDevice) {
    await activeDevice.close();
    log('Rozłączono z klawiaturą.');
  }

  activeDevice = null;
  deviceNameEl.textContent = 'Brak połączonej klawiatury';
  keyboardCard.classList.add('hidden');
  mapperCard.classList.add('hidden');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
});

// Zapis nowego klawisza po pakiecie VIA
saveBtn.addEventListener('click', async () => {
  if (!activeDevice) return;

  if (selectedKeyIndex === null) {
    alert('Najpierw kliknij klawisz na wirtualnej klawiaturze!');
    return;
  }

  const keyCode = parseInt(document.getElementById('action-select').value);

  const viaSetKeyBuffer = new Uint8Array(32);
  viaSetKeyBuffer[0] = 0x05; // VIA Command: set_keycode
  viaSetKeyBuffer[1] = 0x00; // Layer 0
  viaSetKeyBuffer[2] = Math.floor(selectedKeyIndex / 16); // Row
  viaSetKeyBuffer[3] = selectedKeyIndex % 16;             // Col
  viaSetKeyBuffer[4] = (keyCode >> 8) & 0xFF;
  viaSetKeyBuffer[5] = keyCode & 0xFF;

  try {
    await activeDevice.sendReport(0x00, viaSetKeyBuffer);
    log(`[VIA] Zapisano KeyCode (${keyCode}) dla klawisza Index: ${selectedKeyIndex}`);
  } catch (error) {
    log(`Błąd zapisu VIA: ${error.message}`);
  }
});
