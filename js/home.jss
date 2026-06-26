import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Protect route
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // Get user data from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        document.getElementById("userName").textContent =
            "Hi, " + docSnap.data().name;
    } else {
        document.getElementById("userName").textContent =
            "Hi, Player";
    }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    signOut(auth).then(() => {
        window.location.href = "index.html";
    });

});
