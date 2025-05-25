// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// This event listener ensures that the code runs only after the entire HTML document has been loaded and parsed.
document.addEventListener("DOMContentLoaded", () => {

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyByfTCA3Gn18TrWubL--7mCrGjeDPeExLs",
      authDomain: "placement-preparation-website.firebaseapp.com",
      databaseURL: "https://placement-preparation-website-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "placement-preparation-website",
      storageBucket: "placement-preparation-website.firebasestorage.app",
      messagingSenderId: "667068078157",
      appId: "1:667068078157:web:f5614c76afa7e489c52404",
      measurementId: "G-1ECX1T9QHY"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    // Handle login with Email and Password
    document.getElementById("loginButton").addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("User:", userCredential.user);
          window.location.href = "index.html";
        })
        .catch((error) => {
          document.getElementById("message").textContent = "Error: " + error.message;
          console.error(error);
        });
    });

    // Handle registration with Email and Password
    document.getElementById("registerButton").addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("User:", userCredential.user);
                window.location.href = "index.html";
            })
            .catch((error) => {
                document.getElementById("message").textContent = "Error: " + error.message;
                console.error(error);
            });
    });

    // Handle Google Sign-In
    document.getElementById("googleSignInButton").addEventListener("click", (e) => {
        e.preventDefault();

        signInWithPopup(auth, googleProvider)
            .then((result) => {
                const user = result.user;
                console.log("Google User:", user);
                window.location.href = "index.html";
            }).catch((error) => {
                // Check for specific errors here
                if (error.code === 'auth/popup-closed-by-user') {
                    console.log("Popup closed by user.");
                    document.getElementById("message").textContent = "Sign-in popup was closed before completion.";
                } else {
                    document.getElementById("message").textContent = `Error: ${error.message}`;
                    console.error("Google Sign-In Error:", error);
                }
            });
    });

});