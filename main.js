const Gpio = require('pigpio').Gpio;
const {LedConfig, LED_PINS, NUM_LEDS, CONFIG_FETCH_INTERVAL_MS, STATUS_LED_OFF} = require('./config');
const { initStatusLed, setNetworkStatus, cleanupStatusLed } = require('./status_led_control');
const { fetchLedConfiguration } = require('./http_config');
const { updateLedAnimation } = require('./led_control');

let currentRow = 1; //
let maxRowsContainer = { value: 0 }; // Use an object to pass by reference
let lastConfigFetchTime = 0; //
let initialFetchDone = false; //

const ledConfigs = LED_PINS.map(pin => new LedConfig(pin)); //

async function setup() {
  console.log("\n\nAvvio RPi GlowConfig Controller..."); //

  initStatusLed();
  setNetworkStatus(false);

  console.log("Configurazione Pin LED Animazione..."); //

  ledConfigs.forEach(config => {
    try {
      config.gpio = new Gpio(config.pin, {mode: Gpio.OUTPUT});
      config.gpio.pwmWrite(STATUS_LED_OFF); // Start with LEDs off
    } catch (err) {
      console.error(`Failed to initialize GPIO ${config.pin}: ${err.message}`);
      // config.gpio = { pwmWrite: (val) => console.log(`Mock GPIO ${config.pin} PWM: ${val}`) }; // Mock if error
    }
  });

  console.log("Tentativo Fetch Configurazione Iniziale..."); //
  initialFetchDone = await fetchLedConfiguration(currentRow, ledConfigs, maxRowsContainer); //

  if (initialFetchDone) {
    console.log(`Configurazione iniziale (Riga ${currentRow}) caricata. Max Righe: ${maxRowsContainer.value}`); //
    lastConfigFetchTime = Date.now(); //
    setNetworkStatus(true); // Update status LED on successful fetch
  } else {
    console.log("!!! Fetch Configurazione Iniziale Fallito. Uso valori di default."); //
    setNetworkStatus(false);
  }
  console.log("Setup completato. Avvio loop principale."); //
}

function mainLoop() {
  const currentTime = Date.now();

  if (initialFetchDone && (currentTime - lastConfigFetchTime >= CONFIG_FETCH_INTERVAL_MS)) {
    console.log("Intervallo fetch raggiunto.");
    currentRow++;
    if (maxRowsContainer.value > 0 && currentRow > maxRowsContainer.value) {
      console.log(`Raggiunta riga massima (${maxRowsContainer.value}), torno a riga 1.`);
      currentRow = 1;
    } else if (maxRowsContainer.value <= 0) {
      console.log("maxRows non valido, richiedo riga 1.");
      currentRow = 1; 
    }

    console.log(`Workspaceing nuova configurazione per riga ${currentRow}...`);
    fetchLedConfiguration(currentRow, ledConfigs, maxRowsContainer).then(success => {
      if (success) {
        console.log(`Configurazione riga ${currentRow} caricata. Max Righe: ${maxRowsContainer.value}`);
        lastConfigFetchTime = Date.now();
        setNetworkStatus(true);
      } else {
        console.log("!!! Fetch Fallito. Mantengo configurazione precedente.");
        setNetworkStatus(false); // Indicate potential network issue
      }
    });
  } else if (!initialFetchDone ) { 
    console.log("Riprovo fetch configurazione iniziale..."); //
    fetchLedConfiguration(currentRow, ledConfigs, maxRowsContainer).then(success => { 
      initialFetchDone = success;
      if (initialFetchDone) {
        console.log(`Configurazione iniziale (Riga ${currentRow}) caricata. Max Righe: ${maxRowsContainer.value}`); //
        lastConfigFetchTime = Date.now(); //
        setNetworkStatus(true);
      } else {
        console.log("!!! Fetch Iniziale fallito di nuovo."); //
         setNetworkStatus(false);
      }
    });
  }

  if (initialFetchDone || !Gpio.accessible) {
     ledConfigs.forEach(config => {
        updateLedAnimation(config);
     });
  }
}

// --- Start the application ---
(async () => {
  await setup();
  setInterval(mainLoop, CONFIG_FETCH_INTERVAL_MS / 10); // Fetch logic check runs more often
  setInterval(() => { // Dedicated animation loop
    if (initialFetchDone || !Gpio.accessible) {
        ledConfigs.forEach(config => {
            updateLedAnimation(config);
        });
    }
  }, 16); // roughly 60fps for animations

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log("Ricevuto SIGINT. Pulizia GPIO...");
    cleanupStatusLed();
    ledConfigs.forEach(config => {
      if (config.gpio) {
        config.gpio.pwmWrite(STATUS_LED_OFF); // Turn off LED
      }
    });
    console.log("GPIO puliti. Uscita.");
    process.exit(0);
  });
})();