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

var updateScreen = [
	[
		// first screen, show simple message
		function() {
			updateDisplayMsg("Aguardando\n beacons...");
		}
	],
	[
		// this screen will show the last seen beacons
		function() {
			// TODO list last beacons
			updateDisplayMsg("Ultimos beacons");
			
		}
	],
	[
		// this screen will display the RPi statistics, such as load average,
		// CPU temp, public and internal IP address
		function() {
			updateLoadAverage();
			screenIntervalId = setInterval(updateLoadAverage, 1000);
		},
		function() {
			updateSysTemp();
			screenIntervalId = setInterval(updateSysTemp, 1000);
		},
		function() {
			//displayEvents.emit('updated', "IP Privado\n" + internalIp());
			updateDisplayMsg("IP Privado\n" + internalIp());
		},
		function() {
			updateDisplayMsg("IP Publico\nCarregando...");
			publicIp(function (err, ip) {
				//displayEvents.emit('updated', "IP Publico\n" + ip);
				updateDisplayMsg("IP Publico\n" + ip);
			});
		}
	]
];

var updateLoadAverage = function() {
	updateDisplayMsg("Load average\n" +
		numeral(os.loadavg()[0]).format('0.00') + " " +
		numeral(os.loadavg()[1]).format('0.00') + " " +
		numeral(os.loadavg()[2]).format('0.00'));
}

var updateSysTemp = function() {
	exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		} else {
			// gets cpu temp and sends to callback function
			var temp = parseFloat(stdout)/1000;
			updateDisplayMsg("CPU Temp\n" + temp);
		}
	});
}

var updateDisplayMsg = function(message) {
//displayEvents.on("updated", function(message) {
	bpiscreen.write.lcd(message);
};
// ----------------------------------------------------------------
// END GET SCREEN TEXT
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------
var changeScreen = function(opts) {
	opts = opts || {};
	clearInterval(screenIntervalId);
	
	var x = opts.screenX || false;
	var y = opts.screenY || false;
	var next = opts.next || false;
	
	if(x) {
		if(next)
			actualScreenX++;
		else
			actualScreenX--;
	} else if(y) {
		if(next)
			actualScreenY++;
		else
			actualScreenY--;
	}
	
	if(actualScreenX < 0)
	{
		actualScreenX = updateScreen.length;
	} 
	else if(actualScreenX >= updateScreen.length)
	{
		actualScreenX = 0;
	}
	if(actualScreenY < 0)
	{
		actualScreenY = updateScreen[actualScreenX].length;
	} 
	else if(actualScreenY >= updateScreen[actualScreenX].length)
	{
		actualScreenY = 0;
	}
	
	bpiscreen.write.led(config.INTERFACELED1, Number(actualScreenX == 0));
	bpiscreen.write.led(config.INTERFACELED2, Number(actualScreenX == 1));
	bpiscreen.write.led(config.INTERFACELED3, Number(actualScreenX == 2));
		
	updateScreen[actualScreenX][actualScreenY]();
	//displayEvents.emit('screenUpdated' + actualScreenX);
};
// ----------------------------------------------------------------
// END CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// BUTTON CLICK CALLBACK
// ----------------------------------------------------------------
var leftBtnClick = function(){
	//displayEvents.emit('changed');
	changeScreen({ screenX:true, next:false });
}
var middleBtnClick = function(){
	//displayEvents.emit('changed');
	changeScreen({ screenY:true, next:true });
}
var rightBtnClick = function(){
	//displayEvents.emit('changed');
	changeScreen({ screenX:true, next:true });
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
	
	changeScreen();
	//displayEvents.emit('changed');
}

start();
// ----------------------------------------------------------------
// END STARTING SCRIPTS
// ----------------------------------------------------------------
