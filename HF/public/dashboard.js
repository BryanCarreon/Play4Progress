// Firebase App Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM references
const userEmailDisplay = document.getElementById("userEmailDisplay");
const addStudentButton = document.getElementById("addStudentButton");
const studentTableBody = document.getElementById("studentTableBody");

/**
 * Generates a status circle to indicate if all levels in a subject are complete.
 * @param {Object} subjectProgress - The progress object for a subject.
 * @returns {string} - HTML span element with appropriate class.
 */
function getStatusCircle(subjectProgress) {
  const allComplete = Object.values(subjectProgress || {}).every(status => status === "complete");
  const className = allComplete ? "status-circle status-complete" : "status-circle status-incomplete";
  return `<span class="${className}"></span>`;
}

// When user auth state changes (login/logout), update UI
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  if (userEmailDisplay) userEmailDisplay.textContent = user.email;

  const studentsRef = collection(db, "users", user.uid, "students");
  const snapshot = await getDocs(studentsRef);

  snapshot.forEach(docSnap => {
    const student = docSnap.data();
    const row = document.createElement("tr");
    const progress = student.progress || {};
    const subjects = ["addition", "subtraction", "multiplication", "division"];

    const progressDisplays = subjects.map(subject => {
      const subjectProgress = progress[subject] || {};

      // Generate a row of levels with colored status circles
      const levelsHTML = Object.entries(subjectProgress)
        .sort(([a], [b]) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]))
        .map(([level, status]) => {
          const circleClass = status === "complete" ? "status-circle status-complete" : "status-circle status-incomplete";
          return `<div class="level-row">
                    <span class="${circleClass}"></span> ${level}
                  </div>`;
        }).join("");

      return `
        <div class="subject-cell">
          <div class="levels">${levelsHTML}</div>
          <button onclick="selectSubject('${docSnap.id}', '${student.name}', '${subject}')">Start</button>
        </div>
      `;
    });

    // Append student row to table
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${progressDisplays[0]}</td>
      <td>${progressDisplays[1]}</td>
      <td>${progressDisplays[2]}</td>
      <td>${progressDisplays[3]}</td>
      <td>
        <button onclick="removeStudent('${docSnap.id}')" 
                style="background: none; border: none; color: red; font-weight: bold; font-size: 16px; cursor: pointer;"
                title="Remove Student">
          ✖
        </button>
      </td>
    `;

    if (studentTableBody) {
      studentTableBody.appendChild(row);
    }
  });
});

/**
 * Handles adding a new student to the Firestore database.
 * Validates input, checks for duplicate names, and sets up default progress structure.
 */
if (addStudentButton) {
  addStudentButton.addEventListener("click", async () => {
    const nameInput = document.getElementById("newStudentName");
    const studentName = nameInput.value.trim();

    if (!studentName) {
      alert("Please enter a student name.");
      return;
    }

    const studentId = studentName.replace(/\s+/g, "_").toLowerCase();
    const studentRef = doc(db, "users", auth.currentUser.uid, "students", studentId);
    const existing = await getDoc(studentRef);

    if (existing.exists()) {
      alert("A student with this name already exists.");
      return;
    }

    await setDoc(studentRef, {
      name: studentName,
      scores: {
        addition: null,
        subtraction: null,
        multiplication: null,
        division: null
      },
      progress: {
        addition: { "level 1": "incomplete", "level 2": "incomplete", "level 3": "incomplete", "level 4": "incomplete" },
        subtraction: { "level 1": "incomplete", "level 2": "incomplete", "level 3": "incomplete", "level 4": "incomplete" },
        multiplication: { "level 1": "incomplete", "level 2": "incomplete", "level 3": "incomplete", "level 4": "incomplete" },
        division: { "level 1": "incomplete", "level 2": "incomplete", "level 3": "incomplete", "level 4": "incomplete" }
      },
      badges: {
        first_drill_completed: false,
        addition_master: false,
        subtraction_master: false,
        multiplication_master: false,
        division_master: false,
        streak_3_days: false
      }
    });

    window.location.reload();
  });
}

/**
 * Removes a student document from Firestore.
 * @param {string} studentId - The ID of the student to be deleted.
 */
window.removeStudent = async (studentId) => {
  const studentDoc = doc(db, "users", auth.currentUser.uid, "students", studentId);
  await deleteDoc(studentDoc);
  window.location.reload();
};

/**
 * Stores selected student and subject in localStorage and navigates to the drill page.
 * @param {string} id - Firestore doc ID of student.
 * @param {string} name - Name of the student.
 * @param {string} subject - Subject to drill into (e.g., addition).
 */
window.selectSubject = (id, name, subject) => {
  localStorage.setItem("selectedStudentId", id);
  localStorage.setItem("selectedStudentName", name);
  localStorage.setItem("selectedSubject", subject);
  localStorage.setItem("teacherUid", auth.currentUser.uid);
  window.location.href = "student_home_page.html";
};
