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

document.addEventListener("keydown", (e)=>{

    if(e.key==="ArrowLeft" && direction!=="RIGHT") direction="LEFT";
    if(e.key==="ArrowRight" && direction!=="LEFT") direction="RIGHT";
    if(e.key==="ArrowUp" && direction!=="DOWN") direction="UP";
    if(e.key==="ArrowDown" && direction!=="UP") direction="DOWN";
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

    game = setInterval(draw, 150);

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
