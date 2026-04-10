import { authReady, db, auth, storage, functions } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    getCountFromServer,
    where,
    doc,
    getDoc,
    setDoc,
    limit
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

authReady.then(async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadDashboardStats();
        loadLeads();
        loadAdminNews();
        loadAdminProfile(user.uid);
        pollSecurityAlerts();
    }
});

// Mobile Sidebar Toggle
const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
const sidebar = document.querySelector('.dashboard-sidebar');
if (mobileSidebarToggle && sidebar) {
    mobileSidebarToggle.onclick = () => sidebar.classList.toggle('active');
}

async function pollSecurityAlerts() {
    const alertsQuery = query(
        collection(db, "systemAlerts"), 
        where("status", "==", "unread"),
        orderBy("timestamp", "desc")
    );

    // Initial check
    const checkAlerts = async () => {
        const snap = await getDocs(alertsQuery);
        if (!snap.empty) {
            const alert = snap.docs[0];
            showSecurityAlert(alert);
        }
    };

    checkAlerts();
    // Poll every 60 seconds for live updates if logged in
    setInterval(checkAlerts, 60000);
}

function showSecurityAlert(alertDoc) {
    const alert = alertDoc.data();
    const modal = document.getElementById('security-alert-modal');
    if (!modal) return;

    document.getElementById('alert-type').textContent = alert.type;
    document.getElementById('alert-reason').textContent = alert.reason;
    document.getElementById('alert-content').textContent = alert.content;
    
    modal.style.display = 'flex';

    document.getElementById('ack-alert-btn').onclick = async () => {
        await setDoc(doc(db, "systemAlerts", alertDoc.id), { status: "read" }, { merge: true });
        modal.style.display = 'none';
        // Check for next unread alert
        pollSecurityAlerts();
    };
}

// Global Logout Controller - Absolute Reliability
document.addEventListener('click', async (e) => {
    if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        console.log("Global Admin Sign Out Initiated...");
        try {
            await signOut(auth);
            window.location.replace("/");
        } catch (err) {
            console.error("Logout error", err);
            window.location.href = "/"; 
        }
    }
});

async function loadAdminProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
            document.getElementById('profile-img').src = userDoc.data().photoURL;
        }
    } catch (err) { console.error("Profile Error:", err); }
}

async function loadDashboardStats() {
    try {
        // 1. Valuation Requests (Total Leads)
        const leadsSnap = await getCountFromServer(collection(db, "leads"));
        document.getElementById('stat-leads').textContent = leadsSnap.data().count;

        // 2. Registered Users (Simulated/Firestore query if users collection exists)
        // For now, let's assume we count unique emails in leads as a proxy if we haven't built a users collection
        document.getElementById('stat-users').textContent = "12"; // Placeholder until user directory built

        // 3. Offers Made (Leads with offerAmount)
        const offersQuery = query(collection(db, "leads"), where("offerAmount", ">", 0));
        const offersSnap = await getCountFromServer(offersQuery);
        document.getElementById('stat-offers').textContent = offersSnap.data().count;

        // 4. Site Visitors (Placeholder)
        document.getElementById('stat-visitors').textContent = "382";

        // 5. System Efficiency (From Sentinel)
        const auditQuery = query(collection(db, "systemAudits"), orderBy("timestamp", "desc"), limit(1));
        const auditSnap = await getDocs(auditQuery);
        if (!auditSnap.empty) {
            const audit = auditSnap.docs[0].data();
            const effEl = document.getElementById('stat-efficiency');
            if (effEl) {
                effEl.textContent = `${audit.score}%`;
                effEl.style.color = audit.score >= 95 ? "#10b981" : audit.score >= 85 ? "#f59e0b" : "#ef4444";
            }
        } else {
            document.getElementById('stat-efficiency').textContent = "100%"; // Initial peak
        }

        // 6. Social Posts (Mock Breakdown)
        document.getElementById('social-today').textContent = "2";
        document.getElementById('social-week').textContent = "14";
        document.getElementById('social-month').textContent = "58";
        document.getElementById('social-year').textContent = "214";

        // 7. Social Media Efficiency (From Social Sentinel)
        try {
            const socialAuditDoc = await getDoc(doc(db, "componentAudits", "socialMedia"));
            const socialEffEl = document.getElementById('stat-social-efficiency');
            if (socialAuditDoc.exists() && socialEffEl) {
                const audit = socialAuditDoc.data();
                socialEffEl.textContent = `${audit.score}%`;
                socialEffEl.style.color = audit.score >= 90 ? "#10b981" : audit.score >= 70 ? "#f59e0b" : "#ef4444";
            } else if (socialEffEl) {
                socialEffEl.textContent = "N/A";
            }
        } catch (e) { console.warn("Social Audit Load Fail"); }

    } catch (err) { console.error("Stats Error:", err); }
}

async function loadAdminNews() {
    const newsContent = document.getElementById('admin-news-content');
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
            newsContent.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem; color: #64748b;">
                    <i class="fas fa-newspaper" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No market analysis has been generated yet.</p>
                    <small>Use the 'Refresh Market News' action to trigger Andy.</small>
                </div>
            `;
        }
    } catch (err) { 
        console.error("News Load Error:", err);
        newsContent.innerHTML = `<p style="color: #ef4444; padding: 1rem;">Failed to load news analysis. Please check your connection.</p>`; 
    }
}
async function loadLeads() {
    const leadsTable = document.getElementById('leads-body');
    if (!leadsTable) return;

    try {
        const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        leadsTable.innerHTML = "";
        const totalLeadsEl = document.getElementById('totalLeadsEl');
        if (totalLeadsEl) totalLeadsEl.textContent = querySnapshot.size;

        querySnapshot.forEach((doc) => {
            const lead = doc.data();
            const date = lead.createdAt?.toDate() || new Date();
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date.toLocaleDateString('en-GB')}</td>
                <td><strong>${lead.firstName} ${lead.surname}</strong><br><small>${lead.email}</small></td>
                <td>${lead.address}<br><small>${lead.type} - ${lead.bedrooms}br</small></td>
                <td><span class="badge ${lead.timescale === 'Within 7 Days' ? 'badge-urgent' : ''}">${lead.timescale}</span></td>
                <td>Pending Review</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-primary btn-sm">Offer</button>
                        <button class="btn btn-secondary btn-sm impersonate-lead" data-email="${lead.email}">Impersonate</button>
                    </div>
                </td>
            `;
            leadsTable.appendChild(tr);
        });
        // Add click listeners for impersonation
        document.querySelectorAll('.impersonate-lead').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.getAttribute('data-email');
                localStorage.setItem('impersonate_seller', 'true');
                localStorage.setItem('impersonate_email', email);
                window.location.href = "/dashboard.html";
            });
        });
    } catch (error) {
        console.error("Error loading leads:", error);
    }
}

document.getElementById('refresh-leads').onclick = loadLeads;

// Quick Actions
const genNewsAction = document.getElementById('btn-generate-news');
if (genNewsAction) {
    genNewsAction.onclick = async () => {
        const icon = genNewsAction.querySelector('i');
        const originalIcon = icon.className;
        
        icon.className = 'fas fa-spinner fa-spin';
        genNewsAction.style.opacity = '0.7';
        genNewsAction.style.pointerEvents = 'none';

        try {
            const token = await auth.currentUser.getIdToken();
            const resp = await fetch('https://manualmarketupdate-vjikc6hdhq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
            });
            await loadAdminNews();
            alert("Andy has successfully generated today's stories!");
        } catch (err) { 
            console.error("News Trigger Error:", err);
            alert("Failed to trigger update.");
        }
        
        icon.className = originalIcon;
        genNewsAction.style.opacity = '1';
        genNewsAction.style.pointerEvents = 'auto';
    };
}

const testEmailBtn = document.getElementById('btn-test-email');
if (testEmailBtn) {
    testEmailBtn.onclick = async () => {
        const icon = testEmailBtn.querySelector('i');
        const originalIcon = icon.className;
        
        icon.className = 'fas fa-spinner fa-spin';
        testEmailBtn.style.opacity = '0.7';
        testEmailBtn.style.pointerEvents = 'none';

        try {
            const token = await auth.currentUser.getIdToken();
            const resp = await fetch('https://us-central1-c4h-wesbite.cloudfunctions.net/testEmailConnection', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await resp.json();
            
            if (result.success) {
                alert("System Online: " + result.message);
            } else {
                alert("Critical Failure: [" + result.error + "] " + result.message);
            }
        } catch (err) { 
            console.error("Diagnostic Error:", err);
            alert("Connection Failed: Unable to reach diagnostic endpoint."); 
        }
        
        icon.className = originalIcon;
        testEmailBtn.style.opacity = '1';
        testEmailBtn.style.pointerEvents = 'auto';
    };
}

const impersonateBtn = document.getElementById('btn-impersonate');
if (impersonateBtn) {
    impersonateBtn.onclick = () => {
        localStorage.setItem('impersonate_seller', 'true');
        localStorage.setItem('impersonate_email', 'andrew@stallard.co');
        window.location.href = "/dashboard.html";
    };
}


function showImpersonationBar() {
    const bar = document.createElement('div');
    bar.style.cssText = "background: #ffcc00; padding: 10px; text-align: center; font-weight: bold;";
    bar.innerHTML = `Impersonating ${localStorage.getItem('impersonate_email')} <button id="exit-impersonation">Exit</button>`;
    document.body.prepend(bar);
    document.getElementById('exit-impersonation').onclick = () => {
        localStorage.removeItem('impersonate_seller');
        localStorage.removeItem('impersonate_email');
        window.location.href = "/admin.html";
    };
}

// --- ANDY AI CHAT INTEGRATION ---
const CHATBOT_URL = "https://chatbotandy-vjikc6hdhq-uc.a.run.app";
let chatHistory = [];

const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

if (chatToggle && chatWindow) {
    chatToggle.onclick = () => chatWindow.classList.toggle('active');
}

function addMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${sender}`;
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
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        return data.response;
    } catch (err) {
        console.error(err);
        return "System check: Connection issue detected. I'm still here to help with admin tasks.";
    }
}

if (chatForm && chatInput && chatMessages) {
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        addMessage(msg, 'user');
        chatInput.value = '';
        
        const typingId = "typing-" + Date.now();
        const typingEl = document.createElement('div');
        typingEl.id = typingId;
        typingEl.className = 'message message-bot typing';
        typingEl.textContent = "Andy is thinking...";
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await getAndyResponse(msg);
        const typing = document.getElementById(typingId);
        if (typing) typing.remove();
        addMessage(response, 'bot');
    };
}

// Mobile Audit Action
const mobileAuditAction = document.getElementById('btn-mobile-audit');
if (mobileAuditAction) {
    mobileAuditAction.onclick = async () => {
        const icon = mobileAuditAction.querySelector('i');
        const originalIcon = icon.className;
        
        icon.className = 'fas fa-spinner fa-spin';
        mobileAuditAction.style.opacity = '0.7';
        mobileAuditAction.style.pointerEvents = 'none';

        try {
            const auditFn = httpsCallable(functions, 'manualMobileAudit');
            const result = await auditFn();
            alert(`Forensic Audit Result: ${result.data.report}`);
        } catch (err) {
            console.error("Mobile Audit Trace Fail:", err);
            alert("Handshake failed. Sentinel is currently busy.");
        }
        
        icon.className = originalIcon;
        mobileAuditAction.style.opacity = '1';
        mobileAuditAction.style.pointerEvents = 'auto';
    };
}
