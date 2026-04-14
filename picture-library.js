import { authReady, db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    getCountFromServer,
    where,
    doc,
    limit,
    Timestamp
} from "firebase/firestore";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

authReady.then(async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        loadPictureLibrary();
        loadLibraryStats();
    }
});

async function loadLibraryStats() {
    try {
        const totalSnap = await getCountFromServer(collection(db, "imageLibrary"));
        document.getElementById('stat-total-imgs').textContent = totalSnap.data().count;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayQuery = query(collection(db, "imageLibrary"), where("timestamp", ">=", Timestamp.fromDate(startOfDay)));
        const todaySnap = await getCountFromServer(todayQuery);
        document.getElementById('stat-today-imgs').textContent = todaySnap.data().count;
    } catch (err) { console.error("Stats Error:", err); }
}

async function loadPictureLibrary() {
    const container = document.getElementById('picture-container');
    if (!container) return;

    try {
        const q = query(collection(db, "imageLibrary"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        
        container.innerHTML = "";
        
        if (snap.empty) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #64748b;"><i class="fas fa-camera-retro" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i><p>No images generated yet. The library will populate as the Agent works.</p></div>';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp?.toDate().toLocaleDateString('en-GB') || 'Recent';
            const sourceClass = data.source && data.source.toLowerCase().includes('social') ? "source-social" : "source-news";
            
            const card = document.createElement('div');
            card.className = 'picture-card';
            card.innerHTML = `
                <img src="${data.imageUrl}" alt="${data.prompt}" loading="lazy">
                <div class="picture-info">
                    <span class="picture-source ${sourceClass}">${data.source}</span>
                    <p class="picture-prompt">${data.prompt}</p>
                    <small class="picture-date"><i class="far fa-calendar-alt"></i> ${date} - ${data.metadata?.town || 'Global'}</small>
                </div>
            `;

            card.onclick = () => showLightbox(data);
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Library Load Error:", err);
        container.innerHTML = '<p>Error loading image assets.</p>';
    }
}

function showLightbox(data) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lightbox-title');
    const prompt = document.getElementById('lightbox-prompt');
    const source = document.getElementById('lightbox-source');

    img.src = data.imageUrl;
    title.textContent = `${data.source} Asset - ${data.metadata?.town || 'South East Essex'}`;
    prompt.textContent = data.prompt;
    source.textContent = data.source;
    source.className = `picture-source ${data.source && data.source.toLowerCase().includes('social') ? "source-social" : "source-news"}`;

    lightbox.classList.add('active');
}

document.querySelector('.close-lightbox').onclick = () => {
    document.getElementById('lightbox').classList.remove('active');
};

document.getElementById('lightbox').onclick = (e) => {
    if (e.target === document.getElementById('lightbox')) {
        document.getElementById('lightbox').classList.remove('active');
    }
};
