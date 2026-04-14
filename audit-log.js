import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadAuditLog();
    }
});

async function loadAuditLog() {
    const tableBody = document.getElementById('audit-log-body');
    if (!tableBody) return;

    try {
        const q = query(collection(db, "systemAlerts"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        
        tableBody.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString('en-GB') || 'Unknown';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td><span class="badge" style="background: #fee2e2; color: #ef4444; border: 1px solid #ef4444;">${data.type}</span></td>
                <td>${data.reason}</td>
                <td style="font-size: 0.8rem; color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${data.content}</td>
                <td>${data.status === 'read' ? '<i class="fas fa-circle-check" style="color: #10b981;"></i> Acknowledged' : '<i class="fas fa-circle-exclamation" style="color: #ef4444;"></i> Unread'}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Audit log loading failed:", err);
    }
}
