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

document.addEventListener("DOMContentLoaded", () => {

    const guessInput = document.getElementById("guessInput");
    const message = document.getElementById("message");
    const attemptsText = document.getElementById("attempts");

    let secretNumber;
    let attempts;

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

    document.getElementById("logoutBtn")
        ?.addEventListener("click", () => {

        signOut(auth).then(() => {
            window.location.href = "index.html";
        });

    });

    // ---------------- GAME ----------------

    function newGame() {

        secretNumber = Math.floor(Math.random() * 100) + 1;

        attempts = 10;

        attemptsText.textContent = `Attempts Left : ${attempts}`;

        message.textContent = "";

        guessInput.value = "";

        guessInput.disabled = false;

        document.getElementById("guessBtn").disabled = false;

        console.log(secretNumber); // Remove after testing
    }

    function endGame() {

        guessInput.disabled = true;

        document.getElementById("guessBtn").disabled = true;
    }

    function checkGuess() {

        const guess = parseInt(guessInput.value);

        if (isNaN(guess) || guess < 1 || guess > 100) {

            message.textContent =
                "⚠️ Enter a number between 1 and 100.";

            return;
        }

        attempts--;

        attemptsText.textContent =
            `Attempts Left : ${attempts}`;

        if (guess === secretNumber) {

            message.textContent =
                "🎉 Correct! +10 points!";

            updatePoints(10);

            endGame();

            return;
        }

        if (attempts === 0) {

            message.textContent =
                `❌ You Lost! Number was ${secretNumber}. -5 points!`;

            updatePoints(-5);

            endGame();

            return;
        }

        if (guess < secretNumber) {

            message.textContent =
                "📈 Too Low! Try Again.";

        } else {

            message.textContent =
                "📉 Too High! Try Again.";

        }

        guessInput.value = "";

        guessInput.focus();

    }

    // Allow Enter key

    guessInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {

            checkGuess();

        }

    });

    document
        .getElementById("guessBtn")
        .addEventListener("click", checkGuess);

    document
        .getElementById("newGame")
        .addEventListener("click", newGame);

    newGame();

});

// ---------------- FIRESTORE ----------------

async function updatePoints(value) {

    if (!currentUserUID) return;

    const ref = doc(db, "users", currentUserUID);

    await updateDoc(ref, {
        points: increment(value)
    });

    currentPoints += value;

    document.getElementById("userPoints").textContent =
        ` | ⭐ ${currentPoints} pts`;
}
