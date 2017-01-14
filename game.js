const initSnakeLifePoint = 100
const perFoodGain = 5
const pointPerBody = 20
const R = 3
const GameWidth = 400
const GameHeight = 400
const LENGTH = 400
const UPDATEPERSECOND = 40 //ms

let GL = null

const vertexShader = `
    attribute vec4 a_Position;
    attribute vec4 a_color;
    varying vec4 vector_color;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 2.0;
        vector_color = a_color;
    }
`
const fragmentShader = `
    precision mediump float;
    varying vec4 vector_color;
    void main() {
        gl_FragColor = vector_color;
        //gl_FragColor = vec4(0,1,0,1);
    }
`

function translateXWebToGL (x) {
    return (x - LENGTH/2)/(LENGTH/2)
}

function translateYWebToGL (y) {
    return (LENGTH/2 - y)/(LENGTH/2)
}

class Snake {
    constructor (params) {
        this.body = []

        this.growing = 0

        this.N = 2 //render a circle per N

        this.color = params && params.color || [parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), 1]

        this.directVertex = {
            x: 1,
            y: 0
        } // move forward vertex

        if(params && params.hasOwnProperty('startPoint')) {
            let point = {
                x: params.startPoint.x,
                y: params.startPoint.y
            }

            for(let i = 0; i < 50; i ++) {
                this.body.unshift({
                    x: point.x + i * R,
                    y: point.y
                })
            }
        } else if (params && params.body && params.directVertex && params.color){
            this.directVertex = params.directVertex
            this.body = params.body
            this.color = params.color
        } else {
            console.info(params)
            console.error('init snake params error')
            delete this
        }

    }

    updateDirectVertex (targetPoint) {
        if(targetPoint.x === this.body[0].x && targetPoint.y === this.body[0].y) {
            return
        }

        this.directVertex = {
            x: targetPoint.x - this.body[0].x,
            y: targetPoint.y - this.body[0].y
        }
        //console.log(this.directVertex)
    }

    returnRenderBodies () {
        let r = [], n = this.N
        this.body.forEach( (item, index) => {
            if(n === 0  || index % n === 0) {
                r.push(item)
            }
        })
        return r
    }

    move () {
        let X = this.body[0].x,
            Y = this.body[0].y
        let X2 = X + this.directVertex.x,
            Y2 = Y + this.directVertex.y,
            X1,Y1
        let L = Math.sqrt((X2-X) * (X2 - X) + (Y2 - Y) * (Y2 - Y))


        X1 = (X2 - X) * R / L + X
        Y1 = (Y2 - Y) * R / L + Y

        if(this.growing === 0 || this.growing < 0) {
            this.body.pop()
            this.growing = 0
        } else {
            this.growing --
        }

        this.body.unshift({
            x: X1,
            y: Y1
        })

    }

    grow (n) {
        this.growing += (n || 1)
    }

    normalPoint () {

    }
}

let alive = true

class Game {
    constructor (p) {
        this.width = GameWidth
        this.height = GameHeight
        this.snakes = []
        this.initSnakesNum = 3
        this.playerID = Math.floor(Math.random()*100000000).toString()
        this.lastDataUpdatedTime = new Date().getTime()
        this.connectToServer()
    }

    getHost () {
        let host = /^http\:\/\/([0-9|A-z|\.|\-]*):9527/.exec(window.location.href)
        //console.log(host)
        return host[1]
    }

    connectToServer () {
        this.socket = io(`http://${this.getHost()}:9527`)

        this.socket.on('reject', () => {
            alert('Too many people on server')
        })

        this.socket.on('new', (data) => {
            this.insertSnake(data)
        })

        this.socket.on('approval', data => {
            console.log(data)

            this.insertSnake(data, true)

            for(let userId in data.snakes) {
                this.insertSnake(data.snakes[userId])
            }

            this.initCanvas()
            this.initHandler()

            console.log(this.snakes[this.playerID].color)

            this.runGame()
        })

        this.socket.on('others-input', data => {
            this.snakes[data.id].updateDirectVertex(data.targetPoint)
        })

        this.socket.on('others-quit', data => {
            delete this.snakes[data.id]
        })
    }

    sendCurrentPlayerDataToServer () {
        let currentSanke = this.snakes[this.playerID]
        this.socket.emit('current-snake-data', {
            id: this.playerID,
            body: currentSanke.body,
            directVertex: currentSanke.directVertex,
            color: currentSanke.color
        })
    }

    weclomeUser (name) {
        if (name) {
            this.socket.emit('request-in',{
                name: name,
                id: this.playerID
            })
        }
    }

    runGame () {
        if(alive) {
            let t = new Date().getTime()
            if(t - this.lastDataUpdatedTime > UPDATEPERSECOND) {
                this.updateAllSnakesData()
                this.lastDataUpdatedTime = t
            }
            this.render()
            // requestAnimationFrame(function () {
            //     this.runGame()
            // }.bind(this))

            setTimeout(() => {
                this.runGame()
            }, 500)
        } else {
            alert('Game Over')
        }
    }

    initCanvas () {
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.width
        this.canvas.height = this.height
        document.body.appendChild(this.canvas)
        GL = this.canvas.getContext("webgl")

        if(GL) {
            initShaderFromStr(GL, vertexShader, fragmentShader)
            GL.clearColor(0, 0, 0, 1)
            GL.clear(GL.COLOR_BUFFER_BIT)
            GL.drawArrays(GL.POINTS, 0 , 1)
        }
    }

    initHandler () {
        let _t = this
        function handler (e) {
            let X = e.layerX, Y = e.layerY
            this.snakes[this.playerID].updateDirectVertex({
                x: X,
                y: Y
            })
            this.socket.emit('current-player-input', {
                id: this.playerID,
                targetPoint: {
                    x: X,
                    y: Y
                }
            })
        }
        this.canvas.addEventListener('click', handler.bind(this), false)
    }

    insertSnake (p, type) {
        // switch (type) {
        //     case 0 :
        //         this.snakes[this.playerID] = new Snake(p)
        //         break
        //     case 1 :
        //         this.snakes[p.playerID] = (new Snake(p))
        //         break
        //     case 2 :
        //         break
        //     default :
        //         break
        //
        // }
        // if(type) {
        //     this.snakes[this.playerID] = (new Snake(p))
        // } else {
        //     this.snakes[p.id] = new Snake(p)
        // }

        this.snakes[p.id] = new Snake(p)

    }

    updateAllSnakesData () {
        this.sendCurrentPlayerDataToServer()
        for(let i in this.snakes) {
            this.snakes[i].move()
        }
    }

    render () {
        let ap = GL.getAttribLocation(GL.program, "a_Position")
        let ac = GL.getAttribLocation(GL.program, "a_color")
        GL.clearColor(1, 1, 1, 1);
        GL.clear(GL.COLOR_BUFFER_BIT);

        let pts = []

        for(let key in this.snakes) {
            let B = this.snakes[key].returnRenderBodies()
            for(let j = 0; j < B.length; j++) {
                pts.push(translateXWebToGL(B[j].x))
                pts.push(translateYWebToGL(B[j].y))
                pts.push(this.snakes[key].color[0])
                pts.push(this.snakes[key].color[1])
                pts.push(this.snakes[key].color[2])
            }
        }

        let vertexBuffer = GL.createBuffer();

        GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer)

        GL.enableVertexAttribArray(ap)
        GL.enableVertexAttribArray(ac)

        let vArray = new Float32Array(pts)

        let _SIZE = vArray.BYTES_PER_ELEMENT

        GL.vertexAttribPointer(ap, 2, GL.FLOAT, false, _SIZE*5, 0)

        GL.vertexAttribPointer(ac, 3, GL.FLOAT, false, _SIZE*5, _SIZE*2)

        GL.bufferData(GL.ARRAY_BUFFER, vArray, GL.STATIC_DRAW)

        GL.clear(GL.COLOR_BUFFER_BIT)

        GL.drawArrays(GL.POINTS, 0 , pts.length/5);
    }
}