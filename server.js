'use strict'

const http = require('http')
const fs = require('fs')

const app = http.createServer((request, response) =>{
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
    })
}).listen(9527)

const io = require('socket.io')(app)

let USERS = []
let SNAKES = []

io.on('connection', function (socket) {
    socket.emit('ALIVE', {
        x: 200,
        y: 20 + USERS.length * 30
    })

    socket.on('NEW-GUY', function (data) {
        USERS.push(data)
        socket.emit('WELCOME', {
            users: USERS,
            snakes: SNAKES
        })
    })
})