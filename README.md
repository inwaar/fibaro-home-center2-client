# Fibaro HomeCenter2 client

[![Build Status](https://travis-ci.org/inwaar/fibaro-home-center2-client.svg?branch=master)](https://travis-ci.org/inwaar/fibaro-home-center2-client)

Javascript client for communicating with Fibaro HomeCenter2 smart home controllers.

## Requirements

- NodeJS (>=10)
- Fibaro Home Center 2

## Installation

`yarn add fibaro-home-center2-client`

or

`npm install --save fibaro-home-center2-client`


## Usage

### Get rooms:

```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getRooms().subscribe((rooms) => {
   console.log(rooms);
});
```

### Get all available devices:

```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
   console.log(devices);
});
```

### Poll devices properties' updates:

```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.events().subscribe((event) => {
   console.log(event);
});

```

### Control devices:

```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
   const light = devices.find(device => device.identifiers.includes('kitchen/lights/main-light'));
   light.turnOff().subscribe(() => {
       console.log('Kitchen light has turned off');
   });
});
```

### Control devices based on events from other devices:

```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
    const fan = devices.find(device => device.identifiers.includes('bedroom/climate/fan'));

    client.events().subscribe((event) => {
        if (event.identifiers.includes('bedroom/climate/temperature') && event.property === 'value') {
            if (event.newValue > 22) {
                fan.turnOn().subscribe();
            } else {
                fan.turnOff().subscribe();
            }
        }
    })
});
```

### Dump all devices' identifiers
```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
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
```

### List all powered devices
```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
    devices
        .filter(device => device.properties.power > 0)
        .map(device => console.log(device.identifiers.join(', ') + ': ' + device.properties.power + 'w'));
});
```

Output example:
```
hall/lights/lamp: 39.4w
garage/lights/lamp: 79.1w
```

### List all devices' actions and their possible arguments
```javascript
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
    for (const device of devices) {
        console.log(device.identifiers.join(', '), device.actions);
    }
});
```
Output example:
```
...
bedroom/blinds/curtains {
    close: 0,
    open: 0,
    reconfigure: 0,
    reset: 0,
    sceneActivationSet: 0,
    setValue: 1,
    setValue2: 1,
    startLevelDecrease: 0,
    startLevelIncrease: 0,
    stop: 0,
    stopLevelChange: 0
}
bathroom/safety/flood-sensor {
    abortUpdate: 1,
    forceArm: 0,
    meetArmConditions: 0,
    reconfigure: 0,
    retryUpdate: 1,
    setArmed: 1,
    setInterval: 1,
    startUpdate: 1,
    updateFirmware: 1
}
bedroom/lights/led-strip {
    abortUpdate: 1,
    reconfigure: 0,
    reset: 0,
    retryUpdate: 1,
    setB: 1,
    setBrightness: 1,
    setColor: 1,
    setFavoriteProgram: 2,
    setG: 1,
    setR: 1,
    setValue: 1,
    setW: 1,
    startLevelDecrease: 0,
    startLevelIncrease: 0,
    startProgram: 1,
    startUpdate: 1,
    stopLevelChange: 0,
    turnOff: 0,
    turnOn: 0,
    updateFirmware: 1
}
...
```

## API Reference
## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#CLIENT_OPTIONS">CLIENT_OPTIONS</a></dt>
<dd><p>Client options</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DevicePropertyUpdateEvent">DevicePropertyUpdateEvent</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#EventCriteria">EventCriteria</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SystemEvent">SystemEvent</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Room">Room</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Device">Device</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Client"></a>

## Client
**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * [.events()](#Client+events) ⇒ [<code>Observable.&lt;DevicePropertyUpdateEvent&gt;</code>](#DevicePropertyUpdateEvent)
    * [.system()](#Client+system) ⇒ [<code>Observable.&lt;SystemEvent&gt;</code>](#SystemEvent)
    * [.query(query, retry)](#Client+query) ⇒ <code>Observable.&lt;Object&gt;</code>
    * [.getRooms()](#Client+getRooms) ⇒
    * [.getDevices()](#Client+getDevices) ⇒
    * [.callAction(deviceId, action, options)](#Client+callAction) ⇒

<a name="new_Client_new"></a>

### new Client(options)
Creates a new client.


| Param | Type |
| --- | --- |
| options | [<code>CLIENT\_OPTIONS</code>](#CLIENT_OPTIONS) \| <code>Object</code> | 

<a name="Client+events"></a>

### client.events() ⇒ [<code>Observable.&lt;DevicePropertyUpdateEvent&gt;</code>](#DevicePropertyUpdateEvent)
Subscribe on device property update events

**Kind**: instance method of [<code>Client</code>](#Client)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| criteria | [<code>EventCriteria</code>](#EventCriteria) | Optional event filtering |

<a name="Client+system"></a>

### client.system() ⇒ [<code>Observable.&lt;SystemEvent&gt;</code>](#SystemEvent)
Subscribe on client system events

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="Client+query"></a>

### client.query(query, retry) ⇒ <code>Observable.&lt;Object&gt;</code>
Make a GET API request to HC2

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type | Default |
| --- | --- | --- |
| query | <code>string</code> |  | 
| retry | <code>boolean</code> | <code>false</code> | 

<a name="Client+getRooms"></a>

### client.getRooms() ⇒
Get rooms

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: Observable<Room[]>  
**Example**  
```js
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getRooms().subscribe((rooms) => {
   console.log(rooms);
});
```
<a name="Client+getDevices"></a>

### client.getDevices() ⇒
Returns devices with properties and actions

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: Observable<Device[]>  
**Example**  
```js
const Fibaro = require('fibaro-home-center2-client');

const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.getDevices().subscribe((devices) => {
   console.log(devices);
});

client.getDevices().subscribe((devices) => {
   const light = devices.find(device => device.identifiers.includes('kitchen/lights/main-light'));
   light.turnOff().subscribe(() => {
       console.log('Kitchen light has turned off');
   });
});
```
<a name="Client+callAction"></a>

### client.callAction(deviceId, action, options) ⇒
Low level method to call an action on a given device.
Applications are supposed to call actions on devices instead of this function.

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: Observable  

| Param | Type |
| --- | --- |
| deviceId | <code>number</code> | 
| action | <code>string</code> | 
| options | <code>array</code> | 

**Example**  
```js
const Fibaro = require('fibaro-home-center2-client');

// call an action on an ID known device
const client = new Fibaro.Hc2Client({host: '192.168.1.69', user: 'foo', password: 'bar'});
client.callAction(21, 'turnOn');

// call an action on a device object
client.getDevices().subscribe((devices) => {
   // control light
   const light = devices.find(device => device.identifiers.includes('kitchen/lights/main-light'));
   light.turnOn().subscribe(() => {
       console.log('Kitchen light has turned on');
   });

   // control RGBW devices
   const led = devices.find(device => device.identifiers.includes('living-room/lights/rgb-led-strip'));
   led.setBrightness(50).subscribe(() => {
       console.log('Brightness set to 50');
   });
});
```
<a name="CLIENT_OPTIONS"></a>

## CLIENT\_OPTIONS
Client options

**Kind**: global constant  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| host | <code>string</code> | <code>&quot;192.168.1.69&quot;</code> | HC2 controller ip-address |
| port | <code>number</code> | <code>80</code> | HC2 controller port |
| user | <code>string</code> | <code>&quot;admin&quot;</code> | username |
| password | <code>string</code> |  | user password |
| connectTimeout | <code>number</code> | <code>7000</code> | Reconnect to controller if no success timeout |
| pollingInterval | <code>number</code> | <code>1000</code> | Controller devices properties polling interval |
| pollingTimeout | <code>number</code> | <code>3000</code> | Controller devices properties polling timeout |
| debug | <code>boolean</code> | <code>false</code> | Trace debug information |

<a name="DevicePropertyUpdateEvent"></a>

## DevicePropertyUpdateEvent : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Room id provided by HC |
| identifier | <code>number</code> | Generated literal identifier |
| property | <code>string</code> | Updated property |
| newValue | <code>string</code> | updated value |
| oldValue | <code>string</code> | previous value |

<a name="EventCriteria"></a>

## EventCriteria : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| device | [<code>Device</code>](#Device) \| <code>null</code> | Subscribe only on a specific device events |
| properties | <code>Array.&lt;string&gt;</code> \| <code>null</code> | Subscribe only on a specific property change events |

<a name="SystemEvent"></a>

## SystemEvent : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Room id provided by HC |
| name | <code>number</code> | Room name provided by HC |
| identifier | <code>number</code> | Generated literal identifier |

<a name="Room"></a>

## Room : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Room id provided by HC |
| name | <code>number</code> | Room name provided by HC |
| identifier | <code>number</code> | Generated literal identifier |

<a name="Device"></a>

## Device : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Device id provided by HC |
| name | <code>number</code> | Device name provided by HC |
| room | [<code>Room</code>](#Room) | Device room |
| identifiers | <code>Array.&lt;string&gt;</code> | Generated literal identifiers |
| properties | <code>Object</code> | Device properties |
| actions | <code>Object</code> | Available device actions |


## License

This project is licensed under the GNU GPLv3 - see the [LICENSE](LICENSE) file for details
