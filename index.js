var bpiscreen = require('./lib/bpiscreen');
var config = require('./lib/globals-config');

var actualScreen = 1;

// ----------------------------------------------------------------
// CHANGE DISPLAY SCREEN)
// ----------------------------------------------------------------
var changeScreen = function(screen) {
	if(screen < 1) screen = 3;
	if(screen > 3) screen = 1;
	bpiscreen.write.lcd("Tela " + screen);
	bpiscreen.write.led(config.INTERFACELED1, Number(screen == 1));
	bpiscreen.write.led(config.INTERFACELED2, Number(screen == 2));
	bpiscreen.write.led(config.INTERFACELED3, Number(screen == 3));
	actualScreen = screen;
}
// ----------------------------------------------------------------
//
// ----------------------------------------------------------------

// ----------------------------------------------------------------
// BUTTONS CLICK
// ----------------------------------------------------------------
var leftBtnClick = function(){
	console.log("pressionado left btn");
	changeScreen(actualScreen-1);
}
var middleBtnClick = function(){
	console.log("pressionado");
	bpiscreen.write.lcd("Botao\npressionado Middle");
}
var rightBtnClick = function(){
	console.log("pressionado");
	changeScreen(actualScreen+1);
}
// ----------------------------------------------------------------
// STARTING SCRIPTS
// ----------------------------------------------------------------
var start = function() {
	bpiscreen.start();

	bpiscreen.write.led(config.POWERLED, 1);
	bpiscreen.write.led(config.INTERNETLED, 0);
	bpiscreen.write.led(config.BEACONLED, 0);

	bpiscreen.write.led(config.INTERFACELED1, 0);
	bpiscreen.write.led(config.INTERFACELED2, 0);
	bpiscreen.write.led(config.INTERFACELED3, 0);

	bpiscreen.watch.button(config.LEFTBTN, leftBtnClick);
	bpiscreen.watch.button(config.MIDDLEBTN, middleBtnClick);
	bpiscreen.watch.button(config.RIGHTBTN, rightBtnClick);
	changeScreen(actualScreen);
}

start();

