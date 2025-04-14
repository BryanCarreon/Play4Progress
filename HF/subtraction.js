import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get student and teacher IDs from local storage
const selectedId = localStorage.getItem("selectedStudentId");
const selectedName = localStorage.getItem("selectedStudentName");
const teacherUid = localStorage.getItem("teacherUid");

// Redirect if any required data is missing
if (!selectedId || !selectedName || !teacherUid) {
  alert("No student selected. Redirecting to dashboard...");
  window.location.href = "./dashboard.html";
}

// Initial state
let level = 1;
let correctAnswers = 0;
let correctAnswer;
let timer;
let timeLeft = 300;
let gameActive = true;
let progress = 0;

// Determine the starting level based on progress
async function determineStartingLevel() {
  const studentRef = doc(db, "users", teacherUid, "students", selectedId);
  const snapshot = await getDoc(studentRef);
  const data = snapshot.data();
  const subtractionProgress = data.progress?.subtraction || {};
  for (let i = 1; i <= 4; i++) {
    if (subtractionProgress[`level ${i}`] !== "complete") {
      return i;
    }
  }
  return 5; // All levels complete
}

// Start or reset the countdown timer
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

// Generate a subtraction problem
function generateSubtractionProblem(level) {
  if (!gameActive) return;

  if (level > 4) {
    clearInterval(timer);
    gameActive = false;
    document.getElementById("question").textContent = "🎉 All levels complete!";
    document.getElementById("answer").disabled = true;
    document.querySelector(".submit-btn").disabled = true;
    document.getElementById("timer").textContent = "✔️ Done!";
    alert("🎉 You’ve completed all subtraction levels!");
    return;
  }

  const ranges = { 1: [1, 5], 2: [1, 10], 3: [1, 15], 4: [1, 20] };
  let [min, max] = ranges[level] || [1, 5];
  let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
  let num2 = Math.floor(Math.random() * (max - min + 1)) + min;
  if (num2 > num1) [num1, num2] = [num2, num1];
  correctAnswer = num1 - num2;
  document.getElementById("question").textContent = `${num1} - ${num2} = ?`;
}

// Handle answer checking and badge logic
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
        // Mark level complete
        await updateDoc(studentRef, {
          [`progress.subtraction.${completedLevel}`]: "complete"
        });

        const snap = await getDoc(studentRef);
        const studentData = snap.data();
        const progress = studentData.progress || {};
        const badges = studentData.badges || {};
        let updated = false;

        // First drill badge logic
        if (!badges.first_drill_completed) {
          const anyDrillStarted = ["addition", "subtraction", "multiplication", "division"]
            .some(subject => (progress[subject]?.["level 1"] === "complete"));
          if (anyDrillStarted) {
            badges.first_drill_completed = true;
            updated = true;
            alert("🏁 You earned the First Drill badge!");
            const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
            earned.first_drill_completed = true;
            localStorage.setItem("earnedBadges", JSON.stringify(earned));
          }
        }

        // 3-day streak badge logic
        const today = new Date();
        const lastDate = studentData.lastCompletedDate ? new Date(studentData.lastCompletedDate) : null;
        let streak = studentData.streakCount || 1;

        if (lastDate) {
          const diff = (today - lastDate) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else if (diff > 1) streak = 1;
        }

        const updates = { lastCompletedDate: today.toISOString(), streakCount: streak };

        if (streak >= 3 && !badges.streak_3_days) {
          badges.streak_3_days = true;
          updated = true;
          alert("🔥 You earned the 3-Day Streak badge!");
          const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
          earned.streak_3_days = true;
          localStorage.setItem("earnedBadges", JSON.stringify(earned));
        }

        // Subtraction master badge logic
        const subtractionProgress = progress.subtraction || {};
        const allSubtractionComplete = Object.values(subtractionProgress).every(v => v === "complete");
        if (allSubtractionComplete && !badges.subtraction_master) {
          badges.subtraction_master = true;
          updated = true;
          alert("➖ You earned the Subtraction Master badge!");
          const earned = JSON.parse(localStorage.getItem("earnedBadges") || "{}");
          earned.subtraction_master = true;
          localStorage.setItem("earnedBadges", JSON.stringify(earned));
        }

        if (updated) updates.badges = badges;

        await updateDoc(studentRef, updates);

      } catch (error) {
        console.error("Error updating progress or badges:", error);
      }

      // Move to next level
      level++;
      correctAnswers = 0;
      presentProblem();

      if (level <= 4) {
        startTimer();
        alert(`Great job! Moving to level ${level}`);
      }
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

// Load the student's current level and start the game
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
