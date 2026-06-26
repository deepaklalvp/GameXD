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

    const board = document.getElementById("sudoku-board");
    const message = document.getElementById("message");

    let solution = [];
    let puzzle = [];

   let currentUserUID = null;

// ---------------- AUTH + USER DATA ----------------
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // ⭐ ADD THIS LINE HERE
    currentUserUID = user.uid;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {

        const data = snap.data();

        const nameEl = document.getElementById("userName");
        const pointsEl = document.getElementById("userPoints");

        if (nameEl) nameEl.textContent = `Hi, ${data.name}`;
        if (pointsEl) pointsEl.textContent = ` | ⭐ ${data.points} pts`;
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

    // ---------------- SUDOKU LOGIC ----------------

    function generateSolution() {
        return [
            [1,2,3,4,5,6,7,8,9],
            [4,5,6,7,8,9,1,2,3],
            [7,8,9,1,2,3,4,5,6],
            [2,3,1,5,6,4,8,9,7],
            [5,6,4,8,9,7,2,3,1],
            [8,9,7,2,3,1,5,6,4],
            [3,1,2,6,4,5,9,7,8],
            [6,4,5,9,7,8,3,1,2],
            [9,7,8,3,1,2,6,4,5]
        ];
    }

    function createPuzzle(sol) {
        return sol.map(row =>
            row.map(num => Math.random() > 0.5 ? num : "")
        );
    }

    function drawBoard(data) {

        board.innerHTML = "";

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {

                const input = document.createElement("input");
                input.value = data[r][c];

                if (data[r][c] !== "") {
                    input.disabled = true;
                }

                input.dataset.row = r;
                input.dataset.col = c;

                board.appendChild(input);
            }
        }
    }

    function getUserBoard() {

        const inputs = document.querySelectorAll("input");

        let grid = Array.from({ length: 9 }, () =>
            Array(9).fill(0)
        );

        inputs.forEach(input => {

            let r = input.dataset.row;
            let c = input.dataset.col;

            grid[r][c] = input.value ? parseInt(input.value) : 0;
        });

        return grid;
    }

   function checkBoard() {

    const user = getUserBoard();

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            if (user[r][c] !== solution[r][c]) {

                message.textContent = "❌ Wrong solution. -10 points!";

                // ❌ deduct points
                updatePoints(-10);

                return;
            }
        }
    }

    message.textContent = "🎉 Correct! +10 points!";

    // 🎉 reward points
    updatePoints(10);
}

    function newGame() {
        solution = generateSolution();
        puzzle = createPuzzle(solution);
        drawBoard(puzzle);
        message.textContent = "";
    }

    document.getElementById("newGame").addEventListener("click", newGame);
    document.getElementById("check").addEventListener("click", checkBoard);

    newGame();
});

async function updatePoints(value) {

    if (!currentUserUID) return;

    const userRef = doc(db, "users", currentUserUID);

    await updateDoc(userRef, {
        points: increment(value)
    });

    // update UI instantly
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        document.getElementById("userPoints").textContent =
            ` | ⭐ ${snap.data().points} pts`;
    }
}
