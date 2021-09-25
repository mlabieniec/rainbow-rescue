'use strict';

/**
 * TODO:
 *  - add timer to level
 *  - click on 1 circle, click on another, change color to color of first selected circle
 *  - timer ticks down, then re-shuffles
 */

// @TODO
class Collidable {
    constructor() {

    }
}

/**
 * This class mainly preloads sounds and generates random Hex values 
 * for box colors.
 */
class Util {

    // the file names, minus the extension
    sounds = {
        "alert": "",
        "bonus": "",
        "chime": "",
        "complete": "",
        "finish": "",
        "gameover": "",
        "lose1": "",
        "soundtrack-game": "",
        "soundtrack-happy": "",
        "success": "",
        "transition": "",
        "win": "",
        "win2": ""
    };
    preloaded = 0;

    constructor() { }

    /**
     * Preloads the sounds in the background, this is clearly
     * very important for Safari which performs very poorly when
     * dynamically loading sounds, especially on mobile devices.
     * @returns void
     */
    preload() {
        return new Promise((resolve, reject) => {
            let total = Object.keys(this.sounds).length - 1;
            for ( let key in this.sounds) {
                let audio = new Audio(`sounds/${key}.mp3`);
                this.sounds[key] = audio;
                audio.addEventListener("canplaythrough", (e) => {
                    if (this.preloaded >= total) {
                        console.log('all sounds loaded');
                        return resolve();
                    } else {
                        console.log(`preloaded ${this.preloaded}/${total}`);
                        this.preloaded ++
                    }
                });
            }
        });
    }

    // Plays a particular sound by file name
    playSound(sound) {
        console.log('play: ', sound);
        console.log(this.sounds[sound]);
        this.sounds[sound].play();
    }

    // Generates a random Hex value for a box color
    generateColor() {
        let values = "ABCDEF0123456789";
        let val = "#";
        for (let index = 0; index < 6; index++) {
            let rnd = Math.floor(Math.random() * values.length);
            val += values[rnd];
        }
        return val;
    }

}

/**
 * Used to be a ball, now it's a box!
 */
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

    /**
     * Spawns a new box in place of a current box
     * when a user selects the wrong color match
     * @param {Ball} ball 
     */
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
            this.element.style.cursor = "crosshair";
        } else {
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
    let maxBoxes = 25;
    let maxWin = 2;
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
    let starting = true;
    let isBonus = false;
    let util = new Util();
    let soundtrack = new Audio();
    const swatchElement = document.querySelector(".swatch");
    const rootElement = document.getElementById("root");
    const appElement = document.getElementById("app");
    const timeElement = document.querySelector(".timer");
    const scoreElement = document.querySelector(".score");
    const startElement = document.querySelector(".start");
    const startButton = document.querySelector(".btn-start");
    const toolbarElement = document.getElementById("toolbar");
    const usernameInput = document.getElementById("username");
    const gemsInput = document.getElementById("gems");
    gemsInput.value = numBoxes;
    const highScoreElement = document.querySelector(".high-score");
    const gameOverElement = document.getElementById("gameOver");
    const gemsDisplay = document.querySelector(".gems");
    const helpButton = document.querySelector(".btn-help");

    function init() {

        if (!usernameInput.value) return;
        
        if (gemsInput.value) {
            numBoxes = parseInt(gemsInput.value);
            maxBoxes = numBoxes + (numBoxes / 2);
        }

        gemsDisplay.textContent = numBoxes + "/" + maxBoxes;

        clearInterval(startScreenBgTimer);

        try {
            if (!highscore) {
                store(key, {
                    username: usernameInput.value,
                    score: score,
                    highscore: highscore
                });
            }
        } catch (error) {
            console.log(error);
        }

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
        setSoundtrack("soundtrack-game");
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
            if (totalTime < gameTime) {
                totalTime++;
            }
            isBonus = true;
        } else {
            isBonus = false;
        }
    }

    function gameOver() {
        console.log("GAME OVER");
        setSoundtrack("gameover");
        gameOverElement.className = "game-over";
        time = totalTime;
        clearInterval(timer);
        balls.forEach((b) => {
            root.innerHTML = "";
        });
        balls = [];
        score = 0;
    }

    function complete() {
        playSound("finish");
        time = totalTime;
        score += totalTime;
        time = totalTime;
        setHighScore(score);
        clearInterval(timer);
        showStart();
        balls.forEach((b) => {
            root.removeChild(b.element);
        });
        balls = [];
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
        starting = true;
        toolbarElement.className = "hidden";
        gameOverElement.className = "game-over hidden";
        try {
            let data = JSON.parse(localStorage.getItem(key));
            usernameInput.value = data.username;
            highScoreElement.textContent = data.highscore || data.score;
        } catch (error) {
            highScoreElement.textContent = "0";
            console.log(error);
        }
        appElement.style.backgroundColor = util.generateColor();
        startElement.className = "start";
        startScreenBgTimer = setInterval(() => {
            let color = util.generateColor();
            startElement.style.border = `3px dashed ${color}`;
            highScoreElement.style.color = color;
        }, 3000);

        setSoundtrack("soundtrack-happy");

        if (timer) {
            clearInterval(timer);
        }
    }

    function setSoundtrack(sound) {
        soundtrack.src = `sounds/${sound}.mp3`;
        soundtrack.loop = true;
        soundtrack.play();
    }

    function shuffle() {
        if (weightedColor)
            appElement.style.backgroundColor = weightedColor;

        if (balls.length === maxWin) {
            return complete();
        }

        matches = 0;
        selections = [];
        numSelected = 0;
        weightedColor = util.generateColor();
        balls.forEach((b, idx) => {
            b.enable();
            b.clearSelected();
            b.setPosition();
            let color = util.generateColor();
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
        if (!starting && !isBonus) {
            playSound("complete");
        }
        starting = false;
        updateDisplay();
    }

    function startTime() {
        timer = setInterval(() => {
            time--;
            timeElement.textContent = time;
            if (time === 0) {
                time = totalTime;
                clearInterval(timer);
                shuffle();
                if (!starting)
                    startTime();
            } else if(balls.length <= maxWin) {
                return complete();
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
                            updateDisplay();
                            // complete the game
                            if (balls.length <= maxWin) {
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
            updateDisplay();
            totalTime--;

            console.log('gameTime: ', gameTime);
            console.log('totalTime: ', totalTime);
            console.log('gems: ', balls.length);
            if (totalTime <= 2 || balls.length >= maxBoxes) {
                gameOver();
            }
        }
        playSound(snd);
        scoreElement.textContent = score;
    }

    function updateDisplay() {
        gemsDisplay.textContent = balls.length + " / " + maxBoxes;
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
            util.playSound(name);
        } catch (error) {
            console.log(error);
        }
    }

    swatchElement.addEventListener("click", shuffle);
    startButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (!usernameInput.value) return;
        init();
    });
    gameOverElement.addEventListener("click", showStart);
    helpButton.addEventListener("click", () => {
        if (document.getElementById("helpText").className == "hidden")
            document.getElementById("helpText").className = "";
        else
            document.getElementById("helpText").className = "hidden";
    });
    util.preload().then(showStart);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js');
    });
}