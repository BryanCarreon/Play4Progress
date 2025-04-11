import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js'; // adjust path if needed
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const selectedId = localStorage.getItem("selectedStudentId");
const selectedName = localStorage.getItem("selectedStudentName");
if (!selectedId || !selectedName) {
    alert("No student selected. Redirecting to dashboard...");
    window.location.href = "./dashboard.html";
  }
  window.onload = function () {
    presentProblem();
    startTimer();
  };

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

function generateSubtractionProblem(level) {
    if (!gameActive) return;
    const ranges = { 1: [1, 5], 2: [1, 10], 3: [1, 15], 4: [1, 20] };
    let [minVal, maxVal] = ranges[level] || [1, 5];
    let num1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    let num2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    if (num2 > num1) [num1, num2] = [num2, num1];
    correctAnswer = num1 - num2;
    document.getElementById("question").textContent = `${num1} - ${num2} = ?`;
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
            const completedLevel = `level ${level}`;
            // Update Firestore with completed level
            const studentRef = doc(db, "users", auth.currentUser.uid, "students", selectedId);
            updateDoc(studentRef, {
                [`progress.subtraction.${completedLevel}`]: "complete"
            })
            //;
            .then(() => {
                console.log(`Saved: ${completedLevel} marked complete for ${selectedId}`);
            })
            .catch((error) => {
                console.error("Error updating progress:", error);
            });
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
    generateSubtractionProblem(level);
}

window.onload = function() {
    presentProblem();
    startTimer();
};

function endGame() {
    localStorage.removeItem("selectedStudentId");
    localStorage.removeItem("selectedStudentName");
    window.location.href = "dashboard.html";
  }
  
window.checkAnswer = checkAnswer;
window.endGame = endGame;