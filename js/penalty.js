import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let currentUserUID = null;
let currentPoints = 0;
// ===========================
// Penalty Kick - Part 1
// ===========================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const restartBtn = document.getElementById("restartBtn");
const message = document.getElementById("message");

let score = 0;
let lives = 3;

// -----------------------
// Goal
// -----------------------

const goal = {
    x: 220,
    y: 40,
    width: 360,
    height: 120
};

// -----------------------
// Goalkeeper
// -----------------------

const keeper = {
    x: canvas.width / 2,
    y: 110,
    width: 90,
    height: 18,
    speed: 4,
    dir: 1
};

// -----------------------
// Ball
// -----------------------

const ball = {
    x: canvas.width / 2,
    y: 430,
    radius: 12,
    targetX: 0,
    targetY: 0,
    moving: false,
    speed: 8
};

// -----------------------
// Draw Field
// -----------------------

function drawField(){

    ctx.fillStyle = "#3CB043";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Grass stripes

    for(let i=0;i<10;i++){

        ctx.fillStyle =
            i % 2 == 0
            ? "#41ba48"
            : "#37a53e";

        ctx.fillRect(
            0,
            i*60,
            canvas.width,
            60
        );

    }

    // Goal

    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;

    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );

    // Net

    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;

    for(let x=goal.x;x<goal.x+goal.width;x+=20){

        ctx.beginPath();
        ctx.moveTo(x,goal.y);
        ctx.lineTo(x,goal.y+goal.height);
        ctx.stroke();

    }

    for(let y=goal.y;y<goal.y+goal.height;y+=20){

        ctx.beginPath();
        ctx.moveTo(goal.x,y);
        ctx.lineTo(goal.x+goal.width,y);
        ctx.stroke();

    }

}
function showMessage(text,color){

    message.textContent = text;

    message.style.color = color;

    message.classList.add("show");

    setTimeout(()=>{

        message.classList.remove("show");

    },1200);

}
// -----------------------
// Draw Goalkeeper
// -----------------------

function drawKeeper(){

    ctx.fillStyle="#FFD700";

    ctx.fillRect(
        keeper.x-keeper.width/2,
        keeper.y,
        keeper.width,
        keeper.height
    );

}

// -----------------------
// Draw Ball
// -----------------------

function drawBall(){

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI*2
    );

    ctx.fillStyle="white";
    ctx.fill();

    ctx.strokeStyle="black";
    ctx.stroke();

}

// -----------------------
// Move Goalkeeper
// -----------------------

function updateKeeper(){

    keeper.x += keeper.speed * keeper.dir;

    if(
        keeper.x - keeper.width/2 <= goal.x ||
        keeper.x + keeper.width/2 >= goal.x + goal.width
    ){

        keeper.dir *= -1;

    }

}

// -----------------------
// Shoot Ball
// -----------------------

canvas.addEventListener("click",function(e){

    if(ball.moving)
        return;

    const rect = canvas.getBoundingClientRect();

    ball.targetX =
        (e.clientX - rect.left) *
        (canvas.width / rect.width);

    ball.targetY =
        (e.clientY - rect.top) *
        (canvas.height / rect.height);

    ball.moving = true;

});

// -----------------------
// Move Ball
// -----------------------

// -----------------------
// Reset Ball
// -----------------------

function resetBall(){

    ball.x = canvas.width/2;
    ball.y = 430;
    ball.moving = false;

}

// -----------------------
// Game Loop
// -----------------------

function gameLoop(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawField();

    updateKeeper();

    drawKeeper();

    updateBall();

    drawBall();

    requestAnimationFrame(gameLoop);

}

gameLoop();

// ===========================
// Part 2 - Game Logic
// ===========================

// Check shot result
function checkShot(){

    if(
        ball.x > goal.x &&
        ball.x < goal.x + goal.width &&
        ball.y > goal.y &&
        ball.y < goal.y + goal.height
    ){

        if(
            ball.x > keeper.x - keeper.width/2 &&
            ball.x < keeper.x + keeper.width/2 &&
            ball.y > keeper.y &&
            ball.y < keeper.y + keeper.height
        ){

            lives--;

            showMessage("🧤 SAVED!","#ff9800");

        }
        else{

            score++;

            showMessage("⚽ GOAL!","#00ff66");

        }

    }
    else{

        lives--;

        showMessage("❌ MISS!","#ff4444");

    }

    scoreEl.textContent = score;
    livesEl.textContent = lives;

    if(lives <= 0){

        setTimeout(gameOver,1200);

    }
    else{

        setTimeout(resetBall,1200);

    }

}

// ===========================
// Game Over
// ===========================

function gameOver(){

    showMessage("💀 GAME OVER!", "#ff4444");

    restartBtn.style.display = "inline-block";

}

// ===========================
// Restart
// ===========================

restartBtn.addEventListener("click", () => {

    score = 0;
    lives = 3;

    scoreEl.textContent = score;
    livesEl.textContent = lives;

    restartBtn.style.display = "none";

    resetBall();

});

// ===========================
// Replace updateBall()
// with this version
// ===========================

function updateBall() {

    if (!ball.moving)
        return;

    const dx = ball.targetX - ball.x;
    const dy = ball.targetY - ball.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.speed) {

        ball.x = ball.targetX;
        ball.y = ball.targetY;

        ball.moving = false;

        checkShot();

        return;

    }

    ball.x += dx / dist * ball.speed;
    ball.y += dy / dist * ball.speed;

}

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUserUID = user.uid;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {

        const data = snap.data();

        currentPoints = data.points || 0;

        document.getElementById("userName").textContent =
            `Hi, ${data.name}`;

        document.getElementById("userPoints").textContent =
            `⭐ ${currentPoints} pts`;
    }

});

document.getElementById("logoutBtn").addEventListener("click", () => {

    signOut(auth).then(() => {

        location.href = "index.html";

    });

});
