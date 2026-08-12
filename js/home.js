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
   OPEN DRAWER
   ========================================================= */

function openProfile() {

    profileMenu.classList.add("show");

    drawerBackdrop.classList.add("show");

    document.body.classList.add("drawer-open");

    profileMenu.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE DRAWER
   ========================================================= */

function closeProfile() {

    profileMenu.classList.remove("show");

    drawerBackdrop.classList.remove("show");

    document.body.classList.remove("drawer-open");

    profileMenu.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* =========================================================
   TOGGLE DRAWER
   ========================================================= */

function toggleProfile() {

    if (
        profileMenu.classList.contains("show")
    ) {

        closeProfile();

    } else {

        openProfile();

    }
}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

profileBtn.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        toggleProfile();

    }
);


/* =========================================================
   KEYBOARD ACCESS TO PROFILE BUTTON
   ========================================================= */

profileBtn.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            toggleProfile();

        }

    }
);


/* =========================================================
   CLICK BACKDROP
   ========================================================= */

drawerBackdrop.addEventListener(
    "click",
    function () {

        closeProfile();

    }
);


/* =========================================================
   CLICK INSIDE DRAWER
   ========================================================= */

profileMenu.addEventListener(
    "click",
    function (event) {

        /*
         * Stop the click from reaching
         * document.
         *
         * This means clicking buttons
         * INSIDE the drawer will not
         * accidentally close it first.
         */

        event.stopPropagation();

    }
);


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
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

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        try {

            const docRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const docSnap =
                await getDoc(docRef);


            if (docSnap.exists()) {

                const data =
                    docSnap.data();


                /* =========================
                   NAVBAR
                   ========================= */

                document.getElementById(
                    "userName"
                ).textContent =
                    `Hi, ${data.name}`;


                document.getElementById(
                    "userPoints"
                ).innerHTML =
                    `<i class="fa-solid fa-star"></i> ${data.points || 0} pts`;


                /* =========================
                   PROFILE DRAWER
                   ========================= */

                document.getElementById(
                    "profileName"
                ).textContent =
                    data.name || "Player";


                document.getElementById(
                    "profileEmail"
                ).textContent =
                    data.email || user.email || "";


                /* =========================
                   AVATAR
                   ========================= */

                const firstLetter =
                    (data.name || "P")
                    .charAt(0)
                    .toUpperCase();


                document.getElementById(
                    "profileAvatar"
                ).textContent =
                    firstLetter;


            } else {

                document.getElementById(
                    "userName"
                ).textContent =
                    "Hi, Player";


                document.getElementById(
                    "userPoints"
                ).innerHTML =
                    `<i class="fa-solid fa-star"></i> 0 pts`;


                document.getElementById(
                    "profileName"
                ).textContent =
                    "Player";


                document.getElementById(
                    "profileEmail"
                ).textContent =
                    user.email || "";


                document.getElementById(
                    "profileAvatar"
                ).textContent =
                    "P";

            }

        } catch (error) {

            console.error(
                "Error loading user:",
                error
            );


            document.getElementById(
                "userName"
            ).textContent =
                "Hi, Player";

        }

    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

logoutBtn.addEventListener(
    "click",
    async function () {

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


/* =========================================================
   ONLINE PLAYERS
   ========================================================= */

document.getElementById(
    "onlinePlayers"
).textContent = "124";
