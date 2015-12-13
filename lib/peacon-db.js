var nano = require('nano')('http://localhost:5984')
var config = require('./globals-config.js')

var peaconFoundDB, peaconSavedDB

var started = false, finished = false

var saveBeaconToDB

exports.saveBeaconFound = function(beacon) {
	if(!started)
		exports.startDB()
	
	getUUID(1, function(err, uuids) {
		if(!err) {
			beacon._id = uuids.uuids[0]
			peaconFoundDB.insert(beacon, function(err, body) {
				if (!err) {
					console.log("Beacon saved")
				}
			})
		}
	})
}

var getUUID = function(count, callback){
	nano.request({db: "_uuids", qs: { count: count }}, callback)
}

// Starts all DBs - check if exists, if not create it
exports.startDB = function() {
	
	nano.db.get(peaconFoundDB, function(err, body) {
		if (!err) {
			// DB found, using it
			console.log('database ' + peaconFoundDB + ' found!')
			peaconFoundDB = nano.db.use(config.BEACONFOUND)
		} else {
			// DB not found, creating it
			nano.db.create(peaconFoundDB, function(err, body) {
				if (!err) {
					if(!finished) {
						finished = true
					} else {
						started = true
					}
					peaconFoundDB = nano.db.use(config.BEACONFOUND)
					console.log('database ' + peaconFoundDB + ' created!')
				}
			})
		}
	})
	
	nano.db.get(peaconSavedDB, function(err, body) {
		if (!err) {
			// DB found, using it
			console.log('database ' + peaconSavedDB + ' found!')
			peaconSavedDB = nano.db.use(config.BEACONSAVED)
		} else {
			// DB not found, creating it
			nano.db.create(peaconSavedDB, function(err, body) {
				if (!err) {
					if(!finished) {
						finished = true
					} else {
						started = true
					}
					peaconSavedDB = nano.db.use(config.BEACONSAVED)
					console.log('database ' + peaconSavedDB + ' created!')
				}
			})
		}
	})
	
}