const {tap, map, switchMap, retryWhen, delayWhen, share, filter, distinctUntilChanged} = require('rxjs/operators');
const {timer, from, of, Subject, ReplaySubject, BehaviorSubject} = require('rxjs');

const querystring = require('querystring');
const {RxHR} = require('@akanass/rx-http-request');

const CLIENT_OPTIONS = require('./client-options').CLIENT_OPTIONS;

class Client {
    /**
     * Creates a new client.
     * @param {CLIENT_OPTIONS | {}} options
     */
    constructor(options = {}) {
        this._id = Math.random();

        /**
         * Client options
         * @type {CLIENT_OPTIONS}
         * @private
         */
        this._options = {...CLIENT_OPTIONS, ...options};

        /**
         * Last event id
         * @type {number}
         * @private
         */
        this._lastEventId = 0;

        /**
         * Rooms id => room map
         * @type {Object.<number, Room>}
         * @private
         */
        this._roomsMap = {};

        /**
         * Devices id => device map
         * @type {Object.<number, Device>}
         * @private
         */
        this._devicesMap = {};

        /**
         * Devices that are not permitted for the current user and nothing can be fetched for them
         * @type {Object.<number, Device>}
         * @private
         */
        this._unknownDevicesMap = {};

        /**
         * Devices identifier => device map
         * @type {Object.<string, Device>}
         * @private
         */
        this._devicesIdentifiersMap = {};

        /**
         * @private
         */
        this._trace = this._options.debug ? (msg, ...options) => console.debug(this._id + ': ' + msg, options) : () => {
        };

        /**
         * Status query polling timeout reference
         * @type {number|null}
         * @private
         */
        this._nextStatusQueryTimeoutRef = null;

        /**
         * System events subject
         * @type {Subject<SystemEvent>}
         * @private
         */
        this._system$ = this._prepareColdSystem$();

        /**
         * Devices event subject
         * @type {Subject<DevicePropertyUpdateEvent>}
         * @private
         */
        this._events$ = this._prepareColdEvents$();
    }

    /**
     * @typedef {Object} DevicePropertyUpdateEvent
     * @property {number} id - Room id provided by HC
     * @property {number} identifier - Generated literal identifier
     * @property {string} property - Updated property
     * @property {string} newValue - updated value
     * @property {string} oldValue - previous value
     */

    /**
     * @typedef {Object} EventCriteria
     * @property {Device|null} device - Subscribe only on a specific device events
     * @property {string[]|null} properties - Subscribe only on a specific property change events
     */

    /**
     * Subscribe on device property update events
     * @property {EventCriteria} criteria - Optional event filtering
     * @returns {Observable<DevicePropertyUpdateEvent>}
     */
    events(criteria = {}) {
        return this._events$.pipe(
            filter(event => {
                const deviceMatched = !criteria.device || criteria.device.id === event.id;
                const propertyMatched = !criteria.properties || criteria.properties.includes(event.property);
                return deviceMatched && propertyMatched;
            })
        ).asObservable();
    }

    /**
     * @typedef {Object} SystemEvent
     * @property {number} id - Room id provided by HC
     * @property {number} name - Room name provided by HC
     * @property {number} identifier - Generated literal identifier
     */

    /**
     * Subscribe on client system events
     * @returns {Observable<SystemEvent>}
     */
    system() {
        return this._system$.asObservable();
    }

    /**
     * Make a GET API request to HC2
     *
     * @param {string} query
     * @param {boolean} retry=false
     * @returns {Observable<Object>}
     */
    query(query, retry = false) {
        const uri = 'http://' + this._options.host + '/api' + query;
        this._trace('query', uri);

        const options = {
            port: this._options.port,
            auth: {
                user: this._options.user,
                password: this._options.password
            },
            json: true,
            timeout: this._options.connectTimeout
        };

        return RxHR.get(uri, options).pipe(
            map(event => {
                this._trace('query: event.response.statusCode', event.response.statusCode);

                if (![200, 202].includes(event.response.statusCode)) {
                    throw(event.response.statusMessage || event.response.statusCode);
                }

                if (event.body.last) {
                    this._system$.next({type: 'last', details: event.body.last});
                } else {
                    this._system$.next({type: 'connected'});
                }

                return event.body;
            }),
            retryWhen(errors =>
                errors.pipe(
                    tap(error => {
                        this._trace('query: error', error);
                        this._system$.next({type: 'error', details: error});
                    }),
                    delayWhen(() => timer(this._options.connectTimeout))
                )
            )
        );
    }

    /**
     * @typedef {Object} Room
     * @property {number} id - Room id provided by HC
     * @property {number} name - Room name provided by HC
     * @property {number} identifier - Generated literal identifier
     */

    /**
     * Get rooms
     * @returns Observable<Room[]>
     *
     * @example
     * const Fibaro = require('fibaro-home-center2-client');
     *
     * const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
     * client.getRooms().subscribe((rooms) => {
     *    console.log(rooms);
     * });
     */
    getRooms() {
        return this.query('/rooms').pipe(
            map(vendorRooms => {
                this._roomsMap = {
                    0: {
                        id: 0,
                        name: 'Unknown',
                        identifier: 'unknown'
                    }
                };

                return vendorRooms.map(vendorRoom => {
                    const room = {
                        id: vendorRoom.id,
                        name: vendorRoom.name,
                        identifier: this._normalizeIdentifier(vendorRoom.name)
                    };

                    this._roomsMap[room.id] = room;
                    return room;
                });
            })
        );
    }

    /**
     * @typedef {Object} Device
     * @property {number} id - Device id provided by HC
     * @property {number} name - Device name provided by HC
     * @property {Room} room - Device room
     * @property {string[]} identifiers - Generated literal identifiers
     * @property {Object} properties - Device properties
     * @property {Object} actions - Available device actions
     */

    /**
     * Returns devices with properties and actions
     * @returns Observable<Device[]>
     *
     * @example
     * const Fibaro = require('fibaro-home-center2-client');
     *
     * const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
     * client.getDevices().subscribe((devices) => {
     *    console.log(devices);
     * });
     *
     * client.getDevices().subscribe((devices) => {
     *    const light = devices.find(device => device.identifiers.includes('kitchen/lights/main-light'));
     *    light.turnOff().subscribe(() => {
     *        console.log('Kitchen light has turned off');
     *    });
     * });
     */
    getDevices() {
        return this.getRooms().pipe(
            switchMap(() => {
                return this.query('/devices').pipe(
                    map(vendorDevices => {
                        this._devicesMap = {};
                        this._devicesIdentifiersMap = {};

                        return vendorDevices.map(vendorDevice => {
                            if (!this._roomsMap[vendorDevice.roomID]) {
                                this._trace('getDevices: room not found ', vendorDevice.name);
                                return null;
                            }

                            let room = this._roomsMap[vendorDevice.roomID];

                            let properties = {};
                            for (let name of Object.keys(vendorDevice.properties)) {
                                properties[name] = this._jsonTryParse(vendorDevice.properties[name]);
                            }

                            let identifiers = [];
                            if (properties.categories) {
                                for (let category of properties.categories) {
                                    identifiers.push(this._joinIdentifiers([
                                        room.identifier,
                                        category,
                                        vendorDevice.name
                                    ]));
                                }
                            } else {
                                identifiers.push(this._joinIdentifiers([room.identifier, vendorDevice.name]));
                            }

                            let device = {
                                id: vendorDevice.id,
                                name: vendorDevice.name,
                                room: room,
                                identifiers: identifiers,
                                properties: properties,
                                actions: vendorDevice.actions
                            };

                            for (let action of Object.keys(vendorDevice.actions)) {
                                device[action] = (...args) => this.callAction(device.id, action, args);
                            }

                            for (let identifier of identifiers) {
                                this._devicesIdentifiersMap[identifier] = device;
                            }

                            this._devicesMap[device.id] = device;
                            return device;
                        }).filter(device => device)
                    })
                )
            })
        );
    }

    getDeviceByIdentifier(identifier) {
        this._trace('getDeviceByIdentifier', identifier);

        const subject = new ReplaySubject();
        if (this._devicesIdentifiersMap[identifier]) {
            this._trace('getDeviceByIdentifier: device found', this._devicesIdentifiersMap[identifier]);
            subject.next(this._devicesIdentifiersMap[identifier]);
        } else {
            this._trace('getDeviceByIdentifier: device not found');
            this.getDevices().subscribe(() => {
                this._trace('getDeviceByIdentifier: fetching devices');
                if (this._devicesIdentifiersMap[identifier]) {
                    this._trace('getDeviceByIdentifier: device found post-fetched');
                    subject.next(this._devicesIdentifiersMap[identifier]);
                } else {
                    this._trace('getDeviceByIdentifier: device not found post-fetched');
                    subject.error('Device ' + identifier + ' not found');
                }
            });
        }
        return subject.asObservable();
    }

    /**
     * Low level method to call an action on a given device.
     * Applications are supposed to call actions on devices instead of this function.
     *
     * @param {number} deviceId
     * @param {string} action
     * @param {array} options
     * @returns Observable
     *
     * @example
     * const Fibaro = require('fibaro-home-center2-client');
     *
     * // call an action on an ID known device
     * const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
     * client.callAction(21, 'turnOn');
     *
     * // call an action on a device object
     * client.getDevices().subscribe((devices) => {
     *    // control light
     *    const light = devices.find(device => device.identifiers.includes('kitchen/lights/main-light'));
     *    light.turnOn().subscribe(() => {
     *        console.log('Kitchen light has turned on');
     *    });
     *
     *    // control RGBW devices
     *    const led = devices.find(device => device.identifiers.includes('living-room/lights/rgb-led-strip'));
     *    led.setBrightness(50).subscribe(() => {
     *        console.log('Brightness set to 50');
     *    });
     * });
     */
    callAction(deviceId, action, options = []) {
        this._trace('callAction: device', deviceId, action);

        const args = {
            deviceID: deviceId,
            name: action
        };

        for (const [i, option] of options.entries()) {
            args['arg' + (i + 1)] = option;
        }

        return this.query('/callAction?' + querystring.stringify(args)).pipe(share());
    }

    disconnect() {
        this._trace('disconnect');
        this._lastEventId = 0;
        clearTimeout(this._nextStatusQueryTimeoutRef);
    }

    _prepareColdSystem$() {
        return (new Subject()).pipe(
            distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        );
    }

    _prepareColdEvents$() {
        return new BehaviorSubject().pipe(
            switchMap(() => this.query('/refreshStates?last=' + this._lastEventId + '&lang=en', true)),
            tap(response => this._lastEventId = response.last),
            map(response => (response.events && response.events.length) ? response.events : []),

            tap(events => this._trace('_events: events', events.length)),
            map(events => events.filter(event => event.type === 'DevicePropertyUpdatedEvent')),

            tap(events => this._trace('_events: device events', events.length)),
            switchMap(events => {
                if (this._hasNotLoadedDevices(events.map(event => event.data.id))) {
                    return this.getDevices().pipe(map(devices => events));
                } else {
                    return of(events);
                }
            }),
            tap(() => this._nextStatusQueryTimeoutRef = setTimeout(() => this._events$.next(), this._options.pollingInterval)),
            switchMap(events => from(events)),
            map(event => {
                let device;
                if (this._devicesMap[event.data.id]) {
                    device = this._devicesMap[event.data.id];
                } else {
                    device = {
                        id: event.data.id,
                        name: 'unknown-no-access',
                        room: this._roomsMap[0],
                        identifiers: [],
                        properties: [],
                        actions: []
                    };
                    this._unknownDevicesMap[event.data.id] = device;

                    this._trace('_events: no access for the device', event.data.id);
                }

                event.data.identifiers = device.identifiers;
                return event.data;
            }),
            share()
        );
    }

    _hasNotLoadedDevices(deviceIds) {
        for (const deviceId of deviceIds.filter(x => x)) {
            if (!this._devicesMap[deviceId] && !this._unknownDevicesMap[deviceId]) {
                return true;
            }
        }

        return false;
    }

    _normalizeIdentifier(name) {
        return name.toLowerCase()
            .replace(/[^\s\p{L}\p{N}\p{Pc}\p{Pd}\p{M}]+/gu, '')
            .replace(/[\s\p{Pc}]+/gu, '-');
    }

    _joinIdentifiers(identifiers) {
        return identifiers.map(this._normalizeIdentifier).join('/');
    }

    _jsonTryParse(string) {
        try {
            return JSON.parse(string);
        } catch (e) {
            return string;
        }
    }
}

module.exports = {
    Hc2Client: Client,
    CLIENT_OPTIONS,
};
