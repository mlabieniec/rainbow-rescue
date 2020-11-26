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

    setPosition() {
        let top = Math.abs(Math.floor(Math.random() * parseInt(this.root.offsetHeight))) - 30;
        let left = Math.abs(Math.floor(Math.random() * parseInt(this.root.offsetWidth)));
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
    let colors = [];
    let weightedColor;
    let selectedColor;
    let numSelected = 0;
    let maxSelection = 2;
    let selections = [];
    let matches = [];
    let timer;
    let time = 15;
    let totalTime = 15;
    let gameTime = 15;
    let score = 0;
    let isBooting = true;
    let key = "rr";
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
        startTime();
    }

    function onBallSelect(ball) {
        const selectSound = document.createElement("audio");
        selectSound.src = "sounds/chime.mp3";
        selectSound.play();
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

    function complete() {
        time = totalTime;
        score += totalTime;
        localStorage.setItem(key, JSON.stringify({
            'username': usernameInput.value,
            'score': score
        }));
        time = totalTime;
        clearInterval(timer);
        showStart();
        return root.removeChild(balls[0].element);
    }

    function showStart() {
        try {
            let data = JSON.parse(localStorage.getItem(key));
            console.log(data);
            usernameInput.value = data.username;
            highScoreElement.textContent = data.score;
        } catch (error) {
            console.log(error);
        }
        appElement.style.backgroundColor = Util.generateColor();
        startElement.className = "start";
    }

    /**
     * Shuggles all the balls on the screen
     * including changing the colors to new
     * random values
     */
    function shuffle() {
        if (weightedColor)
            appElement.style.backgroundColor = weightedColor;

        if (balls.length === 1) {
            return complete();
        }

        colors = [];
        matches = [];
        selections = [];
        numSelected = 0;
        weightedColor = Util.generateColor();
        colors.push(weightedColor);
        balls.forEach((b, idx) => {
            b.enable();
            b.clearSelected();
            b.setPosition();
            let color = Util.generateColor();
            if (idx === 0 || idx === (balls.length - 1) || idx === (balls.length - balls.length / 2)) {
                color = weightedColor;
            }
            colors.push(color);
            b.color = color;
            b.setColor(color);
            b.element.className = "drag-box animating";
            setTimeout(() => {
                b.element.className = "drag-box";
            }, 1200);
        });
        swatchElement.style.backgroundColor = weightedColor;
        if (!isBooting) {
            const el = document.createElement('audio');
            el.src = 'sounds/complete.mp3';
            el.play();
            isBooting = false;
        }
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
        const snd = document.createElement('audio');
        if (selectedColor === weightedColor) {
            try {
                window.navigator.vibrate(200);
            } catch (error) {
                console.log(error); 
            }
            selectedItems[0].element.style.top = selectedItems[1].element.style.top;
            selectedItems[0].element.style.left = selectedItems[1].element.style.left;
            snd.src = "sounds/win.mp3";
            score++;
            localStorage.setItem(key, JSON.stringify({
                'username': usernameInput.value,
                'score': score
            }));
            setTimeout(() => {
                selectedItems[0].element.className = "drag-box destroy";
                setTimeout(() => {
                    balls.forEach((ball, index) => {
                        if (ball.id === selectedItems[0].id) {
                            rootElement.removeChild(selectedItems[0].element);
                            balls.splice(index, 1);
                            if (balls.length <= 1) {
                                return complete();
                            }
                        }
                    });
                }, 500);
            }, 1000);
        } else {
            snd.src = "sounds/lose1.mp3";
            totalTime--;
        }
        snd.play();
        scoreElement.textContent = score;
    }

    /**
     * Clears the selected balls when clicking
     * either the clear selection button or
     * the root element background
     * @param {MouseEvent} event 
     */
    function clear(event) {
        if (event && event.target === rootElement || event && event.target === btnClear) {
            balls.forEach((b) => {
                if (!b.iDisabled)
                    b.clearSelected();
            });
        }
    }

    swatchElement.addEventListener("click", shuffle);
    startButton.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.setItem(key, JSON.stringify({
            'username': usernameInput.value,
            'score': score
        }));
        init();
    });
    showStart();
}