import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let currentUserUID = null;
let currentPoints = 0;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20;

let snake = [{ x: 9 * box, y: 10 * box }];
let direction = "RIGHT";
let food = randomFood();
let score = 0;

let game = null;
let speed = 150;
let gameStarted = false;

// ---------------- FOOD ----------------
function randomFood() {
    return {
        x: Math.floor(Math.random() * 19) * box,
        y: Math.floor(Math.random() * 19) * box
    };
}

// ---------------- DIRECTION ----------------
function changeDirection(dir) {
    if (dir === "LEFT" && direction !== "RIGHT") direction = "LEFT";
    if (dir === "RIGHT" && direction !== "LEFT") direction = "RIGHT";
    if (dir === "UP" && direction !== "DOWN") direction = "UP";
    if (dir === "DOWN" && direction !== "UP") direction = "DOWN";
}

// ---------------- KEYBOARD ----------------
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") changeDirection("LEFT");
    if (e.key === "ArrowRight") changeDirection("RIGHT");
    if (e.key === "ArrowUp") changeDirection("UP");
    if (e.key === "ArrowDown") changeDirection("DOWN");
});

// ---------------- TOUCH CONTROLS ----------------
let startX = 0;
let startY = 0;

canvas.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) changeDirection("RIGHT");
        else changeDirection("LEFT");
    } else {
        if (dy > 0) changeDirection("DOWN");
        else changeDirection("UP");
    }
});

// ---------------- GAME LOOP ----------------
function draw() {

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, 400, 400);

    // snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "#00ff88" : "#00cc66";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    // head
    let head = { ...snake[0] };

    if (direction === "LEFT") head.x -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "UP") head.y -= box;
    if (direction === "DOWN") head.y += box;

    // move snake FIRST
    snake.unshift(head);

    // food collision
    if (head.x === food.x && head.y === food.y) {

        score++;
        food = randomFood();

        // SPEED INCREASE
        if (score % 5 === 0 && speed > 70) {
            speed -= 10;
            clearInterval(game);
            game = setInterval(draw, speed);
        }

    } else {
        snake.pop();
    }

    // collision check
    let collision =
        head.x < 0 || head.y < 0 ||
        head.x >= 400 || head.y >= 400 ||
        snake.slice(1).some(s => s.x === head.x && s.y === head.y);

    if (collision) {
        clearInterval(game);

        let reward = 0;

        if (score >= 30) reward = 100;
        else if (score >= 20) reward = 50;
        else if (score >= 10) reward = 25;
        else if (score >= 5) reward = 10;

        updatePoints(reward);
        showGameOver(score, reward);
        return;
    }

    document.getElementById("score").textContent = "Score: " + score;
}

// ---------------- GAME OVER UI ----------------
function showGameOver(score, reward) {

    document.getElementById("finalScore").textContent =
        "Score: " + score;

    document.getElementById("rewardEarned").textContent =
        "Reward: ⭐ " + reward + " pts";

    document.getElementById("gameOverModal")
        .classList.remove("hidden");
}

// ---------------- FIREBASE ----------------
async function updatePoints(val) {

    if (!currentUserUID) return;

    const ref = doc(db, "users", currentUserUID);

    await updateDoc(ref, {
        points: increment(val)
    });

    currentPoints += val;

    document.getElementById("userPoints").textContent =
        ` | ⭐ ${currentPoints} pts`;
}

// ---------------- COUNTDOWN ----------------
function startCountdown() {

    const cd = document.getElementById("countdown");

    let count = 3;

    cd.textContent = count;

    const timer = setInterval(() => {

        count--;

        if (count > 0) {
            cd.textContent = count;
        } else if (count === 0) {
            cd.textContent = "GO!";
        } else {
            clearInterval(timer);
            cd.textContent = "";

            if (!gameStarted) {
                gameStarted = true;
                game = setInterval(draw, speed);
            }
        }

    }, 1000);
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {

    startCountdown();

    document.getElementById("restart").onclick = () => {
        location.reload();
    };

    document.getElementById("playAgain").onclick = () => {
        location.reload();
    };

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            location.href = "index.html";
            return;
        }

        currentUserUID = user.uid;

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
            const data = snap.data();

            currentPoints = data.points;

            document.getElementById("userName").textContent =
                `Hi, ${data.name}`;

            document.getElementById("userPoints").textContent =
                ` | ⭐ ${currentPoints} pts`;
        }
    });

    document.getElementById("logoutBtn").onclick = () => {
        signOut(auth).then(() => location.href = "index.html");
    };
});
