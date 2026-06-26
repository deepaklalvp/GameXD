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

const board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;

const winPatterns = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
];

document.addEventListener("DOMContentLoaded",()=>{

    const status=document.getElementById("status");

    // ---------------- LOGIN ----------------

    onAuthStateChanged(auth,async(user)=>{

        if(!user){
            window.location.href="index.html";
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

    // ---------------- LOGOUT ----------------

    document.getElementById("logoutBtn").onclick=()=>{

        signOut(auth).then(()=>{
            location.href="index.html";
        });

    };

    // ---------------- GAME ----------------

    const cells=document.querySelectorAll(".cell");

    cells.forEach(cell=>{

        cell.addEventListener("click",()=>{

            if(gameOver) return;

            const index=cell.dataset.index;

            if(board[index]!="") return;

            board[index]=currentPlayer;

            cell.textContent=currentPlayer;

            if(checkWinner()){

                status.textContent=`🎉 Player ${currentPlayer} Wins! (+10 pts)`;

                gameOver=true;

                updatePoints(10);

                return;
            }

            if(board.every(x=>x!="")){

                status.textContent="🤝 Draw";

                gameOver=true;

                return;
            }

            currentPlayer=currentPlayer=="X"?"O":"X";

            status.textContent=`Player ${currentPlayer}'s Turn`;

        });

    });

    document.getElementById("restartBtn").onclick=restartGame;

});

function checkWinner(){

    return winPatterns.some(pattern=>{

        return pattern.every(index=>board[index]==currentPlayer);

    });

}

function restartGame(){

    board.fill("");

    currentPlayer="X";

    gameOver=false;

    document.querySelectorAll(".cell").forEach(cell=>{

        cell.textContent="";

    });

    document.getElementById("status").textContent="Player X's Turn";

}

async function updatePoints(value){

    if(!currentUserUID) return;

    const ref=doc(db,"users",currentUserUID);

    await updateDoc(ref,{
        points:increment(value)
    });

    currentPoints+=value;

    document.getElementById("userPoints").textContent=` | ⭐ ${currentPoints} pts`;

}
