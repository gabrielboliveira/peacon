var bpiscreen = require('./lib/bpiscreen');
var config = require('./lib/globals-config');

bpiscreen.start();

bpiscreen.write.led(config.INTERFACELED1, 1);
bpiscreen.write.led(config.INTERFACELED2, 1);
bpiscreen.write.led(config.INTERFACELED3, 1);
bpiscreen.write.led(config.POWERLED, 1);
bpiscreen.write.led(config.INTERNETLED, 1);
bpiscreen.write.led(config.BEACONLED, 1);

//bpiscreen.write.lcd("Ola mundo!!");

bpiscreen.write.lcdAt("Oi", 4,0);

var btnTeste = function(){
	console.log("pressionado");
	bpiscreen.write.lcd("Botao pressionado");
}

bpiscreen.watch.button(config.LEFTBTN, btnTeste);
bpiscreen.watch.button(config.MIDDLEBTN, btnTeste);
bpiscreen.watch.button(config.RIGHTBTN, btnTeste);
