'use strict'

const R = 3

class Snake {
    constructor (params) {
        this.body = []

        this.growing = 0

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

module.exports = Snake
