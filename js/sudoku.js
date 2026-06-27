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

            document.getElementById("userName").textContent = `Hi, ${data.name}`;

            currentPoints = data.points || 0;

            document.getElementById("userPoints").textContent =
                ` | ⭐ ${currentPoints} pts`;
        }
    });

    // ---------------- LOGOUT ----------------
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });

    // ---------------- SUDOKU CORE ----------------

    function isSafe(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
            if (board[x][col] === num) return false;
        }

        const sr = row - row % 3;
        const sc = col - col % 3;

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[sr + r][sc + c] === num) return false;
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
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {

                if (board[r][c] === 0) {

                    let nums = shuffle([1,2,3,4,5,6,7,8,9]);

                    for (let num of nums) {
                        if (isSafe(board, r, c, num)) {

                            board[r][c] = num;

                            if (fillBoard(board)) return true;

                            board[r][c] = 0;
                        }
                    }

                    return false;
                }
            }
        }
        return true;
    }

    function generateSolution() {
        let board = Array.from({ length: 9 }, () => Array(9).fill(0));
        fillBoard(board);
        return board;
    }

    function countSolutions(board, limit = 2) {
        let count = 0;

        function solve() {

            if (count >= limit) return;

            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {

                    if (board[r][c] === 0) {

                        for (let num = 1; num <= 9; num++) {
                            if (isSafe(board, r, c, num)) {

                                board[r][c] = num;
                                solve();
                                board[r][c] = 0;
                            }
                        }

                        return;
                    }
                }
            }

            count++;
        }

        solve();
        return count;
    }

    function createPuzzle(solution) {

        let puzzle = solution.map(r => [...r]);

        let cellsToRemove = 45;

        while (cellsToRemove > 0) {

            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);

            if (puzzle[r][c] !== 0) {

                let backup = puzzle[r][c];
                puzzle[r][c] = 0;

                let copy = puzzle.map(row => [...row]);

                if (countSolutions(copy) !== 1) {
                    puzzle[r][c] = backup;
                    continue;
                }

                cellsToRemove--;
            }
        }

        return puzzle;
    }

    // ---------------- UI ----------------

    function drawBoard(data) {

        board.innerHTML = "";

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {

                const input = document.createElement("input");
                input.classList.add("cell");

                input.value = data[r][c] === 0 ? "" : data[r][c];

                if (data[r][c] !== 0) {
                    input.disabled = true;
                }

                input.dataset.row = r;
                input.dataset.col = c;

                input.addEventListener("input", () => {
                    input.value = input.value.replace(/[^1-9]/g, "").slice(0, 1);
                });

                if (c % 3 === 0) input.classList.add("left-border");
                if (r % 3 === 0) input.classList.add("top-border");
                if (c === 8) input.classList.add("right-border");
                if (r === 8) input.classList.add("bottom-border");

                board.appendChild(input);
            }
        }
    }

    function getUserBoard() {

        let grid = Array.from({ length: 9 }, () => Array(9).fill(0));

        document.querySelectorAll("input").forEach(input => {
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
                    updatePoints(-5);
                    return;
                }
            }
        }

        message.textContent = "🎉 Correct! +10 points!";
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
