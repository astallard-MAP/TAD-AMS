import { authReady, db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc,
    setDoc,
    doc,
    getDoc,
    query, 
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

// Editor Instances
let emailQuill = null;
let offerQuill = null;
let currentEmailId = null;
let currentOfferId = null;

authReady.then(async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        setupTabs();
        loadArchives('all');
        setupArchiveFilters();
        // Templates initialized on tab click for performance
    }
});

// --- TAB SYSTEM ---
function setupTabs() {
    const tabs = document.querySelectorAll('.docs-tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            const target = tab.getAttribute('data-tab');
            
            // UI Update
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${target}`).classList.add('active');

            // Logic Activation
            if (target === 'emails' && !emailQuill) initEmailSystem();
            if (target === 'offers' && !offerQuill) initOfferSystem();
        };
    });
}

// --- ARCHIVES SYSTEM ---
function setupArchiveFilters() {
    document.querySelectorAll('.lib-filter-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.lib-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadArchives(tab.getAttribute('data-filter'));
        };
    });
}

async function loadArchives(filter) {
    const container = document.getElementById('archives-container');
    container.innerHTML = '<p class="loading">Sychronising archives...</p>';
    
    let allRecords = [];

    try {
        if (filter === 'all' || filter === 'news') {
            const snap = await getDocs(query(collection(db, "marketUpdatesArchive"), orderBy("updatedAt", "desc")));
            snap.forEach(d => allRecords.push({ type: 'news', title: 'Andy AI Market Pulse', date: d.data().updatedAt?.toDate() || new Date(), content: d.data().content, id: d.id }));
        }

        if (filter === 'all' || filter === 'comm') {
            const snap = await getDocs(query(collection(db, "communicationLogs"), orderBy("timestamp", "desc")));
            snap.forEach(d => allRecords.push({ type: 'comm', title: d.data().type || 'System Communication', date: d.data().timestamp?.toDate() || new Date(), content: d.data().summary, recipients: d.data().recipients, id: d.id }));
        }

        if (filter === 'all' || filter === 'offer') {
            const snap = await getDocs(query(collection(db, "leads"), orderBy("createdAt", "desc")));
            snap.forEach(d => {
                const data = d.data();
                if (data.offerAmount > 0) {
                    allRecords.push({ type: 'offer', title: `Offer Made: £${data.offerAmount}`, date: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(), content: `**Address:** ${data.address}\n\n**Buyer:** ${data.firstName} ${data.surname}\n\n**Offer Status:** ${data.status || 'Pending'}`, id: d.id });
                }
            });
        }

        if (filter === 'all' || filter === 'seo') {
            const snap = await getDocs(query(collection(db, "areaSpotlights"), orderBy("timestamp", "desc")));
            snap.forEach(d => allRecords.push({ type: 'seo', title: `SEO Spotlight: ${d.data().town}`, date: d.data().timestamp?.toDate() || new Date(), content: d.data().analysis || d.data().fullDate, id: d.id }));
        }

        if (filter === 'all' || filter === 'social') {
            const snap = await getDocs(query(collection(db, "socialPosts"), orderBy("timestamp", "desc")));
            snap.forEach(d => allRecords.push({ type: 'social', title: `Agentic Social Post (${d.data().town})`, date: d.data().timestamp?.toDate() || new Date(), content: d.data().content, imageUrl: d.data().imageUrl, id: d.id }));
        }

        allRecords.sort((a, b) => b.date - a.date);
        container.innerHTML = "";

        allRecords.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <div class="doc-meta">
                    <span class="doc-badge badge-${rec.type}">${rec.type.toUpperCase()}</span>
                    <span>${rec.date.toLocaleString('en-GB')}</span>
                </div>
                <strong>${rec.title}</strong>
                ${rec.imageUrl ? `<div style="margin: 0.5rem 0;"><img src="${rec.imageUrl}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;"></div>` : ''}
                <p class="doc-snippet">${rec.content.substring(0, 150).replace(/[#*]/g, '')}...</p>
            `;
            div.onclick = () => showArchivePreview(rec);
            container.appendChild(div);
        });
    } catch (err) { console.error(err); container.innerHTML = '<p class="error">Archive synchronisation failed.</p>'; }
}

function showArchivePreview(rec) {
    const modal = document.getElementById('doc-modal');
    const viewer = document.getElementById('modal-doc-viewer');
    let html = `<h1>${rec.title}</h1><hr><p style="color: #64748b;"><strong>Archive Date:</strong> ${rec.date.toLocaleString('en-GB')}</p>`;
    if (rec.imageUrl) html += `<div style="margin: 1.5rem 0;"><img src="${rec.imageUrl}" style="width: 100%; border-radius: 12px;"></div>`;
    html += marked.parse(rec.content);
    viewer.innerHTML = html;
    modal.classList.add('active');
    document.getElementById('close-doc-modal').onclick = () => modal.classList.remove('active');
}

// --- EMAIL SYSTEM ---
function initEmailSystem() {
    emailQuill = new Quill('#email-quill', { modules: { toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic'], ['link', 'image'], [{ 'list': 'bullet' }]] }, theme: 'snow', placeholder: 'Compose email template...' });
    loadEmailTemplates();
    document.getElementById('btn-new-email').onclick = () => {
        currentEmailId = null;
        document.getElementById('email-no-selection').style.display = 'none';
        document.getElementById('email-editor-ui').style.display = 'block';
        document.getElementById('email-name').value = "";
        document.getElementById('email-subject').value = "";
        emailQuill.root.innerHTML = "";
        document.getElementById('email-version-info').textContent = "New Template Mode";
    };
    document.getElementById('btn-save-email').onclick = () => saveTemplate('email');
}

async function loadEmailTemplates() {
    const container = document.getElementById('email-items-container');
    const snap = await getDocs(query(collection(db, "emailTemplates"), orderBy("updatedAt", "desc")));
    container.innerHTML = "";
    snap.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement('div');
        div.className = `template-item ${currentEmailId === docSnap.id ? 'active' : ''}`;
        div.innerHTML = `<strong>${data.name}</strong><br><small>v${data.version || 1} - ${data.updatedAt?.toDate().toLocaleDateString('en-GB')}</small>`;
        div.onclick = () => selectTemplate('email', docSnap.id);
        container.appendChild(div);
    });
}

// --- OFFER SYSTEM ---
function initOfferSystem() {
    offerQuill = new Quill('#offer-quill', { modules: { toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], ['link'], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] }, theme: 'snow', placeholder: 'Compose offer document...' });
    loadOfferTemplates();
    document.getElementById('btn-new-offer').onclick = () => {
        currentOfferId = null;
        document.getElementById('offer-no-selection').style.display = 'none';
        document.getElementById('offer-editor-ui').style.display = 'block';
        document.getElementById('offer-name').value = "";
        offerQuill.root.innerHTML = "";
        document.getElementById('offer-version-info').textContent = "New Document Mode";
    };
    document.getElementById('btn-save-offer').onclick = () => saveTemplate('offer');
}

async function loadOfferTemplates() {
    const container = document.getElementById('offer-items-container');
    const snap = await getDocs(query(collection(db, "offerTemplates"), orderBy("updatedAt", "desc")));
    container.innerHTML = "";
    snap.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement('div');
        div.className = `template-item ${currentOfferId === docSnap.id ? 'active' : ''}`;
        div.innerHTML = `<strong>${data.name}</strong><br><small>v${data.version || 1} - ${data.updatedAt?.toDate().toLocaleDateString('en-GB')}</small>`;
        div.onclick = () => selectTemplate('offer', docSnap.id);
        container.appendChild(div);
    });
}

// --- SHARED TEMPLATE LOGIC ---
async function selectTemplate(type, id) {
    const coll = type === 'email' ? 'emailTemplates' : 'offerTemplates';
    const docSnap = await getDoc(doc(db, coll, id));
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (type === 'email') {
            currentEmailId = id;
            document.getElementById('email-no-selection').style.display = 'none';
            document.getElementById('email-editor-ui').style.display = 'block';
            document.getElementById('email-name').value = data.name;
            document.getElementById('email-subject').value = data.subject || "";
            emailQuill.root.innerHTML = data.content;
            document.getElementById('email-version-info').textContent = `v${data.version} - Last modified ${data.updatedAt?.toDate().toLocaleString('en-GB')}`;
            loadEmailTemplates();
        } else {
            currentOfferId = id;
            document.getElementById('offer-no-selection').style.display = 'none';
            document.getElementById('offer-editor-ui').style.display = 'block';
            document.getElementById('offer-name').value = data.name;
            offerQuill.root.innerHTML = data.content;
            document.getElementById('offer-version-info').textContent = `v${data.version} - Last modified ${data.updatedAt?.toDate().toLocaleString('en-GB')}`;
            loadOfferTemplates();
        }
    }
}

async function saveTemplate(type) {
    const coll = type === 'email' ? 'emailTemplates' : 'offerTemplates';
    const id = type === 'email' ? currentEmailId : currentOfferId;
    const qInstance = type === 'email' ? emailQuill : offerQuill;
    const name = document.getElementById(type === 'email' ? 'email-name' : 'offer-name').value;
    const subject = type === 'email' ? document.getElementById('email-subject').value : null;

    if (!name) return alert("Please name your template.");

    try {
        let version = 1;
        if (id) {
            const old = await getDoc(doc(db, coll, id));
            version = (old.data().version || 1) + 1;
        }

        const data = { name, content: qInstance.root.innerHTML, version, updatedAt: serverTimestamp() };
        if (subject) data.subject = subject;

        if (id) await setDoc(doc(db, coll, id), data, { merge: true });
        else {
            const newDoc = await addDoc(collection(db, coll), data);
            if (type === 'email') currentEmailId = newDoc.id; else currentOfferId = newDoc.id;
        }
        alert("Template saved successfully.");
        if (type === 'email') loadEmailTemplates(); else loadOfferTemplates();
    } catch (err) { console.error(err); alert("Save failed."); }
}
