const initSnakeLifePoint = 100
const perFoodGain = 5
const pointPerBody = 20

class Obj {
    constructor () {
        //this.croods = []
        this.x
        this.y
    }
}

class Pt {
    constructor () {
        //this.croods = []
        this.x
        this.y
    }
}

class Snake {
    constructor (startPoint) {
        this.speedPerSecond = 12
        this.body = []
        this.lifePoint = initSnakeLifePoint
        this.length = Math.floor(this.lifePoint/pointPerBody)

        let point = {
            x: startPoint.x,
            y: startPoint.y
        }

        for(let i = 0; i < this.length; i ++) {
            this.body.push(new Pt(point.x, point.y))
        }
    }

    move () {

    }
}

class food extends Obj {

}

class body extends Obj {

}

class Game {

}