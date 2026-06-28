import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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

// Send verification email
await sendEmailVerification(user);

// Save user data
await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    points: 100,
    createdAt: serverTimestamp()
});

// Sign out so user must verify first
await auth.signOut();

// Replace form with success message
document.querySelector(".card").innerHTML = `
    <h1>📧 Verify Your Email</h1>

    <p>
        A verification email has been sent to
        <strong>${email}</strong>.
    </p>

    <p>
        Please verify your email before logging in.
    </p>

    <a href="index.html">
        <button style="margin-top:20px;">
            Go to Login
        </button>
    </a>
`;

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
