let currentUserUID = null;
let currentPoints = 0;

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

// ---------------- WORD LIST ----------------

const words = [
    "Apple","Banana","Car","Laptop","Mountain","River","Ocean","Phone","Table","Chair",
    "School","Doctor","Police","Teacher","Airport","Train","Bus","Rocket","Space","Planet",
    "Lion","Tiger","Elephant","Dog","Cat","Fish","Bird","Snake","Monkey",
    "Cricket","Football","Basketball","Volcano","Forest","Desert","Rain","Cloud","Sun",
    "Moon","Star","Galaxy","Robot","Camera","Watch","Bottle","Shoes","Book"
];

let players = [];
let roles = [];
let impostorIndex = 0;
let current = 0;
let word = "";

document.addEventListener("DOMContentLoaded", () => {

    const playersInput = document.getElementById("players");
    const startBtn = document.getElementById("startBtn");
    const revealBtn = document.getElementById("revealBtn");
    const nextBtn = document.getElementById("nextBtn");
    const roleBox = document.getElementById("roleBox");
    const playerText = document.getElementById("playerText");

    // 🛑 safety check (IMPORTANT)
    if (!startBtn || !playersInput || !revealBtn || !nextBtn) {
        console.error("Missing HTML elements. Check IDs in imposter.html");
        return;
    }

    // ---------------- AUTH ----------------

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            window.location.href = "index.html";
            return;
        }

        currentUserUID = user.uid;

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {

            const data = snap.data();

            document.getElementById("userName").textContent =
                `Hi, ${data.name}`;

            currentPoints = data.points || 0;

            document.getElementById("userPoints").textContent =
                ` | ⭐ ${currentPoints} pts`;
        }
    });

    // ---------------- LOGOUT ----------------

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        });
    }

    // ---------------- GAME START ----------------

    startBtn.addEventListener("click", () => {

        const count = parseInt(playersInput.value);

        if (!count || count < 2) {
            alert("Enter at least 2 players");
            return;
        }

        word = words[Math.floor(Math.random() * words.length)];

        players = Array(count).fill(0);
        roles = Array(count).fill("civilian");

        impostorIndex = Math.floor(Math.random() * count);
        roles[impostorIndex] = "impostor";

        current = 0;

        document.getElementById("setup").style.display = "none";
        document.getElementById("game").style.display = "block";

        showPlayer();
    });

    function showPlayer() {

        playerText.textContent = `Player ${current + 1}`;

        roleBox.textContent = "";

        revealBtn.style.display = "block";
        nextBtn.style.display = "none";
    }

    revealBtn.addEventListener("click", () => {

        if (roles[current] === "impostor") {
            roleBox.textContent = "😈 You are the IMPOSTOR";
        } else {
            roleBox.textContent = `Word: ${word}`;
        }

        revealBtn.style.display = "none";
        nextBtn.style.display = "block";
    });

    nextBtn.addEventListener("click", () => {

        current++;

        if (current >= players.length) {
            alert("All players done!");
            location.reload();
            return;
        }

        showPlayer();
    });

});
