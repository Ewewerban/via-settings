let activeDevice = null;

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const saveBtn = document.getElementById('save-btn');
const deviceNameEl = document.getElementById('device-name');
const mapperCard = document.getElementById('mapper-card');
const previewCard = document.getElementById('preview-card');
const logOutput = document.getElementById('log-output');

const buttonSelect = document.getElementById('button-select');
const deviceContainer = document.getElementById('device-container');

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
      log('Nie wybrano urządzenia.');
      return;
    }

    activeDevice = devices[0];

    if (!activeDevice.opened) {
      await activeDevice.open();
    }

    deviceNameEl.textContent = `Połączono: ${activeDevice.productName || 'Urządzenie HID'} (VID: ${activeDevice.vendorId}, PID: ${activeDevice.productId})`;

    // Rejestracja odbierania pakietów
    activeDevice.addEventListener('inputreport', handleInputReport);

    // Wysyłamy do mikrokontrolera komendę GET_LAYOUT (0x02)
    const getLayoutCmd = new Uint8Array([0x02, 0x00]);
    await activeDevice.sendReport(0x00, getLayoutCmd);
    log('Wysłano komendę 0x02 (Żądanie struktury przycisków)...');

    mapperCard.classList.remove('hidden');
    previewCard.classList.remove('hidden');
    connectBtn.classList.add('hidden');
    disconnectBtn.classList.remove('hidden');

  } catch (error) {
    console.error('Błąd WebHID:', error);
    log(`Błąd połączenia: ${error.message}`);
  }
});

// 2. Obsługa przychodzącego raportu z mikrokontrolera
function handleInputReport(event) {
  const { data, reportId } = event;
  const bytes = new Uint8Array(data.buffer);
  log(`Odebrano pakiet [Report ID: ${reportId}]: ${Array.from(bytes).join(', ')}`);

  // Komenda 0x02 = odpowiedź z informacją o przyciskach
  // bytes[1] określa liczbę przycisków obecnych w układzie mikrokontrolera
  if (bytes[0] === 0x02) {
    const buttonCount = bytes[1];
    log(`Urządzenie zwróciło informację o obecności ${buttonCount} przycisków.`);
    buildUIFromDeviceData(buttonCount);
  }
}

// 3. Dynamiczne budowanie widoku z odebranych danych
function buildUIFromDeviceData(count) {
  deviceContainer.innerHTML = '';
  buttonSelect.innerHTML = '';

  for (let i = 1; i <= count; i++) {
    // Przycisk graficzny
    const btn = document.createElement('button');
    btn.className = `dynamic-btn ${i === 1 ? 'active' : ''}`;
    btn.dataset.buttonId = i;
    btn.textContent = `P${i}`;

    btn.addEventListener('click', () => {
      buttonSelect.value = i;
      highlightButton(i);
    });

    deviceContainer.appendChild(btn);

    // Opcja na liście rozwijanej
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Przycisk ${i}`;
    buttonSelect.appendChild(option);
  }
}

function highlightButton(id) {
  const buttons = deviceContainer.querySelectorAll('.dynamic-btn');
  buttons.forEach(btn => {
    if (parseInt(btn.dataset.buttonId) === parseInt(id)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 4. Rozłączanie
disconnectBtn.addEventListener('click', async () => {
  if (activeDevice) {
    await activeDevice.close();
    log('Rozłączono z urządzeniem.');
  }

  activeDevice = null;
  deviceNameEl.textContent = 'Brak połączonego urządzenia';
  mapperCard.classList.add('hidden');
  previewCard.classList.add('hidden');
  disconnectBtn.classList.add('hidden');
  connectBtn.classList.remove('hidden');
});

// 5. Wysyłanie nowej konfiguracji (SET_KEYMAP = 0x01)
saveBtn.addEventListener('click', async () => {
  if (!activeDevice) return;

  const buttonId = parseInt(buttonSelect.value);
  const keyCode = parseInt(document.getElementById('action-select').value);

  const reportData = new Uint8Array([0x01, buttonId, keyCode]);

  try {
    await activeDevice.sendReport(0x00, reportData);
    log(`Wysłano zapis: Przycisk ${buttonId} -> KeyCode ${keyCode}`);
  } catch (error) {
    log(`Błąd wysyłania: ${error.message}`);
  }
});
