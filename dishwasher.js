#!/usr/bin/env node
var request = require("request");
var Milight = require("milight");

var host_url = process.env.URL || 'http://localhost:4730';

var milight_broadcast_ip = "10.0.1.255";

var dishwasher_url = host_url+ '/status/dishwasher';
var light_url = host_url+ '/status/light';

var interval_milight_request = 1 * 1000; // 1 sec
var interval_cache_milight_color = 5 * 1000; // 5 sec

var post_start_time = function() {
  var options = {
    url: dishwasher_url,
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    json: true,
    form: { start_time: Date.now() }
  };

  request(options, function (error, response, body) {
    if (error) {
      console.log(error);
    }
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
};

var milight = new Milight({
    host: milight_broadcast_ip,
    broadcast: true
});

var cache_light = function(callback) {
    var cache_count_threshold = interval_cache_milight_color / interval_milight_request;
    var count = 0;
    var cached_light = null;
    return function() {
	if (cached_light != null && count < cache_count_threshold) {
            // console.log('cached light:'+cached_light);
	    count++;
	    callback(cached_light);
        } else {
            count = 0;
            get_light_color(function(color) {
		cached_light = color;
                // console.log('get new light:'+cached_light);
		callback(color);
	    });
	}
    };
};

var get_light_color = function(callback) {
  request(light_url, function (error, response, body) {
    if (error) {
      console.log(error);
    }
    if (!error && response.statusCode == 200) {
      console.log(body);
      var light = JSON.parse(body);
      callback(light.color);
    }
  });
};

var milight_request = function(color) {
   if (color == 'warning') {
     milight.zone(1).rgb('#FFA500');
   } else {
     milight.zone(1).white(50, function(error) { });
   }
};

setInterval(cache_light(milight_request), interval_milight_request);

var fliclib = require("./fliclibNodeJs");
var FlicClient = fliclib.FlicClient;
var FlicConnectionChannel = fliclib.FlicConnectionChannel;
var FlicScanner = fliclib.FlicScanner;

var client = new FlicClient("localhost", 5551);

function listenToButton(bdAddr) {
	var cc = new FlicConnectionChannel(bdAddr);
	client.addConnectionChannel(cc);
	cc.on("buttonUpOrDown", function(clickType, wasQueued, timeDiff) {
		console.log(bdAddr + " " + clickType + " " + (wasQueued ? "wasQueued" : "notQueued") + " " + timeDiff + " seconds ago");
                if (clickType == "ButtonDown") {
		    post_start_time();
                }
	});
	cc.on("connectionStatusChanged", function(connectionStatus, disconnectReason) {
		console.log(bdAddr + " " + connectionStatus + (connectionStatus == "Disconnected" ? " " + disconnectReason : ""));
	});
}

client.once("ready", function() {
	console.log("Connected to daemon!");
	client.getInfo(function(info) {
		info.bdAddrOfVerifiedButtons.forEach(function(bdAddr) {
			listenToButton(bdAddr);
		});
	});
});

client.on("bluetoothControllerStateChange", function(state) {
	console.log("Bluetooth controller state change: " + state);
});

client.on("newVerifiedButton", function(bdAddr) {
	console.log("A new button was added: " + bdAddr);
	listenToButton(bdAddr);
});

client.on("error", function(error) {
	console.log("Daemon connection error: " + error);
});

client.on("close", function(hadError) {
	console.log("Connection to daemon is now closed");
});
