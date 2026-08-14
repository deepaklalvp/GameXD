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


// =========================================================
// CONNECT FOUR SETTINGS
// =========================================================

const ROWS = 6;
const COLS = 7;


// =========================================================
// GAME STATE
// =========================================================

let board = [];

let gameOver = false;

let playerTurn = true;

let currentPlayer = "R";

let gameMode = "ai";

let lastMove = null;


// =========================================================
// LOCAL SCOREBOARD
// =========================================================

let player1Score = 0;
let player2Score = 0;

let player1Name = "Player 1";
let player2Name = "Player 2";


// =========================================================
// FIREBASE STATE
// =========================================================

let currentUserUID = null;

let currentPoints = 0;


// =========================================================
// HTML ELEMENTS
// =========================================================

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


// =========================================================
// CREATE / RESET BOARD
// =========================================================

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

    lastMove = null;

    drawBoard();

    updateTurnStatus();
}


// =========================================================
// DRAW BOARD
// =========================================================

function drawBoard() {

    if (!boardElement) {
        return;
    }

    boardElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");


            // RED PIECE

            if (board[row][col] === "R") {

                cell.classList.add("red");
            }


            // YELLOW PIECE

            if (board[row][col] === "Y") {

                cell.classList.add("yellow");
            }


            // LAST MOVE

            if (
                lastMove &&
                lastMove.row === row &&
                lastMove.col === col
            ) {

                cell.classList.add("last-move");
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


// =========================================================
// LAST MOVE
// =========================================================

function highlightLastMove(row, col) {

    lastMove = {
        row,
        col
    };

    drawBoard();
}


// =========================================================
// HANDLE CELL CLICK
// =========================================================

function handleCellClick(col) {

    if (gameOver) {
        return;
    }


    // LOCAL TWO PLAYER

    if (gameMode === "local") {

        localPlayerMove(col);

        return;
    }


    // VS AI

    if (gameMode === "ai") {

        if (!playerTurn) {
            return;
        }

        playerMove(col);
    }
}


// =========================================================
// GET EMPTY ROW
// =========================================================

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


// =========================================================
// PLAYER MOVE - AI MODE
// =========================================================

function playerMove(col) {

    if (gameOver || !playerTurn) {
        return;
    }

    const row =
        getEmptyRow(col);

    if (row === -1) {
        return;
    }


    // PLACE PLAYER PIECE

    board[row][col] = "R";

    highlightLastMove(row, col);


    // PLAYER WIN

    if (checkWin("R")) {

        endAIGame(
            "🎉 You Win! +10 Points",
            10,
            "win"
        );

        return;
    }


    // DRAW

    if (isDraw()) {

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


// =========================================================
// AI MOVE
// =========================================================

function aiMove() {

    if (
        gameOver ||
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

        if (getEmptyRow(col) !== -1) {

            availableColumns.push(col);
        }
    }


    if (availableColumns.length === 0) {
        return;
    }


    // TRY TO WIN

    const winningColumn =
        findWinningMove("Y");


    // TRY TO BLOCK PLAYER

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

    else if (availableColumns.includes(3)) {

        if (Math.random() < 0.65) {

            selectedColumn = 3;

        } else {

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
        getEmptyRow(selectedColumn);


    if (row === -1) {
        return;
    }


    // PLACE AI PIECE

    board[row][selectedColumn] = "Y";

    highlightLastMove(
        row,
        selectedColumn
    );


    // AI WIN

    if (checkWin("Y")) {

        endAIGame(
            "😔 AI Wins! -5 Points",
            -5,
            "loss"
        );

        return;
    }


    // DRAW

    if (isDraw()) {

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


// =========================================================
// RANDOM COLUMN
// =========================================================

function randomColumn(columns) {

    return columns[
        Math.floor(
            Math.random() * columns.length
        )
    ];
}


// =========================================================
// FIND WINNING MOVE
// =========================================================

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
            findWinningPattern(player) !== null;


        board[row][col] = "";


        if (win) {
            return col;
        }
    }


    return -1;
}


// =========================================================
// LOCAL PLAYER MOVE
// =========================================================

function localPlayerMove(col) {

    if (gameOver) {
        return;
    }


    const row =
        getEmptyRow(col);


    if (row === -1) {
        return;
    }


    board[row][col] =
        currentPlayer;


    highlightLastMove(
        row,
        col
    );


    // WIN

    if (checkWin(currentPlayer)) {

        if (currentPlayer === "R") {

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

    if (isDraw()) {

        endLocalGame(
            "🤝 Draw!"
        );

        return;
    }


    // SWITCH PLAYER

    currentPlayer =
        currentPlayer === "R"
            ? "Y"
            : "R";


    updateTurnStatus();
}


// =========================================================
// SCOREBOARD
// =========================================================

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


// =========================================================
// PLAYER NAMES
// =========================================================

function updatePlayerNames() {

    if (
        !player1NameInput ||
        !player2NameInput
    ) {

        return;
    }


    player1Name =
        player1NameInput.value.trim()
        || "Player 1";


    player2Name =
        player2NameInput.value.trim()
        || "Player 2";


    updateScoreboard();
}


// =========================================================
// TURN STATUS
// =========================================================

function updateTurnStatus() {

    if (!statusElement) {
        return;
    }


    // AI MODE

    if (gameMode === "ai") {

        statusElement.textContent =
            playerTurn
                ? "Your Turn 🔴"
                : "🤖 AI Thinking...";

        return;
    }


    // LOCAL MODE

    if (gameMode === "local") {

        statusElement.textContent =
            currentPlayer === "R"
                ? `${player1Name}'s Turn 🔴`
                : `${player2Name}'s Turn 🟡`;
    }
}


// =========================================================
// CHECK WIN
// =========================================================

function checkWin(player) {

    const pattern =
        findWinningPattern(player);


    if (pattern) {

        highlightWin(pattern);

        return true;
    }


    return false;
}


// =========================================================
// FIND WINNING PATTERN
// =========================================================

function findWinningPattern(player) {

    // HORIZONTAL

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


    // VERTICAL

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


    // DIAGONAL \

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


    // DIAGONAL /

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


// =========================================================
// HIGHLIGHT WIN
// =========================================================

function highlightWin(pattern) {

    if (!pattern) {
        return;
    }


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


// =========================================================
// DRAW CHECK
// =========================================================

function isDraw() {

    return board[0].every(
        cell => cell !== ""
    );
}


// =========================================================
// AI GAME END
// =========================================================

async function endAIGame(
    message,
    points,
    result
) {

    if (gameOver) {
        return;
    }


    gameOver = true;

    playerTurn = false;


    if (statusElement) {

        statusElement.textContent =
            message;
    }


    // -----------------------------------------------------
    // UPDATE FIREBASE GAME STATISTICS
    // -----------------------------------------------------

    await updateGameStats(result);


    // -----------------------------------------------------
    // UPDATE POINTS
    // -----------------------------------------------------

    if (points !== 0) {

        await updatePoints(points);
    }


    // -----------------------------------------------------
    // REFRESH PROFILE DRAWER
    // -----------------------------------------------------

    await refreshProfileDrawer();
}


// =========================================================
// UPDATE GAME STATISTICS
// =========================================================
//
// IMPORTANT:
//
// Firestore fields:
//
// gamesPlayed
// wins
// gamesDrawn
//
// NOT gamesWon.
//
// This matches your profile drawer.
//

async function updateGameStats(result) {

    if (!currentUserUID) {

        console.error(
            "Cannot update statistics: user not logged in."
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

            updates.wins =
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
            "Connect 4 statistics updated:",
            result
        );

    }

    catch (error) {

        console.error(
            "Failed to update Connect 4 statistics:",
            error
        );
    }
}


// =========================================================
// UPDATE POINTS
// =========================================================

async function updatePoints(value) {

    if (!currentUserUID) {

        console.error(
            "Cannot update points: user not logged in."
        );

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


        updatePointsUI();


        console.log(
            "Connect 4 points updated:",
            value
        );

    }

    catch (error) {

        console.error(
            "Failed to update points:",
            error
        );
    }
}


// =========================================================
// UPDATE POINTS UI
// =========================================================

function updatePointsUI() {

    const userPoints =
        document.getElementById(
            "userPoints"
        );


    if (userPoints) {

        userPoints.innerHTML =
            `<i class="fa-solid fa-star"></i> ${currentPoints} pts`;
    }


    const profilePoints =
        document.getElementById(
            "profilePoints"
        );


    if (profilePoints) {

        profilePoints.textContent =
            `⭐ ${currentPoints} Points`;
    }
}


// =========================================================
// REFRESH PROFILE DRAWER
// =========================================================
//
// This is the important missing part.
//
// After Connect 4 finishes, we read Firestore again
// and immediately update:
//
// profileGames
// profileWins
// profilePoints
//
// So you don't need to reload the page.
//

async function refreshProfileDrawer() {

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


        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {
            return;
        }


        const data =
            snapshot.data();


        // -------------------------------------------------
        // READ STATISTICS
        // -------------------------------------------------

        const gamesPlayed =
            Number(
                data.gamesPlayed ?? 0
            ) || 0;


        const wins =
            Number(
                data.wins ??
                data.gamesWon ??
                0
            ) || 0;


        const gamesDrawn =
            Number(
                data.gamesDrawn ?? 0
            ) || 0;


        const points =
            Number(
                data.points ?? 0
            ) || 0;


        currentPoints =
            points;


        // -------------------------------------------------
        // PROFILE DRAWER
        // -------------------------------------------------

        const profileGames =
            document.getElementById(
                "profileGames"
            );


        const profileWins =
            document.getElementById(
                "profileWins"
            );


        const profilePoints =
            document.getElementById(
                "profilePoints"
            );


        if (profileGames) {

            profileGames.textContent =
                gamesPlayed;
        }


        if (profileWins) {

            profileWins.textContent =
                wins;
        }


        if (profilePoints) {

            profilePoints.textContent =
                `⭐ ${points} Points`;
        }


        // -------------------------------------------------
        // NAVBAR POINTS
        // -------------------------------------------------

        updatePointsUI();


        console.log(
            "Profile drawer refreshed:",
            {
                gamesPlayed,
                wins,
                gamesDrawn,
                points
            }
        );

    }

    catch (error) {

        console.error(
            "Failed to refresh profile drawer:",
            error
        );
    }
}


// =========================================================
// LOCAL GAME END
// =========================================================

function endLocalGame(message) {

    gameOver = true;

    playerTurn = false;


    if (statusElement) {

        statusElement.textContent =
            `${message} — No points awarded`;
    }
}


// =========================================================
// SHOW / HIDE MODE UI
// =========================================================

function updateModeUI() {

    if (
        !playerSetup ||
        !scoreboard ||
        !resetScoreButton
    ) {

        return;
    }


    if (gameMode === "local") {

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


// =========================================================
// GAME MODE CHANGE
// =========================================================

if (gameModeElement) {

    gameModeElement.addEventListener(
        "change",
        () => {

            gameMode =
                gameModeElement.value;


            if (gameMode === "local") {

                player1Score = 0;

                player2Score = 0;

                updatePlayerNames();
            }


            updateModeUI();

            createBoard();
        }
    );
}


// =========================================================
// PLAYER 1 NAME
// =========================================================

if (player1NameInput) {

    player1NameInput.addEventListener(
        "input",
        () => {

            if (gameMode === "local") {

                updatePlayerNames();

                updateTurnStatus();
            }
        }
    );
}


// =========================================================
// PLAYER 2 NAME
// =========================================================

if (player2NameInput) {

    player2NameInput.addEventListener(
        "input",
        () => {

            if (gameMode === "local") {

                updatePlayerNames();

                updateTurnStatus();
            }
        }
    );
}


// =========================================================
// RESET SCORE
// =========================================================

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


// =========================================================
// RESTART ROUND
// =========================================================

if (restartButton) {

    restartButton.addEventListener(
        "click",
        () => {

            createBoard();
        }
    );
}


// =========================================================
// LOGOUT
// =========================================================

if (logoutButton) {

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
}


// =========================================================
// FIREBASE AUTHENTICATION
// =========================================================

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

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const snapshot =
                await getDoc(userRef);


            // -------------------------------------------------
            // USER DOCUMENT EXISTS
            // -------------------------------------------------

            if (snapshot.exists()) {

                const data =
                    snapshot.data();


                currentPoints =
                    Number(
                        data.points ?? 0
                    ) || 0;


                const name =
                    data.name ||
                    "Player";


                // -------------------------------------------------
                // NAVBAR
                // -------------------------------------------------

                const userName =
                    document.getElementById(
                        "userName"
                    );


                if (userName) {

                    userName.textContent =
                        `Hi, ${name}`;
                }


                updatePointsUI();


                // -------------------------------------------------
                // PROFILE DRAWER
                // -------------------------------------------------

                const profileName =
                    document.getElementById(
                        "profileName"
                    );


                const profileEmail =
                    document.getElementById(
                        "profileEmail"
                    );


                const profileAvatar =
                    document.getElementById(
                        "profileAvatar"
                    );


                const profileGames =
                    document.getElementById(
                        "profileGames"
                    );


                const profileWins =
                    document.getElementById(
                        "profileWins"
                    );


                const profilePoints =
                    document.getElementById(
                        "profilePoints"
                    );


                if (profileName) {

                    profileName.textContent =
                        name;
                }


                if (profileEmail) {

                    profileEmail.textContent =
                        data.email ||
                        user.email ||
                        "";
                }


                if (profileAvatar) {

                    profileAvatar.textContent =
                        name
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                        "P";
                }


                if (profileGames) {

                    profileGames.textContent =
                        Number(
                            data.gamesPlayed ?? 0
                        ) || 0;
                }


                if (profileWins) {

                    profileWins.textContent =
                        Number(
                            data.wins ??
                            data.gamesWon ??
                            0
                        ) || 0;
                }


                if (profilePoints) {

                    profilePoints.textContent =
                        `⭐ ${currentPoints} Points`;
                }


                console.log(
                    "Profile statistics:",
                    {
                        gamesPlayed:
                            Number(
                                data.gamesPlayed ?? 0
                            ) || 0,

                        wins:
                            Number(
                                data.wins ??
                                data.gamesWon ??
                                0
                            ) || 0,

                        gamesDrawn:
                            Number(
                                data.gamesDrawn ?? 0
                            ) || 0
                    }
                );

            }

            // -------------------------------------------------
            // USER DOCUMENT DOES NOT EXIST
            // -------------------------------------------------

            else {

                const userName =
                    document.getElementById(
                        "userName"
                    );


                if (userName) {

                    userName.textContent =
                        "Hi, Player";
                }


                currentPoints = 0;

                updatePointsUI();


                const profileGames =
                    document.getElementById(
                        "profileGames"
                    );


                const profileWins =
                    document.getElementById(
                        "profileWins"
                    );


                if (profileGames) {

                    profileGames.textContent =
                        "0";
                }


                if (profileWins) {

                    profileWins.textContent =
                        "0";
                }
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


// =========================================================
// INITIAL UI
// =========================================================

updateModeUI();


// =========================================================
// START GAME
// =========================================================

createBoard();
