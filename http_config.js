const axios = require('axios');
const { CONFIG_ENDPOINT_BASE, NUM_LEDS, CYCLE_INVERT } = require('./config');
const { resetLedState } = require('./led_control'); // Assuming led_control.js is created

async function fetchLedConfiguration(rowNum, configs, maxRowsRef, id = -1) {
  try {
    // const networkInterfaces = require('os').networkInterfaces(); // Basic check
    // if (!networkInterfaces || !Object.keys(networkInterfaces).some(iface => networkInterfaces[iface].some(details => !details.internal && details.family === 'IPv4'))) {
    //    console.log("Errore Fetch: Rete non disponibile.");
    //    return false;
    // } // More robust check would be a ping or DNS resolve

    const url = `${CONFIG_ENDPOINT_BASE}?row=${rowNum}`;
    console.log(`config da: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RPi-GlowConfig-Client'
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200) {
      const payload = response.data; // axios automatically parses JSON
      console.log("[HTTP] Payload ricevuto:", payload);

      maxRowsRef.value = payload.maxRows !== undefined ? payload.maxRows : -1;
      const receivedRow = payload.currentRow !== undefined ? payload.currentRow : -1;

      console.log(`JSON Parsed: currentRow=${receivedRow}, maxRows=${maxRowsRef.value}`);

      if (receivedRow !== rowNum && receivedRow !== -1) {
        console.warn(`Attenzione: Richiesta riga ${rowNum} ma ricevuta riga ${receivedRow}`);
      }
      if (maxRowsRef.value <= 0) {
        console.warn("Attenzione: maxRows non valido ricevuto dal server.");
      }

      const ledConfigsJson = payload.ledConfigs;
      if (!Array.isArray(ledConfigsJson)) {
        console.error("Errore: Array 'ledConfigs' non trovato o non è un array nel JSON.");
        return false;
      }

      if (id == -1){
        let ledIndex = 0;
        for (const ledJson of ledConfigsJson) {
          if (ledIndex >= NUM_LEDS) break;

          configs[ledIndex].minIntensity = parseFloat(ledJson.minI !== undefined ? ledJson.minI : 0); 
          configs[ledIndex].maxIntensity = parseFloat(ledJson.maxI !== undefined ? ledJson.maxI : 255);
          configs[ledIndex].cycleType = parseFloat(ledJson.cyT !== undefined ? ledJson.cyT : CYCLE_INVERT);
          configs[ledIndex].stepValue = parseFloat(ledJson.stV !== undefined ? ledJson.stV : 5);
          configs[ledIndex].stepIntervalMs = parseFloat(ledJson.stMs !== undefined ? ledJson.stMs : 50);
          configs[ledIndex].randomness = parseFloat(ledJson.rand !== undefined ? ledJson.rand : 0);
          configs[ledIndex].maxMsDuration = parseFloat(ledJson.maxMs !== undefined ? ledJson.maxMs : 0);
          configs[ledIndex].minMsDuration = parseFloat(ledJson.minMs !== undefined ? ledJson.minMs : 0);

          resetLedState(configs[ledIndex]);
          console.log(`LED ${ledIndex + 1} configurato:`, JSON.stringify(configs[ledIndex], null, 2));

          ledIndex++;
        }

        if (ledIndex !== NUM_LEDS) {
          console.warn(`Attenzione: Ricevuti dati per ${ledIndex} LED, ma attesi ${NUM_LEDS}`);
        }        
      }else{
        const ledJson = ledConfigsJson[id-1];
        configs[id-1].minIntensity = parseFloat(ledJson.minI !== undefined ? ledJson.minI : 0);
        configs[id-1].maxIntensity = parseFloat(ledJson.maxI !== undefined ? ledJson.maxI : 255);
        configs[id-1].cycleType = parseFloat(ledJson.cyT !== undefined ? ledJson.cyT : CYCLE_INVERT);
        configs[id-1].stepValue = parseFloat(ledJson.stV !== undefined ? ledJson.stV : 5);
        configs[id-1].stepIntervalMs = parseFloat(ledJson.stMs !== undefined ? ledJson.stMs : 50);
        configs[id-1].randomness = parseFloat(ledJson.rand !== undefined ? ledJson.rand : 0);
        configs[id-1].maxMsDuration = parseFloat(ledJson.maxMs !== undefined ? ledJson.maxMs : 0);
        configs[id-1].minMsDuration = parseFloat(ledJson.minMs !== undefined ? ledJson.minMs : 0);

        resetLedState(configs[id-1]);
        console.log(`LED ${id} configurato:`, JSON.stringify(configs[id-1], null, 2));
      }

      return true;
    } else {
      console.error(`[HTTP] GET... fallito, codice non OK: ${response.status}`);
    }
  } catch (error) {
    console.error(`[HTTP] GET... fallito, errore: ${error.message}`);
    if (error.response) {
        console.error('Error Data:', error.response.data);
        console.error('Error Status:', error.response.status);
    }
    return false;
  }
  return false;
}

module.exports = { fetchLedConfiguration };