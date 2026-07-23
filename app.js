let activeDevice = null;

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const saveBtn = document.getElementById('save-btn');
const deviceNameEl = document.getElementById('device-name');
const mapperCard = document.getElementById('mapper-card');
const previewCard = document.getElementById('preview-card');
const logOutput = document.getElementById('log-output');

const buttonSelect = document.getElementById('button-select');
const visualButtons = document.querySelectorAll('.mouse-btn');

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

    if (!devices || devices.length === 0) {
      log('Nie wybrano żadnego urządzenia.');
      return;
    }

    activeDevice = devices[0];

    if (!activeDevice.opened) {
      await activeDevice.open();
    }

    deviceNameEl.textContent = `Połączono: ${activeDevice.productName || 'Nieznane urządzenie'} (Vendor ID: ${activeDevice.vendorId})`;
    
    // Pokaż sekcje po połączeniu
    mapperCard.classList.remove('hidden');
    previewCard.classList.remove('hidden');
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');

    log(`Połączono pomyślnie z: ${activeDevice.productName}`);

    activeDevice.addEventListener('inputreport', handleInputReport);

  } catch (error) {
    console.error('Błąd WebHID:', error);
    log(`Błąd połączenia: ${error.message}`);
  }
});

// 2. Rozłączanie urządzenia
disconnectBtn.addEventListener('click', async () => {
  if (activeDevice) {
    try {
      await activeDevice.close();
      log(`Rozłączono z: ${activeDevice.productName}`);
    } catch (error) {
      log(`Błąd podczas rozłączania: ${error.message}`);
    }
  }

  activeDevice = null;
  deviceNameEl.textContent = 'Brak połączonego urządzenia';
  
  // Ukryj sekcje
  mapperCard.classList.add('hidden');
  previewCard.classList.add('hidden');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
});

// 3. Synchronizacja wyboru przycisku (Wizualny schemat <-> Rozwijana lista)
visualButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-button-id');
    buttonSelect.value = id;
    highlightVisualButton(id);
  });
});

buttonSelect.addEventListener('change', (e) => {
  highlightVisualButton(e.target.value);
});

function highlightVisualButton(id) {
  visualButtons.forEach(btn => {
    if (btn.getAttribute('data-button-id') === id) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 4. Odbiór danych HID
function handleInputReport(event) {
  const { data, reportId } = event;
  const valueArray = new Uint8Array(data.buffer);
  log(`Odebrano pakiet [Report ID: ${reportId}]: ${Array.from(valueArray).join(', ')}`);
}

// 5. Zapisywanie konfiguracji
saveBtn.addEventListener('click', async () => {
  if (!activeDevice) {
    log('Brak aktywnego urządzenia!');
    return;
  }

  const buttonId = parseInt(buttonSelect.value);
  const keyCode = parseInt(document.getElementById('action-select').value);

  const reportData = new Uint8Array([0x01, buttonId, keyCode]);

  try {
    await activeDevice.sendReport(0x00, reportData);
    log(`Wysyłanie bajtów: [${Array.from(reportData).join(', ')}] -> Sukces!`);
  } catch (error) {
    console.error('Błąd wysyłania pakietu:', error);
    log(`Błąd zapisu: ${error.message}`);
  }
});
