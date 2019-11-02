const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

const client = new Fibaro.Hc2Client(options);
client.getDevices().subscribe((devices) => {
    devices
        .filter(device => device.properties.power > 0)
        .map(device => console.log(device.identifiers.join(', ') + ': ' + device.properties.power + 'w'));
});
