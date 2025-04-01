let level = 1;
let correctAnswers = 0;
let correctAnswer;
let timer;
let timeLeft = 20;
let gameActive = true;
let progress = 0;

function startTimer() {
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById("timer").textContent = "Time's up!";
            gameActive = false;
        } else {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timeLeft--;
        }
    }, 1000);
}

function generateAdditionProblem(level) {
    if (!gameActive) return;
    const ranges = { 1: [1, 5], 2: [1, 10], 3: [1, 15], 4: [1, 20] };
    let [minVal, maxVal] = ranges[level] || [1, 5];
    let num1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    let num2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    correctAnswer = num1 + num2;
    document.getElementById("question").textContent = `${num1} + ${num2} = ?`;
}

function checkAnswer() {
    if (!gameActive) return;
    let userAnswer = parseInt(document.getElementById("answer").value);
    let feedback = document.getElementById("feedback");
    if (userAnswer === correctAnswer) {
        feedback.textContent = "Correct!";
        feedback.style.color = "green";
        correctAnswers++;
        progress = (correctAnswers % 5) * 20;
        document.querySelector(".progress-bar").style.height = progress + "%";
        if (correctAnswers % 5 === 0) {
            level = Math.min(level + 1, 4);
            alert(`Great job! Moving to level ${level}.`);
        }
    } else {
        feedback.textContent = `Incorrect! The correct answer was ${correctAnswer}.`;
        feedback.style.color = "red";
    }
    document.getElementById("answer").value = "";
    setTimeout(presentProblem, 1000);
}

function presentProblem() {
    generateAdditionProblem(level);
}

window.onload = function() {
    presentProblem();
    startTimer();
};