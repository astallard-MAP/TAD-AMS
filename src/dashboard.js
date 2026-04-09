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
    } else if (user.uid === ADMIN_UID && localStorage.getItem('impersonate_seller') !== 'true') {
        window.location.href = "/admin.html";
    } else {
        const impersonateEmail = localStorage.getItem('impersonate_email');
        const activeEmail = (user.uid === ADMIN_UID && impersonateEmail) ? impersonateEmail : user.email;
        
        document.getElementById('dash-user-name').textContent = activeEmail.split('@')[0];
        document.getElementById('user-email').textContent = activeEmail;
        loadUserProperties(activeEmail);
        loadUserProfile(user.uid);
        setupDashboardListeners(user);

        if (user.uid === ADMIN_UID) {
            showImpersonationBar();
        }
    }
});

function showImpersonationBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; 
        background: #ef4444; color: white; padding: 10px; 
        text-align: center; z-index: 9999; font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex; justify-content: center; align-items: center; gap: 20px;
    `;
    bar.innerHTML = `
        <span><i class="fas fa-user-secret"></i> IMPERSONATION MODE ACTIVE</span>
        <button id="exit-impersonation" class="btn btn-sm btn-light" style="color: #ef4444; border: none; padding: 5px 15px; border-radius: 4px; font-weight: bold; cursor: pointer;">Exit & Return to Command Centre</button>
    `;
    document.body.prepend(bar);
    document.getElementById('exit-impersonation').onclick = () => {
        localStorage.removeItem('impersonate_seller');
        window.location.href = "/admin.html";
    };
}

// Global Logout Controller - Absolute Reliability
document.addEventListener('click', async (e) => {
    if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        console.log("Global Dashboard Sign Out Initiated...");
        try {
            await signOut(auth);
            window.location.replace("/");
        } catch (err) {
            console.error("Logout error", err);
            window.location.href = "/"; 
        }
    }
});

async function loadUserProperties(email) {
    const listEl = document.getElementById('properties-list');
    if (!listEl) return;

    try {
        const q = query(collection(db, "leads"), where("email", "==", email), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <h3>No properties yet</h3>
                    <p>It looks like you haven't added any properties to your dashboard yet. Click "Add Property" to get started.</p>
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
                
                <div class="epc-container">
                    ${prop.epcRating ? `
                        <div class="epc-badge epc-rating-${prop.epcRating.toLowerCase()}">
                            <i class="fas fa-leaf"></i> EPC Rating: ${prop.epcRating}
                        </div>
                        <span class="epc-expiry">Expires: ${prop.epcExpiry}</span>
                    ` : `
                        <div class="epc-badge" style="background: #e2e8f0; color: #64748b;">
                            <i class="fas fa-search-location"></i> EPC Search Pending
                        </div>
                    `}
                </div>

                <div class="prop-actions">
                    ${prop.offerAmount ? 
                        `<div class="offer-box">
                            <span class="offer-label">Guaranteed Cash Offer:</span>
                            <span class="offer-amount">${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(prop.offerAmount)}</span>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn btn-primary btn-sm" style="flex: 1;">Accept Offer</button>
                                <button class="btn btn-secondary btn-sm toggle-dossier" data-id="${doc.id}" style="flex: 1; border: 1px solid #3b82f6; color: #3b82f6; background: white;">Property Dossier</button>
                            </div>
                        </div>` : 
                        `<div>
                            <p class="waiting-msg"><i class="fas fa-cog fa-spin"></i> Andy is analyzing local data for this property. Your offer is being calculated.</p>
                            <button class="btn btn-secondary btn-sm toggle-dossier" data-id="${doc.id}" style="width: 100%; margin-top: 10px; border: 1px solid #3b82f6; color: #3b82f6; background: white;">View Property Dossier</button>
                        </div>`
                    }
                </div>

                <div class="dossier-section" id="dossier-${doc.id}">
                    <h4><i class="fas fa-file-contract"></i> Advanced Property Dossier</h4>
                    
                    <!-- Street View Integration -->
                    <div class="street-view-panel">
                        <div id="street-view-${doc.id}" class="street-view-container"></div>
                        <div class="street-view-placeholder">
                            <i class="fas fa-map-location-dot"></i>
                            <p>Loading Street View...</p>
                        </div>
                    </div>

                    <div class="dossier-grid">
                        <div class="dossier-item">
                            <i class="fas fa-coins"></i>
                            <span class="dossier-label">Council Tax</span>
                            <span class="dossier-value">${prop.dossier?.councilTaxBand || 'Band D'}</span>
                        </div>
                        <div class="dossier-item">
                            <i class="fas fa-key"></i>
                            <span class="dossier-label">Tenure</span>
                            <span class="dossier-value">${prop.dossier?.tenure || 'Freehold'}</span>
                        </div>
                        <div class="dossier-item">
                            <i class="fas fa-wifi"></i>
                            <span class="dossier-label">Broadband</span>
                            <span class="dossier-value">${prop.dossier?.broadband || '1Gbps+'}</span>
                        </div>
                        <div class="dossier-item">
                            <i class="fas fa-tint"></i>
                            <span class="dossier-label">Flood Risk</span>
                            <span class="dossier-value">${prop.dossier?.floodRiskSurface || 'High Risk'}</span>
                        </div>
                        <div class="dossier-item">
                            <i class="fas fa-map-marked-alt"></i>
                            <span class="dossier-label">Planning</span>
                            <span class="dossier-value">${prop.dossier?.planningCount || '7 Apps'}</span>
                        </div>
                        <div class="dossier-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span class="dossier-label">Schools</span>
                            <span class="dossier-value">3 Good+</span>
                        </div>
                    </div>
                </div>
            `;
            listEl.appendChild(card);
        });

        // Add toggle listeners and initialize maps
        document.querySelectorAll('.toggle-dossier').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const section = document.getElementById(`dossier-${id}`);
                const isActive = section.classList.toggle('active');
                
                if (isActive) {
                    const address = btn.closest('.property-card').querySelector('h3').textContent;
                    initStreetView(id, address);
                }
            });
        });

    } catch (error) {
        console.error("Error loading properties:", error);
    }
}

function initStreetView(id, address) {
    const container = document.getElementById(`street-view-${id}`);
    if (container.dataset.loaded === "true") return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results[0]) {
            const panorama = new google.maps.StreetViewPanorama(container, {
                position: results[0].geometry.location,
                pov: { heading: 165, pitch: 0 },
                zoom: 1,
                addressControl: false,
                showRoadLabels: false,
                motionTracking: false,
                motionTrackingControl: false
            });
            container.dataset.loaded = "true";
        } else {
            container.innerHTML = `<div class="map-error">Street View not available for this location.</div>`;
        }
    });
}

async function loadUserProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
            document.getElementById('profile-img').src = userDoc.data().photoURL;
        }
    } catch (err) { console.error("Profile Error:", err); }
}

function setupDashboardListeners(user) {
    const fileInput = document.getElementById('profile-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const storageRef = ref(storage, `profiles/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);

                await setDoc(doc(db, "users", user.uid), {
                    photoURL: url,
                    updatedAt: new Date()
                }, { merge: true });

                document.getElementById('profile-img').src = url;
            } catch (err) {
                console.error("Profile upload failed:", err);
                alert("Failed to upload profile picture.");
            }
        });
    }
}
// --- ANDY AI CHAT INTEGRATION ---
const CHATBOT_URL = "https://chatbotandy-vjikc6hdhq-uc.a.run.app";
let chatHistory = [];

const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

if (chatToggle && chatWindow) {
    chatToggle.onclick = () => chatWindow.classList.toggle('active');
}

function addMessage(text, sender) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${sender}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getAndyResponse(input) {
    try {
        const user = auth.currentUser;
        const resp = await fetch(CHATBOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: input, 
                history: chatHistory,
                userId: user ? user.uid : 'anonymous'
            })
        });
        const data = await resp.json();
        chatHistory.push({ role: 'user', content: input });
        chatHistory.push({ role: 'assistant', content: data.response });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        return data.response;
    } catch (err) {
        console.error(err);
        return "I'm having a bit of a moment with my connection, but I'm still here to help. How can I assist with your property today?";
    }
}

if (chatForm && chatInput && chatMessages) {
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        addMessage(msg, 'user');
        chatInput.value = '';
        
        const typingId = "typing-" + Date.now();
        const typingEl = document.createElement('div');
        typingEl.id = typingId;
        typingEl.className = 'message message-bot typing';
        typingEl.textContent = "Andy is thinking...";
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await getAndyResponse(msg);
        const typing = document.getElementById(typingId);
        if (typing) typing.remove();
        addMessage(response, 'bot');
    };
}
