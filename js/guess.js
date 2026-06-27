let secretNumber;
let attempts;

function startGame() {

    secretNumber = Math.floor(Math.random() * 100) + 1;

    attempts = 10;

    document.getElementById("attempts").textContent =
        `Attempts Left : ${attempts}`;

    document.getElementById("guessInput").value = "";

    document.getElementById("message").textContent = "";
}

function guessNumber() {

    const input = document.getElementById("guessInput");

    const message = document.getElementById("message");

    const value = parseInt(input.value);

    if (!value || value < 1 || value > 100) {

        message.textContent = "Enter a number between 1 and 100.";

        return;
    }

    attempts--;

    document.getElementById("attempts").textContent =
        `Attempts Left : ${attempts}`;

    if (value === secretNumber) {

        message.textContent = "🎉 Correct! +10 points";

        updatePoints(10);

        return;
    }

    if (attempts === 0) {

        message.textContent =
            `❌ You lost! Number was ${secretNumber}. -5 points`;

        updatePoints(-5);

        return;
    }

    if (value < secretNumber)
        message.textContent = "📈 Too Low!";

    else
        message.textContent = "📉 Too High!";

    input.value = "";
}

document.getElementById("guessBtn")
    .addEventListener("click", guessNumber);

document.getElementById("newGame")
    .addEventListener("click", startGame);

startGame();
