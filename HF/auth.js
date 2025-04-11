import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';
import {   getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//signup
const registerButton= document.getElementById("registerButton");
if(registerButton){
    registerButton.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
    .then(async(userCredential) => {
      const user = userCredential.user;
      alert("Sign up successful!");
      
      console.log("User signed up:", user.email);
        // OPTIONAL: Save username to Realtime Database later
        // ✅ Store user email in Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          email: user.email,
          createdAt: new Date()
        });
        window.location.href = "login.html";

    })
    .catch((error) => {
      console.error("Sign-up error:", error.message);
      alert("Error: " + error.message);
    });
});
}

//log in
const loginButton = document.getElementById("loginButton");
if (loginButton) {
  loginButton.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("Login error: " + error.message);
      });
  });
}

//log out
const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logged out.");
      window.location.href = "login.html";
    });
  });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is logged in:", user.email);
      // Optional: redirect to dashboard
      // window.location.href = "dashboard.html";
    } else {
      console.log("No user is logged in.");
      // Optional: restrict access
    }
  });
