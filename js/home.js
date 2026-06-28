import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

       if (docSnap.exists()) {

            const data = docSnap.data();

                document.getElementById("userName").textContent =
    `Hi, ${data.name}`;

document.getElementById("userPoints").textContent =
    `⭐ ${data.points} pts`;

// Profile Drawer
document.getElementById("profileName").textContent = data.name;
document.getElementById("profileEmail").textContent = data.email;

        } else {

            document.getElementById("userName").textContent =
                "Hi, Player";

            document.getElementById("userPoints").textContent =
                " | ⭐ 0 pts";
        }

    } catch (error) {
        console.log(error);
        document.getElementById("userName").textContent =
            "Hi, Player";
    }
});

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {

    if (
        !profileMenu.contains(e.target) &&
        !profileBtn.contains(e.target)
    ) {
        profileMenu.classList.remove("show");
    }

});

// logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});
