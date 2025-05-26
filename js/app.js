// js/app.js (for login.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged,
    updateProfile // For setting display name
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // Added getDoc

document.addEventListener("DOMContentLoaded", () => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    let app;
    let auth;
    let db;

    try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
            // Fallback config if __firebase_config is not defined (should not happen in your environment)
            apiKey: "YOUR_FALLBACK_API_KEY",
            authDomain: "YOUR_FALLBACK_AUTH_DOMAIN",
            projectId: "YOUR_FALLBACK_PROJECT_ID",
            storageBucket: "YOUR_FALLBACK_STORAGE_BUCKET",
            messagingSenderId: "YOUR_FALLBACK_MESSAGING_SENDER_ID",
            appId: "YOUR_FALLBACK_APP_ID"
        };
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized in app.js (login page).");
    } catch (error) {
        console.error("Error initializing Firebase in app.js:", error);
        const messageEl = document.getElementById("message");
        if (messageEl) messageEl.textContent = "Error initializing application. Please refresh.";
        return;
    }

    const googleProvider = new GoogleAuthProvider();
    // START: Added custom parameter to force account selection
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    // END: Added custom parameter

    // Redirect if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Check if we are on the login page. If so, redirect.
            if (window.location.pathname.includes("login.html")) {
                console.log("User already signed in, redirecting to index.html from login page.");
                window.location.href = "index.html";
            }
        }
    });

    const nameField = document.getElementById('nameField');
    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");
    const googleSignInButton = document.getElementById("googleSignInButton");
    const messageElement = document.getElementById("message");

    // Simplified logic for showing/hiding name field
    if (registerButton) {
        registerButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission if it's part of a form
            messageElement.textContent = "";
            if (nameField) nameField.style.display = 'block';
            
            // Registration logic
            const name = nameField ? nameField.value : '';
            const email = emailField ? emailField.value : '';
            const password = passwordField ? passwordField.value : '';

            if (!name || !email || !password) {
                messageElement.textContent = "Please fill in all fields: Name, Email, and Password.";
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    console.log("User registered:", user);
                    await updateProfile(user, { displayName: name });
                    const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, "info");
                    await setDoc(userDocRef, {
                        _id: user.uid,
                        email: user.email,
                        name: name,
                        createdAt: new Date().toISOString()
                    });
                    console.log("User profile stored in Firestore.");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    messageElement.textContent = "Registration Error: " + error.message;
                    console.error("Registration error:", error);
                });
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission
            messageElement.textContent = "";
            if (nameField) nameField.style.display = 'none';

            const email = emailField ? emailField.value : '';
            const password = passwordField ? passwordField.value : '';

            if (!email || !password) {
                messageElement.textContent = "Please enter both email and password.";
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("User logged in:", userCredential.user);
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    messageElement.textContent = "Login Error: " + error.message;
                    console.error("Login error:", error);
                });
        });
    }
    
    if (googleSignInButton) {
        googleSignInButton.addEventListener("click", async (e) => {
            e.preventDefault();
            messageElement.textContent = "";

            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                console.log("Google User signed in:", user);

                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, "info");
                const docSnap = await getDoc(userDocRef); // Make sure getDoc is imported

                if (!docSnap.exists()) {
                    await setDoc(userDocRef, {
                        _id: user.uid,
                        email: user.email,
                        name: user.displayName || "Google User",
                        createdAt: new Date().toISOString()
                    });
                    console.log("New Google user profile stored in Firestore.");
                } else {
                    console.log("Existing Google user profile found.");
                }
                window.location.href = "index.html";

            } catch (error) {
                if (error.code === 'auth/popup-closed-by-user') {
                    messageElement.textContent = "Sign-in popup was closed before completion.";
                    console.log("Popup closed by user.");
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    messageElement.textContent = "An account already exists with this email address using a different sign-in method.";
                    console.error("Google Sign-In Error:", error);
                } else {
                    messageElement.textContent = `Google Sign-In Error: ${error.message}`;
                    console.error("Google Sign-In Error:", error);
                }
            }
        });
    }
});