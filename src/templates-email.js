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

// Initialize Quill Editor
function initQuill() {
    quill = new Quill('#quill-editor', {
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'link'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        },
        placeholder: 'Compose your professional email template...',
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
        const snap = await getDocs(query(collection(db, "emailTemplates"), orderBy("updatedAt", "desc")));
        container.innerHTML = "";
        
        if (snap.empty) {
            container.innerHTML = "<p style='color: #64748b; font-size: 0.9rem;'>No templates in library.</p>";
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = `template-item ${currentTemplateId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `
                <strong>${data.name}</strong><br>
                <small>${data.subject || 'No subject'}</small><br>
                <span class="version-badge">v${data.version || 1}</span>
            `;
            div.onclick = () => selectTemplate(docSnap.id);
            container.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function selectTemplate(id) {
    currentTemplateId = id;
    const docSnap = await getDoc(doc(db, "emailTemplates", id));
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('no-template-selected').style.display = 'none';
        document.getElementById('editor-ui').style.display = 'block';
        
        document.getElementById('template-name').value = data.name;
        document.getElementById('template-subject').value = data.subject || "";
        quill.root.innerHTML = data.content;
        
        document.getElementById('version-info').textContent = `Last modified: ${data.updatedAt?.toDate().toLocaleString('en-GB')} (Version ${data.version})`;
        loadTemplateLibrary(); // Refresh active state
    }
}

function setupListeners() {
    document.getElementById('btn-new-template').onclick = () => {
        currentTemplateId = null;
        document.getElementById('no-template-selected').style.display = 'none';
        document.getElementById('editor-ui').style.display = 'block';
        document.getElementById('template-name').value = "";
        document.getElementById('template-subject').value = "";
        quill.root.innerHTML = "";
        document.getElementById('version-info').textContent = "New Template Mode";
    };

    document.getElementById('btn-save-template').onclick = async () => {
        const name = document.getElementById('template-name').value;
        const subject = document.getElementById('template-subject').value;
        const content = quill.root.innerHTML;

        if (!name) return alert("Please name your template.");

        try {
            let version = 1;
            let history = [];

            if (currentTemplateId) {
                const oldDoc = await getDoc(doc(db, "emailTemplates", currentTemplateId));
                const oldData = oldDoc.data();
                version = (oldData.version || 1) + 1;
                history = oldData.history || [];
                // Store previous version in history
                history.push({
                    version: oldData.version || 1,
                    content: oldData.content,
                    subject: oldData.subject,
                    updatedAt: oldData.updatedAt
                });
            }

            const templateData = {
                name,
                subject,
                content,
                version,
                history,
                updatedAt: serverTimestamp()
            };

            if (currentTemplateId) {
                await setDoc(doc(db, "emailTemplates", currentTemplateId), templateData, { merge: true });
            } else {
                const newDoc = await addDoc(collection(db, "emailTemplates"), templateData);
                currentTemplateId = newDoc.id;
            }

            alert(`Template saved successfully (v${version})`);
            loadTemplateLibrary();
            selectTemplate(currentTemplateId);
        } catch (err) {
            console.error(err);
            alert("Save failed. See console.");
        }
    };
}
