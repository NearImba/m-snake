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

const MAXNUM = 6 //user
const Snake = require('./scripts/Snake')
const Food = require('./scripts/Food')
const SendGameDataPerTime = 20
const LENGTH = 400

let USERS = []
let SNAKES = {}
let FOOD = []
let GameStarted = false

io.on('connection', function (socket) {
    if(USERS.length >= MAXNUM) {
        socket.emit('reject')
        return
    }
    for(let fn = 0; fn < 100; fn++ ) {
        FOOD.push(new Food())
    }

    let ID = ''

    function getFoodData (FOOD) {
        let r = []
        FOOD.forEach( f => {
            r.push(f.returnRendData())
        })
        return r
    }

    function gameDataUpdate () {
        for(let userId in SNAKES) {
            SNAKES[userId].move()
        }

        //remove eat foods
        for(let en = 0; en < FOOD.length; en++) {
            for(let key in SNAKES) {
                if(FOOD[en].check(SNAKES[key].body[0])) {
                    SNAKES[key].grow(FOOD[en].value)
                    FOOD.splice(en, 1)
                    en--
                }

            }
        }

        //send graph data to clients
        let rData = {
            'snakes': {},
            'food': getFoodData(FOOD)
        }

        for(let key in SNAKES) {
            rData.snakes[key] = {
                'body': SNAKES[key].body,
                'color': SNAKES[key].color,
                'style': SNAKES[key].style
            }
        }

        io.emit('render-data', rData)

        setTimeout(gameDataUpdate, SendGameDataPerTime)
    }

    //new player joined
    socket.on('request-in', function (data) {
        USERS.push(data)
        ID = data.id

        let color = [parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), 1]

        if(!GameStarted){
            GameStarted = true
            setTimeout(gameDataUpdate, SendGameDataPerTime)
        }

        SNAKES[ID] = new Snake({
            id: ID,
            startPoint: {
                x: 200,
                y: 20 + USERS.length * 30
            },
            color: color
        })


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

    })


    socket.on('current-player-input', data => {
        try {
            SNAKES[data.id].updateDirectVertex({
                x: data.targetPoint.x,
                y: data.targetPoint.y
            })
        } catch (e) {
            console.log(data.id)
        }

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