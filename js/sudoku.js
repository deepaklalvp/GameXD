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

    const board = document.getElementById("sudoku-board");
    const message = document.getElementById("message");

    let solution = [];
    let puzzle = [];

// ---------------- AUTH + USER DATA ----------------
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // ⭐ IMPORTANT FIX
    currentUserUID = user.uid;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {

        const data = snap.data();

        document.getElementById("userName").textContent =
            `Hi, ${data.name}`;

        currentPoints = data.points;

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

    // ---------------- SUDOKU LOGIC ----------------

  function isSafe(board, row, col, num) {

    // Row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // 3x3 Box
    const startRow = row - row % 3;
    const startCol = col - col % 3;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[startRow + r][startCol + c] === num)
                return false;
        }
    }

    return true;
}

function shuffle(arr) {

    for (let i = arr.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function fillBoard(board) {

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (board[row][col] === 0) {

                let numbers = shuffle([1,2,3,4,5,6,7,8,9]);

                for (let num of numbers) {

                    if (isSafe(board,row,col,num)) {

                        board[row][col] = num;

                        if (fillBoard(board))
                            return true;

                        board[row][col] = 0;
                    }
                }

                return false;
            }
        }
    }

    return true;
}

function generateSolution() {

    let board = Array.from({length:9},()=>Array(9).fill(0));

    fillBoard(board);

    return board;
}

  function createPuzzle(solution) {

    let puzzle = solution.map(row => [...row]);

    let cellsToRemove = 45;   // Easy = 35, Medium = 45, Hard = 55

    while (cellsToRemove > 0) {

        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== "") {

            puzzle[row][col] = "";

            cellsToRemove--;
        }
    }

    return puzzle;
}

    function drawBoard(data) {

    board.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            const input = document.createElement("input");
            input.classList.add("cell");

            input.value = data[r][c];

            if (data[r][c] !== "") {
                input.disabled = true;
            }

            input.dataset.row = r;
            input.dataset.col = c;

            // ⭐ THIS IS STEP 1 (NOT getUserBoard)
            if (c % 3 === 0) input.classList.add("left-border");
            if (r % 3 === 0) input.classList.add("top-border");
            if (c === 8) input.classList.add("right-border");
            if (r === 8) input.classList.add("bottom-border");

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

                message.textContent = "❌ Wrong solution. -5 points!";

                // ❌ deduct points
                updatePoints(-5);

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

    // Update local points and UI immediately
    currentPoints += value;

    document.getElementById("userPoints").textContent =
        ` | ⭐ ${currentPoints} pts`;
}
