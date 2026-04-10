import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";
const MANUAL_GEN_URL = "https://manualsocialgenerate-vjikc6hdhq-uc.a.run.app";
const PUBLISH_META_URL = "https://publishtometa-vjikc6hdhq-uc.a.run.app";

onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadSocialPosts();
        setupGlobalLogout();
    }
});

function setupGlobalLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            try { 
                await signOut(auth); 
                window.location.replace("/"); 
            } catch (err) { 
                console.error("Logout Error:", err); 
            }
        };
    }
}

async function loadSocialPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '<p class="loading">Loading agentic feed...</p>';

    try {
        const snap = await getDocs(query(collection(db, "socialPosts"), orderBy("timestamp", "desc")));
        container.innerHTML = "";
        
        if (snap.empty) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 3rem;">No posts generated yet. Click above to start.</p>';
            return;
        }

        snap.forEach(d => {
            const post = d.data();
            const date = post.timestamp?.toDate().toLocaleString('en-GB') || 'Just now';
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${date} - <strong>${post.town}</strong></span>
                    <span class="${post.published ? 'badge-published' : 'badge-pending'}">${post.published ? 'PUBLISHED' : 'PENDING'}</span>
                </div>
                ${post.imageUrl ? `<div class="post-preview-img"><img src="${post.imageUrl}" alt="AI generated" style="width: 100%; border-radius: 8px; margin-bottom: 1rem; max-height: 200px; object-fit: cover;"></div>` : ''}
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    ${!post.published ? `<button class="btn btn-sm btn-primary publish-btn" data-id="${d.id}">Publish Now</button>` : ''}
                    <button class="btn btn-sm btn-secondary delete-btn" data-id="${d.id}">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });

        setupActionButtons();
    } catch (err) { console.error(err); }
}

function setupActionButtons() {
    document.querySelectorAll('.publish-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = "Publishing...";
            try {
                const token = await auth.currentUser.getIdToken();
                const resp = await fetch(PUBLISH_META_URL, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ postId: id })
                });
                
                if (resp.ok) {
                    alert("Published successfully to Facebook!");
                    loadSocialPosts();
                } else {
                    const errData = await resp.json();
                    alert("Publish failed: " + (errData.error || "Unknown error"));
                    btn.disabled = false;
                    btn.textContent = "Publish Now";
                }
            } catch (err) { 
                console.error(err);
                alert("Publish failed - Check connection"); 
                btn.disabled = false; 
                btn.textContent = "Publish Now";
            }
        };
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Are you sure?")) return;
            const id = btn.getAttribute('data-id');
            await deleteDoc(doc(db, "socialPosts", id));
            loadSocialPosts();
        };
    });
}

const genBtn = document.getElementById('generate-now-btn');
if (genBtn) {
    genBtn.onclick = async () => {
        genBtn.disabled = true;
        genBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agent is thinking...';
        try {
            const token = await auth.currentUser.getIdToken();
            const resp = await fetch(MANUAL_GEN_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                alert("New post generated successfully!");
                loadSocialPosts();
            }
        } catch (err) { alert("Generation failed"); }
        genBtn.disabled = false;
        genBtn.innerHTML = '<i class="fas fa-plus"></i> Generate Immediate Post';
    };
}
