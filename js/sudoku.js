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
// GLOBAL VARIABLES
// =========================================================

let currentUserUID = null;
let currentPoints = 0;

let solution = [];
let puzzle = [];

let difficulty = "medium";

let mistakes = 0;

let maxMistakes = 3;

let seconds = 0;

let timerInterval = null;

let gameActive = false;

let gameFinished = false;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const board =
        document.getElementById("sudoku-board");

    const message =
        document.getElementById("message");

    const timer =
        document.getElementById("timer");

    const mistakesDisplay =
        document.getElementById("mistakes");

    const difficultySelect =
        document.getElementById("difficulty");

    const gameOver =
        document.getElementById("gameOver");

    const gameOverTitle =
        document.getElementById("gameOverTitle");

    const gameOverMessage =
        document.getElementById("gameOverMessage");

    const finalTime =
        document.getElementById("finalTime");

    const finalMistakes =
        document.getElementById("finalMistakes");

    const playAgain =
        document.getElementById("playAgain");


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.href = "index.html";

            return;
        }

        currentUserUID = user.uid;

        try {

            const snap = await getDoc(
                doc(db, "users", user.uid)
            );

            if (snap.exists()) {

                const data = snap.data();

                document.getElementById("userName")
                    .textContent =
                    `Hi, ${data.name}`;

                currentPoints =
                    data.points || 0;

                document.getElementById("userPoints")
                    .textContent =
                    `⭐ ${currentPoints} pts`;

            }

        } catch (error) {

            console.error(
                "Failed to load user:",
                error
            );

            document.getElementById("userName")
                .textContent =
                "Hi, Player";

        }

    });


    // =====================================================
    // LOGOUT
    // =====================================================

    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", async () => {

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

        });


    // =====================================================
    // DIFFICULTY SETTINGS
    // =====================================================

    const difficultySettings = {

        easy: {

            cellsToRemove: 35,

            maxMistakes: 5

        },

        medium: {

            cellsToRemove: 45,

            maxMistakes: 3

        },

        hard: {

            cellsToRemove: 52,

            maxMistakes: 3

        }

    };


    // =====================================================
    // TIMER
    // =====================================================

    function startTimer() {

        stopTimer();

        seconds = 0;

        updateTimer();

        timerInterval =
            setInterval(() => {

                if (!gameActive) {
                    return;
                }

                seconds++;

                updateTimer();

            }, 1000);

    }


    function stopTimer() {

        if (timerInterval) {

            clearInterval(timerInterval);

            timerInterval = null;

        }

    }


    function updateTimer() {

        const minutes =
            Math.floor(seconds / 60);

        const secs =
            seconds % 60;

        timer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    }


    function getFormattedTime() {

        const minutes =
            Math.floor(seconds / 60);

        const secs =
            seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    }


    // =====================================================
    // SUDOKU SOLVER
    // =====================================================

    function isSafe(board, row, col, num) {

        // Row

        for (let x = 0; x < 9; x++) {

            if (board[row][x] === num) {

                return false;

            }

        }


        // Column

        for (let x = 0; x < 9; x++) {

            if (board[x][col] === num) {

                return false;

            }

        }


        // 3x3 box

        const startRow =
            row - row % 3;

        const startCol =
            col - col % 3;


        for (
            let r = 0;
            r < 3;
            r++
        ) {

            for (
                let c = 0;
                c < 3;
                c++
            ) {

                if (
                    board[startRow + r]
                    [startCol + c] === num
                ) {

                    return false;

                }

            }

        }

        return true;

    }


    // =====================================================
    // SHUFFLE
    // =====================================================

    function shuffle(array) {

        for (
            let i = array.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );

            [
                array[i],
                array[j]
            ] = [
                array[j],
                array[i]
            ];

        }

        return array;

    }


    // =====================================================
    // FILL SUDOKU
    // =====================================================

    function fillBoard(board) {

        for (
            let row = 0;
            row < 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                if (
                    board[row][col] === 0
                ) {

                    const numbers =
                        shuffle(
                            [1,2,3,4,5,6,7,8,9]
                        );

                    for (
                        const num of numbers
                    ) {

                        if (
                            isSafe(
                                board,
                                row,
                                col,
                                num
                            )
                        ) {

                            board[row][col] =
                                num;


                            if (
                                fillBoard(board)
                            ) {

                                return true;

                            }


                            board[row][col] =
                                0;

                        }

                    }

                    return false;

                }

            }

        }

        return true;

    }


    // =====================================================
    // GENERATE SOLUTION
    // =====================================================

    function generateSolution() {

        const board =
            Array.from(
                { length: 9 },
                () =>
                    Array(9).fill(0)
            );

        fillBoard(board);

        return board;

    }


    // =====================================================
    // COUNT SOLUTIONS
    // =====================================================

    function countSolutions(
        board,
        limit = 2
    ) {

        let count = 0;


        function solve() {

            if (count >= limit) {

                return;

            }


            for (
                let row = 0;
                row < 9;
                row++
            ) {

                for (
                    let col = 0;
                    col < 9;
                    col++
                ) {

                    if (
                        board[row][col] === 0
                    ) {

                        for (
                            let num = 1;
                            num <= 9;
                            num++
                        ) {

                            if (
                                isSafe(
                                    board,
                                    row,
                                    col,
                                    num
                                )
                            ) {

                                board[row][col] =
                                    num;

                                solve();

                                board[row][col] =
                                    0;

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


    // =====================================================
    // CREATE PUZZLE
    // =====================================================

    function createPuzzle(
        solutionBoard,
        cellsToRemove
    ) {

        const puzzleBoard =
            solutionBoard.map(
                row => [...row]
            );


        let removed = 0;


        while (
            removed < cellsToRemove
        ) {

            const row =
                Math.floor(
                    Math.random() * 9
                );

            const col =
                Math.floor(
                    Math.random() * 9
                );


            if (
                puzzleBoard[row][col] === 0
            ) {

                continue;

            }


            const backup =
                puzzleBoard[row][col];

            puzzleBoard[row][col] = 0;


            const copy =
                puzzleBoard.map(
                    row => [...row]
                );


            if (
                countSolutions(copy) === 1
            ) {

                removed++;

            } else {

                puzzleBoard[row][col] =
                    backup;

            }

        }


        return puzzleBoard;

    }


    // =====================================================
    // DRAW BOARD
    // =====================================================

    function drawBoard(data) {

        board.innerHTML = "";


        for (
            let row = 0;
            row < 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                const input =
                    document.createElement("input");


                input.classList.add("cell");


                input.dataset.row =
                    row;

                input.dataset.col =
                    col;


                if (
                    data[row][col] !== 0
                ) {

                    input.value =
                        data[row][col];

                    input.disabled =
                        true;

                    input.classList.add(
                        "fixed"
                    );

                }


                // 3x3 borders

                if (col % 3 === 0) {

                    input.classList.add(
                        "left-border"
                    );

                }

                if (row % 3 === 0) {

                    input.classList.add(
                        "top-border"
                    );

                }

                if (col === 8) {

                    input.classList.add(
                        "right-border"
                    );

                }

                if (row === 8) {

                    input.classList.add(
                        "bottom-border"
                    );

                }


                // User input

                input.addEventListener(
                    "input",
                    () => {

                        if (
                            !gameActive ||
                            gameFinished
                        ) {

                            return;

                        }


                        input.value =
                            input.value
                                .replace(
                                    /[^1-9]/g,
                                    ""
                                )
                                .slice(0, 1);


                        if (!input.value) {

                            clearConflicts();

                            return;

                        }


                        const value =
                            parseInt(
                                input.value
                            );


                        const currentRow =
                            Number(
                                input.dataset.row
                            );

                        const currentCol =
                            Number(
                                input.dataset.col
                            );


                        // Wrong answer

                        if (
                            value !==
                            solution[
                                currentRow
                            ][
                                currentCol
                            ]
                        ) {

                            mistakes++;

                            updateMistakes();

                            input.classList.add(
                                "wrong"
                            );


                            setTimeout(() => {

                                input.classList.remove(
                                    "wrong"
                                );

                            }, 500);


                            input.value = "";


                            message.textContent =
                                `❌ Incorrect! ${maxMistakes - mistakes} mistake${maxMistakes - mistakes === 1 ? "" : "s"} remaining.`;

                            message.className =
                                "error";


                            if (
                                mistakes >=
                                maxMistakes
                            ) {

                                loseGame();

                            }

                            return;

                        }


                        // Correct answer

                        input.classList.add(
                            "correct"
                        );


                        setTimeout(() => {

                            input.classList.remove(
                                "correct"
                            );

                        }, 400);


                        message.textContent =
                            "✓ Correct!";

                        message.className =
                            "success";


                        highlightConflicts();

                        checkAutomaticWin();

                    }
                );


                board.appendChild(
                    input
                );

            }

        }

    }


    // =====================================================
    // GET USER BOARD
    // =====================================================

    function getUserBoard() {

        const grid =
            Array.from(
                { length: 9 },
                () => Array(9).fill(0)
            );


        document
            .querySelectorAll(".cell")
            .forEach(input => {

                const row =
                    Number(
                        input.dataset.row
                    );

                const col =
                    Number(
                        input.dataset.col
                    );


                grid[row][col] =
                    input.value
                        ? parseInt(
                            input.value
                        )
                        : 0;

            });


        return grid;

    }


    // =====================================================
    // CLEAR CONFLICTS
    // =====================================================

    function clearConflicts() {

        document
            .querySelectorAll(".cell")
            .forEach(cell => {

                cell.classList.remove(
                    "conflict"
                );

            });

    }


    // =====================================================
    // HIGHLIGHT CONFLICTS
    // =====================================================

    function highlightConflicts() {

        clearConflicts();


        const inputs =
            document.querySelectorAll(
                ".cell"
            );


        const boardData =
            Array.from(
                { length: 9 },
                () => Array(9).fill(0)
            );


        inputs.forEach(input => {

            const row =
                Number(
                    input.dataset.row
                );

            const col =
                Number(
                    input.dataset.col
                );


            boardData[row][col] =
                input.value
                    ? parseInt(
                        input.value
                    )
                    : 0;

        });


        inputs.forEach(input => {

            if (!input.value) {

                return;

            }


            const row =
                Number(
                    input.dataset.row
                );

            const col =
                Number(
                    input.dataset.col
                );

            const value =
                parseInt(
                    input.value
                );


            let conflict =
                false;


            // Row

            for (
                let c = 0;
                c < 9;
                c++
            ) {

                if (
                    c !== col &&
                    boardData[row][c] === value
                ) {

                    conflict = true;

                }

            }


            // Column

            for (
                let r = 0;
                r < 9;
                r++
            ) {

                if (
                    r !== row &&
                    boardData[r][col] === value
                ) {

                    conflict = true;

                }

            }


            // 3x3 box

            const startRow =
                Math.floor(row / 3) * 3;

            const startCol =
                Math.floor(col / 3) * 3;


            for (
                let r = startRow;
                r < startRow + 3;
                r++
            ) {

                for (
                    let c = startCol;
                    c < startCol + 3;
                    c++
                ) {

                    if (
                        (r !== row ||
                         c !== col) &&
                        boardData[r][c] === value
                    ) {

                        conflict = true;

                    }

                }

            }


            if (conflict) {

                input.classList.add(
                    "conflict"
                );

            }

        });

    }


    // =====================================================
    // CHECK AUTOMATIC WIN
    // =====================================================

    function checkAutomaticWin() {

        const userBoard =
            getUserBoard();


        for (
            let row = 0;
            row < 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                if (
                    userBoard[row][col] !==
                    solution[row][col]
                ) {

                    return;

                }

            }

        }


        winGame();

    }


    // =====================================================
    // CHECK BUTTON
    // =====================================================

    function checkBoard() {

        if (
            !gameActive ||
            gameFinished
        ) {

            return;

        }


        const userBoard =
            getUserBoard();


        // Check incomplete

        for (
            let row = 0;
            row < 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                if (
                    userBoard[row][col] === 0
                ) {

                    message.textContent =
                        "⚠️ Complete the entire puzzle first.";

                    message.className =
                        "hint";

                    return;

                }

            }

        }


        // Check solution

        for (
            let row = 0;
            row < 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                if (
                    userBoard[row][col] !==
                    solution[row][col]
                ) {

                    message.textContent =
                        "❌ There are still some mistakes.";

                    message.className =
                        "error";

                    return;

                }

            }

        }


        winGame();

    }


    // =====================================================
    // UPDATE MISTAKES
    // =====================================================

    function updateMistakes() {

        mistakesDisplay.textContent =
            `${mistakes} / ${maxMistakes}`;


        if (
            mistakes >= maxMistakes
        ) {

            mistakesDisplay.classList.add(
                "danger"
            );

        }

    }


    // =====================================================
    // WIN GAME
    // =====================================================

    async function winGame() {

        if (
            gameFinished
        ) {

            return;

        }


        gameFinished = true;

        gameActive = false;

        stopTimer();


        message.textContent =
            `🎉 Puzzle completed in ${getFormattedTime()}! +10 points!`;

        message.className =
            "success";


        await updatePoints(10);


        showGameOver(
            true
        );

    }


    // =====================================================
    // LOSE GAME
    // =====================================================

    async function loseGame() {

        if (
            gameFinished
        ) {

            return;

        }


        gameFinished = true;

        gameActive = false;

        stopTimer();


        message.textContent =
            "💔 Game Over! Too many mistakes.";

        message.className =
            "error";


        await updatePoints(-5);


        showGameOver(
            false
        );

    }


    // =====================================================
    // GAME OVER SCREEN
    // =====================================================

    function showGameOver(
        won
    ) {

        finalTime.textContent =
            getFormattedTime();


        finalMistakes.textContent =
            mistakes;


        if (won) {

            gameOverTitle.textContent =
                "🎉 You Won!";

            gameOverMessage.textContent =
                "Excellent! Sudoku completed.";

        } else {

            gameOverTitle.textContent =
                "💔 Game Over";

            gameOverMessage.textContent =
                "Too many mistakes. Try again!";

        }


        gameOver.classList.remove(
            "hidden"
        );

    }


    // =====================================================
    // NEW GAME
    // =====================================================

    function newGame() {

        difficulty =
            difficultySelect.value;


        const settings =
            difficultySettings[
                difficulty
            ];


        maxMistakes =
            settings.maxMistakes;


        mistakes = 0;

        gameFinished = false;

        gameActive = true;


        updateMistakes();


        message.textContent = "";

        message.className = "";


        gameOver.classList.add(
            "hidden"
        );


        // Generate puzzle

        solution =
            generateSolution();


        puzzle =
            createPuzzle(
                solution,
                settings.cellsToRemove
            );


        drawBoard(
            puzzle
        );


        startTimer();

    }


    // =====================================================
    // DIFFICULTY CHANGE
    // =====================================================

    difficultySelect.addEventListener(
        "change",
        () => {

            newGame();

        }
    );


    // =====================================================
    // BUTTON EVENTS
    // =====================================================

    document
        .getElementById("newGame")
        .addEventListener(
            "click",
            newGame
        );


    document
        .getElementById("check")
        .addEventListener(
            "click",
            checkBoard
        );


    playAgain.addEventListener(
        "click",
        newGame
    );


    // =====================================================
    // START FIRST GAME
    // =====================================================

    newGame();

});


// =========================================================
// FIREBASE POINT UPDATE
// =========================================================

async function updatePoints(value) {

    if (!currentUserUID) {

        return;

    }


    try {

        const ref =
            doc(
                db,
                "users",
                currentUserUID
            );


        await updateDoc(
            ref,
            {
                points:
                    increment(value)
            }
        );


        currentPoints += value;


        const pointsElement =
            document.getElementById(
                "userPoints"
            );


        if (pointsElement) {

            pointsElement.textContent =
                `⭐ ${currentPoints} pts`;

        }

    } catch (error) {

        console.error(
            "Failed to update points:",
            error
        );

    }

}
