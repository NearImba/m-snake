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
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 2.0;
    }
`
const fragmentShader = `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`

function translateXWebToGL (x) {
    return (x - LENGTH/2)/(LENGTH/2)
}

function translateYWebToGL (y) {
    return (LENGTH/2 - y)/(LENGTH/2)
}

class Snake {
    constructor (startPoint) {
        this.speedPerSecond = 12
        this.body = []
        this.lifePoint = initSnakeLifePoint
        this.length = 50

        this.N = 2 //render a circle per N

        this.directVertex = {
            x: 1,
            y: 0
        } // move forward vertex

        let point = {
            x: startPoint.x,
            y: startPoint.y
        }

        for(let i = 0; i < this.length; i ++) {
            this.body.unshift({
                x: point.x + i * R,
                y: point.y
            })
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

        this.body.pop()
        this.body.unshift({
            x: X1,
            y: Y1
        })

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

    connectToServer () {
        this.socket = io('http://localhost:9527')
        this.socket.on('ALIVE', (data) => {
            this.insertSnake(data);
        })

        this.socket.on('WELCOME', (data) => {
            this.initCanvas()
            this.initHandler()
            this.runGame()
        })
    }

    weclomeUser (name) {
        if (name) {
            this.socket.emit('NEW-GUY',{
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
            requestAnimationFrame(function () {
                this.runGame()
            }.bind(this))
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
            //console.log(e)
            let X = e.clientX, Y = e.clientY
            this.snakes[this.playerID].updateDirectVertex({
                x: X,
                y: Y
            })
            this.socket.emit('INPUT', {
                id: this.playerID,
                point: {
                    x: X,
                    y: Y
                }
            })
        }
        this.canvas.addEventListener('click', handler.bind(this), false)
    }

    insertSnake (a) {
        this.snakes[this.playerID] = (new Snake({
            x: a.x,
            y: a.y
        }))
    }

    updateAllSnakesData () {
        for(let i in this.snakes) {
            this.snakes[i].move()
        }
    }

    render () {
        let ap = GL.getAttribLocation(GL.program, "a_Position")
        GL.clearColor(0, 0, 0, 1);
        GL.clear(GL.COLOR_BUFFER_BIT);

        let pts = []

        for(let key in this.snakes) {
            let B = this.snakes[key].returnRenderBodies()
            for(let j = 0; j < B.length; j++) {
                pts.push(translateXWebToGL(B[j].x))
                pts.push(translateYWebToGL(B[j].y))
            }
        }

        let vertexBuffer = GL.createBuffer();

        GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer)

        GL.vertexAttribPointer(ap, 2, GL.FLOAT, false, 0, 0)

        GL.enableVertexAttribArray(ap)

        let vArray = new Float32Array(pts)

        GL.bufferData(GL.ARRAY_BUFFER, vArray, GL.STATIC_DRAW)

        GL.clear(GL.COLOR_BUFFER_BIT)

        GL.drawArrays(GL.POINTS, 0 , pts.length/2);
    }
}