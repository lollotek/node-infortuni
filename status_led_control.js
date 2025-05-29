const { Gpio } = require('onoff');
const { STATUS_LED_PIN, STATUS_LED_ON, STATUS_LED_OFF, CONFIG_BLINK_INTERVAL_MS } = require('./config'); //

let statusLed;
let statusLedState = false; //
let lastStatusBlinkTime = 0; //
let blinkIntervalId = null;
let isNetworkConnected = false; // This needs to be updated by your app's network check

function initStatusLed() {
  if (Gpio.accessible) {
    statusLed = new Gpio(STATUS_LED_PIN, 'out'); //
    updateStatusLedAppearance();
  } else {
    console.warn('GPIO not accessible. Status LED will not function.');
    statusLed = { // Mock object if GPIO not available
        writeSync: (value) => console.log(`Mock Status LED: ${value}`)
    };
  }
}

function setNetworkStatus(isConnected) {
    if (isNetworkConnected !== isConnected) {
        isNetworkConnected = isConnected;
        updateStatusLedAppearance();
    }
}

function updateStatusLedAppearance() {
  if (blinkIntervalId) {
    clearInterval(blinkIntervalId);
    blinkIntervalId = null;
  }

  if (isNetworkConnected) {
    statusLed.writeSync(STATUS_LED_ON); //
    statusLedState = true; //
  } else {
    // Non Connesso: LED Lampeggiante
    blinkIntervalId = setInterval(() => {
      statusLedState = !statusLedState; //
      statusLed.writeSync(statusLedState ? STATUS_LED_ON : STATUS_LED_OFF); //
    }, CONFIG_BLINK_INTERVAL_MS); //
  }
}

function cleanupStatusLed() {
    if (blinkIntervalId) clearInterval(blinkIntervalId);
    if (statusLed && Gpio.accessible) {
        statusLed.writeSync(STATUS_LED_OFF);
        statusLed.unexport();
    }
}

module.exports = { initStatusLed, setNetworkStatus, updateStatusLedAppearance, cleanupStatusLed };