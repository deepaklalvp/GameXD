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
// FIREBASE STATE
// =========================================================

let currentUserUID = null;
let currentPoints = 0;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", () => {


    // =====================================================
    // ELEMENTS
    // =====================================================

    const guessInput =
        document.getElementById("guessInput");

    const guessButton =
        document.getElementById("guessBtn");

    const newGameButton =
        document.getElementById("newGame");

    const message =
        document.getElementById("message");

    const attemptsText =
        document.getElementById("attempts");

    const logoutButton =
        document.getElementById("logoutBtn");

    const userNameElement =
        document.getElementById("userName");

    const userPointsElement =
        document.getElementById("userPoints");


    // =====================================================
    // GAME STATE
    // =====================================================

    let secretNumber = 0;

    let attempts = 10;

    let gameOver = false;


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    onAuthStateChanged(
        auth,
        async (user) => {

            // ---------------------------------------------
            // NOT LOGGED IN
            // ---------------------------------------------

            if (!user) {

                window.location.href =
                    "index.html";

                return;
            }


            // ---------------------------------------------
            // SAVE USER UID
            // ---------------------------------------------

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


                // -----------------------------------------
                // USER DOCUMENT EXISTS
                // -----------------------------------------

                if (snapshot.exists()) {

                    const data =
                        snapshot.data();


                    const name =
                        data.name ||
                        "Player";


                    currentPoints =
                        Number(
                            data.points
                        ) || 0;


                    if (userNameElement) {

                        userNameElement.textContent =
                            `Hi, ${name}`;
                    }


                    updatePointsDisplay();

                }


                // -----------------------------------------
                // USER DOCUMENT DOES NOT EXIST
                // -----------------------------------------

                else {

                    currentPoints = 0;


                    if (userNameElement) {

                        userNameElement.textContent =
                            "Hi, Player";
                    }


                    updatePointsDisplay();
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


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await signOut(auth);

                    window.location.href =
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


    // =====================================================
    // UPDATE POINTS DISPLAY
    // =====================================================

    function updatePointsDisplay() {

        if (!userPointsElement) {
            return;
        }


        userPointsElement.textContent =
            ` | ⭐ ${currentPoints} pts`;

    }


    // =====================================================
    // NEW GAME
    // =====================================================

    function newGame() {

        secretNumber =
            Math.floor(
                Math.random() * 100
            ) + 1;


        attempts = 10;

        gameOver = false;


        if (attemptsText) {

            attemptsText.textContent =
                `Attempts Left : ${attempts}`;

        }


        if (message) {

            message.textContent = "";

        }


        if (guessInput) {

            guessInput.value = "";

            guessInput.disabled = false;

            guessInput.focus();

        }


        if (guessButton) {

            guessButton.disabled = false;

        }


        // ---------------------------------------------
        // REMOVE THIS IN PRODUCTION
        // ---------------------------------------------

        console.log(
            "Secret number:",
            secretNumber
        );

    }


    // =====================================================
    // END GAME UI
    // =====================================================

    function endGame() {

        gameOver = true;


        if (guessInput) {

            guessInput.disabled = true;

        }


        if (guessButton) {

            guessButton.disabled = true;

        }

    }


    // =====================================================
    // CHECK GUESS
    // =====================================================

    async function checkGuess() {

        // ---------------------------------------------
        // DO NOTHING IF GAME HAS ENDED
        // ---------------------------------------------

        if (gameOver) {
            return;
        }


        // ---------------------------------------------
        // CHECK USER INPUT
        // ---------------------------------------------

        const guess =
            parseInt(
                guessInput.value,
                10
            );


        if (
            isNaN(guess) ||
            guess < 1 ||
            guess > 100
        ) {

            if (message) {

                message.textContent =
                    "⚠️ Enter a number between 1 and 100.";

            }

            return;
        }


        // ---------------------------------------------
        // REDUCE ATTEMPT
        // ---------------------------------------------

        attempts--;


        if (attemptsText) {

            attemptsText.textContent =
                `Attempts Left : ${attempts}`;

        }


        // =================================================
        // PLAYER WINS
        // =================================================

        if (
            guess === secretNumber
        ) {

            if (message) {

                message.textContent =
                    "🎉 Correct! +10 points!";

            }


            // -----------------------------------------
            // IMPORTANT:
            // UPDATE BOTH:
            //
            // gamesPlayed +1
            // wins +1
            // points +10
            // -----------------------------------------

            await finishGame(
                "win",
                10
            );


            endGame();

            return;
        }


        // =================================================
        // PLAYER LOSES
        // =================================================

        if (
            attempts === 0
        ) {

            if (message) {

                message.textContent =
                    `❌ You Lost! Number was ${secretNumber}. -5 points!`;

            }


            // -----------------------------------------
            // UPDATE:
            //
            // gamesPlayed +1
            // wins unchanged
            // points -5
            // -----------------------------------------

            await finishGame(
                "loss",
                -5
            );


            endGame();

            return;
        }


        // =================================================
        // HINT
        // =================================================

        if (
            guess < secretNumber
        ) {

            if (message) {

                message.textContent =
                    "📈 Too Low! Try Again.";

            }

        }

        else {

            if (message) {

                message.textContent =
                    "📉 Too High! Try Again.";

            }

        }


        // Clear input

        if (guessInput) {

            guessInput.value = "";

            guessInput.focus();

        }

    }


    // =====================================================
    // FINISH GAME
    // =====================================================
    //
    // This is the important part.
    //
    // WIN:
    // gamesPlayed +1
    // wins +1
    // points +10
    //
    // LOSS:
    // gamesPlayed +1
    // wins unchanged
    // points -5
    //
    // =====================================================

    async function finishGame(
        result,
        points
    ) {

        // ---------------------------------------------
        // USER MUST BE LOGGED IN
        // ---------------------------------------------

        if (!currentUserUID) {

            console.error(
                "Cannot save game result: user not logged in."
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


            // ---------------------------------------------
            // ALWAYS COUNT GAME
            // ---------------------------------------------

            const updates = {

                gamesPlayed:
                    increment(1),

                points:
                    increment(points)

            };


            // ---------------------------------------------
            // ONLY WIN INCREASES WINS
            // ---------------------------------------------

            if (
                result === "win"
            ) {

                updates.wins =
                    increment(1);

            }


            // ---------------------------------------------
            // UPDATE FIRESTORE
            // ---------------------------------------------

            await updateDoc(
                userRef,
                updates
            );


            // ---------------------------------------------
            // UPDATE LOCAL POINT VALUE
            // ---------------------------------------------

            currentPoints += points;


            updatePointsDisplay();


            // ---------------------------------------------
            // LOG RESULT
            // ---------------------------------------------

            console.log(
                "Guess Game statistics updated:",
                {
                    result: result,
                    gamesPlayed: "+1",
                    wins:
                        result === "win"
                            ? "+1"
                            : "+0",
                    points: points
                }
            );

        }

        catch (error) {

            console.error(
                "Failed to update Guess Game statistics:",
                error
            );

        }

    }


    // =====================================================
    // ENTER KEY
    // =====================================================

    if (guessInput) {

        guessInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    checkGuess();

                }

            }
        );

    }


    // =====================================================
    // GUESS BUTTON
    // =====================================================

    if (guessButton) {

        guessButton.addEventListener(
            "click",
            checkGuess
        );

    }


    // =====================================================
    // NEW GAME BUTTON
    // =====================================================

    if (newGameButton) {

        newGameButton.addEventListener(
            "click",
            newGame
        );

    }


    // =====================================================
    // START FIRST GAME
    // =====================================================

    newGame();

});
