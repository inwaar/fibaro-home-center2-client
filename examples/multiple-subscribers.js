const options = require('./options').EXAMPLES_CLIENT_OPTIONS;
const Fibaro = require('./../lib/client');

const client = new Fibaro.Hc2Client(options);

let counter = 5;
let a = client.events().subscribe(event => {
    console.log('event in A subscriber');
    counter--;
    console.log('counter', counter);

    if (counter < 0) {
        a.unsubscribe();
        console.log('A unsubscribed');
    }
});

let b = client.events().subscribe(event => {
    console.log('event in B subscriber');
    b.unsubscribe();
    console.log('B unsubscribed');
});
