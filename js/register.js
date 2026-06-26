import { auth, db } from "./firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    const togglePassword = document.getElementById("togglePassword");
    const password = document.getElementById("password");
    const form = document.getElementById("registerForm");
    const error = document.getElementById("error");

    // safety check
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            password.type = password.type === "password" ? "text" : "password";
        });
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const pass = password.value;
        const confirm = document.getElementById("confirmPassword").value;

        error.textContent = "";

        if (pass !== confirm) {
            error.textContent = "Passwords do not match.";
            return;
        }

        if (pass.length < 6) {
            error.textContent = "Password should be at least 6 characters.";
            return;
        }

        try {

            const userCredential =
                await createUserWithEmailAndPassword(auth, email, pass);

            const user = userCredential.user;

           await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                points: 100, // ⭐ default points
                createdAt: serverTimestamp()
            });

            window.location.href = "home.html";

        } catch (err) {

            console.log(err); // 🔥 IMPORTANT for debugging

            switch (err.code) {

                case "auth/email-already-in-use":
                    error.textContent = "Email already registered.";
                    break;

                case "auth/invalid-email":
                    error.textContent = "Invalid email.";
                    break;

                case "auth/weak-password":
                    error.textContent = "Weak password.";
                    break;

                default:
                    error.textContent = err.message;
            }
        }
    });

});
