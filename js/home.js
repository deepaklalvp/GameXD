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

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   DRAWER STATE
   ========================================================= */

function openProfile() {

    if (!profileMenu || !drawerBackdrop) return;

    profileMenu.classList.add("show");
    drawerBackdrop.classList.add("show");

    document.body.classList.add("drawer-open");

    profileMenu.setAttribute("aria-hidden", "false");

    if (profileBtn) {
        profileBtn.setAttribute("aria-expanded", "true");
    }
}


function closeProfile() {

    if (!profileMenu || !drawerBackdrop) return;

    profileMenu.classList.remove("show");
    drawerBackdrop.classList.remove("show");

    document.body.classList.remove("drawer-open");

    profileMenu.setAttribute("aria-hidden", "true");

    if (profileBtn) {
        profileBtn.setAttribute("aria-expanded", "false");
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

    profileBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        toggleProfile();

    });


    /* Keyboard support */

    profileBtn.addEventListener("keydown", (event) => {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            toggleProfile();

        }

    });

}


/* =========================================================
   BACKDROP
   ========================================================= */

/*
   IMPORTANT:

   Clicking outside the drawer means clicking
   the backdrop.

   It closes ONLY the drawer.

   It does NOT trigger buttons underneath.
*/

if (drawerBackdrop) {

    drawerBackdrop.addEventListener("click", (event) => {

        event.preventDefault();
        event.stopPropagation();

        closeProfile();

    });

}


/* =========================================================
   DRAWER CLICK
   ========================================================= */

/*
   Clicking inside the drawer should NOT close it.

   However, we do NOT prevent normal button behavior.

   So:
   - Edit Profile works
   - View Profile works
   - Terms works
   - Privacy works
   - Help works
   - Logout works
*/

if (profileMenu) {

    profileMenu.addEventListener("click", (event) => {

        event.stopPropagation();

    });

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        profileMenu &&
        profileMenu.classList.contains("show")
    ) {

        closeProfile();

    }

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    /* -----------------------------------------------------
       USER NOT LOGGED IN
       ----------------------------------------------------- */

    if (!user) {

        window.location.href = "index.html";

        return;

    }


    try {

        /* -------------------------------------------------
           FIRESTORE USER DOCUMENT
           ------------------------------------------------- */

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);


        /* -------------------------------------------------
           DEFAULT USER DATA
           ------------------------------------------------- */

        let userData = {

            name: "Player",

            email: user.email || "",

            points: 0,

            gamesPlayed: 0,

            wins: 0

        };


        /* -------------------------------------------------
           GET FIRESTORE DATA
           ------------------------------------------------- */

        if (userSnap.exists()) {

            const data = userSnap.data();

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
            Number(userData.points) || 0;


        const gamesPlayed =
            Number(
                userData.gamesPlayed ??
                userData.games ??
                0
            ) || 0;


        const wins =
            Number(
                userData.wins ??
                userData.gameWins ??
                0
            ) || 0;


        /* =================================================
           NAVBAR
           ================================================= */

        const userName =
            document.getElementById("userName");


        const userPoints =
            document.getElementById("userPoints");


        if (userName) {

            userName.textContent =
                `Hi, ${name}`;

        }


        if (userPoints) {

            userPoints.innerHTML =
                `<i class="fa-solid fa-star"></i> ${points} pts`;

        }


        /* =================================================
           PROFILE DRAWER
           ================================================= */

        const profileName =
            document.getElementById("profileName");


        const profileEmail =
            document.getElementById("profileEmail");


        const profileAvatar =
            document.getElementById("profileAvatar");


        const profilePoints =
            document.getElementById("profilePoints");


        const profileGames =
            document.getElementById("profileGames");


        const profileWins =
            document.getElementById("profileWins");


        /* -------------------------------------------------
           NAME
           ------------------------------------------------- */

        if (profileName) {

            profileName.textContent =
                name;

        }


        /* -------------------------------------------------
           EMAIL
           ------------------------------------------------- */

        if (profileEmail) {

            profileEmail.textContent =
                email;

        }


        /* -------------------------------------------------
           AVATAR
           ------------------------------------------------- */

        if (profileAvatar) {

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "P";


            profileAvatar.textContent =
                firstLetter;

        }


        /* -------------------------------------------------
           PROFILE POINTS
           ------------------------------------------------- */

        if (profilePoints) {

            profilePoints.textContent =
                `⭐ ${points} Points`;

        }


        /* -------------------------------------------------
           GAMES PLAYED
           ------------------------------------------------- */

        if (profileGames) {

            profileGames.textContent =
                gamesPlayed;

        }


        /* -------------------------------------------------
           WINS
           ------------------------------------------------- */

        if (profileWins) {

            profileWins.textContent =
                wins;

        }


    } catch (error) {

        console.error(
            "Error loading user profile:",
            error
        );


        /* -------------------------------------------------
           FALLBACK UI
           ------------------------------------------------- */

        const userName =
            document.getElementById("userName");


        const userPoints =
            document.getElementById("userPoints");


        if (userName) {

            userName.textContent =
                "Hi, Player";

        }


        if (userPoints) {

            userPoints.innerHTML =
                `<i class="fa-solid fa-star"></i> 0 pts`;

        }


        const profileName =
            document.getElementById("profileName");


        const profileEmail =
            document.getElementById("profileEmail");


        const profileAvatar =
            document.getElementById("profileAvatar");


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

    }

});


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            /*
             * Close drawer before signing out
             */

            closeProfile();


            await signOut(auth);


            /*
             * Redirect after successful logout
             */

            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    });

}


/* =========================================================
   ONLINE PLAYERS
   ========================================================= */

/*
   Temporary value.

   Later this can be replaced with
   real-time Firebase presence.
*/

const onlinePlayers =
    document.getElementById("onlinePlayers");


if (onlinePlayers) {

    onlinePlayers.textContent =
        "124";

}
