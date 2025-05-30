const osc = require('node-osc');

const sonicPiIp = '127.0.0.1';
const sonicPiPort = 4560;
const oscAddress = '/oscControl/slider'; 

let client = undefined;

function initOSC() {
  client = new osc.Client(sonicPiIp, sonicPiPort);
}

function sendOSCMessage(index, value) {
  client.send(`${oscAddress}${index}`, [value], () => {
    console.log(`OSC message sent to ${oscAddress}${index} with value: ${value}`);
  });
}

function closeOSC() {
  client.close();
}


module.exports = { sendOSCMessage, closeOSC, initOSC };