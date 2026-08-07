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


// =========================================
// GAME SETTINGS
// =========================================

const ROWS = 6;
const COLS = 7;


// =========================================
// GAME STATE
// =========================================

let board = [];

let gameOver = false;

let playerTurn = true;

let currentPlayer = "R";

let gameMode = "ai";


// =========================================
// FIREBASE STATE
// =========================================

let currentUserUID = null;

let currentPoints = 0;


// =========================================
// ELEMENTS
// =========================================

const boardElement =
    document.getElementById("board");

const statusElement =
    document.getElementById("status");

const restartButton =
    document.getElementById("restartBtn");

const logoutButton =
    document.getElementById("logoutBtn");

const gameModeElement =
    document.getElementById("gameMode");


// =========================================
// CREATE BOARD
// =========================================

function createBoard() {

    board = [];

    for (let row = 0; row < ROWS; row++) {

        board.push(
            Array(COLS).fill("")
        );

    }

    gameOver = false;

    playerTurn = true;

    currentPlayer = "R";

    drawBoard();

    updateTurnStatus();
}


// =========================================
// DRAW BOARD
// =========================================

function drawBoard() {

    boardElement.innerHTML = "";


    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");


            if (board[row][col] === "R") {

                cell.classList.add("red");

            }


            if (board[row][col] === "Y") {

                cell.classList.add("yellow");

            }


            cell.dataset.row = row;

            cell.dataset.col = col;


            cell.addEventListener(
                "click",
                () => handleCellClick(col)
            );


            boardElement.appendChild(cell);

        }

    }

}


// =========================================
// HANDLE CLICK
// =========================================

function handleCellClick(col) {

    if (gameOver) return;

    if (!playerTurn) return;


    // AI mode
    if (gameMode === "ai") {

        playerMove(col);

        return;

    }


    // 2 PLAYER MODE
    if (gameMode === "local") {

        localPlayerMove(col);

    }

}


// =========================================
// GET EMPTY ROW
// =========================================

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


// =========================================
// AI MODE - PLAYER MOVE
// =========================================

function playerMove(col) {

    const row =
        getEmptyRow(col);


    if (row === -1) return;


    board[row][col] = "R";

    drawBoard();


    // PLAYER WIN

    if (checkWin("R")) {

        endGame(
            "🎉 You Win! +10 Points",
            10
        );

        return;

    }


    // DRAW

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


    setTimeout(
        aiMove,
        500
    );

}


// =========================================
// AI MOVE
// =========================================

function aiMove() {

    if (gameOver) return;


    const availableColumns = [];


    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        if (
            getEmptyRow(col) !== -1
        ) {

            availableColumns.push(col);

        }

    }


    if (
        availableColumns.length === 0
    ) {

        return;

    }


    // Try to win

    const winningColumn =
        findWinningMove("Y");


    // Try to block player

    const blockingColumn =
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

    else if (
        availableColumns.includes(3)
    ) {

        // Prefer center column

        if (Math.random() < 0.65) {

            selectedColumn = 3;

        }

        else {

            selectedColumn =
                randomColumn(
                    availableColumns
                );

        }

    }

    else {

        selectedColumn =
            randomColumn(
                availableColumns
            );

    }


    const row =
        getEmptyRow(
            selectedColumn
        );


    board[row][selectedColumn] = "Y";

    drawBoard();


    // AI WIN

    if (checkWin("Y")) {

        endGame(
            "😔 AI Wins! -5 Points",
            -5
        );

        return;

    }


    // DRAW

    if (isDraw()) {

        endGame(
            "🤝 Draw!",
            0
        );

        return;

    }


    playerTurn = true;

    updateTurnStatus();

}


// =========================================
// RANDOM COLUMN
// =========================================

function randomColumn(columns) {

    return columns[
        Math.floor(
            Math.random() *
            columns.length
        )
    ];

}


// =========================================
// FIND WINNING MOVE
// =========================================

function findWinningMove(player) {

    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        const row =
            getEmptyRow(col);


        if (row === -1) continue;


        board[row][col] = player;


        const win =
            checkWinWithoutHighlight(
                player
            );


        board[row][col] = "";


        if (win) {

            return col;

        }

    }


    return -1;

}


// =========================================
// 2 PLAYER MODE
// =========================================

function localPlayerMove(col) {

    const row =
        getEmptyRow(col);


    if (row === -1) return;


    board[row][col] =
        currentPlayer;


    drawBoard();


    // PLAYER 1 WIN

    if (checkWin(currentPlayer)) {

        if (currentPlayer === "R") {

            endLocalGame(
                "🎉 Player 1 Wins! 🔴"
            );

        }

        else {

            endLocalGame(
                "🎉 Player 2 Wins! 🟡"
            );

        }

        return;

    }


    // DRAW

    if (isDraw()) {

        endLocalGame(
            "🤝 Draw!"
        );

        return;

    }


    // CHANGE PLAYER

    if (currentPlayer === "R") {

        currentPlayer = "Y";

    }

    else {

        currentPlayer = "R";

    }


    updateTurnStatus();

}


// =========================================
// UPDATE TURN STATUS
// =========================================

function updateTurnStatus() {

    if (gameMode === "ai") {

        if (playerTurn) {

            statusElement.textContent =
                "Your Turn 🔴";

        }

        else {

            statusElement.textContent =
                "🤖 AI Thinking...";

        }

        return;

    }


    // LOCAL MODE

    if (currentPlayer === "R") {

        statusElement.textContent =
            "Player 1's Turn 🔴";

    }

    else {

        statusElement.textContent =
            "Player 2's Turn 🟡";

    }

}


// =========================================
// CHECK WIN
// =========================================

function checkWin(player) {

    const pattern =
        findWinningPattern(player);


    if (pattern) {

        highlightWin(pattern);

        return true;

    }


    return false;

}


// =========================================
// FIND WINNING PATTERN
// =========================================

function findWinningPattern(player) {


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

                return [
                    [row, col],
                    [row, col + 1],
                    [row, col + 2],
                    [row, col + 3]
                ];

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

                return [
                    [row, col],
                    [row + 1, col],
                    [row + 2, col],
                    [row + 3, col]
                ];

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

                return [
                    [row, col],
                    [row + 1, col + 1],
                    [row + 2, col + 2],
                    [row + 3, col + 3]
                ];

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

                return [
                    [row, col],
                    [row + 1, col - 1],
                    [row + 2, col - 2],
                    [row + 3, col - 3]
                ];

            }

        }

    }


    return null;

}


// =========================================
// CHECK WIN WITHOUT HIGHLIGHT
// =========================================

function checkWinWithoutHighlight(player) {

    return findWinningPattern(player) !== null;

}


// =========================================
// HIGHLIGHT WIN
// =========================================

function highlightWin(pattern) {

    const cells =
        document.querySelectorAll(
            ".cell"
        );


    pattern.forEach(
        ([row, col]) => {

            const index =
                row * COLS + col;


            if (cells[index]) {

                cells[index]
                    .classList
                    .add("win");

            }

        }
    );

}


// =========================================
// DRAW CHECK
// =========================================

function isDraw() {

    return board[0].every(
        cell => cell !== ""
    );

}


// =========================================
// AI GAME END
// =========================================

async function endGame(
    message,
    points
) {

    gameOver = true;

    playerTurn = false;

    statusElement.textContent =
        message;


    // IMPORTANT:
    // Points are updated ONLY
    // in Vs AI mode.

    if (
        gameMode === "ai" &&
        points !== 0
    ) {

        await updatePoints(points);

    }

}


// =========================================
// LOCAL GAME END
// =========================================

function endLocalGame(message) {

    gameOver = true;

    playerTurn = false;


    statusElement.textContent =
        `${message} — No points awarded`;

}


// =========================================
// FIREBASE POINTS
// =========================================

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
                points:
                    increment(value)
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


// =========================================
// GAME MODE CHANGE
// =========================================

gameModeElement.addEventListener(
    "change",
    () => {

        gameMode =
            gameModeElement.value;


        createBoard();

    }
);


// =========================================
// RESTART
// =========================================

restartButton.addEventListener(
    "click",
    createBoard
);


// =========================================
// LOGOUT
// =========================================

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


// =========================================
// FIREBASE AUTH
// =========================================

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


// =========================================
// START GAME
// =========================================

createBoard();
