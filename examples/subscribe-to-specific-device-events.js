const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

options.debug = false;
const client = new Fibaro.Hc2Client(options);

client.getDevices().subscribe((devices) => {
    const hvac = devices.find(device => device.identifiers.includes('living-room/climate/temperature'));
    console.log(hvac.properties.value + hvac.properties.unit);

    client.system().subscribe(() => process.stdout.write('.'));

    client.events({device: hvac, properties: ['value']}).subscribe(event => {
        process.stdout.write(event.newValue + hvac.properties.unit);
    });
});
