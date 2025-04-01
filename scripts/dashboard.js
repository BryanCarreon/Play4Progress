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

    userEmailDisplay.textContent = user.email;

    const studentsRef = collection(db, "users", user.uid, "students");
    const snapshot = await getDocs(studentsRef);

    
    snapshot.forEach(docSnap => {
    const student = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.scores?.addition ?? "—"}</td>
      <td>${student.scores?.subtraction ?? "—"}</td>
      <td>${student.scores?.multiplication ?? "—"}</td>
      <td>
        <button onclick="selectStudent('${docSnap.id}', '${student.name}')">Select</button>
        <button onclick="removeStudent('${docSnap.id}')">Remove</button>
      </td>
    `;

    studentTableBody.appendChild(row);
  });
});

// Add student
addStudentButton.addEventListener("click", async () => {
    const nameInput = document.getElementById("newStudentName");
    const studentName = nameInput.value.trim();
  
    if (!studentName) return alert("Enter a student name");
  
  // 🔐 Optionally sanitize the name to use as a Firestore-safe ID
  const studentId = studentName.replace(/\s+/g, "_").toLowerCase();

  // Reference to students/{studentId}
  const studentRef = doc(db, "users", auth.currentUser.uid, "students", studentId);

  // Optional: check if student already exists
  const existing = await getDoc(studentRef);
  if (existing.exists()) {
    return alert("A student with this name already exists.");
  }

  await setDoc(studentRef, {
    name: studentName,
    scores: {
      addition: null,
      subtraction: null,
      multiplication: null
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

  // Remove student
window.removeStudent = async (studentId) => {
    const studentDoc = doc(db, "users", auth.currentUser.uid, "students", studentId);
    await deleteDoc(studentDoc);
    window.location.reload();
  };
  
  // Select student (can be saved in localStorage for next page)
  window.selectStudent = (id, name) => {
    localStorage.setItem("selectedStudentId", id);
    localStorage.setItem("selectedStudentName", name);
    // Redirect to math activity page
    //window.location.href = "math.html";
  };

