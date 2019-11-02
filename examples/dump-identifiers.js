const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

const client = new Fibaro.Hc2Client(options);

client.getDevices().subscribe((devices) => {
    const map = {};
    for (const device of devices) {
        for (const identifier of device.identifiers) {
            map[identifier] = device.id;
        }
    }

    for (const key of Object.keys(map).sort()) {
        console.log(key + ': ' + map[key]);
    }
});
