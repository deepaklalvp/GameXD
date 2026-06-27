import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    const board = document.getElementById("board");

    const q = query(collection(db, "users"), orderBy("points", "desc"));
    const snap = await getDocs(q);

    let rank = 1;

    snap.forEach(doc => {

        const data = doc.data();

        const row = document.createElement("div");
        row.classList.add("row");

        row.innerHTML = `
            <div class="rank">#${rank}</div>
            <div class="name">${data.name}</div>
            <div class="points">${data.points || 0} pts</div>
        `;

        board.appendChild(row);
        rank++;
    });

});
