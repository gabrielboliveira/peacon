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
	
	nano.db.get(config.BEACONFOUND, function(err, body) {
		if (!err) {
			// DB found, using it
			console.log('database ' + config.BEACONFOUND + ' found!')
			if(!finished) {
				finished = true
			} else {
				started = true
			}
			peaconFoundDB = nano.db.use(config.BEACONFOUND)
		} else {
			// DB not found, creating it
			nano.db.create(config.BEACONFOUND, function(err, body) {
				if (!err) {
					if(!finished) {
						finished = true
					} else {
						started = true
					}
					peaconFoundDB = nano.db.use(config.BEACONFOUND)
					console.log('database ' + config.BEACONFOUND + ' created!')
				}
			})
		}
	})
	
	nano.db.get(config.BEACONSAVED, function(err, body) {
		if (!err) {
			// DB found, using it
			console.log('database ' + config.BEACONSAVED + ' found!')
			if(!finished) {
				finished = true
			} else {
				started = true
			}
			peaconSavedDB = nano.db.use(config.BEACONSAVED)
		} else {
			// DB not found, creating it
			nano.db.create(config.BEACONSAVED, function(err, body) {
				if (!err) {
					if(!finished) {
						finished = true
					} else {
						started = true
					}
					peaconSavedDB = nano.db.use(config.BEACONSAVED)
					console.log('database ' + config.BEACONSAVED + ' created!')
				}
			})
		}
	})
	
}