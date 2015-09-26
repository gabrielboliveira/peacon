var events = require("events"),
	lcdEvents = new events.EventEmitter();

var config = require('./globals-config.js');

var GPIO = require('onoff').Gpio,
    intled1 = new GPIO(config.INTERFACELED1, 'out'),
    intled2 = new GPIO(config.INTERFACELED2, 'out'),
    intled3 = new GPIO(config.INTERFACELED3, 'out'),
    powerled = new GPIO(config.POWERLED, 'out'),
    netled = new GPIO(config.INTERNETLED, 'out'),
    beaconled = new GPIO(config.BEACONLED, 'out'),
    leftbtn = new GPIO(config.LEFTBTN, 'in', 'both'),
    middlebtn = new GPIO(config.MIDDLEBTN, 'in', 'both'),
    rightbtn = new GPIO(config.RIGHTBTN, 'in', 'both');

var Lcd = require('lcd'),
	lcdDisplay = new Lcd({
		rs: config.LCDRS,
		e: config.LCDE,
		data: [config.LCDDATA1, config.LCDDATA2, config.LCDDATA3, config.LCDDATA4],
		cols: config.LCDCOLS,
		rows: config.LCDROWS
	});

var write = {};

write.led = function(led, stat) {
	switch(led) {
		case config.INTERFACELED1:
			intled1.writeSync(stat);
			break;
		case config.INTERFACELED2:
			intled2.writeSync(stat);
			break;
		case config.INTERFACELED3:
			intled3.writeSync(stat);
			break;
		case config.POWERLED:
			powerled.writeSync(stat);
			break;
		case config.INTERNETLED:
			netled.writeSync(stat);
			break;
		case config.BEACONLED:
			beaconled.writeSync(stat);
			break;
	}
};

var watch = {};

var leftBtnEvent = new events.EventEmitter(),
	midBtnEvent = new events.EventEmitter(),
	rightBtnEvent = new events.EventEmitter();

watch.button = function(btn, callback){
	switch(btn) {
		case config.LEFTBTN:
			leftBtnEvent.on('clicked', callback);
			break;
		case config.MIDDLEBTN:
			midBtnEvent.on('clicked', callback);
			break;
		case config.RIGHTBTN:
			rightBtnEvent.on('clicked', callback);
			break;
	}
};
var debouncing = false, debounceIntervalId;

var performDebounce = function() {
	debouncing = true;
	debounceIntervalId = setInterval(function() {
		debouncing = false;
	}, 100);
};

var leftBtnClick = function(err, state) {
	if(state && !err && !debouncing) {
		performDebounce();
		leftBtnEvent.emit('click');
	}
};
var middleBtnClick = function(err, state) {
	if(state && !err && !debouncing) {
		performDebounce();
		midBtnEvent.emit('click');
	}
};
var rightBtnClick = function(err, state) {
	if(state && !err && !debouncing) {
		performDebounce();
		rightBtnEvent.emit('click');
	}
};

var lcdStarted = false;

var start = function(){
	lcdDisplay.on('ready', function() {
		lcdStarted = true;
		console.log("LCD Ready");
		lcdEvents.emit('ready');
	});
	leftbtn.watch(leftBtnClick);
	middlebtn.watch(middleBtnClick);
	rightbtn.watch(rightBtnClick);
};

var clearLCD = function(callback){
	console.log("clearLCD");
	if(!lcdStarted) lcdEvents.once('ready', function(){
		clr(callback);
	});
	else clr(callback);
};

var clr = function(callback){
	lcdDisplay.clear();
	lcdDisplay.once('clear', callback);
};

// write a message to the LCD display
// handles '\n' for multiple lines(two lines implemented only)
// TODO: implement more than two lines
write.lcd = function(message) {
	var msg = message.split("\n"); 			// split message by two at the line break
	console.log("write.lcd");
	clearLCD(function(){
		console.log("write.lcd clearLCD");
		console.log(msg[0]);
		lcdDisplay.setCursor(0, 0); 		// set at the beginning of LCD display
		lcdDisplay.print(msg[0]); 		// print the first message
		if(msg.length > 1) {			// check if it has two lines
			lcdDisplay.once("printed", function() {
				lcdDisplay.setCursor(0, 1);	// set at the beginning of second line
				lcdDisplay.print(msg[1]);	// print the second line	
			});
		}
	});
};

// write at a certain position c (column) and l (line)
// doesn't need the '\n' handling
write.lcdAt = function(message, c, l) {
	clearLCD(function(){
		lcdDisplay.setCursor(c, l); 		// set cursor at position
		lcdDisplay.print(message); 		// print the first message
	});
};

exports.write = write;
exports.watch = watch;
exports.start = start;