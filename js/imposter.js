let players = [];
let roles = [];
let impostorIndex = 0;
let currentPlayer = 0;

let word = "Apple"; // you can later randomize this

document.getElementById("startGame").addEventListener("click", startGame);

function startGame() {

    const count = parseInt(document.getElementById("players").value);

    if (!count || count < 2) {
        alert("Enter at least 2 players");
        return;
    }

    players = Array.from({ length: count });

    roles = Array(count).fill("civilian");

    impostorIndex = Math.floor(Math.random() * count);

    roles[impostorIndex] = "impostor";

    currentPlayer = 0;

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").classList.remove("hidden");

    showPlayer();
}

function showPlayer() {

    document.getElementById("playerText").textContent =
        `Player ${currentPlayer + 1}`;

    document.getElementById("roleBox").textContent = "";

    document.getElementById("revealBtn").style.display = "block";
    document.getElementById("nextBtn").classList.add("hidden");
}

document.getElementById("revealBtn").addEventListener("click", () => {

    const role = roles[currentPlayer];

    if (role === "impostor") {
        document.getElementById("roleBox").textContent =
            "😈 YOU ARE THE IMPOSTOR";
    } else {
        document.getElementById("roleBox").textContent =
            `Word: ${word}`;
    }

    document.getElementById("revealBtn").style.display = "none";
    document.getElementById("nextBtn").classList.remove("hidden");
});

document.getElementById("nextBtn").addEventListener("click", () => {

    currentPlayer++;

    if (currentPlayer >= players.length) {
        alert("All players done. Start discussion outside app.");
        location.reload();
        return;
    }

    showPlayer();
});
