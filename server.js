const port = 43653;
const broadcastAddr = "192.168.1.255";
const dgram = require('dgram');
const server = dgram.createSocket("udp4");

server.bind(function () {
	server.setBroadcast(true);
	setInterval(broadcastNew, 3000);
});

function broadcastNew() {
	var message = new Buffer("Broadcast message!");
	server.send(message, 0, message.length, port, broadcastAddr, function () {
		console.log("Sent '" + message + "'");
	});
}
