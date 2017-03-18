const GameWidth = 400
const GameHeight = 400
const LENGTH = 400

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
    }
`

function translateXWebToGL (x) {
    return (x - LENGTH/2)/(LENGTH/2)
}

function translateYWebToGL (y) {
    return (LENGTH/2 - y)/(LENGTH/2)
}

let alive = true

class Game {
    constructor (p) {
        this.width = GameWidth
        this.height = GameHeight
        this.snakes = []
        this.renderData = []
        this.playerID = Math.floor(Math.random()*100000000).toString()
        this.lastDataUpdatedTime = new Date().getTime()
        this.connectToServer()
    }

    getHost () {
        let host = /^http\:\/\/([0-9|A-z|\.|\-]*):9527/.exec(window.location.href)
        return host[1]
    }

    connectToServer () {
        this.socket = io(`http://${this.getHost()}:9527`)

        this.socket.on('reject', () => {
            alert('Too many people on server')
        })

        this.socket.on('render-data', (data) => {
            this.renderData = this.filterSnakeRenderData(data.snakes).concat(this.filterFoodRenderData(data.food))
        })

        this.socket.on('approval', data => {
            this.initCanvas()
            this.initHandler()

            this.runGame()
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
            this.render()

            requestAnimationFrame(function () {
                this.runGame()
            }.bind(this))

            // setTimeout(() => {
            //     this.runGame()
            // }, 500)
        } else {
            alert('Game Over')
        }
    }

    filterFoodRenderData (data) {
        let pts = []
        data.forEach(d => {
            pts.push(translateXWebToGL(d.x))
            pts.push(translateYWebToGL(d.y))
            pts.push(d.color[0])
            pts.push(d.color[1])
            pts.push(d.color[2])
        })
        return pts
    }

    filterSnakeRenderData (data) {
        let pts = []
        function returnRenderBodies (body, n) {
            let r = []
            body.forEach( (item, index) => {
                if(n === 0  || index % n === 0) {
                    r.push(item)
                }
            })
            return r
        }

        for(let key in data) {
            let B = returnRenderBodies(data[key].body, 2)
            for(let j = 0; j < B.length; j++) {
                pts.push(translateXWebToGL(B[j].x))
                pts.push(translateYWebToGL(B[j].y))
                pts.push(data[key].color[0])
                pts.push(data[key].color[1])
                pts.push(data[key].color[2])
            }
        }

        return pts
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

    render () {
        let ap = GL.getAttribLocation(GL.program, "a_Position")
        let ac = GL.getAttribLocation(GL.program, "a_color")
        GL.clearColor(1, 1, 1, 1);
        GL.clear(GL.COLOR_BUFFER_BIT);

        let pts = this.renderData
        if(pts.length === 0) {
            return
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