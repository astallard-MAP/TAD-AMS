import { db, auth, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy,
    doc,
    setDoc,
    getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/";
    } else if (user.uid === ADMIN_UID) {
        window.location.href = "/admin.html";
    } else {
        document.getElementById('dash-user-name').textContent = user.email.split('@')[0];
        document.getElementById('user-email').textContent = user.email;
        loadUserProperties(user.email);
        loadUserProfile(user.uid);
        setupDashboardListeners(user);
    }
});

async function loadUserProperties(email) {
    const listEl = document.getElementById('properties-list');
    if (!listEl) return;

    try {
        // Query leads matching this user's email
        const q = query(collection(db, "leads"), where("email", "==", email), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <h3>No properties yet</h3>
                    <p>It looks like you haven't added any properties to your dashboard yet. Click "Add Another Property" to get started.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const prop = doc.data();
            const date = prop.createdAt?.toDate() || new Date();
            
            const card = document.createElement('div');
            card.className = "property-card";
            card.innerHTML = `
                <div class="prop-status-ribbon ${prop.status === 'Offer Made' ? 'status-offer' : 'status-pending'}">
                    ${prop.status || 'Pending Review'}
                </div>
                <div class="prop-header">
                    <h3>${prop.address}</h3>
                    <span class="prop-date">${date.toLocaleDateString('en-GB')}</span>
                </div>
                <div class="prop-details">
                    <p><i class="fas fa-home"></i> ${prop.type} (${prop.bedrooms} Bedrooms)</p>
                    <p><i class="fas fa-clock"></i> Desired Timescale: ${prop.timescale}</p>
                </div>
                <div class="prop-actions">
                    ${prop.offerAmount ? 
                        `<div class="offer-box">
                            <span class="offer-label">Guaranteed Cash Offer:</span>
                            <span class="offer-amount">${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(prop.offerAmount)}</span>
                            <button class="btn btn-primary btn-sm">Accept Offer</button>
                        </div>` : 
                        `<p class="waiting-msg"><i class="fas fa-cog fa-spin"></i> Andy is analyzing local data for this property. Your offer is being calculated.</p>`
                    }
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading properties:", error);
        listEl.innerHTML = "<p>Error loading your property dashboard. Please try again later.</p>";
    }
}

async function loadUserProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
            document.getElementById('profile-img').src = userDoc.data().photoURL;
        }
    } catch (err) {
        console.error("Error loading user profile:", err);
    }
}

function setupDashboardListeners(user) {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            try {
                await signOut(auth);
                window.location.replace("/");
            } catch (err) {
                console.error("User Logout Error:", err);
            }
        };
    }

    const fileInput = document.getElementById('profile-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const storageRef = ref(storage, `profiles/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);

                // Update Firestore
                await setDoc(doc(db, "users", user.uid), {
                    photoURL: url,
                    updatedAt: new Date()
                }, { merge: true });

                // Update UI
                document.getElementById('profile-img').src = url;
            } catch (err) {
                console.error("Profile upload failed:", err);
                alert("Failed to upload profile picture. Please try again.");
            }
        });
    }
}
