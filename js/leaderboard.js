import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", () => {

    const board = document.getElementById("board");

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            location.href = "index.html";
            return;
        }

        const currentUserUID = user.uid;

        try {

            const q = query(
                collection(db, "users"),
                orderBy("points", "desc")
            );

            const snap = await getDocs(q);

            let users = [];

            snap.forEach((userDoc) => {

                const data = userDoc.data();

                users.push({
                    uid: userDoc.id,
                    name: data.name || "Unknown",
                    points: data.points ?? 0
                });

            });


            board.innerHTML = "";


            /* =================================================
               TOP 3
               ================================================= */

            const top3 = users.slice(0, 3);

            const podium = document.createElement("div");

            podium.classList.add("podium");


            /* -----------------------------
               1st
               ----------------------------- */

            if (top3[0]) {

                const row = document.createElement("div");

                row.classList.add(
                    "podium-row",
                    "gold"
                );

                if (top3[0].uid === currentUserUID) {
                    row.classList.add("current-player");
                }

                row.innerHTML = `
                    <span>🥇 ${escapeHTML(top3[0].name)}</span>
                    <b>⭐ ${top3[0].points}</b>
                `;

                podium.appendChild(row);
            }


            /* -----------------------------
               2nd
               ----------------------------- */

            if (top3[1]) {

                const row = document.createElement("div");

                row.classList.add(
                    "podium-row",
                    "silver"
                );

                if (top3[1].uid === currentUserUID) {
                    row.classList.add("current-player");
                }

                row.innerHTML = `
                    <span>🥈 ${escapeHTML(top3[1].name)}</span>
                    <b>⭐ ${top3[1].points}</b>
                `;

                podium.appendChild(row);
            }


            /* -----------------------------
               3rd
               ----------------------------- */

            if (top3[2]) {

                const row = document.createElement("div");

                row.classList.add(
                    "podium-row",
                    "bronze"
                );

                if (top3[2].uid === currentUserUID) {
                    row.classList.add("current-player");
                }

                row.innerHTML = `
                    <span>🥉 ${escapeHTML(top3[2].name)}</span>
                    <b>⭐ ${top3[2].points}</b>
                `;

                podium.appendChild(row);
            }


            board.appendChild(podium);


            /* =================================================
               REST OF PLAYERS
               ================================================= */

            const rest = users.slice(3);

            rest.forEach((u, i) => {

                const rank = i + 4;

                const row = document.createElement("div");

                row.classList.add("row");


                /* Highlight logged-in player */

                if (u.uid === currentUserUID) {

                    row.classList.add(
                        "current-player"
                    );

                }


                row.innerHTML = `

                    <div class="rank">
                        ${getRankBadge(rank)}
                    </div>

                    <div class="name">

                        ${escapeHTML(u.name)}

                        ${
                            u.uid === currentUserUID
                                ? `<span class="you-badge">YOU</span>`
                                : ""
                        }

                    </div>

                    <div class="points">
                        ⭐ ${u.points}
                    </div>

                `;

                board.appendChild(row);

            });


            /* =================================================
               CURRENT USER RANK
               ================================================= */

            const currentIndex = users.findIndex(
                u => u.uid === currentUserUID
            );


            if (currentIndex !== -1) {

                const rank = currentIndex + 1;

                const rankInfo =
                    document.createElement("div");

                rankInfo.classList.add(
                    "your-rank"
                );

                rankInfo.innerHTML = `
                    👤 Your Rank:
                    <strong>#${rank}</strong>
                    &nbsp; • &nbsp;
                    ⭐ ${users[currentIndex].points} pts
                `;

                board.prepend(rankInfo);

            }

        } catch (error) {

            console.error(
                "Leaderboard error:",
                error
            );

            board.innerHTML = `
                <div class="error">
                    ⚠️ Unable to load leaderboard.
                </div>
            `;

        }

    });

});


/* =========================================================
   RANK BADGE
   ========================================================= */

function getRankBadge(rank) {

    switch (rank) {

        case 1:
            return `<span class="badge gold">🥇</span>`;

        case 2:
            return `<span class="badge silver">🥈</span>`;

        case 3:
            return `<span class="badge bronze">🥉</span>`;

        default:
            return `
                <span class="badge normal">
                    #${rank}
                </span>
            `;
    }

}


/* =========================================================
   SECURITY
   Prevent Firebase names containing HTML from
   being inserted directly into the page.
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
