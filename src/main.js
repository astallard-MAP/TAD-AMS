import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

// Auth State Logic
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    const adminToggle = document.getElementById('admin-toggle');
    const portfolioLink = document.getElementById('portfolio-link');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            const nameEl = userProfile.querySelector('.user-name');
            if (nameEl) nameEl.textContent = user.email.split('@')[0];
        }

        // Global Redirect Logic
        if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
            const isImpersonating = localStorage.getItem('impersonate_seller') === 'true';
            if (user.uid === ADMIN_UID && !isImpersonating) {
                if (adminToggle) adminToggle.style.display = 'block';
                window.location.href = '/admin.html';
            } else {
                if (portfolioLink) portfolioLink.style.display = 'block';
                window.location.href = '/dashboard.html';
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (adminToggle) adminToggle.style.display = 'none';
    }
});

const CHATBOT_URL = "https://chatbotandy-vjikc6hdhq-uc.a.run.app";
let chatHistory = [];

// UI Element Selections
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const leadForm = document.getElementById('lead-form');
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');

// Chat Toggle Logic
if (chatToggle && chatWindow) {
    chatToggle.onclick = () => chatWindow.classList.toggle('active');
}

function addMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${sender}`;
    // Support markdown if needed, otherwise plain text
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getAndyResponse(input) {
    try {
        const user = auth.currentUser;
        const resp = await fetch(CHATBOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: input, 
                history: chatHistory,
                userId: user ? user.uid : 'anonymous'
            })
        });
        const data = await resp.json();
        chatHistory.push({ role: 'user', content: input });
        chatHistory.push({ role: 'assistant', content: data.response });
        // Keep history manageable
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        return data.response;
    } catch (err) {
        console.error(err);
        return "I'm having a bit of a moment with my connection, but I'm still ready to help with your property. Why don't you try asking again or just fill in the form?";
    }
}

if (chatForm && chatInput && chatMessages) {
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        
        addMessage(msg, 'user');
        chatInput.value = '';
        
        // Add a "typing" indicator
        const typingId = "typing-" + Date.now();
        const typingEl = document.createElement('div');
        typingEl.id = typingId;
        typingEl.className = 'message message-bot typing';
        typingEl.textContent = "Andy is thinking...";
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await getAndyResponse(msg);
        
        const indicator = document.getElementById(typingId);
        if (indicator) indicator.remove();
        
        addMessage(response, 'bot');
    };
}

// Form Logic - Safe Initialisation
if (leadForm) {
    leadForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(leadForm);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = leadForm.querySelector('button');
        if (!submitBtn) return;
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;

        try {
            data.createdAt = serverTimestamp();
            
            // Sample EPC Data Integration for demonstration
            if (data.address.includes('289 Carlton Avenue')) {
                data.epcRating = 'F';
                data.epcExpiry = '18 Aug 2025';
            }

            await addDoc(collection(db, "leads"), data);
            
            const formCard = leadForm.closest('.form-card');
            if (formCard) {
                formCard.innerHTML = `
                    <div class="success-wrap" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-check-circle" style="font-size: 4rem; color: #2e7d32; margin-bottom: 1.5rem;"></i>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.8rem; margin-bottom: 1rem;">Done, ${data.firstName}!</h3>
                        <p style="color: #666; margin-bottom: 2rem;">Andy has received your property details and the initial investigation is complete. Expect a contact from him shortly.</p>
                        
                        <div class="review-invite" style="background: #f9f9f9; padding: 1.5rem; border-radius: 12px; border: 1px solid #eee;">
                            <p style="font-size: 0.9rem; margin-bottom: 1rem; color: #444;"><strong>Help us help others?</strong><br>If you've found our service fast and helpful, please leave us a review on Google.</p>
                            <a href="https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83OBY8" target="_blank" class="btn btn-primary" style="width: 100%;">Share Your Feedback</a>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error(error);
            alert("Error sending details.");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };
}

// Modal Logic
if (loginBtn && loginModal) {
    loginBtn.onclick = () => loginModal.classList.add('active');
    const closeBtn = loginModal.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = () => loginModal.classList.remove('active');
}

if (loginForm) {
    let activeMode = 'login';
    const toggleBtn = document.getElementById('toggle-signup');
    const authTitle = loginModal.querySelector('h2');
    const submitBtn = document.getElementById('main-auth-btn');

    if (toggleBtn) {
        toggleBtn.onclick = (e) => {
            e.preventDefault();
            activeMode = activeMode === 'login' ? 'signup' : 'login';
            authTitle.textContent = activeMode === 'login' ? 'Sign In to Portal' : 'Create Portal Login';
            submitBtn.textContent = activeMode === 'login' ? 'Sign In' : 'Create Account';
            toggleBtn.textContent = activeMode === 'login' ? 'Create Login' : 'Already have a login?';
        };
    }

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const errorMsg = document.getElementById('auth-error');
        
        try {
            if (activeMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            if (loginModal) loginModal.classList.remove('active');
        } catch (error) {
            if (errorMsg) errorMsg.textContent = error.message.replace('Firebase:', '');
        }
    };
}

// Global Logout Controller - Absolute Reliability
document.addEventListener('click', async (e) => {
    if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        console.log("Global Sign Out Sequence Initiated...");
        try {
            await signOut(auth);
            window.location.replace("/");
        } catch (err) {
            console.error("Logout error", err);
            window.location.href = "/"; 
        }
    }
});

// Market News Logic
async function fetchLatestNews() {
    const newsContent = document.getElementById('news-content');
    if (!newsContent) return;
    try {
        const newsDoc = await getDoc(doc(db, "marketUpdates", "latest"));
        if (newsDoc.exists()) {
            const data = newsDoc.data();
            newsContent.innerHTML = `
                <div class="news-meta">
                    <small>Last Analysed: ${data.updatedAt?.toDate().toLocaleString('en-GB')}</small>
                </div>
                ${data.imageUrl ? `<img src="${data.imageUrl}" alt="News Context" style="width: 100%; border-radius: 8px; margin: 1rem 0; max-height: 300px; object-fit: cover;">` : ''}
                <div class="news-body markdown-body">
                    ${marked.parse(data.content)}
                </div>
            `;
        } else {
            newsContent.innerHTML = "<p>Andy is currently preparing today's market insights. Please check back shortly.</p>";
        }
    } catch (err) { 
        console.error(err); 
        newsContent.innerHTML = "<p>Unable to load news at this time. Our researchers are investigating.</p>";
    }
}

fetchLatestNews();

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
