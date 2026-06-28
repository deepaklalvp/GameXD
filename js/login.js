import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    await user.reload();

    if (user.emailVerified) {
        window.location.href = "home.html";
    } else {
        await signOut(auth);
    }

});

    const form = document.getElementById("loginForm");
    const error = document.getElementById("error");
    const togglePassword = document.getElementById("togglePassword");
    const password = document.getElementById("password");

    // SAFE check (VERY IMPORTANT)
    if (togglePassword && password) {
        togglePassword.addEventListener("click", () => {
            password.type = password.type === "password" ? "text" : "password";
        });
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const pass = password.value;

        error.textContent = "";

        try {

            const userCredential = await signInWithEmailAndPassword(auth, email, pass);

const user = userCredential.user;

// Reload latest user information
await user.reload();

if (!user.emailVerified) {

    await signOut(auth);

    error.textContent = "Please verify your email before logging in.";

    return;
}

window.location.href = "home.html";

        } catch (err) {

            console.log(err);

            switch (err.code) {

                case "auth/invalid-email":
                    error.textContent = "Invalid email address.";
                    break;

                case "auth/invalid-credential":
                    error.textContent = "Incorrect email or password.";
                    break;

                default:
                    error.textContent = err.message;
            }
        }

    });

});
