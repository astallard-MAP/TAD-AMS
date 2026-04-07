import { auth, db } from './firebase-config.js';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Authentication for Andrew Stallard (Global Administrator)
const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

// Global Auth State Handler
onAuthStateChanged(auth, async (user) => {
  const loginBtn = document.getElementById('login-btn');
  const userProfile = document.getElementById('user-profile');
  const adminToggle = document.getElementById('admin-toggle');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) {
      userProfile.style.display = 'flex';
      userProfile.querySelector('.user-name').textContent = user.email.split('@')[0];
    }
    
    // Check if Global Admin
    if (user.uid === ADMIN_UID) {
      if (adminToggle) adminToggle.style.display = 'block';
    } else {
      // Regular User Profile Link
      const portfolioLink = document.getElementById('portfolio-link');
      if (portfolioLink) portfolioLink.style.display = 'block';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userProfile) userProfile.style.display = 'none';
    if (adminToggle) adminToggle.style.display = 'none';
  }
});

// UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const errorMsg = document.getElementById('login-error');
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                document.getElementById('login-modal').classList.remove('active');
            } catch (error) {
                if (errorMsg) errorMsg.textContent = "Invalid login credentials.";
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => signOut(auth));
    }

    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => loginModal.classList.add('active'));
        loginModal.querySelector('.close-modal').addEventListener('click', () => loginModal.classList.remove('active'));
    }
});
