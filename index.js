var bpiscreen = require('./lib/bpiscreen');
var config = require('./lib/globals-config');

bpiscreen.write.led(config.INTERFACELED1, 1);
bpiscreen.write.led(config.INTERFACELED2, 1);
bpiscreen.write.led(config.INTERFACELED3, 1);
bpiscreen.write.led(config.POWERLED, 1);
bpiscreen.write.led(config.INTERNETLED, 1);
bpiscreen.write.led(config.BEACONLED, 1);

bpiscreen.write.lcd("Ola mundo!!");
