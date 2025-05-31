// --- Pin Definitions ---
// https://stackoverflow.com/questions/78173749/use-raspberry-pi-4-gpio-with-node-js
// WARNING: These pin numbers can be check using $cat /sys/kernel/debug/gpio
const STATUS_LED_PIN = 4;  // BCM GPIO4
const LED1_PIN = 17;       // BCM GPIO17
const LED2_PIN = 27;       // BCM GPIO27
const LED3_PIN = 22;       // BCM GPIO22
const LED_PINS = [LED1_PIN, LED2_PIN, LED3_PIN];
const NUM_LEDS = LED_PINS.length;

// --- LED di Stato ---
const STATUS_LED_ON = 255; 
const STATUS_LED_OFF = 0;
const CONFIG_BLINK_INTERVAL_MS = 800; // Lampeggio durante config/errore

// --- Costanti Animazione LED ---
const CYCLE_ASCEND_RESET = 0;  
const CYCLE_DESCEND_RESET = 1; 
const CYCLE_INVERT = 2;        
const STATE_FADING_UP = 1;     
const STATE_FADING_DOWN = 2;   
const STATE_PAUSED_AT_MAX = 3; 
const STATE_PAUSED_AT_MIN = 4; 

// --- Struttura Configurazione LED (Class in JS) ---
class LedConfig {
  constructor(id, pin) {
    this.id = id + 1;
    this.pin = pin; // GPIO BCM number
    this.minIntensity = 0;
    this.maxIntensity = 100; // Default, RPi PWM usually 0-255 or 0-1000
    this.cycleType = CYCLE_INVERT;
    this.stepValue = 5;
    this.stepIntervalMs = 100;
    this.randomness = 0;
    this.maxMsDuration = 0;
    this.minMsDuration = 0;
    // Variabili di stato
    this.currentIntensity = 0;
    this.animationState = STATE_FADING_UP;
    this.lastUpdateTime = 0;
    this.pauseStartTime = 0;

    this.gpio = null; // To be initialized in main
  }
}

// --- Configurazione HTTP ---
const CONFIG_ENDPOINT_BASE = "https://martin-infortuni.netlify.app/.netlify/functions/upload-supa";
const CONFIG_FETCH_INTERVAL_MS = 30000; // 30 secondi

module.exports = {
  STATUS_LED_PIN, LED1_PIN, LED2_PIN, LED3_PIN, LED_PINS, NUM_LEDS,
  STATUS_LED_ON, STATUS_LED_OFF, CONFIG_BLINK_INTERVAL_MS,
  CYCLE_ASCEND_RESET, CYCLE_DESCEND_RESET, CYCLE_INVERT,
  STATE_FADING_UP, STATE_FADING_DOWN, STATE_PAUSED_AT_MAX, STATE_PAUSED_AT_MIN,
  LedConfig,
  CONFIG_ENDPOINT_BASE, CONFIG_FETCH_INTERVAL_MS
};