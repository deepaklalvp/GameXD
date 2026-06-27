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

let users = [];

snap.forEach(doc => {
    const data = doc.data();

    users.push({
        name: data.name || "Unknown",
        points: data.points ?? 0
    });
});

    board.innerHTML = "";

    // 🏆 TOP 3 PODIUM
    const top3 = users.slice(0, 3);

    const podium = document.createElement("div");
    podium.classList.add("podium");

    podium.innerHTML = `
        <div class="podium-row silver">
            🥈 <span>${top3[1]?.name || "-"}</span>
            <b>${top3[1]?.points || 0}</b>
        </div>

        <div class="podium-row gold">
            🥇 <span>${top3[0]?.name || "-"}</span>
            <b>${top3[0]?.points || 0}</b>
        </div>

        <div class="podium-row bronze">
            🥉 <span>${top3[2]?.name || "-"}</span>
            <b>${top3[2]?.points || 0}</b>
        </div>
    `;

    board.appendChild(podium);

    // 🔻 Rest of leaderboard
    const rest = users.slice(3);

    rest.forEach((u, i) => {
        const row = document.createElement("div");
        row.classList.add("row");

        row.innerHTML = `
            <div class="rank">#${i + 4}</div>
            <div class="name">${u.name}</div>
            <div class="points">${u.points || 0}</div>
        `;

        board.appendChild(row);
    });
});
