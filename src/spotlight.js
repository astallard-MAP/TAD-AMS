import { db } from './firebase-config.js';
import { doc, getDoc } from "firebase/firestore";

async function loadSpotlightData() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        window.location.href = "/spotlights-index.html";
        return;
    }

    try {
        const docSnap = await getDoc(doc(db, "areaSpotlights", id));
        if (!docSnap.exists()) {
            document.getElementById('page-title').textContent = "Spotlight Not Found";
            return;
        }

        const data = docSnap.data();
        
        // Metadata
        document.title = `${data.town} | Daily Property Spotlight - ${data.dateId}`;
        const meta = document.getElementById('meta-desc');
        if (meta) meta.content = `Daily property insights for ${data.town}. ${data.intro.substring(0, 150)}...`;

        // Content
        document.getElementById('page-title').textContent = `${data.town} ${data.fullDate}`;
        document.getElementById('page-date').textContent = data.fullDate;
        document.getElementById('target-town').textContent = data.town;

        document.getElementById('intro-section').innerHTML = marked.parse(data.intro);
        document.getElementById('history-section').innerHTML = marked.parse(data.history);
        document.getElementById('news-section').innerHTML = marked.parse(data.news);
        document.getElementById('signoff-section').innerHTML = marked.parse(data.signoff);

        // Social Grid
        const grid = document.getElementById('social-grid');
        grid.innerHTML = "";
        if (data.socialMedia && data.socialMedia.length > 0) {
            data.socialMedia.forEach(post => {
                const card = document.createElement('div');
                card.className = "social-card";
                card.innerHTML = `
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Social Context">` : ''}
                    <div class="social-text">${marked.parse(post.content.substring(0, 300) + '...')}</div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = "<p style='grid-column: span 3; color: #64748b;'>Daily social stream archive is updating.</p>";
        }

    } catch (err) {
        console.error(err);
        document.getElementById('page-title').textContent = "Error loading spotlight.";
    }
}

loadSpotlightData();
