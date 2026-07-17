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
let gameWon = false;


let timerInterval;
let timerStarted = false;


// shuffle
for(let i = cards.length - 1; i > 0; i--){

    const j = Math.floor(Math.random() * (i + 1));

    [cards[i], cards[j]] = [cards[j], cards[i]];
}


function createBoard(){

    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    cards.forEach((emoji,index)=>{

        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.emoji = emoji;

        card.addEventListener("click",async()=>flip(card));


        grid.appendChild(card);
    });
}

async function flip(card){

    if (gameWon) return;


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

    await checkMatch();

}


async function checkMatch(){


    if(firstCard.dataset.emoji === secondCard.dataset.emoji){

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        matches++;

        reset();

        if(matches === emojis.length && !gameWon){

    gameWon = true;

    const reward = getReward(seconds, moves);

    clearInterval(timerInterval);

    document.getElementById("status").innerHTML = `
    <h2>🎉 Congratulations!</h2>

    <p>⏱ Time : ${formatTime(seconds)}</p>

    <p>🔄 Moves : ${moves}</p>

    <p>${"⭐".repeat(reward.stars)} ${reward.title}</p>

    <p>🏅 +${reward.points} GameXD Points</p>
    `;

    await updatePoints(reward.points);
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

function formatTime(seconds){

    const min = String(Math.floor(seconds / 60)).padStart(2,"0");

    const sec = String(seconds % 60).padStart(2,"0");

    return `${min}:${sec}`;

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

function getReward(time, moves){

    if(time <= 45 && moves <= 16){

        return {
            stars: 3,
            points: 20,
            title: "Excellent!"
        };

    }

    if(time <= 75 && moves <= 22){

        return {
            stars: 2,
            points: 15,
            title: "Great!"
        };

    }

    return {
        stars: 1,
        points: 10,
        title: "Good Job!"
    };

}


// ---------- FIREBASE ----------
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
