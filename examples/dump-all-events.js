const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

const client = new Fibaro.Hc2Client(options);
client.system().subscribe(event => console.log(event));
client.events().subscribe(event => console.log(event));
