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
// DOM
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const guessInput =
            document.getElementById(
                "guessInput"
            );

        const message =
            document.getElementById(
                "message"
            );

        const attemptsText =
            document.getElementById(
                "attempts"
            );

        const guessButton =
            document.getElementById(
                "guessBtn"
            );

        const newGameButton =
            document.getElementById(
                "newGame"
            );

        const logoutButton =
            document.getElementById(
                "logoutBtn"
            );


        // =================================================
        // GAME STATE
        // =================================================

        let secretNumber = 0;

        let attempts = 0;

        let gameFinished = false;


        // =================================================
        // AUTHENTICATION
        // =================================================

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
                        await getDoc(
                            userRef
                        );


                    if (
                        snapshot.exists()
                    ) {

                        const data =
                            snapshot.data();


                        // -----------------------------
                        // USER NAME
                        // -----------------------------

                        const userName =
                            document.getElementById(
                                "userName"
                            );


                        if (userName) {

                            userName.textContent =
                                `Hi, ${data.name || "Player"}`;
                        }


                        // -----------------------------
                        // POINTS
                        // -----------------------------

                        currentPoints =
                            Number(
                                data.points
                            ) || 0;


                        updatePointsDisplay();


                        // -----------------------------
                        // DEBUG
                        // -----------------------------

                        console.log(
                            "Guess Game profile statistics:",
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


        // =================================================
        // LOGOUT
        // =================================================

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


        // =================================================
        // UPDATE POINTS DISPLAY
        // =================================================

        function updatePointsDisplay() {

            const userPoints =
                document.getElementById(
                    "userPoints"
                );


            if (userPoints) {

                userPoints.innerHTML =
                    `<i class="fa-solid fa-star"></i> ${currentPoints} pts`;
            }
        }


        // =================================================
        // NEW GAME
        // =================================================

        function newGame() {

            secretNumber =
                Math.floor(
                    Math.random() * 100
                ) + 1;


            attempts = 10;

            gameFinished = false;


            // -----------------------------
            // RESET UI
            // -----------------------------

            if (attemptsText) {

                attemptsText.textContent =
                    `Attempts Left : ${attempts}`;
            }


            if (message) {

                message.textContent =
                    "";
            }


            if (guessInput) {

                guessInput.value = "";

                guessInput.disabled = false;

                guessInput.focus();
            }


            if (guessButton) {

                guessButton.disabled =
                    false;
            }


            // -----------------------------
            // DEBUG
            // -----------------------------

            // Remove this line when testing
            // is completely finished.

            console.log(
                "Secret number:",
                secretNumber
            );
        }


        // =================================================
        // END GAME
        // =================================================

        function endGame() {

            gameFinished = true;


            if (guessInput) {

                guessInput.disabled =
                    true;
            }


            if (guessButton) {

                guessButton.disabled =
                    true;
            }
        }


        // =================================================
        // CHECK GUESS
        // =================================================

        async function checkGuess() {

            // -----------------------------
            // GAME ALREADY FINISHED
            // -----------------------------

            if (gameFinished) {
                return;
            }


            if (!guessInput) {
                return;
            }


            const guess =
                Number(
                    guessInput.value
                );


            // -----------------------------
            // VALIDATION
            // -----------------------------

            if (
                !Number.isInteger(guess) ||
                guess < 1 ||
                guess > 100
            ) {

                if (message) {

                    message.textContent =
                        "⚠️ Enter a number between 1 and 100.";
                }

                return;
            }


            // -----------------------------
            // USE ONE ATTEMPT
            // -----------------------------

            attempts--;


            if (attemptsText) {

                attemptsText.textContent =
                    `Attempts Left : ${attempts}`;
            }


            // =================================================
            // CORRECT GUESS
            // =================================================

            if (
                guess === secretNumber
            ) {

                if (message) {

                    message.textContent =
                        "🎉 Correct! +10 points!";
                }


                endGame();


                /*
                 * IMPORTANT
                 *
                 * One completed game:
                 *
                 * gamesPlayed +1
                 *
                 * One win:
                 *
                 * gamesWon +1
                 *
                 * Points:
                 *
                 * +10
                 */

                await updateGameStats(
                    "win"
                );


                await updatePoints(
                    10
                );


                return;
            }


            // =================================================
            // NO ATTEMPTS LEFT
            // =================================================

            if (
                attempts <= 0
            ) {

                if (message) {

                    message.textContent =
                        `❌ You Lost! Number was ${secretNumber}. -5 points!`;
                }


                endGame();


                /*
                 * One completed game:
                 *
                 * gamesPlayed +1
                 *
                 * No gamesWon update.
                 *
                 * No gamesDrawn update.
                 *
                 * Points:
                 *
                 * -5
                 */

                await updateGameStats(
                    "loss"
                );


                await updatePoints(
                    -5
                );


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


            // -----------------------------
            // CLEAR INPUT
            // -----------------------------

            guessInput.value = "";

            guessInput.focus();
        }


        // =================================================
        // FIRESTORE GAME STATISTICS
        // =================================================
        //
        // EXACT FIELDS:
        //
        // gamesPlayed
        // gamesWon
        // gamesDrawn
        //
        // =================================================

        async function updateGameStats(
            result
        ) {

            if (!currentUserUID) {

                console.error(
                    "Cannot update Guess Game statistics: no logged-in user."
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


                /*
                 * Every completed Guess Game
                 * increases gamesPlayed.
                 */

                const updates = {

                    gamesPlayed:
                        increment(1)

                };


                /*
                 * Correct guess:
                 * gamesWon +1
                 */

                if (
                    result === "win"
                ) {

                    updates.gamesWon =
                        increment(1);
                }


                /*
                 * This game has no draw.
                 *
                 * Therefore gamesDrawn
                 * is NOT updated.
                 */


                await updateDoc(
                    userRef,
                    updates
                );


                console.log(
                    "Guess Game statistics updated:",
                    {
                        result,
                        fields: updates
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


        // =================================================
        // FIRESTORE POINT UPDATE
        // =================================================

        async function updatePoints(
            value
        ) {

            if (!currentUserUID) {

                console.error(
                    "Cannot update points: no logged-in user."
                );

                return;
            }


            if (
                value === 0
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


                await updateDoc(
                    userRef,
                    {

                        points:
                            increment(value)

                    }
                );


                /*
                 * Update local value so the
                 * navbar changes immediately.
                 */

                currentPoints += value;


                updatePointsDisplay();


                console.log(
                    `Guess Game points updated: ${value}`
                );

            }

            catch (error) {

                console.error(
                    "Failed to update points:",
                    error
                );
            }
        }


        // =================================================
        // ENTER KEY
        // =================================================

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


        // =================================================
        // GUESS BUTTON
        // =================================================

        if (guessButton) {

            guessButton.addEventListener(
                "click",
                checkGuess
            );
        }


        // =================================================
        // NEW GAME BUTTON
        // =================================================

        if (newGameButton) {

            newGameButton.addEventListener(
                "click",
                newGame
            );
        }


        // =================================================
        // START FIRST GAME
        // =================================================

        newGame();

    }
);
