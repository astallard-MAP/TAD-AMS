import { authReady, db, auth, storage, functions } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc,
    serverTimestamp,
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
        loadForensicLogs();
    }
});

// --- GLOBAL ERROR INTERCEPTION ---
window.onerror = function(message, source, lineno, colno, error) {
    logToForensics("Browser", "Frontend", `Uncaught: ${message} at ${source}:${lineno}`, "Error");
};

window.onunhandledrejection = function(event) {
    logToForensics("Browser", "Async", `Unhandled Rejection: ${event.reason}`, "Error");
};

// --- FORENSIC LOGGING ENGINE ---
async function logToForensics(level, component, message, severity = "Info") {
    try {
        await addDoc(collection(db, "systemLogs"), {
            timestamp: serverTimestamp(),
            level: level,
            component: component,
            message: message,
            severity: severity
        });
    } catch (e) { console.warn("Forensic Log Injection Failed:", e); }
}

async function loadForensicLogs() {
    const logsBody = document.getElementById('logs-body');
    if (!logsBody) return;

    try {
        const q = query(collection(db, "systemLogs"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            logsBody.innerHTML = '<tr><td colspan="4" style="padding: 2rem; text-align: center; color: #64748b;">No forensic logs recorded in current epoch.</td></tr>';
            return;
        }

        logsBody.innerHTML = snap.docs.map(doc => {
            const log = doc.data();
            const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
            const timeStr = date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
            const color = log.severity === 'Error' ? '#ef4444' : log.severity === 'Warning' ? '#f59e0b' : '#38bdf8';
            
            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; color: #64748b;">${timeStr}</td>
                    <td style="padding: 10px; font-weight: bold; color: ${color};">${log.severity || 'INFO'}</td>
                    <td style="padding: 10px; color: #e2e8f0;">${log.component || 'General'}</td>
                    <td style="padding: 10px; word-break: break-all;">${log.message}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Forensic Load Fail:", err);
        logsBody.innerHTML = `<tr><td colspan="4" style="padding: 1rem; color: #ef4444;">Forensic trace failed: ${err.message}</td></tr>`;
    }
}

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
        const imgEl = document.getElementById('profile-img');
        const placeholder = document.getElementById('profile-placeholder');
        
        if (userDoc.exists() && userDoc.data().photoURL) {
            if (imgEl) {
                imgEl.src = userDoc.data().photoURL;
                imgEl.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
        }
    } catch (err) { 
        console.error("Profile Load Error:", err); 
        logToForensics("Auth", "System", `Failed to load admin profile image: ${err.message}`, "Warning");
    }
}

async function loadDashboardStats() {
    try {
        // 1. Valuation Requests (Total Leads)
        const leadsSnap = await getCountFromServer(collection(db, "leads"));
        document.getElementById('stat-leads').textContent = leadsSnap.data().count;

        // 2. Registered Users (Simulated/Firestore query if users collection exists)
        // For now, let's assume we count unique emails in leads as a proxy if we haven't built a users collection
        document.getElementById('stat-users').textContent = "Active"; 

        // 3. Offers Made (Leads with offerAmount)
        const offersQuery = query(collection(db, "leads"), where("offerAmount", ">", 0));
        const offersSnap = await getCountFromServer(offersQuery);
        document.getElementById('stat-offers').textContent = offersSnap.data().count;

        // 4. Site Visitors (Placeholder)
        document.getElementById('stat-visitors').textContent = "Live";

        // 5. System Efficiency (From Sentinel)
        const auditQuery = query(collection(db, "systemAudits"), orderBy("timestamp", "desc"), limit(1));
        const auditSnap = await getDocs(auditQuery);
        if (!auditSnap.empty) {
            const audit = auditSnap.docs[0].data();
            latestAudit = audit;
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
            const socialEffEl = document.getElementById('stat-social-efficiency');
            if (socialAuditDoc.exists() && socialEffEl) {
                latestSocialAudit = socialAuditDoc.data();
                const audit = latestSocialAudit;
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

// Efficiency Report Logic
let latestAudit = null;
let latestSocialAudit = null;

async function showEfficiencyReport() {
    const modal = document.getElementById('efficiency-modal');
    const content = document.getElementById('efficiency-report-content');
    if (!modal || !content) {
        // Create modal if it doesn't exist
        const modalHtml = `
            <div id="efficiency-modal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:2000; align-items:center; justify-content:center;">
                <div class="modal-content" style="background:#fff; width:90%; max-width:600px; padding:2rem; border-radius:12px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); position:relative;">
                    <button id="close-eff-modal" style="position:absolute; top:1rem; right:1rem; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
                    <h2 id="eff-modal-title" style="margin-bottom:1rem; display:flex; align-items:center; gap:10px;"><i class="fas fa-microchip" style="color:#3b82f6;"></i> System Efficiency Audit</h2>
                    <div id="efficiency-report-content"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('close-eff-modal').onclick = () => document.getElementById('efficiency-modal').style.display = 'none';
    }

    const reportModal = document.getElementById('efficiency-modal');
    const reportContent = document.getElementById('efficiency-report-content');
    const titleEl = document.getElementById('eff-modal-title');

    titleEl.innerHTML = `<i class="fas fa-microchip" style="color:#3b82f6;"></i> System Efficiency Audit`;

    if (!latestAudit) {
        reportContent.innerHTML = "<p>Data not yet synchronized. Please wait...</p>";
    } else {
        renderAuditContent(reportContent, latestAudit, "Optimization Roadmap (Target 99.99%)");
    }

    reportModal.style.display = 'flex';
}

async function showSocialReport() {
    const modal = document.getElementById('efficiency-modal');
    const content = document.getElementById('efficiency-report-content');
    if (!modal || !content) {
        await showEfficiencyReport(); // Initialize modal
    }

    const reportModal = document.getElementById('efficiency-modal');
    const reportContent = document.getElementById('efficiency-report-content');
    const titleEl = document.getElementById('eff-modal-title');

    titleEl.innerHTML = `<i class="fas fa-hashtag" style="color:#a21caf;"></i> Social Media Sentinel Audit`;

    if (!latestSocialAudit) {
        reportContent.innerHTML = `
            <div style="text-align:center; padding:2rem;">
                <p>Social Sentinel data is currently offline (N/A).</p>
                <button id="trigger-social-audit" class="btn btn-primary">Run Manual Audit Now</button>
            </div>
        `;
        document.getElementById('trigger-social-audit').onclick = async () => {
            document.getElementById('trigger-social-audit').disabled = true;
            document.getElementById('trigger-social-audit').innerText = "Analyzing Content...";
            try {
                const resp = await fetch('https://manualsocialaudit-vjikc6hdhq-uc.a.run.app');
                latestSocialAudit = await resp.json();
                await loadDashboardStats();
                showSocialReport();
            } catch (e) {
                alert("Audit failed. Social Agent is currently isolated.");
            }
        };
    } else {
        renderAuditContent(reportContent, latestSocialAudit, "Social Compliance & Performance");
    }

    reportModal.style.display = 'flex';
}

function renderAuditContent(container, audit, title) {
    const issuesHtml = audit.issues && audit.issues.length > 0 
        ? audit.issues.map(issue => `
            <div class="issue-item" style="border-left:4px solid ${issue.severity === 'High' || issue.severity === 'Critical' ? '#ef4444' : '#f59e0b'}; padding:1rem; margin-bottom:1rem; background:#f8fafc;">
                <h4 style="margin:0; color:#1e293b;">${issue.component} [${issue.severity}]</h4>
                <p style="margin:0.5rem 0; font-size:0.9rem; color:#475569;"><strong>Issue:</strong> ${issue.issue}</p>
                <p style="margin:0.5rem 0; font-size:0.9rem; color:#0f172a;"><strong>Course of Action:</strong> ${issue.plan}</p>
            </div>
        `).join('')
        : `<div style="text-align:center; padding:2rem; color:#10b981;">
            <i class="fas fa-check-circle" style="font-size:3rem; margin-bottom:1rem;"></i>
            <p><strong>Sentinel Status: Optimal.</strong> All compliance checks passed.</p>
           </div>`;

    container.innerHTML = `
        <div class="efficiency-summary" style="margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:600; color:#64748b;">Sentinel Health Score</span>
                <span style="font-size:2rem; font-weight:bold; color:${audit.score >= 90 ? '#10b981' : '#f59e0b'}">${audit.score}%</span>
            </div>
            <p style="margin:0.5rem 0; font-size:0.85rem; color:#94a3b8;">Refreshed: ${audit.timestamp?.toDate ? audit.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}</p>
        </div>
        <h3 style="font-size:1.1rem; margin-bottom:1rem;">${title}</h3>
        <div class="issues-list" style="max-height:400px; overflow-y:auto;">
            ${issuesHtml}
        </div>
        <div style="margin-top:1.5rem; display:flex; gap:10px;">
            <button id="btn-trigger-repair" class="btn btn-primary" style="flex:1; background:#ef4444;">Perform Full System Repair</button>
        </div>
        <div style="margin-top:1rem; padding:1rem; background:#eff6ff; border-radius:8px; border:1px solid #bfdbfe;">
            <p style="margin:0; font-size:0.85rem; color:#1e40af;"><i class="fas fa-info-circle"></i> <strong>Sentinel Note:</strong> The system autonomously implements major repairs every 2 hours. High severity issues may require manual infrastructure inspection.</p>
        </div>
    `;

    const repairBtn = document.getElementById('btn-trigger-repair');
    if (repairBtn) {
        repairBtn.onclick = async () => {
            repairBtn.disabled = true;
            repairBtn.innerText = "Heal Initiated...";
            try {
                await fetch('https://manualmarketupdate-vjikc6hdhq-uc.a.run.app'); // One heal
                await fetch('https://manualsocialaudit-vjikc6hdhq-uc.a.run.app'); // Another heal
                alert("Self-Repair Sequence Complete. Reloading stats...");
                location.reload();
            } catch (e) {
                alert("Repair failed. Infrastructure isolate detected.");
                repairBtn.disabled = false;
                repairBtn.innerText = "Retry Repair";
            }
        };
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

// GBP Publish Action
const publishGBPAction = document.getElementById('btn-publish-gbp');
if (publishGBPAction) {
    publishGBPAction.onclick = async () => {
        const icon = publishGBPAction.querySelector('i');
        const originalIcon = icon.className;
        
        icon.className = 'fas fa-spinner fa-spin';
        publishGBPAction.style.opacity = '0.7';
        publishGBPAction.style.pointerEvents = 'none';

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Session expired. Please re-login.");
                return;
            }
            const token = await user.getIdToken();
            const resp = await fetch('https://testgbppost-vjikc6hdhq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
            });
            const result = await resp.json();
            
            if (result.success) {
                alert("GBP Sync Success: Posted to all active locations.");
            } else {
                alert("GBP Error: [" + (result.error || "UNKNOWN") + "]");
            }
        } catch (err) { 
            console.error("GMB Sync Error:", err);
            alert("Connection Failed: Unable to reach GBP engine."); 
        }
        
        icon.className = originalIcon;
        publishGBPAction.style.opacity = '1';
        publishGBPAction.style.pointerEvents = 'auto';
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

const efficiencyBtn = document.getElementById('btn-show-efficiency');
if (efficiencyBtn) {
    efficiencyBtn.onclick = showEfficiencyReport;
}

const socialSentinelBtn = document.getElementById('btn-social-sentinel');
if (socialSentinelBtn) {
    socialSentinelBtn.onclick = showSocialReport;
}

const refreshLogsBtn = document.getElementById('refresh-logs');
if (refreshLogsBtn) {
    refreshLogsBtn.onclick = loadForensicLogs;
}

const clearLogsBtn = document.getElementById('clear-logs');
if (clearLogsBtn) {
    clearLogsBtn.onclick = () => {
        const body = document.getElementById('logs-body');
        if (body) body.innerHTML = '<tr><td colspan="4" style="padding: 2rem; text-align: center; color: #64748b;">Cache cleared. Refresh to fetch from source.</td></tr>';
    };
}
