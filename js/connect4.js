
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
// CONNECT FOUR SETTINGS
// =========================================

const ROWS = 6;
const COLS = 7;


// =========================================
// GAME STATE
// =========================================

let board = [];

let gameOver = false;

// Used only for AI mode
let playerTurn = true;

// Used only for 2-player mode
let currentPlayer = "R";

// "ai" = Player vs AI
// "local" = Player 1 vs Player 2
let gameMode = "ai";


// =========================================
// FIREBASE STATE
// =========================================

let currentUserUID = null;
let currentPoints = 0;


// =========================================
// HTML ELEMENTS
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
// CREATE / RESET BOARD
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

            // Red piece
            if (board[row][col] === "R") {

                cell.classList.add("red");

            }

            // Yellow piece
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
// HANDLE BOARD CLICK
// =========================================

function handleCellClick(col) {

    // Game already finished
    if (gameOver) {
        return;
    }


    // =====================================
    // LOCAL 2 PLAYER MODE
    // =====================================

    if (gameMode === "local") {

        localPlayerMove(col);

        return;
    }


    // =====================================
    // VS AI MODE
    // =====================================

    if (gameMode === "ai") {

        // Don't allow clicking while AI moves
        if (!playerTurn) {
            return;
        }

        playerMove(col);

        return;
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
// ===============================
// VS AI MODE
// ===============================
// =========================================


// =========================================
// PLAYER MOVE - AI MODE
// =========================================

function playerMove(col) {

    if (gameOver) {
        return;
    }

    if (!playerTurn) {
        return;
    }


    const row =
        getEmptyRow(col);


    // Column is full
    if (row === -1) {
        return;
    }


    // Place player's red piece
    board[row][col] = "R";

    drawBoard();


    // =====================================
    // PLAYER WINS
    // =====================================

    if (checkWin("R")) {

        endAIGame(
            "🎉 You Win! +10 Points",
            10
        );

        return;
    }


    // =====================================
    // DRAW
    // =====================================

    if (isDraw()) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // =====================================
    // AI'S TURN
    // =====================================

    playerTurn = false;

    updateTurnStatus();


    // IMPORTANT:
    // AI is ONLY called here in AI mode.

    setTimeout(() => {

        // Check again in case
        // the user changed mode/restarted
        if (
            gameOver ||
            gameMode !== "ai"
        ) {
            return;
        }

        aiMove();

    }, 500);
}


// =========================================
// AI MOVE
// =========================================

function aiMove() {

    // Safety checks
    if (gameOver) {
        return;
    }

    if (gameMode !== "ai") {
        return;
    }


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


    // No moves available
    if (
        availableColumns.length === 0
    ) {
        return;
    }


    // =====================================
    // AI STRATEGY
    // =====================================

    // 1. Try to win
    const winningColumn =
        findWinningMove("Y");


    // 2. Block player
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
        // most of the time

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


    // =====================================
    // PLACE AI PIECE
    // =====================================

    const row =
        getEmptyRow(selectedColumn);


    if (row === -1) {
        return;
    }


    board[row][selectedColumn] = "Y";

    drawBoard();


    // =====================================
    // AI WINS
    // =====================================

    if (checkWin("Y")) {

        endAIGame(
            "😔 AI Wins! -5 Points",
            -5
        );

        return;
    }


    // =====================================
    // DRAW
    // =====================================

    if (isDraw()) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // =====================================
    // PLAYER'S TURN AGAIN
    // =====================================

    playerTurn = true;

    updateTurnStatus();
}


// =========================================
// RANDOM COLUMN
// =========================================

function randomColumn(columns) {

    return columns[
        Math.floor(
            Math.random() * columns.length
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


        if (row === -1) {
            continue;
        }


        // Temporarily place piece
        board[row][col] = player;


        const win =
            findWinningPattern(player) !== null;


        // Remove temporary piece
        board[row][col] = "";


        if (win) {
            return col;
        }
    }


    return -1;
}


// =========================================
// ===============================
// LOCAL 2 PLAYER MODE
// ===============================
// =========================================


// =========================================
// LOCAL PLAYER MOVE
// =========================================

function localPlayerMove(col) {

    // Safety check
    if (gameOver) {
        return;
    }


    const row =
        getEmptyRow(col);


    // Column is full
    if (row === -1) {
        return;
    }


    // =====================================
    // PLACE CURRENT PLAYER'S PIECE
    // =====================================

    board[row][col] =
        currentPlayer;


    drawBoard();


    // =====================================
    // CHECK WIN
    // =====================================

    if (
        checkWin(currentPlayer)
    ) {

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


    // =====================================
    // CHECK DRAW
    // =====================================

    if (isDraw()) {

        endLocalGame(
            "🤝 Draw!"
        );

        return;
    }


    // =====================================
    // SWITCH PLAYER
    // =====================================

    if (currentPlayer === "R") {

        currentPlayer = "Y";

    }

    else {

        currentPlayer = "R";
    }


    // =====================================
    // UPDATE STATUS
    // =====================================

    updateTurnStatus();
}


// =========================================
// UPDATE TURN STATUS
// =========================================

function updateTurnStatus() {

    // =====================================
    // VS AI
    // =====================================

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


    // =====================================
    // LOCAL 2 PLAYER
    // =====================================

    if (gameMode === "local") {

        if (currentPlayer === "R") {

            statusElement.textContent =
                "Player 1's Turn 🔴";

        }

        else {

            statusElement.textContent =
                "Player 2's Turn 🟡";
        }

    }
}


// =========================================
// WIN DETECTION
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

    // =====================================
    // HORIZONTAL
    // =====================================

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


    // =====================================
    // VERTICAL
    // =====================================

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


    // =====================================
    // DIAGONAL \
    // =====================================

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


    // =====================================
    // DIAGONAL /
    // =====================================

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
// HIGHLIGHT WINNING PIECES
// =========================================

function highlightWin(pattern) {

    const cells =
        document.querySelectorAll(".cell");


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

async function endAIGame(
    message,
    points
) {

    gameOver = true;

    playerTurn = false;


    statusElement.textContent =
        message;


    // =====================================
    // FIREBASE POINTS
    // ONLY FOR AI MODE
    // =====================================

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


    // NO FIREBASE POINT UPDATE
    // IN LOCAL 2 PLAYER MODE

    statusElement.textContent =
        `${message} — No points awarded`;
}


// =========================================
// UPDATE FIREBASE POINTS
// =========================================

async function updatePoints(value) {

    if (!currentUserUID) {
        return;
    }


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
            "Failed to update points:",
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


        // Completely reset game
        // when switching modes.

        createBoard();
    }
);


// =========================================
// RESTART
// =========================================

restartButton.addEventListener(
    "click",
    () => {

        createBoard();

    }
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
// FIREBASE AUTHENTICATION
// =========================================

onAuthStateChanged(
    auth,
    async user => {

        // =================================
        // NOT LOGGED IN
        // =================================

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


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.data();


                currentPoints =
                    data.points || 0;


                // Username

                document.getElementById(
                    "userName"
                ).textContent =
                    `Hi, ${data.name || "Player"}`;


                // Points

                document.getElementById(
                    "userPoints"
                ).textContent =
                    ` | ⭐ ${currentPoints} pts`;
            }

        }

        catch (error) {

            console.error(
                "Failed to load user data:",
                error
            );
        }
    }
);


// =========================================
// START GAME
// =========================================

createBoard();
