// ================================
// Penalty Kick - Part 1A.1
// Canvas Setup & Game Loop
// ================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Fixed canvas size
canvas.width = 900;
canvas.height = 600;

// -------------------------------
// Game State
// -------------------------------

let gameStarted = false;
let score = 0;
let shots = 0;
let lives = 5;

// -------------------------------
// Goal
// -------------------------------

const goal = {
    x: 250,
    y: 60,
    width: 400,
    height: 120
};

// -------------------------------
// Ball
// -------------------------------

const ball = {
    x: canvas.width / 2,
    y: 520,

    radius: 18,

    targetX: canvas.width / 2,
    targetY: 520,

    speed: 12,

    moving: false
};
// ==========================
// Shot Settings
// ==========================

let canShoot = true;

const BALL_RESET_TIME = 1000;
// -------------------------------
// Goalkeeper
// (Animation comes later)
// -------------------------------

const keeper = {

    x: canvas.width / 2,
    y: 135,

    width: 90,
    height: 80,

    targetX: canvas.width / 2,

    speed: 6,

    diving: false

};
// =======================
// Keeper Positions
// =======================

const KEEPER_LEFT = goal.x + 70;

const KEEPER_CENTER = canvas.width / 2;

const KEEPER_RIGHT = goal.x + goal.width - 70;

// -------------------------------
// Utility
// -------------------------------

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// -------------------------------
// Reset Ball
// -------------------------------

function resetBall(){

    ball.x = canvas.width / 2;

    ball.y = 520;

    ball.targetX = ball.x;

    ball.targetY = ball.y;

    ball.moving = false;

    keeper.targetX = KEEPER_CENTER;

    keeper.diving = true;

}

// =======================
// Goalkeeper AI
// =======================

function keeperDive(){

    const side = Math.floor(Math.random() * 3);

    if(side === 0){

        keeper.targetX = KEEPER_LEFT;

    }
    else if(side === 1){

        keeper.targetX = KEEPER_CENTER;

    }
    else{

        keeper.targetX = KEEPER_RIGHT;

    }

    keeper.diving = true;

}
// =======================
// Animate Keeper
// =======================

function updateKeeper(){

    if(!keeper.diving)
        return;

    const dx = keeper.targetX - keeper.x;

    if(Math.abs(dx) < keeper.speed){

        keeper.x = keeper.targetX;

        keeper.diving = false;

        return;

    }

    keeper.x += Math.sign(dx) * keeper.speed;

}
// ==========================
// Move Ball
// ==========================

function updateBall(){

    if(!ball.moving) return;

    const dx = ball.targetX - ball.x;
    const dy = ball.targetY - ball.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if(distance < ball.speed){

        ball.x = ball.targetX;
        ball.y = ball.targetY;

        ball.moving = false;

        setTimeout(()=>{

            resetBall();

            canShoot = true;

        },BALL_RESET_TIME);

        return;

    }

    ball.x += dx / distance * ball.speed;
    ball.y += dy / distance * ball.speed;

}

// -------------------------------
// Draw Background
// -------------------------------

function drawBackground() {

    // Sky
    ctx.fillStyle = "#6ec6ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grass
    ctx.fillStyle = "#3fa34d";
    ctx.fillRect(0, 120, canvas.width, canvas.height);

}

// -------------------------------
// Draw Grass Stripes
// -------------------------------

function drawGrass() {

    const stripeHeight = 40;

    for (let i = 0; i < 12; i++) {

        ctx.fillStyle =
            i % 2 === 0
                ? "#3fa34d"
                : "#45b854";

        ctx.fillRect(
            0,
            120 + i * stripeHeight,
            canvas.width,
            stripeHeight
        );

    }

}

// -------------------------------
// Draw Penalty Spot
// -------------------------------

function drawPenaltySpot() {

    ctx.beginPath();

    ctx.arc(
        canvas.width / 2,
        500,
        5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "white";

    ctx.fill();

}

// -------------------------------
// Animation Loop
// -------------------------------
// -------------------------------
// Draw Goal
// -------------------------------

function drawGoal() {

    // Net
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );

    // Net pattern
    ctx.strokeStyle = "#bfbfbf";
    ctx.lineWidth = 1;

    // Vertical lines
    for(let x = goal.x; x <= goal.x + goal.width; x += 20){

        ctx.beginPath();
        ctx.moveTo(x, goal.y);
        ctx.lineTo(x, goal.y + goal.height);
        ctx.stroke();

    }

    // Horizontal lines
    for(let y = goal.y; y <= goal.y + goal.height; y += 20){

        ctx.beginPath();
        ctx.moveTo(goal.x, y);
        ctx.lineTo(goal.x + goal.width, y);
        ctx.stroke();

    }

    // Goal posts
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;

    ctx.strokeRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );

}

// -------------------------------
// Draw Penalty Box
// -------------------------------

function drawPenaltyBox(){

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        170,
        120,
        560,
        170
    );

    ctx.beginPath();

    ctx.arc(
        canvas.width / 2,
        290,
        80,
        0,
        Math.PI
    );

    ctx.stroke();

}

// -------------------------------
// Draw Goalkeeper
// -------------------------------

function drawKeeper(){

    ctx.save();

    ctx.translate(keeper.x, keeper.y);

    // Head

    ctx.beginPath();

    ctx.arc(0,0,14,0,Math.PI*2);

    ctx.fillStyle="#ffdbac";

    ctx.fill();

    // Jersey

    ctx.fillStyle="#facc15";

    ctx.fillRect(-18,18,36,42);

    // Arms

    ctx.strokeStyle="#facc15";
    ctx.lineWidth=6;

    let arm = 28;

    if(keeper.diving){

        arm = 45;

    }

    ctx.beginPath();
    ctx.moveTo(-18,25);
    ctx.lineTo(-arm,40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(18,25);
    ctx.lineTo(arm,40);
    ctx.stroke();

    // Legs

    ctx.beginPath();
    ctx.moveTo(-8,60);
    ctx.lineTo(-18,85);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8,60);
    ctx.lineTo(18,85);
    ctx.stroke();

    ctx.restore();

}

// -------------------------------
// Draw Ball
// -------------------------------

function drawBall(){

    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        ball.x,
        ball.y + 16,
        16,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle="rgba(0,0,0,.25)";
    ctx.fill();

    // Ball

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

    ctx.lineWidth=2;
    ctx.strokeStyle="#222";
    ctx.stroke();

    // Center

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        5,
        0,
        Math.PI*2
    );

    ctx.fillStyle="#222";
    ctx.fill();

    // Spin

    if(ball.moving){

        ctx.save();

        ctx.translate(ball.x,ball.y);

        ctx.rotate(Date.now()/120);

        ctx.strokeStyle="#222";

        ctx.beginPath();
        ctx.moveTo(-8,0);
        ctx.lineTo(8,0);
        ctx.stroke();

        ctx.restore();

    }

}

// -------------------------------
// Draw Stadium Banner
// -------------------------------

function drawBanner(){

    ctx.fillStyle = "rgba(0,0,0,.25)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        40
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 22px Poppins";

    ctx.fillText(
        "⚽ GAMEXD PENALTY SHOOTOUT",
        250,
        27
    );

}

function animate(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawBackground();

    drawGrass();

    drawGoal();

    drawPenaltyBox();

    drawPenaltySpot();

    updateBall();
  updateKeeper();

    drawKeeper();

    drawBall();

    drawBanner();

    requestAnimationFrame(animate);

}
animate();

// ==========================
// Shoot
// ==========================

canvas.addEventListener("click",(e)=>{

    if(!canShoot)
        return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Only allow shooting above the ball

    if(mouseY > ball.y)
        return;

    ball.targetX = clamp(mouseX,40,860);
    ball.targetY = clamp(mouseY,40,560);

    ball.moving = true;
  
keeperDive();
    canShoot = false;

    shots++;

    document.getElementById("shots").textContent = shots;

});

