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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/";
    } else {
        if (user.uid === ADMIN_UID) {
            document.getElementById('admin-nav-link').style.display = 'block';
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

// Logout
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => window.location.href = "/");
};
