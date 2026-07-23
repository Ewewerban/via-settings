let activeDevice = null;

const connectBtn = document.getElementById('connect-btn');
const saveBtn = document.getElementById('save-btn');
const deviceNameEl = document.getElementById('device-name');
const mapperCard = document.getElementById('mapper-card');
const logOutput = document.getElementById('log-output');

// Pomocnicza funkcja logująca
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent += `\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

// Sprawdzenie obsługi WebHID
if (!('hid' in navigator)) {
  alert('Twoja przeglądarka nie obsługuje WebHID API! Użyj Chrome, Edge lub Opera.');
} else {
  log('WebHID API jest wspierane. Gotowe do połączenia.');
}

// 1. Łączenie z urządzeniem
connectBtn.addEventListener('click', async () => {
  try {
    log('Otwieranie okna wyboru urządzenia...');
    
    // Zapytanie o urządzenia HID
    const devices = await navigator.hid.requestDevice({ filters: [] });

    if (!devices || devices.length === 0) {
      log('Nie wybrano żadnego urządzenia.');
      return;
    }

    activeDevice = devices[0];

    // Otwarcie połączenia
    if (!activeDevice.opened) {
      await activeDevice.open();
    }

    deviceNameEl.textContent = `Połączono: ${activeDevice.productName || 'Nieznane urządzenie'} (Vendor ID: ${activeDevice.vendorId})`;
    mapperCard.classList.remove('hidden');
    log(`Połączono pomyślnie z: ${activeDevice.productName}`);

    // Nasłuchiwanie wejściowych danych
    activeDevice.addEventListener('inputreport', handleInputReport);

  } catch (error) {
    console.error('Błąd WebHID:', error);
    log(`Błąd połączenia: ${error.message}`);
  }
});

// 2. Obsługa przychodzących danych HID
function handleInputReport(event) {
  const { data, reportId } = event;
  const valueArray = new Uint8Array(data.buffer);
  log(`Odebrano pakiet [Report ID: ${reportId}]: ${Array.from(valueArray).join(', ')}`);
}

// 3. Wysyłanie konfiguracji
saveBtn.addEventListener('click', async () => {
  if (!activeDevice) {
    log('Brak aktywnego urządzenia!');
    return;
  }

  const buttonId = parseInt(document.getElementById('button-select').value);
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
