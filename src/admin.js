import { db, auth, storage } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    getCountFromServer,
    where,
    doc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadDashboardStats();
        loadLeads();
        loadAdminNews();
        loadAdminProfile(user.uid);
        
        // Finalize logout logic
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                console.log("Admin Logging Out...");
                try {
                    await signOut(auth);
                    console.log("Logged out, redirecting...");
                    window.location.replace("/");
                } catch (err) {
                    console.error("Logout failed:", err);
                }
            };
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

        // 5. Social Posts (Mock Breakdown)
        document.getElementById('social-today').textContent = "2";
        document.getElementById('social-week').textContent = "14";
        document.getElementById('social-month').textContent = "58";
        document.getElementById('social-year').textContent = "214";

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
                    <small>Last Analyzed: ${data.updatedAt?.toDate().toLocaleString('en-GB')}</small>
                </div>
                <div class="news-body markdown-body">
                    ${marked.parse(data.content)}
                </div>
            `;
        }
    } catch (err) { newsContent.textContent = "Failed to load news analysis."; }
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
                <td><button class="btn btn-primary btn-sm">Make Offer</button></td>
            `;
            leadsTable.appendChild(tr);
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
            await fetch('https://us-central1-c4h-wesbite.cloudfunctions.net/manualMarketUpdate');
            await loadAdminNews();
            alert("Andy has successfully generated and published today's stories!");
        } catch (err) { alert("Failed to trigger update."); }
        
        icon.className = originalIcon;
        genNewsAction.style.opacity = '1';
        genNewsAction.style.pointerEvents = 'auto';
    };
}
