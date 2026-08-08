
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

// Local 2-player mode
let currentPlayer = "R";

// "ai" or "local"
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
// HTML ELEMENTS
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
// LAST MOVE
// =========================================

let lastMove = null;


// =========================================
// CREATE / RESET BOARD
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

    // Remove last-move information
    lastMove = null;


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


            // =================================
            // RED PIECE
            // =================================

            if (
                board[row][col] === "R"
            ) {

                cell.classList.add("red");
            }


            // =================================
            // YELLOW PIECE
            // =================================

            if (
                board[row][col] === "Y"
            ) {

                cell.classList.add("yellow");
            }


            // =================================
            // LAST MOVE INDICATOR
            // =================================

            if (
                lastMove &&
                lastMove.row === row &&
                lastMove.col === col
            ) {

                cell.classList.add(
                    "last-move"
                );
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
// MARK LAST MOVE
// =========================================

function highlightLastMove(row, col) {

    lastMove = {
        row: row,
        col: col
    };


    drawBoard();
}


// =========================================
// HANDLE CELL CLICK
// =========================================

function handleCellClick(col) {

    if (gameOver) {
        return;
    }


    // =====================================
    // LOCAL 2 PLAYER
    // =====================================

    if (
        gameMode === "local"
    ) {

        localPlayerMove(col);

        return;
    }


    // =====================================
    // VS AI
    // =====================================

    if (
        gameMode === "ai"
    ) {

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

        if (
            board[row][col] === ""
        ) {

            return row;
        }
    }


    return -1;
}


// =========================================
// =========================================
// VS AI MODE
// =========================================
// =========================================


// =========================================
// PLAYER MOVE
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


    // Column full
    if (row === -1) {
        return;
    }


    // =====================================
    // PLACE RED PIECE
    // =====================================

    board[row][col] = "R";


    // Mark player's latest move
    highlightLastMove(row, col);


    // =====================================
    // CHECK WIN
    // =====================================

    if (
        checkWin("R")
    ) {

        endAIGame(
            "🎉 You Win! +10 Points",
            10
        );

        return;
    }


    // =====================================
    // CHECK DRAW
    // =====================================

    if (
        isDraw()
    ) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // =====================================
    // AI TURN
    // =====================================

    playerTurn = false;

    updateTurnStatus();


    setTimeout(
        () => {

            // Important safety check.
            // AI cannot run in local mode.

            if (
                gameOver ||
                gameMode !== "ai"
            ) {

                return;
            }


            aiMove();

        },
        500
    );
}


// =========================================
// AI MOVE
// =========================================

function aiMove() {

    if (gameOver) {
        return;
    }


    // Absolute safety check
    if (
        gameMode !== "ai"
    ) {

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


    // No available move
    if (
        availableColumns.length === 0
    ) {

        return;
    }


    // =====================================
    // TRY TO WIN
    // =====================================

    const winningColumn =
        findWinningMove("Y");


    // =====================================
    // BLOCK PLAYER
    // =====================================

    const blockingColumn =
        findWinningMove("R");


    let selectedColumn;


    // Winning move
    if (
        winningColumn !== -1
    ) {

        selectedColumn =
            winningColumn;
    }


    // Blocking move
    else if (
        blockingColumn !== -1
    ) {

        selectedColumn =
            blockingColumn;
    }


    // Prefer center
    else if (
        availableColumns.includes(3)
    ) {

        if (
            Math.random() < 0.65
        ) {

            selectedColumn = 3;
        }

        else {

            selectedColumn =
                randomColumn(
                    availableColumns
                );
        }
    }


    // Random
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


    // =====================================
    // PLACE AI PIECE
    // =====================================

    board[row][selectedColumn] = "Y";


    // Mark AI's latest move
    highlightLastMove(
        row,
        selectedColumn
    );


    // =====================================
    // AI WINS
    // =====================================

    if (
        checkWin("Y")
    ) {

        endAIGame(
            "😔 AI Wins! -5 Points",
            -5
        );

        return;
    }


    // =====================================
    // DRAW
    // =====================================

    if (
        isDraw()
    ) {

        endAIGame(
            "🤝 Draw!",
            0
        );

        return;
    }


    // =====================================
    // PLAYER TURN
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


        // Temporarily place piece
        board[row][col] = player;


        const win =
            findWinningPattern(player)
            !== null;


        // Remove temporary piece
        board[row][col] = "";


        if (win) {

            return col;
        }
    }


    return -1;
}


// =========================================
// =========================================
// LOCAL 2 PLAYER MODE
// =========================================
// =========================================


// =========================================
// LOCAL PLAYER MOVE
// =========================================

function localPlayerMove(col) {

    if (gameOver) {
        return;
    }


    const row =
        getEmptyRow(col);


    // Column full
    if (row === -1) {
        return;
    }


    // =====================================
    // PLACE CURRENT PLAYER PIECE
    // =====================================

    board[row][col] =
        currentPlayer;


    // Mark latest move
    highlightLastMove(
        row,
        col
    );


    // =====================================
    // CHECK WIN
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
    // CHECK DRAW
    // =====================================

    if (
        isDraw()
    ) {

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
// UPDATE STATUS
// =========================================

function updateTurnStatus() {

    // =====================================
    // AI MODE
    // =====================================

    if (
        gameMode === "ai"
    ) {

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
    // LOCAL MODE
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
    // for AI games.

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


    // No Firebase point changes
    // in local multiplayer.

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
// SHOW / HIDE MODE UI
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


        // Switching modes resets
        // local scoreboard.

        if (
            gameMode === "local"
        ) {

            player1Score = 0;

            player2Score = 0;


            updatePlayerNames();
        }


        // Important:
        // This also clears lastMove.

        updateModeUI();

        createBoard();
    }
);


// =========================================
// PLAYER 1 NAME CHANGE
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


// =========================================
// PLAYER 2 NAME CHANGE
// =========================================

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


        // Reset score also starts
        // a new round.

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
        // Scores stay unchanged.

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

