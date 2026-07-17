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

// --------------------
// Firebase
// --------------------

let currentUser = null;
let currentPoints = 0;
let pointsAwarded = false;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    currentUser = user;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {

        const data = snap.data();

        currentPoints = data.points || 0;

        document.getElementById("userName").textContent =
            `Hi, ${data.name}`;

        document.getElementById("userPoints").textContent =
            `⭐ ${currentPoints} pts`;
    }

});

// Logout

document.getElementById("logoutBtn").addEventListener("click", () => {

    signOut(auth).then(() => {

        location.href = "index.html";

    });

});

// --------------------
// Game
// --------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 420;
canvas.height = 600;

const gravity = 0.45;
const jump = -8;

let score = 0;
let gameStarted = false;
let countdown = 3;
let gameOver = false;


let bgX = 0;
let cloudX = 420;
let groundX = 0;


const bird = {

    x: 80,
    y: 250,
    radius: 15,
    velocity: 0

};

const pipes = [];
const gap = 160;

const pipeInterval = setInterval(() => {

    if (!gameOver)
        addPipe();

}, 1800);

function addPipe() {

    const topHeight = Math.random() * 250 + 50;

    pipes.push({

        x: canvas.width,
        top: topHeight,
        bottom: topHeight + gap,
        passed: false

    });

}

function startCountdown(){

    const timer =
    setInterval(()=>{

        document.getElementById("countdown")
        .textContent = countdown;


        countdown--;


        if(countdown < 0){

            clearInterval(timer);

            document.getElementById("countdown")
            .style.display="none";


            gameStarted=true;

            loop();

        }


    },1000);

}


function drawBird() {

    ctx.fillStyle = "yellow";

    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.arc(bird.x + 6, bird.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

}

function drawPipes() {

    ctx.fillStyle = "#1ca300";

    pipes.forEach(pipe => {

        ctx.fillRect(pipe.x, 0, 60, pipe.top);

        ctx.fillRect(
            pipe.x,
            pipe.bottom,
            60,
            canvas.height - pipe.bottom
        );

    });

}

function drawBackground(){

    // Sky
    ctx.fillStyle = "#6fd6ff";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.8)";

    ctx.beginPath();
    ctx.arc(cloudX,100,25,0,Math.PI*2);
    ctx.arc(cloudX+30,100,35,0,Math.PI*2);
    ctx.arc(cloudX+70,100,25,0,Math.PI*2);
    ctx.fill();


    // Ground
    ctx.fillStyle="#7ac943";

    ctx.fillRect(
        0,
        canvas.height-40,
        canvas.width,
        40
    );


    // Move clouds
    cloudX -= 1;

    if(cloudX < -100){
        cloudX = canvas.width;
    }

}


function update() {

    bird.velocity += gravity;
    bird.y += bird.velocity;

    pipes.forEach(pipe => {

        pipe.x -= 3;

        // Collision

        if (
            bird.x + bird.radius > pipe.x &&
            bird.x - bird.radius < pipe.x + 60 &&
            (
                bird.y - bird.radius < pipe.top ||
                bird.y + bird.radius > pipe.bottom
            )
        ) {

            endGame();

        }

        // Score

        if (!pipe.passed && pipe.x + 60 < bird.x) {

            pipe.passed = true;

            score++;

            document.getElementById("score").textContent =
                `Score : ${score}`;

        }

    });

    while (pipes.length && pipes[0].x < -70) {

        pipes.shift();

    }

    if (bird.y > canvas.height || bird.y < 0) {

        endGame();

    }

}

function draw(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBackground();
    drawPipes();
    drawBird();

}

function loop() {

    if (gameOver)
        return;

    update();
    draw();

    requestAnimationFrame(loop);

}

function flap(){

    if(!gameStarted || gameOver)
        return;


    bird.velocity = jump;

}


document.addEventListener("keydown", e => {

    if (e.code === "Space") {

        e.preventDefault();

        flap();

    }

});

canvas.addEventListener("mousedown", flap);

canvas.addEventListener("touchstart", e => {

    e.preventDefault();

    flap();

});

// --------------------
// Points
// --------------------

function calculatePoints(score) {

    if (score >= 100) return 50;
    if (score >= 75) return 40;
    if (score >= 50) return 30;
    if (score >= 40) return 20;
    if (score >= 30) return 15;
    if (score >= 20) return 10;
    if (score >= 10) return 5;
    if (score >= 5) return 0;

    return 0;

}

async function savePoints() {

    if (pointsAwarded || !currentUser)
        return;

    pointsAwarded = true;

    const earned = calculatePoints(score);

    if (earned === 0)
        return;

    const ref = doc(db, "users", currentUser.uid);

    await updateDoc(ref, {

        points: increment(earned)

    });

    currentPoints += earned;

    document.getElementById("userPoints").textContent =
        `⭐ ${currentPoints} pts`;

}

// --------------------
// End Game
// --------------------

async function endGame() {

    if (gameOver)
        return;

    gameOver = true;

    clearInterval(pipeInterval);

    await savePoints();

    document.getElementById("gameOver").classList.remove("hide");

    document.getElementById("finalScore").innerHTML =
        `Your Score : ${score}<br>GameXD Points : +${calculatePoints(score)}`;

}

// Restart

document.getElementById("restartBtn").addEventListener("click", () => {

    location.reload();

});

// Start game

startCountdown();

