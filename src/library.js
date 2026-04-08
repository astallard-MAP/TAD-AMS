import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    doc,
    getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadLibrary('all');
        setupFilters();
    }
});

function setupFilters() {
    const tabs = document.querySelectorAll('.library-tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadLibrary(tab.getAttribute('data-filter'));
        };
    });
}

async function loadLibrary(filter) {
    const container = document.getElementById('library-container');
    container.innerHTML = '<p class="loading">Fetching permanent archive...</p>';
    
    let allRecords = [];

    try {
        // 1. Fetch News Archive
        if (filter === 'all' || filter === 'news') {
            const newsSnap = await getDocs(query(collection(db, "marketUpdatesArchive"), orderBy("updatedAt", "desc")));
            newsSnap.forEach(d => {
                allRecords.push({
                    type: 'news',
                    title: 'Andy AI Market Pulse',
                    date: d.data().updatedAt?.toDate() || new Date(),
                    content: d.data().content,
                    id: d.id
                });
            });
        }

        // 2. Fetch Communication Logs
        if (filter === 'all' || filter === 'comm') {
            const commSnap = await getDocs(query(collection(db, "communicationLogs"), orderBy("timestamp", "desc")));
            commSnap.forEach(d => {
                allRecords.push({
                    type: 'comm',
                    title: d.data().type || 'System Communication',
                    date: d.data().timestamp?.toDate() || new Date(),
                    content: d.data().summary,
                    recipients: d.data().recipients,
                    id: d.id
                });
            });
        }

        // 3. Fetch Leads (Offer History)
        if (filter === 'all' || filter === 'offer') {
            const leadsSnap = await getDocs(query(collection(db, "leads"), orderBy("createdAt", "desc")));
            leadsSnap.forEach(d => {
                const data = d.data();
                if (data.offerAmount > 0) {
                    allRecords.push({
                        type: 'offer',
                        title: `Offer Made: £${data.offerAmount}`,
                        date: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
                        content: `**Address:** ${data.address}\n\n**Buyer:** ${data.firstName} ${data.surname}\n\n**Offer Status:** ${data.status || 'Pending'}`,
                        id: d.id
                    });
                }
            });
        }

        // 4. Fetch Social Media Agent Feed
        if (filter === 'all' || filter === 'social') {
            const socialSnap = await getDocs(query(collection(db, "socialPosts"), orderBy("timestamp", "desc")));
            socialSnap.forEach(d => {
                allRecords.push({
                    type: 'social',
                    title: `Agentic Social Post (${d.data().town})`,
                    date: d.data().timestamp?.toDate() || new Date(),
                    content: d.data().content,
                    id: d.id
                });
            });
        }

        // Sort by Date
        allRecords.sort((a, b) => b.date - a.date);

        if (allRecords.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 4rem;">No records found in the library.</p>';
            return;
        }

        container.innerHTML = "";
        allRecords.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-meta">
                    <span class="doc-badge badge-${rec.type}">${rec.type.toUpperCase()}</span>
                    <span>${rec.date.toLocaleString('en-GB')}</span>
                </div>
                <strong class="doc-title">${rec.title}</strong>
                <p class="doc-snippet">${rec.content.substring(0, 150).replace(/[#*]/g, '')}...</p>
            `;
            div.onclick = () => showPreview(rec);
            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error">An error occurred while loading the library. Please contact system support.</p>';
    }
}

function showPreview(rec) {
    const modal = document.getElementById('doc-modal');
    const viewer = document.getElementById('modal-doc-viewer');
    
    let htmlContent = `<h1>${rec.title}</h1><hr>`;
    htmlContent += `<p style="color: #64748b;"><strong>Archive Date:</strong> ${rec.date.toLocaleString('en-GB')}</p>`;
    
    if (rec.recipients) {
        htmlContent += `<p style="color: #64748b;"><strong>Recipients:</strong> ${rec.recipients.join(', ')}</p>`;
    }

    htmlContent += marked.parse(rec.content);
    
    viewer.innerHTML = htmlContent;
    modal.classList.add('active');
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}
