'use strict'

const http = require('http')
const fs = require('fs')

const app = http.createServer((request, response) => {
    fs.readFile(__dirname + request.url,
        function (err, data) {
            if (err) {
                response.writeHead(500);
                return response.end('Error loading index.html');
            }

            response.writeHead(200);
            response.end(data);
    })
}).listen(9527)

const io = require('socket.io')(app)

const MAXUSERNUM = 6
let USERS = []
let SNAKES = {}

io.on('connection', function (socket) {
    if(USERS.length >= MAXUSERNUM) {
        socket.emit('reject')
        return
    }
    let ID = ''
    //new player joined
    socket.on('request-in', function (data) {
        USERS.push(data)
        ID = data.id

        let color = [parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), 1]
        socket.emit('approval', {
            id: data.id,
            users: USERS,
            startPoint: {
                x: 200,
                y: 20 + USERS.length * 30
            },
            snakes: SNAKES,
            color: color
        })

        socket.broadcast.emit('new', {
            id: data.id,
            startPoint: {
                x: 200,
                y: 20 + USERS.length * 30
            },
            color: color
        });
    })

    //player sent data to server
    socket.on('current-snake-data', data => {
        SNAKES[data.id] = data
    })

    socket.on('current-player-input', data => {
        socket.broadcast.emit('others-input', data);
    })

    socket.on('disconnect', () => {
        io.emit('others-quit', {id: ID});
        for(let i = 0; i < USERS.length; i++) {
            if(USERS[i].id === ID) {
                USERS.splice(i, 1)
                break
            }
        }
        delete SNAKES[ID]
    })
})