import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    // Redirect if already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = "home.html";
        }
    });

    const togglePassword = document.getElementById("togglePassword");
    const password = document.getElementById("password");
    const form = document.getElementById("loginForm");
    const error = document.getElementById("error");

    // Prevent crash
    if (togglePassword && password) {
        togglePassword.addEventListener("click", () => {
            password.type =
                password.type === "password" ? "text" : "password";
        });
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const pass = password.value;

        error.textContent = "";

        try {

            await signInWithEmailAndPassword(auth, email, pass);

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

                case "auth/user-disabled":
                    error.textContent = "Account has been disabled.";
                    break;

                default:
                    error.textContent = err.message;
            }

        }

    });

});
