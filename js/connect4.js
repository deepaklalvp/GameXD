
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

// AI mode
let playerTurn = true;

// Local mode
let currentPlayer = "R";

// ai / local
let gameMode = "ai";


// =========================================
// LOCAL SCOREBOARD
// =========================================

let player1Score = 0;
let player2Score = 0;

let player1Name = "Player 1";
let player2Name = "Player 2";


// =========================================
// FIREBASE
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

const resetScoreButton =
    document.getElementById("resetScoreBtn");

const logoutButton =
    document.getElementById("logoutBtn");

const gameModeElement =
    document.getElementById("gameMode");

const playerSetup =
    document.getElementById("playerSetup");

const scoreboard =
    document.getElementById("scoreboard");

const player1NameInput =
    document.getElementById("player1Name");

const player2NameInput =
    document.getElementById("player2Name");

const displayPlayer1 =
    document.getElementById("displayPlayer1");

const displayPlayer2 =
    document.getElementById("displayPlayer2");

const player1ScoreElement =
    document.getElementById("player1Score");

const player2ScoreElement =
    document.getElementById("player2Score");


// =========================================
// CREATE BOARD
// =========================================

function createBoard() {

    board = [];

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

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


    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            const cell =
                document.createElement("div");


            cell.classList.add("cell");


            if (
                board[row][col] === "R"
            ) {

                cell.classList.add("red");

            }


            if (
                board[row][col] === "Y"
            ) {

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

    if (gameOver) {
        return;
    }


    // =====================================
    // LOCAL 2 PLAYER
    // =====================================

    if (gameMode === "local") {

        localPlayerMove(col);

        return;
    }


    // =====================================
    // VS AI
    // =====================================

    if (gameMode === "ai") {

        if (!playerTurn) {
            return;
        }

        playerMove(col);

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

    if (gameOver) {
        return;
    }


    if (!playerTurn) {
        return;
    }


    const row =
        getEmptyRow(col);


    if (row === -1) {
        return;
    }


    board[row][col] = "R";

    drawBoard();


    // Player wins

    if (checkWin("R")) {

        endAIGame(
            "🎉 You Win! +10 Points",
            10
        );

        return;
    }


    // Draw

    if (isDraw()) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // AI's turn

    playerTurn = false;

    updateTurnStatus();


    setTimeout(() => {

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


    if (
        availableColumns.length === 0
    ) {
        return;
    }


    // Try to win

    const winningColumn =
        findWinningMove("Y");


    // Block player

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


    if (row === -1) {
        return;
    }


    board[row][selectedColumn] = "Y";

    drawBoard();


    // AI wins

    if (checkWin("Y")) {

        endAIGame(
            "😔 AI Wins! -5 Points",
            -5
        );

        return;
    }


    // Draw

    if (isDraw()) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // Player's turn

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


        if (row === -1) {
            continue;
        }


        board[row][col] = player;


        const win =
            findWinningPattern(player)
            !== null;


        board[row][col] = "";


        if (win) {
            return col;
        }
    }


    return -1;
}


// =========================================
// LOCAL 2 PLAYER MOVE
// =========================================

function localPlayerMove(col) {

    if (gameOver) {
        return;
    }


    const row =
        getEmptyRow(col);


    if (row === -1) {
        return;
    }


    // Place piece

    board[row][col] =
        currentPlayer;


    drawBoard();


    // =====================================
    // WIN
    // =====================================

    if (
        checkWin(currentPlayer)
    ) {

        if (
            currentPlayer === "R"
        ) {

            player1Score++;

            updateScoreboard();


            endLocalGame(
                `🎉 ${player1Name} Wins! 🔴`
            );

        }

        else {

            player2Score++;

            updateScoreboard();


            endLocalGame(
                `🎉 ${player2Name} Wins! 🟡`
            );
        }


        return;
    }


    // =====================================
    // DRAW
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

    if (
        currentPlayer === "R"
    ) {

        currentPlayer = "Y";

    }

    else {

        currentPlayer = "R";
    }


    updateTurnStatus();
}


// =========================================
// UPDATE SCOREBOARD
// =========================================

function updateScoreboard() {

    player1ScoreElement.textContent =
        player1Score;

    player2ScoreElement.textContent =
        player2Score;


    displayPlayer1.textContent =
        player1Name;

    displayPlayer2.textContent =
        player2Name;
}


// =========================================
// UPDATE PLAYER NAMES
// =========================================

function updatePlayerNames() {

    const name1 =
        player1NameInput.value.trim();


    const name2 =
        player2NameInput.value.trim();


    player1Name =
        name1 || "Player 1";


    player2Name =
        name2 || "Player 2";


    updateScoreboard();
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
    // LOCAL
    // =====================================

    if (
        gameMode === "local"
    ) {

        if (
            currentPlayer === "R"
        ) {

            statusElement.textContent =
                `${player1Name}'s Turn 🔴`;

        }

        else {

            statusElement.textContent =
                `${player2Name}'s Turn 🟡`;
        }
    }
}


// =========================================
// WIN CHECK
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

async function endAIGame(
    message,
    points
) {

    gameOver = true;

    playerTurn = false;


    statusElement.textContent =
        message;


    // Firebase points ONLY
    // in AI mode

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


    // IMPORTANT:
    // No Firebase points here.

    statusElement.textContent =
        `${message} — No points awarded`;
}


// =========================================
// FIREBASE POINT UPDATE
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
// SHOW / HIDE LOCAL UI
// =========================================

function updateModeUI() {

    if (
        gameMode === "local"
    ) {

        playerSetup.style.display =
            "flex";

        scoreboard.style.display =
            "flex";

        resetScoreButton.style.display =
            "inline-block";


        updatePlayerNames();

    }

    else {

        playerSetup.style.display =
            "none";

        scoreboard.style.display =
            "none";

        resetScoreButton.style.display =
            "none";
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


        // Switching modes starts
        // a fresh local scoreboard.

        if (
            gameMode === "local"
        ) {

            player1Score = 0;

            player2Score = 0;


            updatePlayerNames();

        }


        updateModeUI();

        createBoard();
    }
);


// =========================================
// PLAYER NAME CHANGES
// =========================================

player1NameInput.addEventListener(
    "input",
    () => {

        if (
            gameMode === "local"
        ) {

            updatePlayerNames();

            updateTurnStatus();
        }
    }
);


player2NameInput.addEventListener(
    "input",
    () => {

        if (
            gameMode === "local"
        ) {

            updatePlayerNames();

            updateTurnStatus();
        }
    }
);


// =========================================
// RESET SCORE
// =========================================

resetScoreButton.addEventListener(
    "click",
    () => {

        player1Score = 0;

        player2Score = 0;


        updateScoreboard();


        // Also start a fresh round

        createBoard();
    }
);


// =========================================
// RESTART ROUND
// =========================================

restartButton.addEventListener(
    "click",
    () => {

        // IMPORTANT:
        // Restart does NOT reset
        // local 2-player scores.

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


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.data();


                currentPoints =
                    data.points || 0;


                document.getElementById(
                    "userName"
                ).textContent =
                    `Hi, ${data.name || "Player"}`;


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
// INITIAL UI
// =========================================

updateModeUI();


// =========================================
// START GAME
// =========================================

createBoard();
