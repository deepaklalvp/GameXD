import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const profileBtn =
    document.getElementById("profileBtn");

const profileMenu =
    document.getElementById("profileMenu");

const drawerBackdrop =
    document.getElementById("drawerBackdrop");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================================================
   DRAWER STATE
   ========================================================= */

function openProfile() {

    if (!profileMenu || !drawerBackdrop) return;

    profileMenu.classList.add("show");
    drawerBackdrop.classList.add("show");

    document.body.classList.add("drawer-open");

    profileMenu.setAttribute(
        "aria-hidden",
        "false"
    );

    if (profileBtn) {
        profileBtn.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


function closeProfile() {

    if (!profileMenu || !drawerBackdrop) return;

    profileMenu.classList.remove("show");
    drawerBackdrop.classList.remove("show");

    document.body.classList.remove("drawer-open");

    profileMenu.setAttribute(
        "aria-hidden",
        "true"
    );

    if (profileBtn) {
        profileBtn.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


function toggleProfile() {

    if (!profileMenu) return;

    if (profileMenu.classList.contains("show")) {

        closeProfile();

    } else {

        openProfile();

    }
}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

if (profileBtn) {

    profileBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            toggleProfile();

        }
    );


    /* Keyboard support */

    profileBtn.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                toggleProfile();

            }

        }
    );

}


/* =========================================================
   BACKDROP
   ========================================================= */

if (drawerBackdrop) {

    drawerBackdrop.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            closeProfile();

        }
    );

}


/* =========================================================
   DRAWER CLICK
   ========================================================= */

if (profileMenu) {

    profileMenu.addEventListener(
        "click",
        (event) => {

            /*
             * Keep clicks inside the drawer
             * from closing it.
             *
             * Buttons inside the drawer still
             * work normally.
             */

            event.stopPropagation();

        }
    );

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            profileMenu &&
            profileMenu.classList.contains("show")
        ) {

            closeProfile();

        }

    }
);


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /* -------------------------------------------------
           NOT LOGGED IN
           ------------------------------------------------- */

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        try {

            /* -------------------------------------------------
               FIRESTORE USER DOCUMENT
               ------------------------------------------------- */

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(userRef);


            /* =================================================
               DEFAULT USER DATA
               ================================================= */

            let userData = {

                name: "Player",

                email:
                    user.email || "",

                points: 0,

                gamesPlayed: 0,

                gamesWon: 0,

                gamesDrawn: 0

            };


            /* =================================================
               FIRESTORE DATA
               ================================================= */

            if (userSnap.exists()) {

                const data =
                    userSnap.data();


                userData = {

                    ...userData,

                    ...data

                };

            }


            /* =================================================
               CLEAN VALUES
               ================================================= */

            const name =
                userData.name ||
                "Player";


            const email =
                userData.email ||
                user.email ||
                "";


            const points =
                Number(
                    userData.points
                ) || 0;


            /*
             * IMPORTANT:
             *
             * These names MUST match
             * the fields used by the games.
             *
             * gamesPlayed
             * gamesWon
             * gamesDrawn
             */

            const gamesPlayed =
                Number(
                    userData.gamesPlayed
                ) || 0;


            const gamesWon =
                Number(
                    userData.gamesWon
                ) || 0;


            const gamesDrawn =
                Number(
                    userData.gamesDrawn
                ) || 0;


            /* =================================================
               NAVBAR
               ================================================= */

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
                    `Hi, ${name}`;

            }


            if (userPoints) {

                userPoints.innerHTML =
                    `<i class="fa-solid fa-star"></i> ${points} pts`;

            }


            /* =================================================
               PROFILE DRAWER ELEMENTS
               ================================================= */

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


            const profilePoints =
                document.getElementById(
                    "profilePoints"
                );


            const profileGames =
                document.getElementById(
                    "profileGames"
                );


            const profileWins =
                document.getElementById(
                    "profileWins"
                );


            /* =================================================
               PROFILE NAME
               ================================================= */

            if (profileName) {

                profileName.textContent =
                    name;

            }


            /* =================================================
               PROFILE EMAIL
               ================================================= */

            if (profileEmail) {

                profileEmail.textContent =
                    email;

            }


            /* =================================================
               PROFILE AVATAR
               ================================================= */

            if (profileAvatar) {

                const firstLetter =
                    name
                        .trim()
                        .charAt(0)
                        .toUpperCase() || "P";


                profileAvatar.textContent =
                    firstLetter;

            }


            /* =================================================
               PROFILE POINTS
               ================================================= */

            if (profilePoints) {

                profilePoints.textContent =
                    `⭐ ${points} Points`;

            }


            /* =================================================
               GAMES PLAYED
               ================================================= */

            if (profileGames) {

                profileGames.textContent =
                    gamesPlayed;

            }


            /* =================================================
               GAMES WON
               ================================================= */

            if (profileWins) {

                profileWins.textContent =
                    gamesWon;

            }


            /* =================================================
               DEBUG
               ================================================= */

            console.log(
                "Profile statistics:",
                {
                    gamesPlayed,
                    gamesWon,
                    gamesDrawn
                }
            );

        }


        catch (error) {

            console.error(
                "Error loading user profile:",
                error
            );


            /* =================================================
               FALLBACK NAVBAR
               ================================================= */

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


            /* =================================================
               FALLBACK PROFILE
               ================================================= */

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


            const profilePoints =
                document.getElementById(
                    "profilePoints"
                );


            const profileGames =
                document.getElementById(
                    "profileGames"
                );


            const profileWins =
                document.getElementById(
                    "profileWins"
                );


            if (profileName) {

                profileName.textContent =
                    "Player";

            }


            if (profileEmail) {

                profileEmail.textContent =
                    user.email || "";

            }


            if (profileAvatar) {

                profileAvatar.textContent =
                    "P";

            }


            if (profilePoints) {

                profilePoints.textContent =
                    "⭐ 0 Points";

            }


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
);


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            try {

                closeProfile();

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


/* =========================================================
   ONLINE PLAYERS
   ========================================================= */

/*
 * Temporary value.
 *
 * Later this can be replaced with
 * real-time Firebase presence.
 */

const onlinePlayers =
    document.getElementById(
        "onlinePlayers"
    );


if (onlinePlayers) {

    onlinePlayers.textContent =
        "124";

}
