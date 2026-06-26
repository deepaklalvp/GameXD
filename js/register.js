import { auth, db } from "/js/firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Show / Hide Password
const togglePassword = document.getElementById("togglePassword");

const password = document.getElementById("password");

togglePassword.addEventListener("click", () => {

    password.type =
        password.type === "password"
            ? "text"
            : "password";

});

const form = document.getElementById("registerForm");

const error = document.getElementById("error");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const pass = password.value;

    const confirm =
        document.getElementById("confirmPassword").value;

    error.textContent = "";

    if (pass !== confirm) {

        error.textContent = "Passwords do not match.";

        return;

    }

    if (pass.length < 6) {

        error.textContent =
            "Password should be at least 6 characters.";

        return;

    }

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                pass
            );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {

            name: name,

            email: email,

            createdAt: serverTimestamp()

        });

        window.location.href = "home.html";

    } catch (err) {

        switch (err.code) {

            case "auth/email-already-in-use":
                error.textContent =
                    "Email already registered.";
                break;

            case "auth/invalid-email":
                error.textContent =
                    "Invalid email.";
                break;

            case "auth/weak-password":
                error.textContent =
                    "Password is too weak.";
                break;

            default:
                error.textContent = err.message;

        }

    }

});
