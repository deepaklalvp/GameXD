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

let board = Array(9).fill("");
let gameOver = false;
let difficulty = "easy";

const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

function getEmpty(){
    return board.map((v,i)=>v===""?i:null).filter(v=>v!==null);
}

function checkWin(b,p){
    return winPatterns.some(pattern=>pattern.every(i=>b[i]===p));
}

function updateStatus(msg){
    document.getElementById("status").textContent = msg;
}

function endGame(msg, points){
    updateStatus(msg);
    gameOver = true;
    if(points !== 0) updatePoints(points);
}

// ---------- AI ----------
function aiMove(){

    if(gameOver) return;

    let move;

    if(difficulty === "easy"){
        let empty = getEmpty();
        move = empty[Math.floor(Math.random()*empty.length)];
    }

    else if(difficulty === "medium"){
        move = findWin("O") || findWin("X") || randomMove();
    }

    else {
        move = minimax(board, "O").index;
    }

    board[move] = "O";
    document.querySelectorAll(".cell")[move].textContent = "O";

    if(checkWin(board,"O")){
        endGame("😔 AI Wins!", -5);
        return;
    }

    if(board.every(v=>v!=="")){
        endGame("🤝 Draw!", 0);
        return;
    }

    updateStatus("Your Turn");
}

function randomMove(){
    let empty = getEmpty();
    return empty[Math.floor(Math.random()*empty.length)];
}

function findWin(player){
    for(let i of getEmpty()){
        board[i]=player;
        if(checkWin(board,player)){
            board[i]="";
            return i;
        }
        board[i]="";
    }
    return null;
}

// ---------- MINIMAX ----------
function minimax(newBoard, player){

    let empty = getEmpty();

    if(checkWin(newBoard,"X")) return {score:-10};
    if(checkWin(newBoard,"O")) return {score:10};
    if(empty.length===0) return {score:0};

    let moves=[];

    for(let i of empty){

        let move={index:i};
        newBoard[i]=player;

        let result=minimax(newBoard,player==="O"?"X":"O");
        move.score=result.score;

        newBoard[i]="";
        moves.push(move);
    }

    let best;

    if(player==="O"){
        let bestScore=-999;
        for(let m of moves){
            if(m.score>bestScore){
                bestScore=m.score;
                best=m;
            }
        }
    } else {
        let bestScore=999;
        for(let m of moves){
            if(m.score<bestScore){
                bestScore=m.score;
                best=m;
            }
        }
    }

    return best;
}

// ---------- PLAYER ----------
function playerMove(i,cell){

    if(gameOver || board[i]!=="") return;

    board[i]="X";
    cell.textContent="X";

    if(checkWin(board,"X")){
        endGame("🎉 You Win!",10);
        return;
    }

    if(board.every(v=>v!=="")){
        endGame("🤝 Draw!",0);
        return;
    }

    updateStatus("AI Thinking...");

    setTimeout(aiMove,400);
}

// ---------- RESET ----------
function restart(){
    board=Array(9).fill("");
    gameOver=false;
    document.querySelectorAll(".cell").forEach(c=>c.textContent="");
    updateStatus("Your Turn");
}

// ---------- FIREBASE ----------
async function updatePoints(val){

    if(!currentUserUID) return;

    const ref=doc(db,"users",currentUserUID);

    await updateDoc(ref,{
        points:increment(val)
    });

    currentPoints+=val;

    document.getElementById("userPoints").textContent=
        ` | ⭐ ${currentPoints} pts`;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded",()=>{

    document.querySelectorAll(".cell").forEach((c,i)=>{
        c.addEventListener("click",()=>playerMove(i,c));
    });

    document.getElementById("restartBtn").onclick=restart;

    const diff=document.getElementById("difficulty");
    if(diff) diff.onchange=e=>difficulty=e.target.value;

    onAuthStateChanged(auth,async(user)=>{

        if(!user){
            location.href="index.html";
            return;
        }

        currentUserUID=user.uid;

        const snap=await getDoc(doc(db,"users",user.uid));

        if(snap.exists()){
            const data=snap.data();
            currentPoints=data.points;

            document.getElementById("userName").textContent=`Hi, ${data.name}`;
            document.getElementById("userPoints").textContent=` | ⭐ ${currentPoints} pts`;
        }
    });

    document.getElementById("logoutBtn").onclick=()=>{
        signOut(auth).then(()=>location.href="index.html");
    };
});
