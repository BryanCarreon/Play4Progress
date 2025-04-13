import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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
let timeLeft = 300;
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

async function checkAnswer() {
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
            const teacherUid = localStorage.getItem("teacherUid");
            const studentRef = doc(db, "users", teacherUid, "students", selectedId);
          
            try {
              // 1. Mark the level complete
              await updateDoc(studentRef, {
                [`progress.addition.${completedLevel}`]: "complete"
              });
          
              console.log(`Saved: ${completedLevel} marked complete for ${selectedId}`);
          
              // 2. Load latest student data to evaluate badges
              const snap = await getDoc(studentRef);
              const studentData = snap.data();
              const progress = studentData.progress || {};
              const badges = studentData.badges || {};
          
              // 3. Badge logic
          
              // "Check" First drill completed
              if (!badges.first_drill_completed) {
                badges.first_drill_completed = true;
                alert("🏁 You earned the First Drill badge!");
                //store the newly eaned badge in localStorage to sync with home page
                const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
                earned.first_drill_completed = true;
                localStorage.setItem("earnedBadges", JSON.stringify(earned));
              }
          
              // "Check" Addition Master - all levels complete
              const additionProgress = progress.addition || {};
              const allAdditionComplete = Object.values(additionProgress).every(v => v === "complete");
              if (allAdditionComplete && !badges.addition_master) {
                badges.addition_master = true;
                alert("➕ You earned the Addition Master badge!");
                //store the newly eaned badge in localStorage to sync with home page
                const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
                earned.addition_master = true;
                localStorage.setItem("earnedBadges", JSON.stringify(earned));
              }
          
              // 4. Save badge updates
              await updateDoc(studentRef, { badges });
          
            } catch (error) {
              console.error("Error updating progress or badges:", error);
            }
          
            // 5. Move to next level
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

function endGame() {
    window.location.href = "student_home_page.html";
}
  
window.checkAnswer = checkAnswer;
window.endGame = endGame;