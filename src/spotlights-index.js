import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "firebase/firestore";

async function loadSpotlights() {
    const container = document.getElementById('spotlight-list');
    if (!container) return;

    try {
        const q = query(collection(db, "areaSpotlights"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            container.innerHTML = "<p>Andy is currently preparing the first set of area spotlights.</p>";
            return;
        }

        container.innerHTML = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const card = document.createElement('a');
            card.href = `/spotlight.html?id=${docSnap.id}`;
            card.className = "area-card";
            card.style.cssText = "display: block; padding: 1.5rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; text-decoration: none; color: inherit; transition: all 0.2s;";
            
            card.innerHTML = `
                <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">${data.dateId}</div>
                <h3 style="margin: 0; color: #1e293b;">${data.town}</h3>
                <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">${data.fullDate}</p>
                <div style="margin-top: 1rem; color: #3b82f6; font-weight: bold; font-size: 0.85rem;">View Insights <i class="fas fa-arrow-right"></i></div>
            `;
            
            card.onmouseenter = () => card.style.borderColor = "#3b82f6";
            card.onmouseleave = () => card.style.borderColor = "#e2e8f0";
            
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load insights. Check portal connectivity.</p>";
    }
}

loadSpotlights();
