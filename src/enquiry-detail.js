import { db, auth } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const urlParams = new URLSearchParams(window.location.search);
const leadId = urlParams.get('id');
const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        if (leadId) {
            initWorkspace();
        } else {
            alert("No Lead ID specified.");
            window.location.href = "/admin.html";
        }
    }
});

async function initWorkspace() {
    loadLeadData();
    subscribeToCommunications();
    subscribeToTasks();
    setupEventListeners();
}

async function loadLeadData() {
    try {
        const leadDoc = await getDoc(doc(db, "leads", leadId));
        if (leadDoc.exists()) {
            const lead = leadDoc.data();
            document.getElementById('lead-name').textContent = `${lead.firstName} ${lead.surname}`;
            document.getElementById('lead-address').textContent = lead.address;
            document.getElementById('lead-status').textContent = lead.status || "Pending Review";
            
            renderPropertyDetails(lead);
        } else {
            console.error("Lead not found");
        }
    } catch (err) {
        console.error("Error loading lead:", err);
    }
}

function renderPropertyDetails(lead) {
    const container = document.getElementById('property-details');
    container.innerHTML = `
        <div class="details-grid">
            <div class="detail-item">
                <label>Property Type</label>
                <p>${lead.type || 'N/A'}</p>
            </div>
            <div class="detail-item">
                <label>Bedrooms</label>
                <p>${lead.bedrooms || '0'}</p>
            </div>
            <div class="detail-item">
                <label>Sale Reason</label>
                <p>${lead.reason || 'Not Specified'}</p>
            </div>
            <div class="detail-item">
                <label>Timescale</label>
                <p>${lead.timescale || 'Flexible'}</p>
            </div>
            <div class="detail-item">
                <label>Estimated Value</label>
                <p>£${lead.valuationAmount ? lead.valuationAmount.toLocaleString() : 'Pending'}</p>
            </div>
            <div class="detail-item">
                <label>Equity</label>
                <p>${lead.equity || 'N/A'}</p>
            </div>
        </div>
        <div style="margin-top: 2rem; padding: 1.5rem; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
            <label style="color: #166534; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">AI Property Insight</label>
            <p style="color: #14532d; font-size: 0.9rem; margin-top: 5px;">${lead.aiSummary || 'Forensic analysis in progress...'}</p>
        </div>
    `;
}

function subscribeToCommunications() {
    const q = query(
        collection(db, "communications"), 
        where("leadId", "==", leadId),
        orderBy("timestamp", "asc")
    );

    onSnapshot(q, (snapshot) => {
        const chatArea = document.getElementById('chat-history');
        chatArea.innerHTML = "";
        
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const div = document.createElement('div');
            div.className = `msg-bubble ${msg.sender === 'Admin' ? 'msg-admin' : 'msg-user'}`;
            
            const time = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            div.innerHTML = `
                <p>${msg.text}</p>
                <span class="msg-meta">${msg.type === 'email' ? '<i class="fas fa-envelope"></i> Sent as Email' : '<i class="fas fa-sticky-note"></i> Internal Note'} • ${time}</span>
            `;
            chatArea.appendChild(div);
        });
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}

function subscribeToTasks() {
    const q = query(
        collection(db, "tasks"), 
        where("leadId", "==", leadId),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, (snapshot) => {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = "";
        
        snapshot.forEach((docSnap) => {
            const task = docSnap.data();
            const div = document.createElement('div');
            div.className = "task-item";
            div.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${docSnap.id}">
                <div class="task-info">
                    <span class="task-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.title}</span>
                    <span class="task-assignee">Assigned to: ${task.assignee}</span>
                </div>
            `;
            taskList.appendChild(div);

            div.querySelector('.task-checkbox').onclick = async (e) => {
                await updateDoc(doc(db, "tasks", docSnap.id), {
                    completed: e.target.checked
                });
            };
        });
    });
}

function setupEventListeners() {
    // Communication
    document.getElementById('btn-save-note').onclick = () => saveMessage('Internal Note', 'note');
    document.getElementById('btn-send-email').onclick = () => saveMessage('Admin', 'email');

    // Tasks
    document.getElementById('btn-add-task').onclick = () => {
        document.getElementById('add-task-form').style.display = 'block';
    };
    document.getElementById('btn-save-task').onclick = async () => {
        const title = document.getElementById('task-title-input').value.trim();
        const assignee = document.getElementById('task-assignee-select').value;
        if (!title) return;

        await addDoc(collection(db, "tasks"), {
            leadId,
            title,
            assignee,
            completed: false,
            createdAt: serverTimestamp()
        });
        document.getElementById('task-title-input').value = "";
        document.getElementById('add-task-form').style.display = 'none';
    };

    // Offer Generation
    document.getElementById('btn-gen-offer').onclick = () => {
        document.getElementById('offer-modal').style.display = 'flex';
    };
    document.getElementById('btn-confirm-offer').onclick = async () => {
        const amount = document.getElementById('offer-amount').value;
        if (!amount) return;

        await updateDoc(doc(db, "leads", leadId), {
            officialOffer: Number(amount),
            status: "Offer Made"
        });

        // Log the action
        await saveMessage(`Official Cash Offer generated for £${Number(amount).toLocaleString()}.`, 'note');
        
        document.getElementById('offer-modal').style.display = 'none';
        alert("Offer document logic initiated. Check Documents Hub.");
    };
}

async function saveMessage(senderOverride, type) {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "communications"), {
            leadId,
            text,
            sender: senderOverride === 'Internal Note' ? 'Admin' : 'Admin', // Unified for display
            type,
            timestamp: serverTimestamp()
        });
        input.value = "";
    } catch (err) {
        console.error("Error saving message:", err);
    }
}
