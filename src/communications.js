import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/";
    } else {
        loadCommunications(user.uid);
    }
});

async function loadCommunications(uid) {
    const tableBody = document.getElementById('comms-log-body');
    const noComms = document.getElementById('no-comms');
    if (!tableBody) return;

    try {
        const q = query(
            collection(db, "communications"), 
            where("userId", "==", uid),
            orderBy("timestamp", "desc")
        );
        
        const snap = await getDocs(q);
        
        if (snap.empty) {
            tableBody.innerHTML = "";
            noComms.style.display = "block";
            return;
        }

        noComms.style.display = "none";
        tableBody.innerHTML = "";
        
        snap.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleString('en-GB') || 'Unknown';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${date}</strong></td>
                <td><span class="badge ${data.type === 'Received' ? 'badge-primary' : 'badge-outline'}">${data.type}</span></td>
                <td>${data.channel || 'Direct Message'}</td>
                <td style="max-width: 400px; font-size: 0.9rem; color: #4b5563;">
                    ${data.content}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Communications Load Error:", err);
    }
}
