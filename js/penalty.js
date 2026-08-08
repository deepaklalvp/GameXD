
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

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const restartBtn = document.getElementById("restartBtn");


// =========================================================
// GAME STATE
// =========================================================

let score = 0;
let lives = 3;

let gameOverState = false;
let shotInProgress = false;


// Result message is drawn directly on canvas
let resultText = "";
let resultColor = "";
let resultTimer = 0;


// =========================================================
// CANVAS SIZE
// =========================================================

function getGameWidth() {
    return canvas.clientWidth;
}

function getGameHeight() {
    return canvas.clientHeight;
}


function setupCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        Math.round(rect.width * dpr);

    canvas.height =
        Math.round(rect.height * dpr);

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


// =========================================================
// GOAL
// =========================================================

function getGoal() {

    const width =
        getGameWidth();

    return {

        x:
            width * 0.12,

        y:
            45,

        width:
            width * 0.76,

        height:
            115
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

    const width =
        getGameWidth();

    const height =
        getGameHeight();

    const goal =
        getGoal();


    keeper.width =
        goal.width * 0.25;


    keeper.y =
        goal.y +
        goal.height -
        keeper.height -
        8;


    if (!keeper.x) {

        keeper.x =
            width / 2;
    }


    keeper.x =
        Math.max(
            goal.x +
            keeper.width / 2,

            Math.min(
                keeper.x,

                goal.x +
                goal.width -
                keeper.width / 2
            )
        );


    if (!shotInProgress) {

        ball.x =
            width / 2;

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


window.addEventListener(
    "resize",
    resizeGame
);


// =========================================================
// DRAW FIELD
// =========================================================

function drawField() {

    const width =
        getGameWidth();

    const height =
        getGameHeight();


    // Main grass gradient

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


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Grass stripes

    const stripeHeight =
        height / 10;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

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


    // Pitch markings

    ctx.strokeStyle =
        "rgba(255,255,255,.22)";

    ctx.lineWidth = 2;


    const goal =
        getGoal();


    // Penalty box

    const boxWidth =
        width * 0.58;

    const boxHeight =
        135;

    const boxX =
        (width - boxWidth) / 2;

    const boxY =
        goal.y +
        goal.height;


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
        "rgba(255,255,255,.80)";

    ctx.fill();


    // Goal

    drawGoal();
}


// =========================================================
// DRAW GOAL
// =========================================================

function drawGoal() {

    const goal =
        getGoal();


    // Net background

    ctx.fillStyle =
        "rgba(245,250,255,.10)";


    ctx.fillRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    // Net vertical lines

    ctx.strokeStyle =
        "rgba(255,255,255,.28)";

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
            goal.y +
            goal.height
        );

        ctx.stroke();
    }


    // Net horizontal lines

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
            goal.x +
            goal.width,
            y
        );

        ctx.stroke();
    }


    // Goal frame

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 7;

    ctx.lineJoin =
        "round";


    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    // Small frame glow

    ctx.shadowColor =
        "rgba(255,255,255,.30)";

    ctx.shadowBlur = 10;

    ctx.strokeStyle =
        "rgba(255,255,255,.75)";

    ctx.lineWidth = 2;


    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    ctx.shadowBlur = 0;
}


// =========================================================
// DRAW GOALKEEPER
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
        "#ffe45a"
    );


    gradient.addColorStop(
        1,
        "#df9700"
    );


    ctx.fillStyle =
        gradient;


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
        "#efb188";


    ctx.beginPath();

    ctx.arc(
        keeper.x,
        y - 9,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Left glove

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


    // Right glove

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
// DRAW FOOTBALL
// =========================================================

function drawBall() {

    const r =
        ball.radius;


    // Ball shadow

    ctx.beginPath();

    ctx.ellipse(
        ball.x,
        ball.y + r * .78,
        r * .90,
        r * .30,
        0,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "rgba(0,0,0,.28)";

    ctx.fill();


    // Ball gradient

    const gradient =
        ctx.createRadialGradient(
            ball.x - r * .35,
            ball.y - r * .40,
            r * .08,
            ball.x,
            ball.y,
            r
        );


    gradient.addColorStop(
        0,
        "#ffffff"
    );


    gradient.addColorStop(
        .60,
        "#f1f3f4"
    );


    gradient.addColorStop(
        1,
        "#bfc5ca"
    );


    // Ball body

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


    // Clip football panels

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
        "#151719";


    // Center pentagon

    drawPolygon(
        ball.x,
        ball.y,
        r * .30,
        5,
        -Math.PI / 2
    );


    // Upper left panel

    drawPolygon(
        ball.x -
        r * .55,

        ball.y -
        r * .25,

        r * .18,

        5,

        -.5
    );


    // Upper right panel

    drawPolygon(
        ball.x +
        r * .55,

        ball.y -
        r * .25,

        r * .18,

        5,

        .5
    );


    // Lower left panel

    drawPolygon(
        ball.x -
        r * .40,

        ball.y +
        r * .50,

        r * .16,

        5,

        -.7
    );


    // Lower right panel

    drawPolygon(
        ball.x +
        r * .40,

        ball.y +
        r * .50,

        r * .16,

        5,

        .7
    );


    ctx.restore();


    // Ball outline

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
// POLYGON
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
            i *
            Math.PI *
            2 /
            sides;


        const px =
            x +
            Math.cos(angle) *
            radius;


        const py =
            y +
            Math.sin(angle) *
            radius;


        if (i === 0) {

            ctx.moveTo(
                px,
                py
            );

        } else {

            ctx.lineTo(
                px,
                py
            );
        }
    }


    ctx.closePath();

    ctx.fill();
}


// =========================================================
// GOALKEEPER MOVEMENT
// =========================================================

function updateKeeper() {

    const goal =
        getGoal();


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
// SHOOT
// =========================================================

canvas.addEventListener(
    "click",
    function (e) {

        if (
            gameOverState ||
            ball.moving ||
            shotInProgress
        ) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        ball.targetX =
            (e.clientX -
                rect.left) *
            (
                getGameWidth() /
                rect.width
            );


        ball.targetY =
            (e.clientY -
                rect.top) *
            (
                getGameHeight() /
                rect.height
            );


        // Don't allow target outside
        // useful playing area

        ball.targetY =
            Math.max(
                30,
                Math.min(
                    ball.targetY,
                    getGameHeight() - 20
                )
            );


        ball.moving = true;

        shotInProgress = true;
    }
);


// =========================================================
// BALL MOVEMENT
// =========================================================

function updateBall() {

    if (!ball.moving) {
        return;
    }


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
        dist <=
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
        (dx / dist) *
        ball.speed;


    ball.y +=
        (dy / dist) *
        ball.speed;
}


// =========================================================
// CHECK SHOT
// =========================================================

function checkShot() {

    if (gameOverState) {
        return;
    }


    const goal =
        getGoal();


    const insideGoal =
        ball.x >
            goal.x &&

        ball.x <
            goal.x +
            goal.width &&

        ball.y >
            goal.y &&

        ball.y <
            goal.y +
            goal.height;


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


    // SAVED

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


    // GOAL

    else if (insideGoal) {

        score++;

        showMessage(
            "⚽ GOAL!",
            "#4dff91"
        );
    }


    // MISS

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

    } else {

        setTimeout(
            resetBall,
            1200
        );
    }
}


// =========================================================
// SHOW RESULT
// Draw directly on canvas
// =========================================================

function showMessage(
    text,
    color
) {

    resultText =
        text;

    resultColor =
        color;

    resultTimer =
        90;
}


// =========================================================
// DRAW RESULT
// =========================================================

function drawResultMessage() {

    if (
        !resultText ||
        resultTimer <= 0
    ) {

        return;
    }


    const width =
        getGameWidth();


    /*
       Put result in the upper
       portion of the FIELD,
       below the goal.

       This prevents it from
       appearing at the bottom
       or outside the canvas.
    */

    const x =
        width / 2;


    const y =
        205;


    // Fade animation

    const progress =
        resultTimer / 90;


    const alpha =
        Math.min(
            1,
            progress * 3
        );


    ctx.save();


    ctx.globalAlpha =
        alpha;


    // Result glass panel

    const boxWidth =
        Math.min(
            width * .68,
            290
        );


    const boxHeight =
        58;


    ctx.fillStyle =
        "rgba(0,0,0,.50)";


    ctx.beginPath();

    ctx.roundRect(
        x -
        boxWidth / 2,

        y -
        boxHeight / 2,

        boxWidth,

        boxHeight,

        16
    );

    ctx.fill();


    // Result text

    ctx.font =
        "900 30px Inter, Arial, sans-serif";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.shadowColor =
        resultColor;


    ctx.shadowBlur =
        20;


    ctx.fillStyle =
        resultColor;


    ctx.fillText(
        resultText,
        x,
        y
    );


    ctx.restore();


    resultTimer--;


    // Clear after animation

    if (
        resultTimer <= 0
    ) {

        resultText = "";
        resultColor = "";
    }
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

    const width =
        getGameWidth();

    const height =
        getGameHeight();


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawField();


    updateKeeper();


    drawKeeper();


    updateBall();


    drawBall();


    // IMPORTANT:
    // Result is drawn LAST,
    // so it appears above everything.

    drawResultMessage();
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


        resultText = "";

        resultColor = "";

        resultTimer = 0;


        scoreEl.textContent =
            score;

        livesEl.textContent =
            lives;


        restartBtn.style.display =
            "none";


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


    if (score >= 15) {

        reward = 100;

    } else if (score >= 11) {

        reward = 75;

    } else if (score >= 8) {

        reward = 50;

    } else if (score >= 5) {

        reward = 25;

    } else if (score >= 3) {

        reward = 10;
    }


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


        try {

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

        } catch (error) {

            console.error(
                "Firebase user loading error:",
                error
            );
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
        async () => {

            try {

                await signOut(auth);

                location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
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
    ) {

        return;
    }


    try {

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

    } catch (error) {

        console.error(
            "Point update error:",
            error
        );
    }
}


// =========================================================
// INITIALIZE
// =========================================================

setupCanvas();

positionObjects();

resetBall();

gameLoop();
