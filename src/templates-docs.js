import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    query, 
    orderBy,
    serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";
let quill;
let currentTemplateId = null;

function initQuill() {
    quill = new Quill('#quill-editor', {
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['image', 'link'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        },
        placeholder: 'Enter your formal terms, conditions, and offer details...',
        theme: 'snow'
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        initQuill();
        loadTemplateLibrary();
        setupListeners();
    }
});

async function loadTemplateLibrary() {
    const container = document.getElementById('template-items-container');
    if (!container) return;

    try {
        const snap = await getDocs(query(collection(db, "documentTemplates"), orderBy("updatedAt", "desc")));
        container.innerHTML = "";
        
        if (snap.empty) {
            container.innerHTML = "<p style='color: #64748b; font-size: 0.9rem;'>No documents in library.</p>";
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = `template-item ${currentTemplateId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `
                <strong>${data.name}</strong><br>
                <span class="version-badge">v${data.version || 1}</span>
            `;
            div.onclick = () => selectTemplate(docSnap.id);
            container.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function selectTemplate(id) {
    currentTemplateId = id;
    const docSnap = await getDoc(doc(db, "documentTemplates", id));
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('no-template-selected').style.display = 'none';
        document.getElementById('editor-ui').style.display = 'block';
        
        document.getElementById('template-name').value = data.name;
        quill.root.innerHTML = data.content;
        
        document.getElementById('version-info').textContent = `Last modified: ${data.updatedAt?.toDate().toLocaleString('en-GB')} (Version ${data.version})`;
        loadTemplateLibrary();
    }
}

function setupListeners() {
    document.getElementById('btn-new-template').onclick = () => {
        currentTemplateId = null;
        document.getElementById('no-template-selected').style.display = 'none';
        document.getElementById('editor-ui').style.display = 'block';
        document.getElementById('template-name').value = "";
        quill.root.innerHTML = "<h1>Formal Written Offer</h1><p>Subject to Terms and Conditions as outlined below...</p>";
        document.getElementById('version-info').textContent = "New Document Mode";
    };

    document.getElementById('btn-save-template').onclick = async () => {
        const name = document.getElementById('template-name').value;
        const content = quill.root.innerHTML;

        if (!name) return alert("Please name your document.");

        try {
            let version = 1;
            let history = [];

            if (currentTemplateId) {
                const oldDoc = await getDoc(doc(db, "documentTemplates", currentTemplateId));
                const oldData = oldDoc.data();
                version = (oldData.version || 1) + 1;
                history = oldData.history || [];
                history.push({
                    version: oldData.version || 1,
                    content: oldData.content,
                    updatedAt: oldData.updatedAt
                });
            }

            const templateData = {
                name,
                content,
                version,
                history,
                updatedAt: serverTimestamp()
            };

            if (currentTemplateId) {
                await setDoc(doc(db, "documentTemplates", currentTemplateId), templateData, { merge: true });
            } else {
                const newDoc = await addDoc(collection(db, "documentTemplates"), templateData);
                currentTemplateId = newDoc.id;
            }

            alert(`Document version v${version} saved.`);
            loadTemplateLibrary();
            selectTemplate(currentTemplateId);
        } catch (err) {
            console.error(err);
            alert("Save failed.");
        }
    };
}
