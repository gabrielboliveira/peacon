var bpiscreen = require('./lib/bpiscreen');
var config = require('./lib/globals-config');
var internalIp = require('internal-ip');
var publicIp = require('public-ip');
var os = require('os');
var numeral = require('numeral');
var exec = require('child_process').exec;

var events = require("events"),
	displayEvents = new events.EventEmitter();

var actualScreenX = 1, actualScreenY = 1;
var screenIntervalId;

// ----------------------------------------------------------------
// GET SCREEN TEXT
// ----------------------------------------------------------------
// this array will return the text from each of screen position

// first screen, show simple message
displayEvents.on("screenUpdated1", function() {
	displayEvents.emit('updated', "Aguardando\n beacons...");
});

// this screen will show the last seen beacons
displayEvents.on("screenUpdated2", function() {
	// TODO list last beacons
	displayEvents.emit('updated', "Ultimos beacons");
	
});

// this screen will display the RPi statistics, such as load average,
// CPU temp, public and internal IP address
displayEvents.on("screenUpdated3", function() {
	if(actualScreenY < 1){
		actualScreenY = 4;
	} 
	else if(actualScreenY > 4) {
		actualScreenY = 1;
	}
	
	switch(actualScreenY)
	{
		case 1:
			screenIntervalId = setInterval(function() {
				displayEvents.emit('updated', "Load average\n" +
					numeral(os.loadavg()[0]).format('0.00') + " " +
					numeral(os.loadavg()[1]).format('0.00') + " " +
					numeral(os.loadavg()[2]).format('0.00'));
			}, 1000);
			break;
		case 2:
			screenIntervalId = setInterval(function() {
				exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
					if (error !== null) {
						console.log('exec error: ' + error);
					} else {
						// gets cpu temp and sends to callback function
						var temp = parseFloat(stdout)/1000;
						displayEvents.emit('updated', "CPU Temp\n" + temp);
					}
				});
			}, 1000);
		case 3:
			displayEvents.emit('updated', "IP Privado\n" + internalIp());
			break;
		case 4:
			publicIp(function (err, ip) {
				displayEvents.emit('updated', "IP Publico\n" + ip);
			});
			break;
	}
});

displayEvents.on("updated", function(message) {
	bpiscreen.write.lcd(message);
});
// ----------------------------------------------------------------
// END GET SCREEN TEXT
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------
displayEvents.on("changed", function(message) {
	clearInterval(screenIntervalId);
	
	if(actualScreenX < 1)
	{
		actualScreenX = config.TOTALSCREENS;
	} 
	else if(actualScreenX > config.TOTALSCREENS)
	{
		actualScreenX = 1;
	}
	bpiscreen.write.led(config.INTERFACELED1, Number(actualScreenX == 1));
	bpiscreen.write.led(config.INTERFACELED2, Number(actualScreenX == 2));
	bpiscreen.write.led(config.INTERFACELED3, Number(actualScreenX == 3));
	displayEvents.emit('screenUpdated' + actualScreenX);
});
// ----------------------------------------------------------------
// END CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// BUTTON CLICK CALLBACK
// ----------------------------------------------------------------
var leftBtnClick = function(){
	actualScreenY = 1;
	actualScreenX--;
	displayEvents.emit('changed');
}
var middleBtnClick = function(){
	actualScreenY++;
	displayEvents.emit('changed');
}
var rightBtnClick = function(){
	actualScreenY = 1;
	actualScreenX++;
	displayEvents.emit('changed');
}
// ----------------------------------------------------------------
// END BUTTON CLICK CALLBACK
// ----------------------------------------------------------------



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
	
	displayEvents.emit('changed');
}

start();
// ----------------------------------------------------------------
// END STARTING SCRIPTS
// ----------------------------------------------------------------
