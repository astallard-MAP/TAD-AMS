import { db, auth, analytics, logEvent } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

import privacyRaw from './privacy.html?raw';
import cookiesRaw from './cookies.html?raw';
import termsRaw from './terms.html?raw';

const policyHTML = {
    '/privacy.html': privacyRaw,
    '/cookies.html': cookiesRaw,
    '/terms.html': termsRaw
};

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

const CHATBOT_URL = "https://europe-west4-c4h-wesbite.cloudfunctions.net/chatbotAndy";
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

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.onclick = () => navLinks.classList.toggle('mobile-active');
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
        return "I'm having a bit of a moment with my connection, but I'm still here to help. How can I assist with your property today?";
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
            
            await addDoc(collection(db, "leads"), data);
            
            // Register Conversion Event in GA4
            if (analytics) {
                logEvent(analytics, 'lead_generation', {
                    reason: data.reason,
                    timescale: data.timescale,
                    debug_mode: true
                });
            }
            
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
            localStorage.removeItem('impersonate_seller');
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

// --- GOOGLE REVIEWS INTEGRATION ---
async function fetchGoogleReviews() {
    const reviewsGrid = document.getElementById('google-reviews');
    const reviewsSection = document.getElementById('reviews');
    if (!reviewsGrid || !reviewsSection) return;

    try {
        const resp = await fetch('https://europe-west4-c4h-wesbite.cloudfunctions.net/getGoogleReviews');
        if (!resp.ok) throw new Error("API Offline");
        
        const reviews = await resp.json();
        
        // Filter: Only show reviews that have actual text content
        const verifiedReviews = (reviews || []).filter(r => r.comment && r.comment.trim().length > 0);
        
        if (verifiedReviews.length === 0) {
            console.log("No text-based reviews found. Keeping section hidden.");
            reviewsSection.style.display = 'none';
            return;
        }

        reviewsSection.style.display = 'block';

        // Render Reviews
        reviewsGrid.innerHTML = verifiedReviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <img src="${review.reviewer.profilePhotoUrl || '/andy-avatar.jpg'}" alt="${review.reviewer.displayName}" class="reviewer-img">
                    <div class="reviewer-info">
                        <strong>${review.reviewer.displayName}</strong>
                        <div class="stars">${'★'.repeat(review.starRating)}${'☆'.repeat(5 - review.starRating)}</div>
                    </div>
                </div>
                <p class="review-text">"${review.comment ? review.comment.split('\n')[0].substring(0, 150) + (review.comment.length > 150 ? '...' : '') : 'Excellent service from the team at Cash 4 Houses.'}"</p>
                <div class="review-meta">
                    <small>${new Date(review.createTime).toLocaleDateString('en-GB')}</small>
                    <span class="office-tag">${review.source || 'Verified Seller'}</span>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.warn("Reviews Fetch Failure:", err);
        // On failure, we hide the section to avoid "nothing to display" impression
        reviewsSection.style.display = 'none';
    }
}

fetchGoogleReviews();

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

// --- POLICY MODAL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // Inject modal CSS dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .policy-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(5px);
            z-index: 999999; display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .policy-modal-overlay.active { opacity: 1; pointer-events: all; }
        .policy-modal-container {
            background: #fff; width: 90%; max-width: 800px; max-height: 90vh;
            border-radius: 12px; display: flex; flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transform: translateY(20px); transition: transform 0.3s ease;
        }
        .policy-modal-overlay.active .policy-modal-container { transform: translateY(0); }
        .policy-modal-content {
            padding: 2rem; overflow-y: auto; flex-grow: 1;
            font-family: inherit; line-height: 1.6; color: #1e293b;
        }
        .policy-modal-footer {
            padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; background: #f8fafc;
            border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
            display: flex; justify-content: flex-end;
        }
        .policy-modal-btn {
            background: #10b981; color: #fff; border: none; padding: 0.75rem 2rem;
            border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;
            font-size: 1rem;
        }
        .policy-modal-btn:hover { background: #059669; }
        .policy-content-body h1 { font-family: 'Outfit', sans-serif; font-size: 2rem; margin-bottom: 1.5rem; color: #0f172a; }
        .policy-content-body h2 { font-size: 1.3rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #0f172a; }
        .policy-content-body p { margin-bottom: 1rem; }
        .policy-content-body ul { margin-bottom: 1rem; padding-left: 1.5rem; }
        .policy-content-body li { margin-bottom: 0.5rem; }
        .policy-content-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; text-align: left; }
        .policy-content-body th, .policy-content-body td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        /* Add some basic scrollbar styling for the modal */
        .policy-modal-content::-webkit-scrollbar { width: 8px; }
        .policy-modal-content::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .policy-modal-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .policy-modal-content::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'policy-modal-overlay';
    overlay.innerHTML = `
        <div class="policy-modal-container">
            <div class="policy-modal-content">
                <div class="policy-content-body" id="policy-modal-body">Loading...</div>
            </div>
            <div class="policy-modal-footer">
                <button class="policy-modal-btn" id="policy-modal-agree">I Agree & Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById('policy-modal-agree');
    const modalBody = document.getElementById('policy-modal-body');

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
    });

    const links = document.querySelectorAll('a[href="/privacy.html"], a[href="/cookies.html"], a[href="/terms.html"]');
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');
            overlay.classList.add('active');
            
            const rawText = policyHTML[url];
            if (rawText) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(rawText, 'text/html');
                    const mainContent = doc.querySelector('.policy-content');
                    if (mainContent) {
                        modalBody.innerHTML = mainContent.innerHTML;
                    } else {
                        modalBody.innerHTML = '<p>Failed to extract policy content. Please try again later.</p>';
                    }
                } catch (err) {
                    console.error("Failed to parse policy", err);
                    modalBody.innerHTML = '<p>Failed to parse policy. Please try again later.</p>';
                }
            } else {
                modalBody.innerHTML = '<p>Policy content not found.</p>';
            }
        });
    });
});
