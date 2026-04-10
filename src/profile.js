import { db, auth, storage } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";
const ADMIN_NAV = `
    <a href="/admin.html"><i class="fas fa-chart-line"></i> Command Centre</a>
    <a href="/profile.html" class="active"><i class="fas fa-user-edit"></i> My Profile</a>
    <a href="/performance.html"><i class="fas fa-microchip"></i> Performance Hub</a>
    <a href="/documents.html"><i class="fas fa-folder-tree"></i> Documents Hub</a>
    <a href="/picture-library.html"><i class="fas fa-images"></i> Picture Library</a>
    <a href="/social.html"><i class="fas fa-hashtag"></i> Social Agent</a>
    <a href="/admin.html#messages-section"><i class="fas fa-comment-dots"></i> Messages Hub</a>
    <a href="/admin.html#leads-section"><i class="fas fa-list-ul"></i> Enquiries</a>
    <a href="/admin.html#news-section"><i class="fas fa-robot"></i> AI News Suite</a>
    <a href="/performance.html#gbp-section"><i class="fas fa-store"></i> GBP Control</a>
    <a href="/performance.html#users-section"><i class="fas fa-users-gear"></i> User Manager</a>
    <a href="/audit-log.html"><i class="fas fa-shield-halved"></i> Security & Audit</a>
`;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/";
    } else {
        if (user.uid === ADMIN_UID) {
            const sideNav = document.querySelector('.sidebar-nav');
            if (sideNav) sideNav.innerHTML = ADMIN_NAV;
            document.getElementById('sidebar-user-role').textContent = "Global Admin";
        }
        loadProfile(user.uid);
    }
});

async function loadProfile(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('prof-name').value = data.displayName || "";
        document.getElementById('prof-mobile').value = data.mobile || "";
        document.getElementById('prof-address').value = data.address || "";
        document.getElementById('prof-home-email').value = data.homeEmail || "";
        document.getElementById('prof-work-email').value = data.workEmail || "";
        
        if (data.photoURL) {
            updateAvatarDisplay(data.photoURL);
        }
        
        document.getElementById('sidebar-user-name').textContent = data.displayName || auth.currentUser.email.split('@')[0];
    }
}

function updateAvatarDisplay(url) {
    const container = document.getElementById('avatar-preview-wrap');
    container.innerHTML = `<img src="${url}" class="profile-avatar-large">`;
    const sidebarAvatar = document.getElementById('sidebar-avatar-container');
    sidebarAvatar.innerHTML = `<img src="${url}" class="profile-img">`;
}

// Avatar Upload
document.getElementById('avatar-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.querySelector('button[onclick*="avatar-input"]');
    btn.disabled = true;
    btn.textContent = "Uploading...";

    try {
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        // Save to Firestore
        await setDoc(doc(db, "users", auth.currentUser.uid), { photoURL: url }, { merge: true });
        updateAvatarDisplay(url);
        alert("Avatar updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Upload failed.");
    }
    btn.disabled = false;
    btn.textContent = "Change Avatar";
};

// Form Save
document.getElementById('profile-form').onsubmit = async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.updatedAt = serverTimestamp();

    try {
        await setDoc(doc(db, "users", auth.currentUser.uid), data, { merge: true });
        document.getElementById('sidebar-user-name').textContent = data.displayName;
        alert("Profile synchronised successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to save profile.");
    }
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Character Profile";
};

// Global Logout Controller - Absolute Reliability
document.addEventListener('click', async (e) => {
    if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.replace("/");
        } catch (err) {
            console.error("Logout error", err);
            window.location.href = "/"; 
        }
    }
});
