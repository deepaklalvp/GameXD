
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


// =========================================================
// FIREBASE
// =========================================================

let currentUserUID = null;
let currentPoints = 0;


// =========================================================
// CANVAS
// =========================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// Make canvas rendering sharper
function setupCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}


// =========================================================
// UI
// =========================================================

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const restartBtn = document.getElementById("restartBtn");
const message = document.getElementById("message");


// =========================================================
// GAME STATE
// =========================================================

let score = 0;
let lives = 3;

let gameOverState = false;
let shotInProgress = false;


// =========================================================
// FIELD DIMENSIONS
// =========================================================

function getGameWidth() {
    return canvas.getBoundingClientRect().width;
}

function getGameHeight() {
    return canvas.getBoundingClientRect().height;
}


// =========================================================
// GOAL
// =========================================================

function getGoal() {

    const width = getGameWidth();

    return {
        x: width * 0.12,
        y: 45,
        width: width * 0.76,
        height: 115
    };
}


// =========================================================
// GOALKEEPER
// =========================================================

const keeper = {
    x: 0,
    y: 0,
    width: 0,
    height: 24,
    speed: 2.4,
    dir: 1
};


// =========================================================
// BALL
// =========================================================

const ball = {

    x: 0,
    y: 0,

    radius: 14,

    targetX: 0,
    targetY: 0,

    moving: false,

    speed: 10
};


// =========================================================
// POSITION OBJECTS
// =========================================================

function positionObjects() {

    const width = getGameWidth();
    const height = getGameHeight();

    const goal = getGoal();

    keeper.width = goal.width * 0.25;

    keeper.x = Math.max(
        goal.x + keeper.width / 2,
        Math.min(
            keeper.x || width / 2,
            goal.x + goal.width - keeper.width / 2
        )
    );

    keeper.y =
        goal.y +
        goal.height -
        keeper.height -
        8;


    if (!shotInProgress) {

        ball.x = width / 2;

        ball.y =
            height - 115;

    }
}


// =========================================================
// RESIZE
// =========================================================

function resizeGame() {

    setupCanvas();

    positionObjects();

    draw();

}


window.addEventListener("resize", resizeGame);


// =========================================================
// FIELD
// =========================================================

function drawField() {

    const width = getGameWidth();
    const height = getGameHeight();

    // Base pitch
    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    gradient.addColorStop(
        0,
        "#168044"
    );

    gradient.addColorStop(
        1,
        "#075126"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Grass stripes
    const stripeHeight = height / 10;

    for (let i = 0; i < 10; i++) {

        ctx.fillStyle =
            i % 2 === 0
                ? "rgba(255,255,255,.035)"
                : "rgba(0,0,0,.035)";

        ctx.fillRect(
            0,
            i * stripeHeight,
            width,
            stripeHeight
        );

    }


    // Subtle pitch lines

    ctx.strokeStyle =
        "rgba(255,255,255,.20)";

    ctx.lineWidth = 2;


    // Penalty box

    const boxWidth =
        width * 0.58;

    const boxHeight = 135;

    const boxX =
        (width - boxWidth) / 2;

    const boxY =
        getGoal().y +
        getGoal().height;


    ctx.strokeRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );


    // Penalty spot

    ctx.beginPath();

    ctx.arc(
        width / 2,
        boxY + 88,
        4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(255,255,255,.75)";

    ctx.fill();


    drawGoal();
}


// =========================================================
// GOAL
// =========================================================

function drawGoal() {

    const goal = getGoal();


    // Net background

    ctx.fillStyle =
        "rgba(245,250,255,.10)";

    ctx.fillRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    // Net

    ctx.strokeStyle =
        "rgba(255,255,255,.30)";

    ctx.lineWidth = 1;


    for (
        let x = goal.x;
        x <= goal.x + goal.width;
        x += 18
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            goal.y
        );

        ctx.lineTo(
            x,
            goal.y + goal.height
        );

        ctx.stroke();

    }


    for (
        let y = goal.y;
        y <= goal.y + goal.height;
        y += 18
    ) {

        ctx.beginPath();

        ctx.moveTo(
            goal.x,
            y
        );

        ctx.lineTo(
            goal.x + goal.width,
            y
        );

        ctx.stroke();

    }


    // Goal frame

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 7;

    ctx.lineJoin = "round";

    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    // Goal glow

    ctx.shadowColor =
        "rgba(255,255,255,.30)";

    ctx.shadowBlur = 12;

    ctx.strokeStyle =
        "rgba(255,255,255,.75)";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );

    ctx.shadowBlur = 0;
}


// =========================================================
// GOALKEEPER
// =========================================================

function drawKeeper() {

    const x =
        keeper.x -
        keeper.width / 2;

    const y =
        keeper.y;

    const w =
        keeper.width;

    const h =
        keeper.height;


    // Body

    const gradient =
        ctx.createLinearGradient(
            x,
            y,
            x,
            y + h
        );

    gradient.addColorStop(
        0,
        "#ffd84a"
    );

    gradient.addColorStop(
        1,
        "#e79b00"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        8
    );

    ctx.fill();


    // Head

    ctx.fillStyle =
        "#f0b58b";

    ctx.beginPath();

    ctx.arc(
        keeper.x,
        y - 9,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Gloves

    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();

    ctx.arc(
        x - 5,
        y + h / 2,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + w + 5,
        y + h / 2,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// =========================================================
// FOOTBALL
// =========================================================

function drawBall() {

    const r = ball.radius;


    // Shadow underneath

    ctx.beginPath();

    ctx.ellipse(
        ball.x,
        ball.y + r * .75,
        r * .9,
        r * .30,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.25)";

    ctx.fill();


    // Football body

    const gradient =
        ctx.createRadialGradient(
            ball.x - r * .35,
            ball.y - r * .4,
            r * .1,
            ball.x,
            ball.y,
            r
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        .65,
        "#f2f4f5"
    );

    gradient.addColorStop(
        1,
        "#c6cbd0"
    );


    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        gradient;

    ctx.fill();


    // Black football panels

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.clip();


    ctx.fillStyle =
        "#17191c";


    // Center pentagon

    drawPolygon(
        ball.x,
        ball.y,
        r * .30,
        5,
        -Math.PI / 2
    );


    // Side panels

    drawPolygon(
        ball.x - r * .55,
        ball.y - r * .25,
        r * .18,
        5,
        -.5
    );


    drawPolygon(
        ball.x + r * .55,
        ball.y - r * .25,
        r * .18,
        5,
        .5
    );


    drawPolygon(
        ball.x - r * .40,
        ball.y + r * .50,
        r * .16,
        5,
        -.7
    );


    drawPolygon(
        ball.x + r * .40,
        ball.y + r * .50,
        r * .16,
        5,
        .7
    );


    ctx.restore();


    // Outline

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(0,0,0,.45)";

    ctx.lineWidth = 1.5;

    ctx.stroke();
}


// =========================================================
// POLYGON HELPER
// =========================================================

function drawPolygon(
    x,
    y,
    radius,
    sides,
    rotation
) {

    ctx.beginPath();

    for (
        let i = 0;
        i < sides;
        i++
    ) {

        const angle =
            rotation +
            i * Math.PI * 2 / sides;

        const px =
            x +
            Math.cos(angle) * radius;

        const py =
            y +
            Math.sin(angle) * radius;

        if (i === 0)
            ctx.moveTo(px, py);
        else
            ctx.lineTo(px, py);

    }

    ctx.closePath();

    ctx.fill();
}


// =========================================================
// KEEPER MOVEMENT
// =========================================================

function updateKeeper() {

    const goal = getGoal();

    keeper.x +=
        keeper.speed *
        keeper.dir;


    if (
        keeper.x -
            keeper.width / 2 <=
        goal.x
    ) {

        keeper.x =
            goal.x +
            keeper.width / 2;

        keeper.dir = 1;
    }


    if (
        keeper.x +
            keeper.width / 2 >=
        goal.x +
            goal.width
    ) {

        keeper.x =
            goal.x +
            goal.width -
            keeper.width / 2;

        keeper.dir = -1;
    }
}


// =========================================================
// BALL CLICK
// =========================================================

canvas.addEventListener(
    "click",
    function (e) {

        if (
            gameOverState ||
            ball.moving ||
            shotInProgress
        )
            return;


        const rect =
            canvas.getBoundingClientRect();


        ball.targetX =
            (e.clientX - rect.left) *
            (getGameWidth() / rect.width);


        ball.targetY =
            (e.clientY - rect.top) *
            (getGameHeight() / rect.height);


        // Prevent shooting behind the goal

        ball.targetY =
            Math.max(
                30,
                ball.targetY
            );


        ball.moving = true;

        shotInProgress = true;
    }
);


// =========================================================
// BALL MOVEMENT
// =========================================================

function updateBall() {

    if (!ball.moving)
        return;


    const dx =
        ball.targetX -
        ball.x;

    const dy =
        ball.targetY -
        ball.y;


    const dist =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        dist <
        ball.speed
    ) {

        ball.x =
            ball.targetX;

        ball.y =
            ball.targetY;

        ball.moving = false;

        checkShot();

        return;
    }


    ball.x +=
        dx / dist *
        ball.speed;

    ball.y +=
        dy / dist *
        ball.speed;
}


// =========================================================
// SHOT RESULT
// =========================================================

function checkShot() {

    if (gameOverState)
        return;


    const goal = getGoal();


    const insideGoal =
        ball.x > goal.x &&
        ball.x <
            goal.x + goal.width &&
        ball.y > goal.y &&
        ball.y <
            goal.y + goal.height;


    const keeperSave =
        ball.x >
            keeper.x -
            keeper.width / 2 -
            ball.radius &&
        ball.x <
            keeper.x +
            keeper.width / 2 +
            ball.radius &&
        ball.y >
            keeper.y -
            ball.radius &&
        ball.y <
            keeper.y +
            keeper.height +
            ball.radius;


    if (
        insideGoal &&
        keeperSave
    ) {

        lives--;

        showMessage(
            "🧤 SAVED!",
            "#ffb52e"
        );

    }

    else if (insideGoal) {

        score++;

        showMessage(
            "⚽ GOAL!",
            "#4dff91"
        );

    }

    else {

        lives--;

        showMessage(
            "❌ MISS!",
            "#ff5570"
        );

    }


    scoreEl.textContent =
        score;

    livesEl.textContent =
        lives;


    if (lives <= 0) {

        gameOverState = true;

        setTimeout(
            gameOver,
            1200
        );

    }

    else {

        setTimeout(
            resetBall,
            1200
        );
    }
}


// =========================================================
// RESULT MESSAGE
// =========================================================

function showMessage(
    text,
    color
) {

    if (!message)
        return;


    message.textContent =
        text;

    message.style.color =
        color;


    // Keep message above the canvas
    message.style.top =
        "82px";


    message.style.left =
        "50%";


    message.style.transform =
        "translateX(-50%)";


    message.style.opacity =
        "1";


    message.classList.add(
        "show"
    );


    setTimeout(
        () => {

            message.classList.remove(
                "show"
            );

        },
        1200
    );
}


// =========================================================
// RESET BALL
// =========================================================

function resetBall() {

    const width =
        getGameWidth();

    const height =
        getGameHeight();


    ball.x =
        width / 2;

    ball.y =
        height - 115;


    ball.targetX =
        ball.x;

    ball.targetY =
        ball.y;


    ball.moving = false;

    shotInProgress = false;
}


// =========================================================
// DRAW EVERYTHING
// =========================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        getGameWidth(),
        getGameHeight()
    );


    drawField();

    updateKeeper();

    drawKeeper();

    updateBall();

    drawBall();
}


// =========================================================
// GAME LOOP
// =========================================================

function gameLoop() {

    draw();

    requestAnimationFrame(
        gameLoop
    );
}


// =========================================================
// RESTART
// =========================================================

restartBtn.addEventListener(
    "click",
    () => {

        score = 0;

        lives = 3;

        gameOverState = false;

        shotInProgress = false;


        scoreEl.textContent =
            score;

        livesEl.textContent =
            lives;


        restartBtn.style.display =
            "none";


        message.classList.remove(
            "show"
        );


        resetBall();
    }
);


// =========================================================
// GAME OVER
// =========================================================

async function gameOver() {

    gameOverState = true;

    shotInProgress = false;


    let reward = 0;


    if (score >= 15)
        reward = 100;

    else if (score >= 11)
        reward = 75;

    else if (score >= 8)
        reward = 50;

    else if (score >= 5)
        reward = 25;

    else if (score >= 3)
        reward = 10;


    await updatePoints(
        reward
    );


    alert(
        `Game Over!\n\n` +
        `Goals: ${score}\n` +
        `Reward: ⭐ ${reward}`
    );


    restartBtn.style.display =
        "inline-block";
}


// =========================================================
// FIREBASE AUTH
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            location.href =
                "index.html";

            return;
        }


        currentUserUID =
            user.uid;


        const snap =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        if (snap.exists()) {

            const data =
                snap.data();


            currentPoints =
                data.points || 0;


            const userName =
                document.getElementById(
                    "userName"
                );


            const userPoints =
                document.getElementById(
                    "userPoints"
                );


            if (userName) {

                userName.textContent =
                    `Hi, ${data.name || "Player"}`;
            }


            if (userPoints) {

                userPoints.textContent =
                    `⭐ ${currentPoints} pts`;
            }
        }
    }
);


// =========================================================
// LOGOUT
// =========================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            signOut(auth)
                .then(
                    () => {

                        location.href =
                            "index.html";
                    }
                );
        }
    );
}


// =========================================================
// FIREBASE POINTS
// =========================================================

async function updatePoints(points) {

    if (
        !currentUserUID ||
        points === 0
    )
        return;


    const ref =
        doc(
            db,
            "users",
            currentUserUID
        );


    await updateDoc(
        ref,
        {
            points:
                increment(points)
        }
    );


    currentPoints +=
        points;


    const userPoints =
        document.getElementById(
            "userPoints"
        );


    if (userPoints) {

        userPoints.textContent =
            `⭐ ${currentPoints} pts`;
    }
}


// =========================================================
// INITIALIZE
// =========================================================

resizeGame();

resetBall();

gameLoop();
