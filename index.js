var bpiscreen = require('./lib/bpiscreen')
var config = require('./lib/globals-config')
var internalIp = require('internal-ip')
var publicIp = require('public-ip')
var os = require('os')
var numeral = require('numeral')
var exec = require('child_process').exec
var isOnline = require('is-online')
var Bleacon = require('bleacon')
var PeaconDB = require('./lib/peacon-db')

var events = require("events"),
	displayEvents = new events.EventEmitter()

var actualScreenX = 0, actualScreenY = 0
var screenIntervalId

var beaconHistory = []
var beaconHistoryCount = 0

// ----------------------------------------------------------------
// GET SCREEN TEXT
// ----------------------------------------------------------------
// this array will return the text from each of screen position
var updateScreen = [
	[
		// first screen, show simple message
		function() {
			updateBeaconsFound()
		}
	],
	[
		// this screen will show the last seen beacons
		function() {
			// TODO list last beacons
			if(beaconHistoryCount == 0)
				updateDisplayMsg("Nenhum beacon\nno historico")
			else if(beaconHistoryCount == 1)
				updateDisplayMsg("1 beacon\nno historico")
			else
				updateDisplayMsg(beaconHistoryCount + " beacons\nno historico")
		}
	],
	[
		// this screen will display the RPi statistics, such as load average,
		// CPU temp, public and internal IP address
		function() {
			// TODO Improve to rewrite only the second line
			updateLoadAverage()
			screenIntervalId = setInterval(updateLoadAverage, 1000)
		},
		function() {
			// TODO Improve to rewrite only the second line
			updateSysTemp()
			screenIntervalId = setInterval(updateSysTemp, 1000)
		},
		function() {
			//displayEvents.emit('updated', "IP Privado\n" + internalIp())
			updateDisplayMsg("IP Privado\n" + internalIp())
		},
		function() {
			updateDisplayMsg("IP Publico\nCarregando...")
			publicIp(function (err, ip) {
				if(!ip)
					updateDisplayMsg("IP Publico\nnao encontrado")
				else
					updateDisplayMsg("IP Publico\n" + ip)
			})
		}
	]
]

var updateLoadAverage = function() {
	updateDisplayMsg("Load average\n" +
		numeral(os.loadavg()[0]).format('0.00') + " " +
		numeral(os.loadavg()[1]).format('0.00') + " " +
		numeral(os.loadavg()[2]).format('0.00'))
}

var updateSysTemp = function() {
	exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error)
		} else {
			// gets cpu temp and sends to callback function
			var temp = parseFloat(stdout) / 1000
			updateDisplayMsg("CPU Temp\n" + temp)
		}
	})
}

var updateBeaconsFound = function() {
	if( (actualScreenX ==  0) && (actualScreenY == 0) ) {
		if(beaconsOnRange.length == 0)
			updateDisplayMsg("Aguardando\nbeacons")
		else if(beaconsOnRange.length == 1)
			updateDisplayMsg("1 beacon\nencontrado")
		else
			updateDisplayMsg(beaconsOnRange.length + " beacons\nencontrados")
	} else if(beaconsOnRange.length == 0) {
		actualScreenX = 0
		actualScreenY = 0
		updateDisplayMsg("Aguardando\nbeacons")
	}
}

displayEvents.on("beacon-range-change", updateBeaconsFound)

var updateDisplayMsg = function(message) {
	bpiscreen.write.lcd(message)
}
// ----------------------------------------------------------------
// END GET SCREEN TEXT
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------
var changeScreen = function(opts) {
	opts = opts || {}
	clearInterval(screenIntervalId)
	
	var x = opts.screenX || false
	var y = opts.screenY || false
	var next = opts.next || false
	
	if(x) {
		if(next)
			actualScreenX++
		else
			actualScreenX--
	} else if(y) {
		if(next)
			actualScreenY++
		else
			actualScreenX--
	}
	
	if(actualScreenX < 0)
	{
		actualScreenX = updateScreen.length - 1
	} 
	else if(actualScreenX >= updateScreen.length)
	{
		actualScreenX = 0
	}
	if(actualScreenY < 0)
	{
		actualScreenY = updateScreen[actualScreenX].length - 1
	} 
	else if(actualScreenY >= updateScreen[actualScreenX].length)
	{
		actualScreenY = 0
	}
	
	bpiscreen.write.led(config.INTERFACELED1, Number(actualScreenX == 0))
	bpiscreen.write.led(config.INTERFACELED2, Number(actualScreenX == 1))
	bpiscreen.write.led(config.INTERFACELED3, Number(actualScreenX == 2))
		
	updateScreen[actualScreenX][actualScreenY]()
	//displayEvents.emit('screenUpdated' + actualScreenX)
}
// ----------------------------------------------------------------
// END CHANGE DISPLAY SCREEN
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// BUTTON CLICK CALLBACK
// ----------------------------------------------------------------
var leftBtnClick = function(){
	//displayEvents.emit('changed')
	changeScreen({ screenX:true, next:false })
}
var middleBtnClick = function(){
	//displayEvents.emit('changed')
	changeScreen({ screenY:true, next:true })
}
var rightBtnClick = function(){
	//displayEvents.emit('changed')
	changeScreen({ screenX:true, next:true })
}
// ----------------------------------------------------------------
// END BUTTON CLICK CALLBACK
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// CHECK INTERNET CONNECTIVITY (YELLOW LED)
// ----------------------------------------------------------------
var checkInternet = function(){
	isOnline(function(err, online) {
		bpiscreen.write.led(config.INTERNETLED, Number(online == true))
	})
}
// ----------------------------------------------------------------
// END CHECK INTERNET CONNECTIVITY (YELLOW LED)
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// BEACON IDENTIFICATION
// ----------------------------------------------------------------

// save all beacons on range for a limited time
var beaconsOnRange = [ ]

// time between beacon range in and out - in ms
var beaconTime = 3000

// find a beacon at the original array
var findBeaconLocally = function(uuid, major, minor) {
	var i = 0, len = beaconsOnRange.length
	for (; i < len; ++i) {
		if ( beaconsOnRange[i].uuid == uuid &&
			beaconsOnRange[i].major == major &&
			beaconsOnRange[i].minor == minor )
			return beaconsOnRange[i]
	}
	return null
}

// creates a new beacon item to insert on the range array
var newBeacon = function(){
	var newB = {
		"uuid": "",
		"major": "",
		"minor": "",
		"name": "",
		"initialDate": Date.now(),
		"finalDate": "",
		"funcTimeout": "",
		"screenIndex": ""
	}
	return newB
}

// timeout callback to remove a beacon from the range array
var beaconTimeoutCallback = function(beacon) {
	
	beacon.finalDate = Date.now()
	
	var totalTime = ( (beacon.finalDate - beacon.initialDate - beaconTime) / 1000 )
	
	var index = beaconsOnRange.indexOf(beacon)
	
	if (index > -1) {
		beaconsOnRange.splice(index, 1)
	}
	
	if (beacon.screenIndex > -1) {
		updateScreen[0].splice(beacon.screenIndex, 1)
	}
	
	displayEvents.emit("beacon-range-change")

	console.log(totalTime)
	
	// ignore the beacon if the range time is less than 1 second
	if(totalTime > 1) {
		
		var beaconToSaveDB = {
			"uuid": beacon.uuid,
			"major": beacon.major,
			"minor": beacon.minor,
			"initialDate": beacon.initialDate,
			"total": totalTime
		}
		
		PeaconDB.saveBeaconFound(beaconToSaveDB)
		
		beaconHistoryCount++
		
		var currentBeacon = beaconHistoryCount
		
		updateScreen[1].push(function(){
			if(!beacon.name)
				updateDisplayMsg(currentBeacon + " de " + beaconHistoryCount + "\nDesconhecido")
			else
				updateDisplayMsg(currentBeacon + " de " + beaconHistoryCount + "\n" + beacon.name)
		})
	}

	bpiscreen.write.led(config.BEACONLED, Number(beaconsOnRange.length > 0))
}

// callback when a beacon is discovered
Bleacon.on('discover', function(bleacon) {
	
	var findB = findBeaconLocally(bleacon.uuid, bleacon.major, bleacon.minor)
	
	if (!findB) {
		findB = newBeacon()
		findB.uuid = bleacon.uuid
		findB.major = bleacon.major
		findB.minor = bleacon.minor
		PeaconDB.searchSavedBeacon(bleacon, function(err, beaconFound){
			if(!beaconFound)
				findB.name = null
			else
				findB.name = beaconFound.name
		})
		findB.screenIndex = updateScreen[0].length
		beaconsOnRange.push(findB)
		updateScreen[0].push(function(){
			if(!findB.name)
				updateDisplayMsg("Desconhecido")
			else
				updateDisplayMsg(findB.name)
		})
		displayEvents.emit("beacon-range-change")
	}
	
	// stops the older timeout
	clearTimeout(findB.funcTimeout)
	
	findB.funcTimeout = setTimeout(function() {
		beaconTimeoutCallback(findB)
	}, beaconTime)
		
	bpiscreen.write.led(config.BEACONLED, Number(beaconsOnRange.length > 0))
})
// ----------------------------------------------------------------
// END BEACON IDENTIFICATION
// ----------------------------------------------------------------

// ----------------------------------------------------------------
// STARTING SCRIPTS
// ----------------------------------------------------------------
var start = function() {
	bpiscreen.start()

	bpiscreen.write.led(config.POWERLED, 1)
	bpiscreen.write.led(config.INTERNETLED, 0)
	bpiscreen.write.led(config.BEACONLED, 0)

	bpiscreen.write.led(config.INTERFACELED1, 0)
	bpiscreen.write.led(config.INTERFACELED2, 0)
	bpiscreen.write.led(config.INTERFACELED3, 0)

	bpiscreen.watch.button(config.LEFTBTN, leftBtnClick)
	bpiscreen.watch.button(config.MIDDLEBTN, middleBtnClick)
	bpiscreen.watch.button(config.RIGHTBTN, rightBtnClick)
	
	changeScreen()
	//displayEvents.emit('changed')
	
	// check internet connectivity every minute
	checkInternet()
	setInterval(checkInternet, 60000)
	
	Bleacon.startScanning() // scan for any bleacons
	
	PeaconDB.startDB() // start all databases
}

start()
// ----------------------------------------------------------------
// END STARTING SCRIPTS
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// CLOSING SCRIPTS
// ----------------------------------------------------------------
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
	bpiscreen.write.led(config.POWERLED, 0)
	bpiscreen.write.led(config.INTERNETLED, 0)
	bpiscreen.write.led(config.BEACONLED, 0)

	bpiscreen.write.led(config.INTERFACELED1, 0)
	bpiscreen.write.led(config.INTERFACELED2, 0)
	bpiscreen.write.led(config.INTERFACELED3, 0)	

	updateDisplayMsg("Programa\nParado")
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
// ----------------------------------------------------------------
// END CLOSING SCRIPTS
// ----------------------------------------------------------------
