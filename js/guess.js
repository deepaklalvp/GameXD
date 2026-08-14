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


    // =====================================================
    // GAME STATE
    // =====================================================

    let secretNumber = null;

    let attempts = 0;

    let gameFinished = false;


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
            // SAVE UID
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
                            data.points ?? 0
                        ) || 0;


                    // -------------------------------------
                    // NAVBAR NAME
                    // -------------------------------------

                    const userName =
                        document.getElementById(
                            "userName"
                        );


                    if (userName) {

                        userName.textContent =
                            `Hi, ${name}`;
                    }


                    // -------------------------------------
                    // NAVBAR POINTS
                    // -------------------------------------

                    updatePointsUI();


                    // -------------------------------------
                    // PROFILE DRAWER
                    // -------------------------------------

                    updateProfileUI(data);


                    console.log(
                        "Guess Game profile loaded:",
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
                                ) || 0,

                            points:
                                currentPoints
                        }
                    );
                }

                // -----------------------------------------
                // USER DOCUMENT DOES NOT EXIST
                // -----------------------------------------

                else {

                    currentPoints = 0;

                    setDefaultProfileUI();
                }

            }

            catch (error) {

                console.error(
                    "Failed to load user data:",
                    error
                );

                currentPoints = 0;

                setDefaultProfileUI();
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
    // NEW GAME
    // =====================================================

    function newGame() {

        secretNumber =
            Math.floor(
                Math.random() * 100
            ) + 1;


        attempts = 10;

        gameFinished = false;


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


        // Remove this after testing
        console.log(
            "Secret number:",
            secretNumber
        );
    }


    // =====================================================
    // END GAME UI
    // =====================================================

    function endGame() {

        gameFinished = true;


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

        // -----------------------------------------------
        // GAME ALREADY FINISHED
        // -----------------------------------------------

        if (gameFinished) {
            return;
        }


        // -----------------------------------------------
        // INPUT CHECK
        // -----------------------------------------------

        if (!guessInput) {
            return;
        }


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


        // -----------------------------------------------
        // REMOVE ONE ATTEMPT
        // -----------------------------------------------

        attempts--;


        if (attemptsText) {

            attemptsText.textContent =
                `Attempts Left : ${attempts}`;
        }


        // =================================================
        // PLAYER WINS
        // =================================================

        if (guess === secretNumber) {

            if (message) {

                message.textContent =
                    "🎉 Correct! +10 points!";
            }


            endGame();


            // ---------------------------------------------
            // UPDATE FIRESTORE
            // ---------------------------------------------

            await finishGuessGame(
                "win",
                10
            );


            return;
        }


        // =================================================
        // PLAYER LOSES
        // =================================================

        if (attempts === 0) {

            if (message) {

                message.textContent =
                    `❌ You Lost! Number was ${secretNumber}. -5 points!`;
            }


            endGame();


            // ---------------------------------------------
            // UPDATE FIRESTORE
            // ---------------------------------------------

            await finishGuessGame(
                "loss",
                -5
            );


            return;
        }


        // =================================================
        // HINT
        // =================================================

        if (guess < secretNumber) {

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


        // -----------------------------------------------
        // CLEAR INPUT
        // -----------------------------------------------

        guessInput.value = "";

        guessInput.focus();
    }


    // =====================================================
    // ENTER KEY
    // =====================================================

    if (guessInput) {

        guessInput.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

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


// =========================================================
// FINISH GUESS GAME
// =========================================================
//
// WIN:
// gamesPlayed +1
// wins +1
// points +10
//
// LOSS:
// gamesPlayed +1
// points -5
//
// LOCAL DRAWER IS REFRESHED AFTER FIRESTORE UPDATE
// =========================================================

async function finishGuessGame(
    result,
    points
) {

    if (!currentUserUID) {

        console.error(
            "Cannot update game statistics: no logged-in user."
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


        // -----------------------------------------------
        // GAME STATISTICS
        // -----------------------------------------------

        const updates = {

            gamesPlayed:
                increment(1)

        };


        // -----------------------------------------------
        // WIN
        // -----------------------------------------------

        if (result === "win") {

            updates.wins =
                increment(1);
        }


        // -----------------------------------------------
        // POINTS
        // -----------------------------------------------

        if (points !== 0) {

            updates.points =
                increment(points);
        }


        // -----------------------------------------------
        // SINGLE FIRESTORE UPDATE
        // -----------------------------------------------

        await updateDoc(
            userRef,
            updates
        );


        console.log(
            "Guess Game statistics updated:",
            {
                result,
                points
            }
        );


        // -----------------------------------------------
        // UPDATE LOCAL POINT VALUE
        // -----------------------------------------------

        currentPoints += points;


        updatePointsUI();


        // -----------------------------------------------
        // REFRESH PROFILE DRAWER
        // -----------------------------------------------

        await refreshProfileDrawer();

    }

    catch (error) {

        console.error(
            "Failed to update Guess Game statistics:",
            error
        );
    }
}


// =========================================================
// REFRESH PROFILE DRAWER
// =========================================================
//
// Reads Firestore again after the game.
//
// This makes:
//
// Games
// Wins
// Points
//
// update immediately without page refresh.
// =========================================================

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


        // -----------------------------------------------
        // GAMES PLAYED
        // -----------------------------------------------

        const gamesPlayed =
            Number(
                data.gamesPlayed ?? 0
            ) || 0;


        // -----------------------------------------------
        // WINS
        // -----------------------------------------------

        const wins =
            Number(
                data.wins ??
                data.gamesWon ??
                0
            ) || 0;


        // -----------------------------------------------
        // DRAWS
        // -----------------------------------------------

        const gamesDrawn =
            Number(
                data.gamesDrawn ?? 0
            ) || 0;


        // -----------------------------------------------
        // POINTS
        // -----------------------------------------------

        const points =
            Number(
                data.points ?? 0
            ) || 0;


        currentPoints =
            points;


        // -----------------------------------------------
        // PROFILE GAMES
        // -----------------------------------------------

        const profileGames =
            document.getElementById(
                "profileGames"
            );


        if (profileGames) {

            profileGames.textContent =
                gamesPlayed;
        }


        // -----------------------------------------------
        // PROFILE WINS
        // -----------------------------------------------

        const profileWins =
            document.getElementById(
                "profileWins"
            );


        if (profileWins) {

            profileWins.textContent =
                wins;
        }


        // -----------------------------------------------
        // PROFILE POINTS
        // -----------------------------------------------

        const profilePoints =
            document.getElementById(
                "profilePoints"
            );


        if (profilePoints) {

            profilePoints.textContent =
                `⭐ ${points} Points`;
        }


        // -----------------------------------------------
        // NAVBAR POINTS
        // -----------------------------------------------

        updatePointsUI();


        console.log(
            "Guess Game profile drawer refreshed:",
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
// UPDATE PROFILE UI
// =========================================================

function updateProfileUI(data) {

    const name =
        data.name ||
        "Player";


    const email =
        data.email ||
        auth.currentUser?.email ||
        "";


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


    // -----------------------------------------------
    // NAME
    // -----------------------------------------------

    if (profileName) {

        profileName.textContent =
            name;
    }


    // -----------------------------------------------
    // EMAIL
    // -----------------------------------------------

    if (profileEmail) {

        profileEmail.textContent =
            email;
    }


    // -----------------------------------------------
    // AVATAR
    // -----------------------------------------------

    if (profileAvatar) {

        profileAvatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "P";
    }


    // -----------------------------------------------
    // GAMES
    // -----------------------------------------------

    if (profileGames) {

        profileGames.textContent =
            gamesPlayed;
    }


    // -----------------------------------------------
    // WINS
    // -----------------------------------------------

    if (profileWins) {

        profileWins.textContent =
            wins;
    }


    // -----------------------------------------------
    // POINTS
    // -----------------------------------------------

    if (profilePoints) {

        profilePoints.textContent =
            `⭐ ${currentPoints} Points`;
    }
}


// =========================================================
// DEFAULT PROFILE UI
// =========================================================

function setDefaultProfileUI() {

    const userName =
        document.getElementById(
            "userName"
        );


    const userPoints =
        document.getElementById(
            "userPoints"
        );


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


    if (userName) {

        userName.textContent =
            "Hi, Player";
    }


    if (userPoints) {

        userPoints.innerHTML =
            `<i class="fa-solid fa-star"></i> 0 pts`;
    }


    if (profileName) {

        profileName.textContent =
            "Player";
    }


    if (profileEmail) {

        profileEmail.textContent =
            auth.currentUser?.email ||
            "";
    }


    if (profileAvatar) {

        profileAvatar.textContent =
            "P";
    }


    if (profileGames) {

        profileGames.textContent =
            "0";
    }


    if (profileWins) {

        profileWins.textContent =
            "0";
    }


    if (profilePoints) {

        profilePoints.textContent =
            "⭐ 0 Points";
    }
}
