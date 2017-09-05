const port = 43653;
const dgram = require('dgram');
const server = dgram.createSocket("udp4");
const netmask = require('netmask').Netmask;
var broadcastAddresses;

server.bind(function () {
	server.setBroadcast(true);
	broadcastAddresses = getBroadcastAddresses();
	setInterval(broadcastNew, 3000);
});

function broadcastNew() {
	var message = new Buffer("Broadcast message!");
	for (var i = 0; i < broadcastAddresses.length; i++) {
		server.send(message, 0, message.length, port, broadcastAddresses[i], function () {
			console.log("Sent '" + message + "'");
		});
	};
}

function getBroadcastAddresses() {
	var interfaces = require('os').networkInterfaces();
	var addrs = [];

	Object.keys(interfaces).forEach(function (key) {
		var interface = interfaces[key];
		for (var i = 0; i < interface.length; i++) {
			if (!interface[i].internal && interface[i].family == "IPv4" && interface[i].netmask && interface[i].address) {
				var cidr_bits = 0;
				interface[i].netmask.split('.').forEach(function (octet) {
					cidr_bits += ((octet >>> 0).toString(2).match(/1/g) || []).length;
				});
				var addr = new netmask(interface[i].address + "/" + cidr_bits);
				addrs.push(addr.broadcast);
			}
		}
	});
	return addrs;
}
