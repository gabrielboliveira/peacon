var bpiscreen = require('./lib/bpiscreen');
var config = require('./lib/globals-config');
var internalIp = require('internal-ip');
var publicIp = require('public-ip');
var os = require('os');
var numeral = require('numeral');
var exec = require('child_process').exec;

var events = require("events"),
	displayEvents = new events.EventEmitter();

var actualScreenX = 0, actualScreenY = 0;
var screenIntervalId;

// ----------------------------------------------------------------
// GET SCREEN TEXT
// ----------------------------------------------------------------
// this array will return the text from each of screen position
var getScreenText = [
	// returns
	[
		function() { }
	],
	[
		function() { }
	],
	// this screen will display the RPi statistics, such as load average,
	// CPU temp, public and internal IP address
	[
		// returns the load average
		function() {
			screenIntervalId = setInterval(function() {
				displayEvents.emit('updated', "Load average\n" +
					numeral(os.loadavg()[0]).format('0.00') + " " +
					numeral(os.loadavg()[1]).format('0.00') + " " +
					numeral(os.loadavg()[2]).format('0.00'));
			}, 1000);
		},
		function() {
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
		},
		function() {
			displayEvents.emit('updated', "IP Privado\n" + internalIp());
		},
		function() {
			publicIp(function (err, ip) {
				displayEvents.emit('updated', "IP Publico\n" + ip);
			});
		}
	]
];

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
	if(actualScreenX < 0)
	{
		actualScreenX = getScreenText.length - 1;
	} 
	else if(actualScreenX > getScreenText.length - 1)
	{
		actualScreenX = 0;
	}
	if(actualScreenY < 0)
	{
		actualScreenY = getScreenText[actualScreenX].length - 1;
	}
	else if(actualScreenY > getScreenText[actualScreenX].length - 1)
	{
		actualScreenY = 0;
	}
	getScreenText[screenX][screenY]();
});
// ----------------------------------------------------------------
// END CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// BUTTON CLICK CALLBACK
// ----------------------------------------------------------------
var leftBtnClick = function(){
	actualScreenX--;
	displayEvents.emit('changed');
}
var middleBtnClick = function(){
	actualScreenY++;
	displayEvents.emit('changed');
}
var rightBtnClick = function(){
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
