import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy 
} from "firebase/firestore";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/";
    } else {
        document.getElementById('dash-user-name').textContent = user.email.split('@')[0];
        loadUserProperties(user.email);
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
