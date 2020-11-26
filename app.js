'use strict';

/**
 * TODO:
 *  - add timer to level
 *  - click on 1 circle, click on another, change color to color of first selected circle
 *  - timer ticks down, then re-shuffles
 */

class Collidable {
    constructor() {

    }
}

class Util {
    constructor() { }

    static generateColor() {
        let values = "ABCDEF0123456789";
        let val = "#";
        for (let index = 0; index < 6; index++) {
            let rnd = Math.floor(Math.random() * values.length);
            val += values[rnd];
        }
        return val;
    }
}

class Ball extends Collidable {

    id;
    iDragging = false;
    iSelected = false;
    iDisabled = false;
    onSelect;
    element;
    color;
    root;

    constructor(rootElement) {
        super(rootElement);
        if (!rootElement) throw Error("Ball requires a root element");
        this.root = rootElement;
        this.element = document.createElement("div");
        this.element.className = "drag-box";
        this.id = Math.floor(Math.random() * 10000) + 1;
        this.element.addEventListener("click", this.setSelected.bind(this));
        this.element.addEventListener("mouseover", this.toggleDrag.bind(this));
        this.element.addEventListener("mouseout", this.toggleDrag.bind(this));
        this.element.addEventListener("mousemove", this.move.bind(this));
        rootElement.appendChild(this.element);
    }

    popInFrom(ball) {
        this.element.style.top = ball.element.style.top;
        this.element.style.left = ball.element.style.left;
        setTimeout(() => {
            this.setPosition();
        }, 500);
    }

    setPosition() {
        let top = Math.abs(Math.random() * parseInt(this.root.offsetHeight)) - 30;
        let left = Math.abs(Math.random() * parseInt(this.root.offsetWidth));
        this.element.style.top = top.toString() + "px";
        this.element.style.left = left.toString() + "px";
    }

    disable() {
        this.iDisabled = true;
        this.element.style.cursor = "default";
    }

    enable() {
        this.iDisabled = false;
        this.element.style.cursor = "pointer";
    }

    setColor(color) {
        this.color = color;
        this.element.style.backgroundColor = color;
    }

    getColor() {
        return this.element.style.backgroundColor;
    }

    toggleDrag() {
        if (this.iDisabled) return;
        this.iDragging = !this.iDragging;
        if (this.iDragging) {
            //this.iSelected = false;
            this.element.style.cursor = "crosshair";
            //this.setSelected();
        } else {
            //this.clearSelected();
            this.element.style.cursor = "pointer";
        }
    }

    move(event) {
        if (this.iDragging && !this.iDisabled) {
            let x = parseInt(event.clientX) - 50, y = parseInt(event.clientY) - 50;
            this.element.style.top = `${y}px`;
            this.element.style.left = `${x}px`;
        }
    }

    setSelected() {
        if (this.iDisabled) return;
        this.iSelected = !this.iSelected;
        if (this.iSelected) {
            this.element.className = "drag-box selected";
            if (this.onSelect) {
                this.onSelect(this);
            }
        } else {
            this.element.className = "drag-box";

        }
    }

    clearSelected() {
        this.iSelected = false;
        this.element.className = "drag-box";
    }
}

document.body.onload = () => {

    let numBoxes = 20;
    let balls = [];
    let weightedColor;
    let selectedColor;
    let numSelected = 0;
    let maxSelection = 2;
    let matches = 0;
    let maxMatches = 3;
    let selections = [];
    let timer;
    let time = 15;
    let totalTime = 15;
    let gameTime = 15;
    let score = 0;
    let highscore = score;
    let key = "rr";
    let startScreenBgTimer;
    let isBooting = true;
    const swatchElement = document.querySelector(".swatch");
    const rootElement = document.getElementById("root");
    const appElement = document.getElementById("app");
    const timeElement = document.querySelector(".timer");
    const scoreElement = document.querySelector(".score");
    const startElement = document.querySelector(".start");
    const startButton = document.querySelector(".btn-start");
    const toolbarElement = document.getElementById("toolbar");
    const usernameInput = document.getElementById("username");
    const highScoreElement = document.querySelector(".high-score");

    function init() {

        if (!usernameInput.value) return;

        clearInterval(startScreenBgTimer);

        totalTime = gameTime;
        time = gameTime;
        startElement.className = "start hidden";
        toolbarElement.className = "";
        for (let index = 0; index < numBoxes; index++) {
            let ball = new Ball(rootElement);
            ball.onSelect = onBallSelect;
            balls.push(ball);
            setTimeout(() => {
                shuffle();
            }, 500);
        }
        timeElement.textContent = time;
        scoreElement.textContent = score;
        highScoreElement.textContent = highscore;
        startTime();
    }

    function onBallSelect(ball) {
        playSound("chime");
        ball.disable();
        selections[numSelected] = ball;
        if (selections.length === maxSelection) {
            selectedColor = selections[numSelected - 1].color;
            ball.setColor(selectedColor);
            calculateScore(selections);
            selections = [];
            numSelected = 0;
        } else {
            numSelected++;
        }
    }

    function determineBonus() {
        if (matches === maxMatches) {
            score += maxMatches;
            time = 1;
            playSound("bonus");
        }
    }

    function complete() {
        time = totalTime;
        score += totalTime;
        time = totalTime;
        setHighScore(score);
        clearInterval(timer);
        showStart();
        return root.removeChild(balls[0].element);
    }

    function setHighScore(currentScore) {
        let data = {
            username: usernameInput.value,
            score: currentScore,
            highscore: highscore
        };
        if (highscore < currentScore) {
            data.highscore = currentScore;
        }
        return store(key, data);
    }

    function store(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        return JSON.parse(localStorage.getItem(key));
    }

    function showStart() {
        try {
            let data = JSON.parse(localStorage.getItem(key));
            usernameInput.value = data.username;
            highScoreElement.textContent = data.highscore || data.score;
        } catch (error) {
            console.log(error);
        }
        appElement.style.backgroundColor = Util.generateColor();
        startElement.className = "start";
        startScreenBgTimer = setInterval(() => {
            let color = Util.generateColor();
            startElement.style.border = `3px dashed ${color}`;
            highScoreElement.style.color = color;
        }, 3000);
    }

    function shuffle() {
        if (weightedColor)
            appElement.style.backgroundColor = weightedColor;

        if (balls.length === 1) {
            return complete();
        }

        matches = 0;
        selections = [];
        numSelected = 0;
        weightedColor = Util.generateColor();
        balls.forEach((b, idx) => {
            b.enable();
            b.clearSelected();
            b.setPosition();
            let color = Util.generateColor();
            if (idx <= 3) {
                color = weightedColor;
            }
            b.color = color;
            b.setColor(color);
            b.element.className = "drag-box animating";
            setTimeout(() => {
                b.element.className = "drag-box";
            }, 1200);
        });
        swatchElement.style.backgroundColor = weightedColor;
        playSound("complete");
    }

    function startTime() {
        timer = setInterval(() => {
            time--;
            timeElement.textContent = time;
            if (time === 0) {
                time = totalTime;
                clearInterval(timer);
                shuffle();
                startTime();
            }
        }, 1000);
    }

    function calculateScore(selectedItems) {
        let snd;
        if (selectedColor === weightedColor) {
            try {
                window.navigator.vibrate(200);
            } catch (error) {
                console.log(error);
            }
            selectedItems[0].element.style.top = selectedItems[1].element.style.top;
            selectedItems[0].element.style.left = selectedItems[1].element.style.left;
            snd = "win";
            score++;
            matches++;
            setHighScore(score);
            determineBonus();
            setTimeout(() => {
                selectedItems[0].element.className = "drag-box destroy";
                setTimeout(() => {
                    balls.forEach((ball, index) => {
                        if (ball.id === selectedItems[0].id) {
                            rootElement.removeChild(selectedItems[0].element);
                            balls.splice(index, 1);
                            // complete the game
                            if (balls.length <= 1) {
                                return complete();
                            }
                        }
                    });
                }, 500);
            }, 1000);
        } else {
            snd = "lose1";
            let ball = new Ball(rootElement);
            ball.onSelect = onBallSelect;
            ball.popInFrom(selectedItems[0]);
            balls.push(ball);
            totalTime--;
        }
        playSound(snd);
        scoreElement.textContent = score;
    }

    function clear(event) {
        if (event && event.target === rootElement) {
            balls.forEach((b) => {
                if (!b.iDisabled)
                    b.clearSelected();
            });
        }
    }

    function playSound(name) {
        try {
            const snd = document.createElement("audio");
            snd.src = `sounds/${name}.mp3`;
            snd.play();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    swatchElement.addEventListener("click", shuffle);
    startButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (!usernameInput.value) return;
        init();
    });
    showStart();
}