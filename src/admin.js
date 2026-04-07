import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadLeads();
    }
});

async function loadLeads() {
    const leadsTable = document.getElementById('leads-body');
    const totalLeadsEl = document.getElementById('total-leads');
    if (!leadsTable) return;

    try {
        const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        leadsTable.innerHTML = "";
        totalLeadsEl.textContent = querySnapshot.size;

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
