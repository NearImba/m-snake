'use strict'

const W = 400
const H = 400

class Food {
    constructor (sceneWidth = W, sceneHeight = H) {
        this.x = Math.floor(sceneWidth * Math.random())
        this.y = Math.floor(sceneHeight * Math.random())
        this.style = 3
        this.value = 2
        this.color = [parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2)), 1]
    }

    check (head) {
        if(head && Math.abs(head.x - this.x) < 10 && Math.abs(head.y -this.y) < 10) {
            return true
        } else {
            return false
        }
    }

    returnRendData () {
        return {
            x: this.x,
            y: this.y,
            style: this.style,
            color: this.color
        }
    }
}

module.exports = Food

