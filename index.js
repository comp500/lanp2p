const port = 43653;
const dgram = require('dgram');
const server = dgram.createSocket("udp4");
const client = dgram.createSocket("udp4");
const netmask = require('netmask').Netmask;
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const express = require('express');
const username = require('username');
var broadcastAddresses;
var receivedTimes = [];

// HTTP SERVER

var app = express();
var httpserver = require('http').Server(app);
var io = require('socket.io')(httpserver);
io.on('connection', function (socket) {
	socket.on('sendmsg', function (data) {
		broadcastNew(data.msg);
	});
});
app.use(express.static(__dirname));
httpserver.listen(8080, "127.0.0.1");

// CLIENT

client.on('listening', function () {
	var address = client.address();
	console.log('UDP Client listening on ' + address.address + ":" + address.port);
	client.setBroadcast(true);
});

client.on('message', function (message, rinfo) {
	var parsedMessage = JSON.parse(message);
	if (receivedTimes.indexOf(parsedMessage.t) == -1) {
		receivedTimes.push(parsedMessage.t);
		console.log('Message from: ' + rinfo.address + ':' + rinfo.port + ' - ' + parsedMessage.m);
		io.emit('recvmsg', {
			msg: parsedMessage.m,
			usr: parsedMessage.u
		});
	}
});

client.bind(port);

// SERVER

server.bind(function () {
	server.setBroadcast(true);
	broadcastAddresses = getBroadcastAddresses();
	console.log('UDP Server broadcasting on ' + broadcastAddresses);
});

function broadcastNew(msg) {
	var objmessage = {
		t: Date.now(),
		m: msg,
		u: username.sync()
	};
	
	var message = new Buffer(JSON.stringify(objmessage));
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
		var netInterface = interfaces[key];
		for (var i = 0; i < netInterface.length; i++) {
			if (!netInterface[i].internal && netInterface[i].family == "IPv4" && netInterface[i].netmask && netInterface[i].address) {
				var cidr_bits = 0;
				netInterface[i].netmask.split('.').forEach(function (octet) {
					cidr_bits += ((octet >>> 0).toString(2).match(/1/g) || []).length;
				});
				var addr = new netmask(netInterface[i].address + "/" + cidr_bits);
				addrs.push(addr.broadcast);
			}
		}
	});
	return addrs;
}
