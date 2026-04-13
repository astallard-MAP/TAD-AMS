import { authReady, db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    getCountFromServer,
    doc,
    getDoc
} from "firebase/firestore";
import { signOut } from "firebase/auth";

const ADMIN_UID = "Djh7uHK2yZYHC4Ta4xhbguaCJVl1";

authReady.then(async (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
    } else {
        initCharts();
        loadRealData();
        setupAdminProfile(user.uid);
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                await signOut(auth);
                window.location.replace("/");
            };
        }
    }
});

async function setupAdminProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
            document.getElementById('profile-img').src = userDoc.data().photoURL;
        }
    } catch (err) { console.error("Profile Error:", err); }
}

async function loadRealData() {
    try {
        // Valuation Total
        const leadsSnap = await getCountFromServer(collection(db, "leads"));
        const valCount = leadsSnap.data().count;
        // In a real app we'd trigger a chart refresh here
        
        // Latest AI News
        const newsDoc = await getDoc(doc(db, "marketUpdates", "latest"));
        if (newsDoc.exists()) {
            document.getElementById('latest-ai-news').innerHTML = `
                <h4>${newsDoc.data().updatedAt?.toDate().toLocaleDateString('en-GB')} Update</h4>
                <p>${newsDoc.data().content.substring(0, 150)}...</p>
            `;
        }
    } catch (err) { console.error(err); }
}

function initCharts() {
    // 1. Live Portal Engagement (Full Width)
    new ApexCharts(document.querySelector("#usage-chart"), {
        series: [{ name: 'Page Views', data: [31, 40, 28, 51, 42, 109, 100, 120, 140, 110, 90, 130] }],
        chart: { height: 250, type: 'area', toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 1200 } },
        colors: ['#EA287A'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 4 },
        xaxis: { categories: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], labels: { style: { colors: '#64748b' } } },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } }
    }).render();

    // 2. User peak analysis
    new ApexCharts(document.querySelector("#peak-chart"), {
        series: [{ name: 'Activity', data: [15, 25, 45, 30, 20, 40, 60] }],
        chart: { type: 'bar', height: 180, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
        colors: ['#5A4A61'],
        xaxis: { categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], labels: { style: { colors: '#64748b' } } }
    }).render();

    // 3. Entry Routes
    new ApexCharts(document.querySelector("#entry-routes-chart"), {
        series: [44, 33, 13, 10],
        chart: { width: 300, type: 'donut' },
        labels: ['Organic', 'Direct', 'Social', 'Referral'],
        colors: ['#5A4A61', '#EA287A', '#10b981', '#f59e0b'],
        legend: { position: 'bottom' }
    }).render();

    // 4. Valuation Volume
    new ApexCharts(document.querySelector("#valuation-volume-chart"), {
        chart: { height: 120, type: 'line', sparkline: { enabled: true } },
        series: [{ data: [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54] }],
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#10b981']
    }).render();

    // 5. Valuation Heatmap
    new ApexCharts(document.querySelector("#valuation-heatmap"), {
        series: [
            { name: 'Mon', data: generateData(12, { min: 0, max: 20 }) },
            { name: 'Tue', data: generateData(12, { min: 0, max: 20 }) },
            { name: 'Wed', data: generateData(12, { min: 0, max: 20 }) }
        ],
        chart: { height: 180, type: 'heatmap', toolbar: { show: false } },
        dataLabels: { enabled: false },
        colors: ["#10b981"]
    }).render();

    // 6. Lead Acquisition Source
    new ApexCharts(document.querySelector("#lead-source-chart"), {
        series: [6, 12, 18, 5, 4],
        chart: { type: 'polarArea', height: 180 },
        stroke: { colors: ['#fff'] },
        fill: { opacity: 0.8 },
        labels: ['Google Ads', 'Organic SEO', 'Social', 'Direct', 'Other'],
        legend: { show: false }
    }).render();
}

function generateData(count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
        var x = (i + 1).toString();
        var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
        series.push({ x: x, y: y });
        i++;
    }
    return series;
}
