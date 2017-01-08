const initSnakeLifePoint = 100
const perFoodGain = 5
const pointPerBody = 20
const R = 3
const GameWidth = 400
const GameHeight = 400
const LENGHT = 400
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
    return (x - LENGHT/2)/(LENGHT/2)
}

function translateYWebToGL (y) {
    return (LENGHT/2 - y)/(LENGHT/2)
}

class Snake {
    constructor (startPoint) {
        this.speedPerSecond = 12
        this.body = []
        this.lifePoint = initSnakeLifePoint
        this.length = 5

        this.N = 1 //render a circle per N

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

class Game {
    constructor (p) {
        this.width = GameWidth
        this.height = GameHeight
        this.snakes = []
        this.initSnakesNum = 3
        this.playerID = 1

        for(let i = 0; i < this.initSnakesNum; i++) {
            this.insertSnake()
        }

        this.initCanvas()
        this.initHandler()
        this.run()
    }

    run () {
        setInterval(() => {
            this.updateAllSnakesData()
            this.render()
        },300)

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
            this.snakes[this.playerID].updateDirectVertex({
                x: e.clientX,
                y: e.clientY
            })
        }
        this.canvas.addEventListener('click', handler.bind(this), false)
    }

    insertSnake () {
        this.snakes.push(new Snake({
            x: 100,
            y: 200 + this.snakes.length * 50
        }))
    }

    updateAllSnakesData () {
        for(let i = 0; i < this.snakes.length; i++) {
            this.snakes[i].move()
        }
    }

    render () {
        let ap = GL.getAttribLocation(GL.program, "a_Position")
        GL.clearColor(0, 0, 0, 1);
        GL.clear(GL.COLOR_BUFFER_BIT);

        let pts = []

        for(let i = 0; i < this.snakes.length; i++) {
            for(let j = 0; j < this.snakes[i].body.length; j++) {
                pts.push(translateXWebToGL(this.snakes[i].body[j].x))
                pts.push(translateYWebToGL(this.snakes[i].body[j].y))
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