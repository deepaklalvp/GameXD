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


// =====================================================
// FIREBASE STATE
// =====================================================

let currentUserUID = null;
let currentPoints = 0;


// =====================================================
// GAME STATE
// =====================================================

let board = Array(9).fill("");

let gameOver = false;
let playerTurn = true;

// "ai" or "2player"
let gameMode = "ai";

let difficulty = "easy";


// =====================================================
// 2 PLAYER SCORE
// =====================================================

let playerXScore = 0;
let playerOScore = 0;
let drawScore = 0;


// =====================================================
// PLAYER NAMES
// =====================================================

let playerXName = "Player X";
let playerOName = "Player O";


// =====================================================
// WIN PATTERNS
// =====================================================

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6]
];


// =====================================================
// DOM ELEMENTS
// =====================================================

let cells;
let statusEl;

let aiModeBtn;
let twoPlayerModeBtn;

let playerNamesBox;
let playerXInput;
let playerOInput;

let scoreboard;

let scoreXName;
let scoreOName;

let scoreX;
let scoreO;
let scoreDraw;

let difficultyContainer;
let difficultySelect;

let restartBtn;
let resetScoreBtn;

let userNameEl;
let userPointsEl;
let logoutBtn;


// =====================================================
// GET EMPTY CELLS
// =====================================================

function getEmpty(b = board) {

    return b
        .map((value, index) =>
            value === "" ? index : null
        )
        .filter(index => index !== null);
}


// =====================================================
// CHECK WIN
// =====================================================

function checkWin(b, player) {

    return winPatterns.some(pattern =>
        pattern.every(index =>
            b[index] === player
        )
    );
}


// =====================================================
// GET WINNING PATTERN
// =====================================================

function getWinningPattern(b, player) {

    return winPatterns.find(pattern =>
        pattern.every(index =>
            b[index] === player
        )
    );
}


// =====================================================
// UPDATE STATUS
// =====================================================

function updateStatus(message) {

    if (statusEl) {
        statusEl.textContent = message;
    }
}


// =====================================================
// HIGHLIGHT WIN
// =====================================================

function highlightWin(pattern) {

    if (!pattern) return;

    pattern.forEach(index => {

        if (cells[index]) {
            cells[index].classList.add("win");
        }

    });
}


// =====================================================
// CLEAR WIN HIGHLIGHT
// =====================================================

function clearHighlights() {

    if (!cells) return;

    cells.forEach(cell => {
        cell.classList.remove("win");
    });
}


// =====================================================
// UPDATE SCOREBOARD
// =====================================================

function updateScoreboard() {

    if (scoreX) {
        scoreX.textContent = playerXScore;
    }

    if (scoreO) {
        scoreO.textContent = playerOScore;
    }

    if (scoreDraw) {
        scoreDraw.textContent = drawScore;
    }

    if (scoreXName) {
        scoreXName.textContent = playerXName;
    }

    if (scoreOName) {
        scoreOName.textContent = playerOName;
    }
}


// =====================================================
// UPDATE PLAYER NAMES
// =====================================================

function updatePlayerNames() {

    if (!playerXInput || !playerOInput) {
        return;
    }

    const xName =
        playerXInput.value.trim();

    const oName =
        playerOInput.value.trim();

    playerXName =
        xName || "Player X";

    playerOName =
        oName || "Player O";

    updateScoreboard();
}


// =====================================================
// SHOW ELEMENT
// =====================================================

function showElement(element) {

    if (!element) return;

    element.classList.remove("hidden");
}


// =====================================================
// HIDE ELEMENT
// =====================================================

function hideElement(element) {

    if (!element) return;

    element.classList.add("hidden");
}


// =====================================================
// AI MODE
// =====================================================

function showAIMode() {

    gameMode = "ai";

    // Mode buttons

    if (aiModeBtn) {
        aiModeBtn.classList.add("active");
    }

    if (twoPlayerModeBtn) {
        twoPlayerModeBtn.classList.remove("active");
    }


    // Hide 2-player UI

    hideElement(playerNamesBox);
    hideElement(scoreboard);
    hideElement(resetScoreBtn);


    // Show difficulty

    showElement(difficultyContainer);


    // Reset board

    restart();
}


// =====================================================
// 2 PLAYER MODE
// =====================================================

function showTwoPlayerMode() {

    gameMode = "2player";


    // Mode buttons

    if (aiModeBtn) {
        aiModeBtn.classList.remove("active");
    }

    if (twoPlayerModeBtn) {
        twoPlayerModeBtn.classList.add("active");
    }


    // Show 2-player UI

    showElement(playerNamesBox);
    showElement(scoreboard);
    showElement(resetScoreBtn);


    // Hide AI difficulty

    hideElement(difficultyContainer);


    updatePlayerNames();

    restart();
}


// =====================================================
// RESET BOARD
// =====================================================

function restart() {

    board = Array(9).fill("");

    gameOver = false;

    playerTurn = true;

    clearHighlights();


    if (cells) {

        cells.forEach(cell => {

            cell.textContent = "";

            cell.classList.remove("x");
            cell.classList.remove("o");
            cell.classList.remove("win");

        });

    }


    if (gameMode === "ai") {

        updateStatus("Your Turn");

    } else {

        updateStatus(
            `${playerXName}'s Turn ❌`
        );

    }
}


// =====================================================
// RESET 2 PLAYER SCORE
// =====================================================

function resetTwoPlayerScore() {

    if (gameMode !== "2player") {
        return;
    }

    playerXScore = 0;
    playerOScore = 0;
    drawScore = 0;

    updateScoreboard();

    restart();
}


// =====================================================
// RANDOM AI MOVE
// =====================================================

function randomMove() {

    const empty = getEmpty();

    if (empty.length === 0) {
        return undefined;
    }

    return empty[
        Math.floor(
            Math.random() * empty.length
        )
    ];
}


// =====================================================
// FIND WINNING MOVE
// =====================================================

function findWin(player) {

    for (const index of getEmpty()) {

        board[index] = player;

        const win =
            checkWin(board, player);

        board[index] = "";

        if (win) {
            return index;
        }
    }

    return null;
}


// =====================================================
// MINIMAX AI
// =====================================================

function minimax(newBoard, player) {

    const empty = getEmpty(newBoard);


    // X wins

    if (checkWin(newBoard, "X")) {

        return {
            score: -10
        };
    }


    // O wins

    if (checkWin(newBoard, "O")) {

        return {
            score: 10
        };
    }


    // Draw

    if (empty.length === 0) {

        return {
            score: 0
        };
    }


    const moves = [];


    for (const index of empty) {

        const move = {
            index
        };


        newBoard[index] = player;


        const result =
            minimax(
                newBoard,
                player === "O"
                    ? "X"
                    : "O"
            );


        move.score = result.score;


        newBoard[index] = "";


        moves.push(move);
    }


    let bestMove;


    // AI = O

    if (player === "O") {

        let bestScore = -Infinity;


        for (const move of moves) {

            if (move.score > bestScore) {

                bestScore = move.score;

                bestMove = move;
            }
        }

    }


    // Player = X

    else {

        let bestScore = Infinity;


        for (const move of moves) {

            if (move.score < bestScore) {

                bestScore = move.score;

                bestMove = move;
            }
        }
    }


    return bestMove;
}


// =====================================================
// AI MOVE
// =====================================================

function aiMove() {

    if (gameOver) return;

    if (gameMode !== "ai") return;


    let move;


    // EASY

    if (difficulty === "easy") {

        move = randomMove();
    }


    // MEDIUM

    else if (difficulty === "medium") {

        move =
            findWin("O") ??
            findWin("X") ??
            randomMove();
    }


    // HARD

    else {

        const result =
            minimax(board, "O");

        move = result?.index;
    }


    if (move === undefined) {
        return;
    }


    // Place AI move

    board[move] = "O";

    cells[move].textContent = "O";

    cells[move].classList.add("o");


    // AI wins

    if (checkWin(board, "O")) {

        highlightWin(
            getWinningPattern(board, "O")
        );

        endAIGame(
            "😔 AI Wins! -5 ⭐",
            -5,
            "loss"
        );

        return;
    }


    // Draw

    if (
        board.every(
            value => value !== ""
        )
    ) {

        endAIGame(
            "🤝 Draw!",
            0,
            "draw"
        );

        return;
    }


    // Player's turn

    playerTurn = true;

    updateStatus("Your Turn");
}


// =====================================================
// PLAYER MOVE - AI MODE
// =====================================================

function playerMoveAI(index) {

    if (gameOver) return;

    if (!playerTurn) return;

    if (board[index] !== "") return;


    playerTurn = false;


    // Place X

    board[index] = "X";

    cells[index].textContent = "X";

    cells[index].classList.add("x");


    // Player wins

    if (checkWin(board, "X")) {

        highlightWin(
            getWinningPattern(board, "X")
        );

        endAIGame(
            "🎉 You Win! +10 ⭐",
            10,
            "win"
        );

        return;
    }


    // Draw

    if (
        board.every(
            value => value !== ""
        )
    ) {

        endAIGame(
            "🤝 Draw!",
            0,
            "draw"
        );

        return;
    }


    // AI thinking

    updateStatus(
        "🤖 AI Thinking..."
    );


    setTimeout(() => {

        if (
            gameMode === "ai" &&
            !gameOver
        ) {

            aiMove();
        }

    }, 450);
}


// =====================================================
// 2 PLAYER MOVE
// =====================================================

function playerMoveTwoPlayer(index) {

    if (gameOver) return;

    if (board[index] !== "") return;


    const currentPlayer =
        playerTurn
            ? "X"
            : "O";


    // Place mark

    board[index] =
        currentPlayer;

    cells[index].textContent =
        currentPlayer;

    cells[index].classList.add(
        currentPlayer === "X"
            ? "x"
            : "o"
    );


    // Check win

    if (
        checkWin(
            board,
            currentPlayer
        )
    ) {

        highlightWin(
            getWinningPattern(
                board,
                currentPlayer
            )
        );


        gameOver = true;


        if (currentPlayer === "X") {

            playerXScore++;

            updateStatus(
                `🎉 ${playerXName} Wins!`
            );

        }

        else {

            playerOScore++;

            updateStatus(
                `🎉 ${playerOName} Wins!`
            );
        }


        updateScoreboard();

        return;
    }


    // Check draw

    if (
        board.every(
            value => value !== ""
        )
    ) {

        gameOver = true;

        drawScore++;

        updateScoreboard();

        updateStatus(
            "🤝 Draw!"
        );

        return;
    }


    // Next player

    playerTurn = !playerTurn;


    if (playerTurn) {

        updateStatus(
            `${playerXName}'s Turn ❌`
        );

    }

    else {

        updateStatus(
            `${playerOName}'s Turn ⭕`
        );
    }
}


// =====================================================
// CELL CLICK
// =====================================================

function handleCellClick(index) {

    if (gameMode === "ai") {

        playerMoveAI(index);

    }

    else {

        playerMoveTwoPlayer(index);
    }
}


// =====================================================
// AI GAME END
// =====================================================

async function endAIGame(
    message,
    points,
    result
) {

    // Prevent duplicate game completion

    if (gameOver) {
        return;
    }

    gameOver = true;

    playerTurn = false;


    updateStatus(message);


    // ---------------------------------------------
    // Update personal game statistics
    // ---------------------------------------------

    await updateGameStats(result);


    // ---------------------------------------------
    // Existing points system
    // ---------------------------------------------

    if (
        gameMode === "ai" &&
        points !== 0
    ) {

        await updatePoints(points);
    }
}


// =====================================================
// FIREBASE GAME STATISTICS
// =====================================================
//
// AI mode only.
//
// result:
// "win"
// "loss"
// "draw"
//
// Firestore:
// gamesPlayed
// gamesWon
// gamesDrawn
// =====================================================

async function updateGameStats(result) {

    if (!currentUserUID) {

        console.error(
            "Cannot update game statistics: no logged-in user."
        );

        return;
    }


    if (gameMode !== "ai") {
        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUserUID
            );


        const updates = {

            gamesPlayed:
                increment(1)

        };


        if (result === "win") {

            updates.gamesWon =
                increment(1);
        }


        if (result === "draw") {

            updates.gamesDrawn =
                increment(1);
        }


        await updateDoc(
            userRef,
            updates
        );


        console.log(
            `Game statistics updated: ${result}`
        );

    }

    catch (error) {

        console.error(
            "Error updating game statistics:",
            error
        );
    }
}


// =====================================================
// FIREBASE POINT UPDATE
// =====================================================

async function updatePoints(points) {

    if (!currentUserUID) {

        console.error(
            "No logged-in user."
        );

        return;
    }


    if (gameMode !== "ai") {

        console.log(
            "Points disabled in 2-player mode."
        );

        return;
    }


    if (points === 0) {
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
                    increment(points)
            }
        );


        // Update local value

        currentPoints += points;


        if (userPointsEl) {

            userPointsEl.textContent =
                ` | ⭐ ${currentPoints} pts`;
        }


        console.log(
            `Firebase points updated: ${points}`
        );

    }

    catch (error) {

        console.error(
            "Error updating Firebase points:",
            error
        );
    }
}


// =====================================================
// LOAD USER
// =====================================================

async function loadUser(user) {

    if (!user) {

        location.href =
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


        const snap =
            await getDoc(userRef);


        if (snap.exists()) {

            const data =
                snap.data();


            currentPoints =
                data.points || 0;


            if (userNameEl) {

                userNameEl.textContent =
                    `Hi, ${data.name || "Player"}`;
            }


            if (userPointsEl) {

                userPointsEl.textContent =
                    ` | ⭐ ${currentPoints} pts`;
            }

        }

        else {

            currentPoints = 0;


            if (userNameEl) {

                userNameEl.textContent =
                    "Hi, Player";
            }


            if (userPointsEl) {

                userPointsEl.textContent =
                    " | ⭐ 0 pts";
            }
        }

    }

    catch (error) {

        console.error(
            "Error loading user:",
            error
        );
    }
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        await signOut(auth);

        location.href =
            "index.html";

    }

    catch (error) {

        console.error(
            "Logout failed:",
            error
        );
    }
}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {


        // -----------------------------
        // Get DOM
        // -----------------------------

        cells =
            document.querySelectorAll(
                ".cell"
            );


        statusEl =
            document.getElementById(
                "status"
            );


        aiModeBtn =
            document.getElementById(
                "aiModeBtn"
            );


        twoPlayerModeBtn =
            document.getElementById(
                "twoPlayerModeBtn"
            );


        playerNamesBox =
            document.getElementById(
                "playerNames"
            );


        playerXInput =
            document.getElementById(
                "playerXName"
            );


        playerOInput =
            document.getElementById(
                "playerOName"
            );


        scoreboard =
            document.getElementById(
                "twoPlayerScoreboard"
            );


        scoreXName =
            document.getElementById(
                "scoreXName"
            );


        scoreOName =
            document.getElementById(
                "scoreOName"
            );


        scoreX =
            document.getElementById(
                "scoreX"
            );


        scoreO =
            document.getElementById(
                "scoreO"
            );


        scoreDraw =
            document.getElementById(
                "scoreDraw"
            );


        difficultyContainer =
            document.getElementById(
                "difficultyContainer"
            );


        difficultySelect =
            document.getElementById(
                "difficulty"
            );


        restartBtn =
            document.getElementById(
                "restartBtn"
            );


        resetScoreBtn =
            document.getElementById(
                "resetScoreBtn"
            );


        userNameEl =
            document.getElementById(
                "userName"
            );


        userPointsEl =
            document.getElementById(
                "userPoints"
            );


        logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        // -----------------------------
        // Validate board
        // -----------------------------

        if (
            !cells ||
            cells.length !== 9
        ) {

            console.error(
                "Tic Tac Toe board cells not found."
            );

            return;
        }


        // -----------------------------
        // Cell clicks
        // -----------------------------

        cells.forEach(
            (cell, index) => {

                cell.addEventListener(
                    "click",
                    () => {

                        handleCellClick(
                            index
                        );

                    }
                );

            }
        );


        // -----------------------------
        // AI mode
        // -----------------------------

        if (aiModeBtn) {

            aiModeBtn.addEventListener(
                "click",
                showAIMode
            );
        }


        // -----------------------------
        // 2 Player mode
        // -----------------------------

        if (twoPlayerModeBtn) {

            twoPlayerModeBtn.addEventListener(
                "click",
                showTwoPlayerMode
            );
        }


        // -----------------------------
        // Player X name
        // -----------------------------

        if (playerXInput) {

            playerXInput.addEventListener(
                "input",
                updatePlayerNames
            );
        }


        // -----------------------------
        // Player O name
        // -----------------------------

        if (playerOInput) {

            playerOInput.addEventListener(
                "input",
                updatePlayerNames
            );
        }


        // -----------------------------
        // Difficulty
        // -----------------------------

        if (difficultySelect) {

            difficultySelect.addEventListener(
                "change",
                event => {

                    difficulty =
                        event.target.value;

                }
            );
        }


        // -----------------------------
        // Restart
        // -----------------------------

        if (restartBtn) {

            restartBtn.addEventListener(
                "click",
                restart
            );
        }


        // -----------------------------
        // Reset 2-player score
        // -----------------------------

        if (resetScoreBtn) {

            resetScoreBtn.addEventListener(
                "click",
                resetTwoPlayerScore
            );
        }


        // -----------------------------
        // Logout
        // -----------------------------

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );
        }


        // -----------------------------
        // Initial scoreboard
        // -----------------------------

        updateScoreboard();


        // -----------------------------
        // Firebase authentication
        // -----------------------------

        onAuthStateChanged(
            auth,
            loadUser
        );


        // -----------------------------
        // Start in AI mode
        // -----------------------------

        showAIMode();

    }
);
