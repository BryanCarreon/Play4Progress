import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const selectedId = localStorage.getItem("selectedStudentId");
const selectedName = localStorage.getItem("selectedStudentName");
const teacherUid = localStorage.getItem("teacherUid");

if (!selectedId || !selectedName || !teacherUid) {
    alert("No student selected. Redirecting to dashboard...");
    window.location.href = "./dashboard.html";
}

let level = 1;
let correctAnswers = 0;
let correctAnswer;
let timer;
let timeLeft = 300;
let gameActive = true;
let progress = 0;

async function determineStartingLevel() {
  const studentRef = doc(db, "users", teacherUid, "students", selectedId);
  const snapshot = await getDoc(studentRef);
  const data = snapshot.data();
  const progress = data.progress?.multiplication || {};
  for (let i = 1; i <= 4; i++) {
    if (progress[`level ${i}`] !== "complete") return i;
  }
  return 5;
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 300;
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

function generateMultiplicationProblem(level) {
  if (!gameActive) return;

  if (level > 4) {
    clearInterval(timer);
    gameActive = false;
    document.getElementById("question").textContent = "🎉 All levels complete!";
    document.getElementById("answer").disabled = true;
    document.querySelector(".submit-btn").disabled = true;
    document.getElementById("timer").textContent = "✔️ Done!";
    alert("🎉 You’ve completed all multiplication levels!");
    return;
  }

  const ranges = { 1: [1, 5], 2: [1, 10], 3: [1, 15], 4: [1, 20] };
  let [min, max] = ranges[level] || [1, 5];
  let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
  let num2 = Math.floor(Math.random() * (max - min + 1)) + min;
  correctAnswer = num1 * num2;
  document.getElementById("question").textContent = `${num1} x ${num2} = ?`;
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
      const studentRef = doc(db, "users", teacherUid, "students", selectedId);

      try {
        await updateDoc(studentRef, {
          [`progress.multiplication.${completedLevel}`]: "complete"
        });

        const snap = await getDoc(studentRef);
        const studentData = snap.data();
        const progress = studentData.progress || {};
        const badges = studentData.badges || {};
        let updated = false;

        if (!badges.first_drill_completed) {
          const started = ["addition", "subtraction", "multiplication", "division"]
            .some(subj => progress[subj]?.["level 1"] === "complete");
          if (started) {
            badges.first_drill_completed = true;
            updated = true;
            alert("🏁 You earned the First Drill badge!");
            const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
            earned.first_drill_completed = true;
            localStorage.setItem("earnedBadges", JSON.stringify(earned));
          }
        }

        const multiProgress = progress.multiplication || {};
        const allDone = Object.values(multiProgress).every(v => v === "complete");
        if (allDone && !badges.multiplication_master) {
          badges.multiplication_master = true;
          updated = true;
          alert("✖️ You earned the Multiplication Master badge!");
          const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
          earned.multiplication_master = true;
          localStorage.setItem("earnedBadges", JSON.stringify(earned));
        }

        if (updated) await updateDoc(studentRef, { badges });

      } catch (err) {
        console.error("Error updating badges or progress:", err);
      }

      level = Math.min(level + 1, 4);
      correctAnswers = 0;
      alert(`Great job! Moving to level ${level}`);
      startTimer();
    }
  } else {
    feedback.textContent = `Incorrect! The correct answer was ${correctAnswer}.`;
    feedback.style.color = "red";
  }

  document.getElementById("answer").value = "";
  setTimeout(presentProblem, 1000);
}

function presentProblem() {
  generateMultiplicationProblem(level);
}

window.onload = async function () {
  level = await determineStartingLevel();
  presentProblem();
  startTimer();
};

function endGame() {
  window.location.href = "student_home_page.html";
}

window.checkAnswer = checkAnswer;
window.endGame = endGame;
