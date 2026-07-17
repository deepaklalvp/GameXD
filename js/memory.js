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

const emojis = ["🍎","🍌","🍇","🍓","🍒","🍉","🥝","🍍"];
let cards = [...emojis, ...emojis];

let firstCard = null;
let secondCard = null;
let lock = false;

let matches = 0;
let seconds = 0;
let moves = 0;

let timerInterval;
let timerStarted = false;


// shuffle
cards.sort(()=>Math.random()-0.5);

function createBoard(){

    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    cards.forEach((emoji,index)=>{

        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.emoji = emoji;

        card.addEventListener("click",()=>flip(card));

        grid.appendChild(card);
    });
}

function flip(card){

    if (
        lock ||
        card.classList.contains("flipped") ||
        card.classList.contains("matched")
    ) {
        return;
    }

    // Start timer on first flip
    if (!timerStarted) {
        timerStarted = true;
        startTimer();
    }

    // Show card
    card.textContent = card.dataset.emoji;
    card.classList.add("flipped");

    // First selected card
    if (!firstCard) {
        firstCard = card;
        return;
    }

    // Second selected card
    secondCard = card;

    // Count one move
    moves++;

    document.getElementById("moves").textContent =
        `🔄 Moves: ${moves}`;

    lock = true;

    checkMatch();
}


function checkMatch(){

    if(firstCard.dataset.emoji === secondCard.dataset.emoji){

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        matches++;

        reset();

        if(matches === emojis.length){

    clearInterval(timerInterval);

    document.getElementById("status").innerHTML =
    `🎉 You Win!<br>
    ⏱ Time: ${document.getElementById("timer").textContent.replace("⏱ Time: ","")}<br>
    🔄 Moves: ${moves}`;

    updatePoints(10);
}


    } else {

        setTimeout(()=>{

            firstCard.textContent = "";
            secondCard.textContent = "";

            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            reset();

        },700);
    }
}

function reset(){
    firstCard = null;
    secondCard = null;
    lock = false;
}

function startTimer(){

    timerInterval = setInterval(()=>{

        seconds++;

        const min = String(Math.floor(seconds / 60)).padStart(2,"0");
        const sec = String(seconds % 60).padStart(2,"0");

        document.getElementById("timer").textContent =
            `⏱ Time: ${min}:${sec}`;

    },1000);

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

    createBoard();

    document.getElementById("restart").onclick = () => {

    clearInterval(timerInterval);

    location.reload();
};


    onAuthStateChanged(auth,async(user)=>{

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
