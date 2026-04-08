import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
            if (user.uid === ADMIN_UID) {
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

// Andy's Persona and FAQs
const FAQS = [
  { keywords: ["how fast", "speed", "timescale", "week"], answer: "We can complete the sale in as little as 7 days. Once we agree on a price, we move fast to get you the cash." },
  { keywords: ["condition", "broken", "repair", "worse", "derelict"], answer: "I buy property in ANY condition. Don't worry about repairs." },
  { keywords: ["where", "essex", "locations", "southend", "basildon", "leigh", "rayleigh"], answer: "We focus exclusively on South East Essex, covering Southend, Basildon, Rayleigh, Leigh-on-Sea, and all surrounding areas." },
  { keywords: ["guaranteed", "offer", "promise"], answer: "I offer a guaranteed offer. If I don't buy it personally, I have a network who will." },
  { keywords: ["financial", "stop", "repossession", "pressure"], answer: "I specialise in helping people under financial pressure. Our service is discrete." },
  { keywords: ["cost", "fees", "pay"], answer: "There are no hidden fees or high-pressure tactics." }
];

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

// Chat Logic - Safe Initialisation
if (chatToggle && chatWindow) {
    chatToggle.onclick = () => chatWindow.classList.toggle('active');
}

if (chatForm && chatInput && chatMessages) {
    chatForm.onsubmit = (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        addMessage(msg, 'user');
        chatInput.value = '';
        setTimeout(() => {
            const response = getAndyResponse(msg);
            addMessage(response, 'bot');
        }, 1000);
    };
}

function addMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${sender}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAndyResponse(input) {
    const lowercaseInput = input.toLowerCase();
    for (const faq of FAQS) {
        if (faq.keywords.some(k => lowercaseInput.includes(k))) return faq.answer;
    }
    return "Fill out the form, I'll analyse the data and call you back!";
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
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const errorMsg = document.getElementById('login-error');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (loginModal) loginModal.classList.remove('active');
        } catch (error) {
            if (errorMsg) errorMsg.textContent = "Invalid login credentials.";
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
        const docSnap = await getDoc(doc(db, "marketUpdates", "latest"));
        if (docSnap.exists()) {
            newsContent.innerHTML = marked.parse(docSnap.data().content);
        }
    } catch (err) { console.error(err); }
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
