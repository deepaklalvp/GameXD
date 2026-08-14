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

    lastMove = null;

    drawBoard();

    updateTurnStatus();
}


// =========================================
// DRAW BOARD
// =========================================

function drawBoard() {

    if (!boardElement) {
        return;
    }

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


            // RED PIECE
            if (
                board[row][col] === "R"
            ) {

                cell.classList.add("red");
            }


            // YELLOW PIECE
            if (
                board[row][col] === "Y"
            ) {

                cell.classList.add("yellow");
            }


            // LAST MOVE
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
// LAST MOVE
// =========================================

function highlightLastMove(row, col) {

    lastMove = {
        row,
        col
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


    // LOCAL 2 PLAYER
    if (
        gameMode === "local"
    ) {

        localPlayerMove(col);

        return;
    }


    // VS AI
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


    if (row === -1) {
        return;
    }


    // PLACE RED
    board[row][col] = "R";

    highlightLastMove(
        row,
        col
    );


    // PLAYER WIN
    if (
        checkWin("R")
    ) {

        endAIGame(
            "🎉 You Win! +10 Points",
            10,
            "win"
        );

        return;
    }


    // DRAW
    if (
        isDraw()
    ) {

        endAIGame(
            "🤝 Draw!",
            0,
            "draw"
        );

        return;
    }


    // AI TURN
    playerTurn = false;

    updateTurnStatus();


    setTimeout(
        () => {

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


    if (
        availableColumns.length === 0
    ) {

        return;
    }


    // TRY TO WIN
    const winningColumn =
        findWinningMove("Y");


    // BLOCK PLAYER
    const blockingColumn =
        findWinningMove("R");


    let selectedColumn;


    // AI WINNING MOVE
    if (
        winningColumn !== -1
    ) {

        selectedColumn =
            winningColumn;
    }


    // BLOCK PLAYER
    else if (
        blockingColumn !== -1
    ) {

        selectedColumn =
            blockingColumn;
    }


    // PREFER CENTER
    else if (
        availableColumns.includes(3)
    ) {

        if (
            Math.random() < 0.65
        ) {

            selectedColumn = 3;

        } else {

            selectedColumn =
                randomColumn(
                    availableColumns
                );
        }

    }


    // RANDOM
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


    // PLACE YELLOW
    board[row][selectedColumn] =
        "Y";


    highlightLastMove(
        row,
        selectedColumn
    );


    // AI WIN
    if (
        checkWin("Y")
    ) {

        endAIGame(
            "😔 AI Wins! -5 Points",
            -5,
            "loss"
        );

        return;
    }


    // DRAW
    if (
        isDraw()
    ) {

        endAIGame(
            "🤝 Draw!",
            0,
            "draw"
        );

        return;
    }


    // PLAYER TURN
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
// LOCAL PLAYER MOVE
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


    // PLACE CURRENT PLAYER
    board[row][col] =
        currentPlayer;


    highlightLastMove(
        row,
        col
    );


    // WIN
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

        } else {

            player2Score++;

            updateScoreboard();

            endLocalGame(
                `🎉 ${player2Name} Wins! 🟡`
            );
        }


        return;
    }


    // DRAW
    if (
        isDraw()
    ) {

        endLocalGame(
            "🤝 Draw!"
        );

        return;
    }


    // SWITCH PLAYER
    if (
        currentPlayer === "R"
    ) {

        currentPlayer = "Y";

    } else {

        currentPlayer = "R";
    }


    updateTurnStatus();
}


// =========================================
// UPDATE SCOREBOARD
// =========================================

function updateScoreboard() {

    if (player1ScoreElement) {

        player1ScoreElement.textContent =
            player1Score;
    }


    if (player2ScoreElement) {

        player2ScoreElement.textContent =
            player2Score;
    }


    if (displayPlayer1) {

        displayPlayer1.textContent =
            player1Name;
    }


    if (displayPlayer2) {

        displayPlayer2.textContent =
            player2Name;
    }
}


// =========================================
// UPDATE PLAYER NAMES
// =========================================

function updatePlayerNames() {

    if (
        !player1NameInput ||
        !player2NameInput
    ) {

        return;
    }


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

    if (!statusElement) {
        return;
    }


    // AI MODE
    if (
        gameMode === "ai"
    ) {

        if (playerTurn) {

            statusElement.textContent =
                "Your Turn 🔴";

        } else {

            statusElement.textContent =
                "🤖 AI Thinking...";
        }

        return;
    }


    // LOCAL MODE
    if (
        gameMode === "local"
    ) {

        if (
            currentPlayer === "R"
        ) {

            statusElement.textContent =
                `${player1Name}'s Turn 🔴`;

        } else {

            statusElement.textContent =
                `${player2Name}'s Turn 🟡`;
        }
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

    // -------------------------------------
    // HORIZONTAL
    // -------------------------------------

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


    // -------------------------------------
    // VERTICAL
    // -------------------------------------

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


    // -------------------------------------
    // DIAGONAL \
    // -------------------------------------

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


    // -------------------------------------
    // DIAGONAL /
    // -------------------------------------

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

    if (!pattern) {
        return;
    }


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
    points,
    result
) {

    // Prevent duplicate completion
    if (gameOver) {
        return;
    }


    gameOver = true;

    playerTurn = false;


    if (statusElement) {

        statusElement.textContent =
            message;
    }


    // =====================================
    // UPDATE PROFILE STATISTICS
    // =====================================

    await updateGameStats(result);


    // =====================================
    // UPDATE POINTS
    // =====================================

    if (
        points !== 0
    ) {

        await updatePoints(points);
    }
}


// =========================================
// FIRESTORE GAME STATISTICS
// =========================================
//
// AI games:
//
// Win:
// gamesPlayed +1
// gamesWon +1
//
// Loss:
// gamesPlayed +1
//
// Draw:
// gamesPlayed +1
// gamesDrawn +1
//
// IMPORTANT:
// The fields are EXACTLY:
//
// gamesPlayed
// gamesWon
// gamesDrawn
//
// =========================================

async function updateGameStats(result) {

    if (!currentUserUID) {

        console.error(
            "Cannot update game statistics: no logged-in user."
        );

        return;
    }


    // Local multiplayer does not
    // affect Firebase profile stats.

    if (
        gameMode !== "ai"
    ) {

        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUserUID
            );


        // Every completed AI game
        // increases gamesPlayed.

        const updates = {

            gamesPlayed:
                increment(1)

        };


        // Player won
        if (
            result === "win"
        ) {

            updates.gamesWon =
                increment(1);
        }


        // Game draw
        if (
            result === "draw"
        ) {

            updates.gamesDrawn =
                increment(1);
        }


        await updateDoc(
            userRef,
            updates
        );


        console.log(
            "Connect 4 statistics updated:",
            {
                result,
                fields: updates
            }
        );


    } catch (error) {

        console.error(
            "Failed to update Connect 4 statistics:",
            error
        );
    }
}


// =========================================
// LOCAL GAME END
// =========================================

function endLocalGame(message) {

    gameOver = true;

    playerTurn = false;


    if (statusElement) {

        statusElement.textContent =
            `${message} — No points awarded`;
    }
}


// =========================================
// FIREBASE POINT UPDATE
// =========================================

async function updatePoints(value) {

    if (!currentUserUID) {

        console.error(
            "Cannot update points: no logged-in user."
        );

        return;
    }


    if (
        gameMode !== "ai"
    ) {

        return;
    }


    if (value === 0) {
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


        const userPoints =
            document.getElementById(
                "userPoints"
            );


        if (userPoints) {

            userPoints.innerHTML =
                `<i class="fa-solid fa-star"></i> ${currentPoints} pts`;
        }


        console.log(
            `Connect 4 points updated: ${value}`
        );


    } catch (error) {

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
        !playerSetup ||
        !scoreboard ||
        !resetScoreButton
    ) {

        return;
    }


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

    } else {

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

if (gameModeElement) {

    gameModeElement.addEventListener(
        "change",
        () => {

            gameMode =
                gameModeElement.value;


            // Reset local scoreboard
            // when entering local mode.

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
}


// =========================================
// PLAYER 1 NAME CHANGE
// =========================================

if (player1NameInput) {

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
}


// =========================================
// PLAYER 2 NAME CHANGE
// =========================================

if (player2NameInput) {

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
}


// =========================================
// RESET SCORE
// =========================================

if (resetScoreButton) {

    resetScoreButton.addEventListener(
        "click",
        () => {

            player1Score = 0;

            player2Score = 0;

            updateScoreboard();

            createBoard();
        }
    );
}


// =========================================
// RESTART ROUND
// =========================================

if (restartButton) {

    restartButton.addEventListener(
        "click",
        () => {

            createBoard();
        }
    );
}


// =========================================
// LOGOUT
// =========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


// =========================================
// FIREBASE AUTHENTICATION
// =========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        currentUserUID =
            user.uid;


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const snapshot =
                await getDoc(userRef);


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.data();


                currentPoints =
                    Number(
                        data.points
                    ) || 0;


                const userName =
                    document.getElementById(
                        "userName"
                    );


                const userPoints =
                    document.getElementById(
                        "userPoints"
                    );


                if (userName) {

                    userName.textContent =
                        `Hi, ${data.name || "Player"}`;
                }


                if (userPoints) {

                    userPoints.innerHTML =
                        `<i class="fa-solid fa-star"></i> ${currentPoints} pts`;
                }


                // Read the SAME fields
                // used by the profile drawer.

                console.log(
                    "Connect 4 profile statistics:",
                    {
                        gamesPlayed:
                            Number(
                                data.gamesPlayed
                            ) || 0,

                        gamesWon:
                            Number(
                                data.gamesWon
                            ) || 0,

                        gamesDrawn:
                            Number(
                                data.gamesDrawn
                            ) || 0
                    }
                );


            } else {

                const userName =
                    document.getElementById(
                        "userName"
                    );


                const userPoints =
                    document.getElementById(
                        "userPoints"
                    );


                if (userName) {

                    userName.textContent =
                        "Hi, Player";
                }


                if (userPoints) {

                    userPoints.innerHTML =
                        `<i class="fa-solid fa-star"></i> 0 pts`;
                }
            }


        } catch (error) {

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
