const Gpio = require('pigpio').Gpio;
const { STATUS_LED_PIN, STATUS_LED_ON, STATUS_LED_OFF, CONFIG_BLINK_INTERVAL_MS } = require('./config');

let statusLed;
let statusLedState = false;
let blinkIntervalId = null;
let isNetworkConnected = false;

function initStatusLed() {
  try {
    statusLed = new Gpio(STATUS_LED_PIN, {mode: Gpio.OUTPUT});
  } catch (err) {
    console.error(`Failed to initialize CONFIG GPIO: ${err.message}`);
    statusLed = { pwmWrite: (val) => console.log(`Mock CONFIG GPIO PWM: ${val}`) }; // Mock if error
  }
  updateStatusLedAppearance();
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
    statusLed.pwmWrite(STATUS_LED_ON);
  } else {
    // Non Connesso: LED Lampeggiante
    blinkIntervalId = setInterval(() => {
      statusLedState = !statusLedState;
      statusLed.pwmWrite(statusLedState ? STATUS_LED_ON : STATUS_LED_OFF);
    }, CONFIG_BLINK_INTERVAL_MS);
  }
}

function cleanupStatusLed() {
    if (blinkIntervalId) clearInterval(blinkIntervalId);
    if (statusLed) {
        statusLed.pwmWrite(STATUS_LED_OFF);
    }
}

module.exports = { initStatusLed, setNetworkStatus, updateStatusLedAppearance, cleanupStatusLed };