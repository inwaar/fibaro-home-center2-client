const assert = require('assert');
const Client = require('../lib/client').Hc2Client;

describe('Client', function () {
    describe('#_normalizeIdentifier()', function () {
        it('should normalize identifiers', function () {
            const SUT = new Client();
            assert.strictEqual(
                SUT._normalizeIdentifier('Someone\'s "device" #1-2_3'),
                'someones-device-1-2-3'
            );
        });
    });
});
