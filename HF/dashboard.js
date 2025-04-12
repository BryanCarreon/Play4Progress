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
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { firebaseConfig } from './firebase-config.js';

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const userEmailDisplay = document.getElementById("userEmailDisplay");
const addStudentButton = document.getElementById("addStudentButton");
const studentTableBody = document.getElementById("studentTableBody");

// Track auth status
onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    if (userEmailDisplay) {
    userEmailDisplay.textContent = user.email;
    }
    
    const studentsRef = collection(db, "users", user.uid, "students");
    const snapshot = await getDocs(studentsRef);

    
    snapshot.forEach(docSnap => {
    const student = docSnap.data();
    const row = document.createElement("tr");
    const progress = student.progress || {};
    // const progressDisplay = Object.entries(progress)
    // .sort((a, b) => {
    //     const levelA = parseInt(a[0].split(" ")[1]);
    //     const levelB = parseInt(b[0].split(" ")[1]);
    //     return levelA - levelB;
    //   })
    const subjects = ["addition", "subtraction", "multiplication", "division"];

// Create a display per subject
    const progressDisplays = subjects.map(subject => {
    const subjectProgress = progress[subject] || {};
    if (!subjectProgress || typeof subjectProgress !== 'object') {
        return "—"; // No progress for this subject
      }
    
      const display = Object.entries(subjectProgress)
        .sort((a, b) => {
          const aLevel = parseInt(a[0].split(" ")[1]);
          const bLevel = parseInt(b[0].split(" ")[1]);
          return aLevel - bLevel;
        })
        .map(([level, status]) => `${level}: ${status}`)
        .join("<br>");
        return display || "—";
    });

    //this is from the html below:
    // <td>${student.scores?.addition ?? "—"}</td>
    // <td>${student.scores?.subtraction ?? "—"}</td>
    // <td>${student.scores?.multiplication ?? "—"}</td>
    //  <td>${progressDisplay}</td>
    console.log("Student:", student.name, "Progress:", progressDisplays);

    row.innerHTML = `
  <td>${student.name}</td>
  <td>
    ${progressDisplays[0]}<br>
    <button onclick="selectSubject('${docSnap.id}', '${student.name}', 'addition')">Start</button>
  </td>
  <td>
    ${progressDisplays[1]}<br>
    <button onclick="selectSubject('${docSnap.id}', '${student.name}', 'subtraction')">Start</button>
  </td>
  <td>
    ${progressDisplays[2]}<br>
    <button onclick="selectSubject('${docSnap.id}', '${student.name}', 'multiplication')">Start</button>
  </td>
  <td>
    ${progressDisplays[3]}<br>
    <button onclick="selectSubject('${docSnap.id}', '${student.name}', 'division')">Start</button>
  </td>
  <td>
  <button onclick="removeStudent('${docSnap.id}')"
  style="
    background: none;
    border: none;
    color: red;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
  "
  title="Remove Student"
  >✖</button>
  </td>
    `;
    
    if (studentTableBody) {
        studentTableBody.appendChild(row);
      }
  });
});

// Add student
if (addStudentButton){
addStudentButton.addEventListener("click", async () => {
    const nameInput = document.getElementById("newStudentName");
    const studentName = nameInput.value.trim();
  
    if (!studentName) return alert("Enter a student name");
  
  // Optionally sanitize the name to use as a Firestore-safe ID
  const studentId = studentName.replace(/\s+/g, "_").toLowerCase();

  // Reference to students/{studentId}
  const studentRef = doc(db, "users", auth.currentUser.uid, "students", studentId);

  // check if student already exists
  const existing = await getDoc(studentRef);
  if (existing.exists()) {
    return alert("A student with this name already exists.");
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
      addition: {
        "level 1": "incomplete",
        "level 2": "incomplete",
        "level 3": "incomplete",
        "level 4": "incomplete"
      },
      subtraction: {
        "level 1": "incomplete",
        "level 2": "incomplete",
        "level 3": "incomplete",
        "level 4": "incomplete"
      },
      multiplication: {
        "level 1": "incomplete",
        "level 2": "incomplete",
        "level 3": "incomplete",
        "level 4": "incomplete"
      },
      division: {
        "level 1": "incomplete",
        "level 2": "incomplete",
        "level 3": "incomplete",
        "level 4": "incomplete"
      }
    },
    badges:{
      first_drill_completed: false,
      addition_master: false,
      subtraction_master: false,
      multiplication_master: false,
      division_master: false,
      streak_3_days: false
    }
  });
    // const studentsRef = collection(db, "users", auth.currentUser.uid, "students");
    // await addDoc(studentsRef, {
    //   name: studentName,
    //   scores: {
    //     addition: null,
    //     subtraction: null,
    //     multiplication: null
    //   }
    // });
    
  
    window.location.reload();
  });
}

  // Remove student
window.removeStudent = async (studentId) => {
    const studentDoc = doc(db, "users", auth.currentUser.uid, "students", studentId);
    await deleteDoc(studentDoc);
    window.location.reload();
  };
  
  // Select student (can be saved in localStorage for next page)
window.selectSubject = (id, name, subject) => {
  localStorage.setItem("selectedStudentId", id);
  localStorage.setItem("selectedStudentName", name);
  localStorage.setItem("selectedSubject", subject);
  localStorage.setItem("teacherUid", auth.currentUser.uid);
  window.location.href = "student_home_page.html";
  };

