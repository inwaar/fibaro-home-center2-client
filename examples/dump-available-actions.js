const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

const client = new Fibaro.Hc2Client(options);

client.getDevices().subscribe(devices => {
    for (const device of devices) {
        console.log(device.identifiers.join(', '), device.actions);
    }
});
