'use strict';

/**
 * Client options
 *
 * @readonly
 * @property {string} host=192.168.1.69 - HC2 controller ip-address
 * @property {number} port=80 - HC2 controller port
 * @property {string} user=admin - username
 * @property {string} password - user password
 * @property {number} connectTimeout=7000 - Reconnect to controller if no success timeout
 * @property {number} pollingInterval=1000 - Controller devices properties polling interval
 * @property {number} pollingTimeout=3000 - Controller devices properties polling timeout
 * @property {boolean} debug=false - Trace debug information
 */
const CLIENT_OPTIONS = {
    host: '192.168.1.69',
    port: 80,
    user: 'admin',
    password: '',
    connectTimeout: 7000,
    pollingInterval: 1000,
    pollingTimeout: 3000,
    debug: false
};

module.exports = {
    CLIENT_OPTIONS,
};
