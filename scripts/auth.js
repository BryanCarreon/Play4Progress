import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//log in
const loginButton = document.getElementById("loginButton");
if(loginButton){
    loginButton.addEventListener("click",() => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("Logged in as: " + user.email);
            //can redirect later
        })

})
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

//log out
const logoutButton = document.getElementById("logoutButton");
if (logoutButton){
    logoutButton.addEventListener("click", () =>{
    signOut(auth).then(() => {
        alert("Logged out!");
        //redirect to log in maybe
    });
});
}

//signup
const registerButton= document.getElementById("registerButton");
if(registerButton){
    registerButton.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Sign up successful!");

      // OPTIONAL: Save username to Realtime Database later
      console.log("User signed up:", user.email);
    })
    .catch((error) => {
      console.error("Sign-up error:", error.message);
      alert("Error: " + error.message);
    });
});
}