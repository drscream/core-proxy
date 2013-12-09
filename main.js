#!/usr/bin/env node

"use strict"

var net = require('net')
var fs  = require('fs')
var argv = require('optimist')
	.options({
		'source': {
			alias: 's',
			demand: true,
			default: '::1:3306',
		},
		'destination': {
			alias: 'd',
			demand: true,
		}
	})
	.argv

// Make sure args are an array
argv.source      = (typeof(argv.source)      == 'string') ? [argv.source]      : argv.source
argv.destination = (typeof(argv.destination) == 'string') ? [argv.destination] : argv.destination

// Socket error handler
function errorHandler(err) {
	var addr = this.address()
	var self = this

	if(typeof(addr) == 'string') {
		// Reuse unix socket if possible
		if(err.code == 'EADDRINUSE') {
			var testSocket = net.connect(addr, function(){
				console.log('unixsocket: Socket is in use ', err)
				process.exit()
			})
			testSocket.on('error', function(err) {
				if (err.code == 'ECONNREFUSED') {
					fs.unlink(addr)
					self.listen(addr)
				} else {
					console.log('unixsocket: Socket error ', err)
					process.exit()
				}
			})
		}
	} else {
		// Exit if tcp socket already in use
		console.log('tcpsocket: ', err)
		process.exit()
	}
}

// Socket request handler
function requestHandler(c) {
	// Random connection to destination
	var d = argv.destination[Math.floor(Math.random()*argv.destination.length)]
	var host = d.split(':')
	var port = host.pop()

	var client = net.connect({host: host, port: port}, function() {
		client.pipe(c)
		c.pipe(client)
	})

	// Close the connection on error
	client.on('error', function(err){
		console.log(err, host, port)
		c.end()
	})
	c.on('error', function(err){
		console.log(err)
		client.end()
	})
}

// Listen on all source sockets (tcp and unix)
var servers = []
for(var i=0; i<argv.source.length; ++i) {
	var s = argv.source[i]
	var srv = net.createServer(requestHandler)
	srv.on('error', errorHandler)
	if(s.indexOf(":") < 0) {
		// unix socket
		srv.listen(s)
	} else {
		// tcp socket
		var host = s.split(':')
		var port = host.pop()
		srv.listen(port, host.join(':'))
	}
	servers.push(srv)
}

// Remove unix sockets from disk at SIGINT
process.on('SIGINT', function() {
	console.log("Goodbye")
	for(var i=0; i<servers.length; ++i) {
		var s = servers[i]
		if(typeof(s.address()) == 'string') {
			fs.unlinkSync(s.address())
		}
	}
	process.exit()
})
