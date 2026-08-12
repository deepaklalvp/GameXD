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
// HELPER
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
// UPDATE 2 PLAYER SCOREBOARD
// =====================================================

function updateScoreboard() {

    if (!scoreX || !scoreO || !scoreDraw) return;

    scoreX.textContent = playerXScore;
    scoreO.textContent = playerOScore;
    scoreDraw.textContent = drawScore;

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

    if (!playerXInput || !playerOInput) return;

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
// SHOW / HIDE ELEMENT SAFELY
// =====================================================

function showElement(element) {

    if (!element) return;

    element.classList.remove("hidden");

}


function hideElement(element) {

    if (!element) return;

    element.classList.add("hidden");

}


// =====================================================
// SHOW AI MODE
// =====================================================

function showAIMode() {

    gameMode = "ai";

    // Buttons
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


    // Show AI difficulty
    showElement(difficultyContainer);


    // Reset board only
    restart();

}


// =====================================================
// SHOW 2 PLAYER MODE
// =====================================================

function showTwoPlayerMode() {

    gameMode = "2player";

    // Buttons
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
// RESET CURRENT BOARD
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

    }

    else {

        updateStatus(
            `${playerXName}'s Turn ❌`
        );

    }

}


// =====================================================
// RESET 2 PLAYER SCORE
// =====================================================

function resetTwoPlayerScore() {

    // Only available in 2-player mode
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
// MINIMAX
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


    board[move] = "O";

    cells[move].textContent = "O";

    cells[move].classList.add("o");


    // AI wins
 if (checkWin(board, "O")) {

    highlightWin(
        getWinningPattern(board, "O")
    );

    await endGame(
        "😔 AI Wins! -5 ⭐",
        -5
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
            0
        );

        return;

    }


    playerTurn = true;

    updateStatus("Your Turn");

}


// =====================================================
// PLAYER X MOVE - AI MODE
// =====================================================

function playerMoveAI(index) {

    if (gameOver) return;

    if (!playerTurn) return;

    if (board[index] !== "") return;


    playerTurn = false;


    board[index] = "X";

    cells[index].textContent = "X";

    cells[index].classList.add("x");


    // Player wins
if (checkWin(board, "X")) {

    highlightWin(
        getWinningPattern(board, "X")
    );

    await endGame(
        "🎉 You Win! +10 ⭐",
        10
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
            0
        );

        return;

    }


    updateStatus(
        "🤖 AI Thinking..."
    );


    setTimeout(() => {

        // Make sure player hasn't changed mode
        if (gameMode === "ai" && !gameOver) {
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


    board[index] = currentPlayer;


    cells[index].textContent =
        currentPlayer;


    cells[index].classList.add(
        currentPlayer === "X"
            ? "x"
            : "o"
    );


    // -----------------------------
    // PLAYER WINS
    // -----------------------------

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


    // -----------------------------
    // DRAW
    // -----------------------------

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


    // -----------------------------
    // NEXT PLAYER
    // -----------------------------

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

async function endAIGame(message, points) {

    gameOver = true;

    playerTurn = false;


    updateStatus(message);


    // Firebase points ONLY in AI mode
    if (
        gameMode === "ai" &&
        points !== 0
    ) {

        await updatePoints(points);

    }

}


// =====================================================
// FIREBASE POINT UPDATE
// =====================================================

async function updatePoints(points) {

    if (!currentUserUID) return;

    if (gameMode !== "ai") return;

    if (points === 0) return;


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
                points: increment(points)
            }
        );


        currentPoints += points;


        if (userPointsEl) {

            userPointsEl.textContent =
                ` | ⭐ ${currentPoints} pts`;

        }

    }

    catch (error) {

        console.error(
            "Error updating points:",
            error
        );

    }

}


// =====================================================
// FIREBASE USER
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
        // Validate important elements
        // -----------------------------

        if (!cells || cells.length !== 9) {

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
        // Player names
        // -----------------------------

        if (playerXInput) {

            playerXInput.addEventListener(
                "input",
                updatePlayerNames
            );

        }


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
        // Reset 2-player scoreboard
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
