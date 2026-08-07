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


// ===============================
// GAME SETTINGS
// ===============================

const ROWS = 6;
const COLS = 7;

let board = [];

let gameOver = false;
let playerTurn = true;

let currentUserUID = null;
let currentPoints = 0;


// ===============================
// ELEMENTS
// ===============================

const boardElement =
    document.getElementById("board");

const statusElement =
    document.getElementById("status");

const restartButton =
    document.getElementById("restartBtn");

const logoutButton =
    document.getElementById("logoutBtn");


// ===============================
// CREATE BOARD
// ===============================

function createBoard() {

    board = [];

    for (let row = 0; row < ROWS; row++) {

        board.push(
            Array(COLS).fill("")
        );

    }

    gameOver = false;
    playerTurn = true;

    drawBoard();

    statusElement.textContent =
        "Your Turn 🔴";
}


// ===============================
// DRAW BOARD
// ===============================

function drawBoard() {

    boardElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            if (board[row][col] === "R") {

                cell.classList.add("red");

            }

            if (board[row][col] === "Y") {

                cell.classList.add("yellow");

            }

            cell.addEventListener(
                "click",
                () => playerMove(col)
            );

            boardElement.appendChild(cell);

        }

    }

}


// ===============================
// FIND EMPTY ROW
// ===============================

function getEmptyRow(col) {

    for (
        let row = ROWS - 1;
        row >= 0;
        row--
    ) {

        if (board[row][col] === "") {

            return row;

        }

    }

    return -1;
}


// ===============================
// PLAYER MOVE
// ===============================

function playerMove(col) {

    if (gameOver) return;

    if (!playerTurn) return;

    const row = getEmptyRow(col);

    if (row === -1) return;

    board[row][col] = "R";

    drawBoard();


    // Player wins
    if (checkWin("R")) {

        endGame(
            "🎉 You Win! +10 Points",
            10,
            row,
            col
        );

        return;
    }


    // Draw
    if (isDraw()) {

        endGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    playerTurn = false;

    statusElement.textContent =
        "🤖 AI Thinking...";

    setTimeout(aiMove, 500);
}


// ===============================
// AI MOVE
// ===============================

function aiMove() {

    if (gameOver) return;


    let columns = [];

    for (let col = 0; col < COLS; col++) {

        if (getEmptyRow(col) !== -1) {

            columns.push(col);

        }

    }


    if (columns.length === 0) return;


    // Try to win
    let winningColumn =
        findWinningMove("Y");

    // Block player
    let blockingColumn =
        findWinningMove("R");


    let selectedColumn;


    if (winningColumn !== -1) {

        selectedColumn =
            winningColumn;

    }

    else if (blockingColumn !== -1) {

        selectedColumn =
            blockingColumn;

    }

    else {

        // Prefer middle
        if (
            columns.includes(3) &&
            Math.random() < 0.6
        ) {

            selectedColumn = 3;

        }

        else {

            selectedColumn =
                columns[
                    Math.floor(
                        Math.random() *
                        columns.length
                    )
                ];

        }

    }


    const row =
        getEmptyRow(selectedColumn);

    board[row][selectedColumn] = "Y";

    drawBoard();


    // AI wins
    if (checkWin("Y")) {

        endGame(
            "😔 AI Wins! -5 Points",
            -5
        );

        return;
    }


    // Draw
    if (isDraw()) {

        endGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    playerTurn = true;

    statusElement.textContent =
        "Your Turn 🔴";
}


// ===============================
// FIND WINNING MOVE
// ===============================

function findWinningMove(player) {

    for (let col = 0; col < COLS; col++) {

        const row = getEmptyRow(col);

        if (row === -1) continue;

        board[row][col] = player;

        const win =
            checkWin(player);

        board[row][col] = "";

        if (win) {

            return col;

        }

    }

    return -1;
}


// ===============================
// CHECK WIN
// ===============================

function checkWin(player) {


    // Horizontal
    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col <= COLS - 4;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player
            ) {

                highlightWin([
                    [row, col],
                    [row, col + 1],
                    [row, col + 2],
                    [row, col + 3]
                ]);

                return true;
            }

        }

    }


    // Vertical
    for (
        let row = 0;
        row <= ROWS - 4;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player
            ) {

                highlightWin([
                    [row, col],
                    [row + 1, col],
                    [row + 2, col],
                    [row + 3, col]
                ]);

                return true;
            }

        }

    }


    // Diagonal \
    for (
        let row = 0;
        row <= ROWS - 4;
        row++
    ) {

        for (
            let col = 0;
            col <= COLS - 4;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player
            ) {

                highlightWin([
                    [row, col],
                    [row + 1, col + 1],
                    [row + 2, col + 2],
                    [row + 3, col + 3]
                ]);

                return true;
            }

        }

    }


    // Diagonal /
    for (
        let row = 0;
        row <= ROWS - 4;
        row++
    ) {

        for (
            let col = 3;
            col < COLS;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col - 1] === player &&
                board[row + 2][col - 2] === player &&
                board[row + 3][col - 3] === player
            ) {

                highlightWin([
                    [row, col],
                    [row + 1, col - 1],
                    [row + 2, col - 2],
                    [row + 3, col - 3]
                ]);

                return true;
            }

        }

    }


    return false;
}


// ===============================
// HIGHLIGHT WIN
// ===============================

function highlightWin(pattern) {

    const cells =
        document.querySelectorAll(".cell");


    pattern.forEach(([row, col]) => {

        const index =
            row * COLS + col;

        cells[index].classList.add("win");

    });

}


// ===============================
// DRAW CHECK
// ===============================

function isDraw() {

    return board[0].every(
        cell => cell !== ""
    );

}


// ===============================
// END GAME
// ===============================

async function endGame(message, points) {

    gameOver = true;
    playerTurn = false;

    statusElement.textContent = message;


    if (points !== 0) {

        await updatePoints(points);

    }

}


// ===============================
// FIREBASE POINTS
// ===============================

async function updatePoints(value) {

    if (!currentUserUID) return;


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUserUID
            );


        await updateDoc(
            userRef,
            {
                points: increment(value)
            }
        );


        currentPoints += value;


        document.getElementById(
            "userPoints"
        ).textContent =
            ` | ⭐ ${currentPoints} pts`;

    }

    catch (error) {

        console.error(
            "Error updating points:",
            error
        );

    }

}


// ===============================
// RESTART
// ===============================

restartButton.addEventListener(
    "click",
    createBoard
);


// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            location.href =
                "index.html";

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// ===============================
// FIREBASE AUTH
// ===============================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            location.href =
                "index.html";

            return;
        }


        currentUserUID =
            user.uid;


        try {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (snapshot.exists()) {

                const data =
                    snapshot.data();


                currentPoints =
                    data.points || 0;


                document.getElementById(
                    "userName"
                ).textContent =
                    `Hi, ${data.name}`;


                document.getElementById(
                    "userPoints"
                ).textContent =
                    ` | ⭐ ${currentPoints} pts`;

            }

        }

        catch (error) {

            console.error(
                "Failed to load user:",
                error
            );

        }

    }
);


// ===============================
// START GAME
// ===============================

createBoard();
