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

let snake = [{x:9*box, y:10*box}];
let direction = "RIGHT";
let food = randomFood();
let score = 0;
let game;

function randomFood(){
    return {
        x: Math.floor(Math.random()*19)*box,
        y: Math.floor(Math.random()*19)*box
    };
}

function changeDirection(dir){

    if(dir==="LEFT" && direction!=="RIGHT") direction="LEFT";
    if(dir==="RIGHT" && direction!=="LEFT") direction="RIGHT";
    if(dir==="UP" && direction!=="DOWN") direction="UP";
    if(dir==="DOWN" && direction!=="UP") direction="DOWN";

}

document.addEventListener("keydown", (e)=>{

    if(e.key==="ArrowLeft") changeDirection("LEFT");
    if(e.key==="ArrowRight") changeDirection("RIGHT");
    if(e.key==="ArrowUp") changeDirection("UP");
    if(e.key==="ArrowDown") changeDirection("DOWN");

});
let startX = 0;
let startY = 0;

canvas.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

// Prevent page scrolling while swiping on the canvas
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - startX;
    const dy = endY - startY;

    // Ignore tiny swipes
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) changeDirection("RIGHT");
        else changeDirection("LEFT");
    } else {
        if (dy > 0) changeDirection("DOWN");
        else changeDirection("UP");
    }
});

function draw(){

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,400,400);

    for(let i=0;i<snake.length;i++){
        ctx.fillStyle = i===0 ? "#00ff88" : "#00cc66";
        ctx.fillRect(snake[i].x,snake[i].y,box,box);
    }

    ctx.fillStyle="red";
    ctx.fillRect(food.x,food.y,box,box);

    let head = {...snake[0]};

    if(direction==="LEFT") head.x -= box;
    if(direction==="RIGHT") head.x += box;
    if(direction==="UP") head.y -= box;
    if(direction==="DOWN") head.y += box;

    if(head.x===food.x && head.y===food.y){
        score++;
        food = randomFood();
    } else {
        snake.pop();
    }

    let collision =
        head.x<0 || head.y<0 ||
        head.x>=400 || head.y>=400 ||
        snake.some(s=>s.x===head.x && s.y===head.y);

    if(collision){
        clearInterval(game);
        updatePoints(score >= 5 ? 10 : 0);
        alert("Game Over! Score: " + score);
        return;
    }

    snake.unshift(head);

    document.getElementById("score").textContent = "Score: " + score;
}

// ---------- FIREBASE ----------
async function updatePoints(val){

    if(!currentUserUID) return;

    const ref = doc(db,"users",currentUserUID);

    await updateDoc(ref,{
        points: increment(val)
    });

    currentPoints += val;

    document.getElementById("userPoints").textContent =
        ` | ⭐ ${currentPoints} pts`;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded",()=>{

    startCountdown();

    document.getElementById("restart").onclick = ()=>{
        location.reload();
    };

    onAuthStateChanged(auth, async(user)=>{

        if(!user){
            location.href="index.html";
            return;
        }

        currentUserUID = user.uid;

        const snap = await getDoc(doc(db,"users",user.uid));

        if(snap.exists()){
            const data = snap.data();

            currentPoints = data.points;

            document.getElementById("userName").textContent =
                `Hi, ${data.name}`;

            document.getElementById("userPoints").textContent =
                ` | ⭐ ${currentPoints} pts`;
        }
    });

    document.getElementById("logoutBtn").onclick = ()=>{
        signOut(auth).then(()=>location.href="index.html");
    };

});

function startCountdown(){

    const cd = document.getElementById("countdown");

    let count = 3;

    cd.textContent = count;

    const timer = setInterval(()=>{

        count--;

        if(count>0){
            cd.textContent = count;
        }else if(count===0){
            cd.textContent = "GO!";
        }else{
            clearInterval(timer);
            cd.textContent = "";
            game = setInterval(draw,speed);
        }

    },1000);

}
