import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
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
    const emailInput = document.getElementById("email");

    // SAFE check (VERY IMPORTANT)
    if (togglePassword && password) {
        togglePassword.addEventListener("click", () => {
            password.type = password.type === "password" ? "text" : "password";
        });
    }

    forgotPassword.addEventListener("click", async (e) => {

    e.preventDefault();

    const email = emailInput.value.trim();

    error.style.color = "#ff4d4d";
    error.textContent = "";

    if (!email) {
        error.textContent = "Please enter your email address first.";
        return;
    }

    try {

        await sendPasswordResetEmail(auth, email);

        error.style.color = "#4CAF50";
        error.textContent = "Password reset email has been sent. Check your inbox.";

    } catch (err) {

        error.style.color = "#ff4d4d";

        switch (err.code) {

            case "auth/invalid-email":
                error.textContent = "Invalid email address.";
                break;

            case "auth/user-not-found":
                error.textContent = "No account found with this email.";
                break;

            default:
                error.textContent = err.message;
        }
    }

});
    
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
