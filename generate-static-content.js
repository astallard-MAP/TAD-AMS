import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp();
const db = admin.firestore();

async function generateStaticContent() {
    try {
        console.log("Fetching SEO Pages from Firestore...");
        const pagesSnap = await db.collection("seoPages").orderBy("timestamp", "desc").limit(1000).get();
        const siteUrl = "https://cash4houses.co.uk";
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Static Core Pages
        const staticPages = ['', 'contact.html', 'about.html', 'dashboard.html', 'archive.html'];
        staticPages.forEach(p => {
            xml += `  <url><loc>${siteUrl}/${p}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
        });

        // Ensure dist directory exists
        const distDir = path.resolve('dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }

        console.log(`Found ${pagesSnap.size} dynamic pages. Generating static HTML...`);
        
        // Archive Page Logic
        let archiveLinksHtml = '';

        // Dynamic SEO Pages
        pagesSnap.forEach(doc => {
            const data = doc.data();
            const fileName = `${doc.id}.html`;
            const filePath = path.join(distDir, fileName);
            
            if (data.html) {
                fs.writeFileSync(filePath, data.html);
                console.log(`Generated: ${fileName}`);
            }
            
            xml += `  <url><loc>${siteUrl}/${fileName}</loc><changefreq>never</changefreq><priority>0.5</priority></url>\n`;

            const rawDateStr = doc.id.replace('cashforhouses', '');
            let formattedDate = rawDateStr;
            if (rawDateStr.length === 8) {
                formattedDate = rawDateStr.substring(0,2) + '/' + rawDateStr.substring(2,4) + '/' + rawDateStr.substring(4,8);
            }
            
            archiveLinksHtml += `
            <a href="/${fileName}" class="archive-card">
                <span class="archive-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                <h3 class="archive-title">${data.town || 'Property Update'}</h3>
                <span class="archive-arrow">Read Article <i class="fas fa-arrow-right"></i></span>
            </a>`;
        });

        const archiveHtml = `
<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Articles Archive | Cash 4 Houses</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .archive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
        .archive-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; display: flex; flex-direction: column; gap: 0.5rem; }
        .archive-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .archive-date { font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .archive-title { color: #0f172a; font-size: 1.25rem; font-weight: 700; margin: 0; }
        .archive-arrow { color: var(--primary); margin-top: auto; padding-top: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <nav>
                <a href="/" class="logo"><img src="/logo.jpg" alt="Cash 4 Houses Logo"></a>
                <div class="nav-links">
                    <a href="/about.html">About</a>
                    <a href="/locations.html">Locations</a>
                    <a href="/contact.html">Contact</a>
                </div>
            </nav>
        </div>
    </header>
    
    <section class="contact-hero" style="background: #f8fafc; padding: 4rem 0;">
        <div class="container" style="text-align: center;">
            <h1 style="color: #0f172a; margin-bottom: 1rem;">Daily Market Articles</h1>
            <p style="font-size: 1.15rem; color: #475569; max-width: 600px; margin: 0 auto;">Browse our historical archive of local property market updates and SEO content across South East Essex.</p>
        </div>
    </section>

    <main style="padding-bottom: 5rem; min-height: 50vh;">
        <div class="container">
            <div class="archive-grid">
                ${archiveLinksHtml || '<p style="grid-column: 1/-1; text-align: center; color: #64748b; font-size: 1.1rem; padding: 3rem;">No articles generated yet.</p>'}
            </div>
        </div>
    </main>

    <footer>
        <div class="container">
            <div class="footer-content" style="text-align: center; border-top: 1px solid #334155; padding-top: 2rem;">
                <p>&copy; 2026 Cash 4 Houses. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
        fs.writeFileSync(path.join(distDir, 'archive.html'), archiveHtml);
        console.log("Generated: archive.html");

        xml += '</urlset>';
        const sitemapPath = path.join(distDir, 'sitemap.xml');
        fs.writeFileSync(sitemapPath, xml);
        console.log("Generated sitemap.xml");

        console.log("Static content generation complete.");
    } catch (err) {
        console.error("Error generating static content:", err);
        process.exit(1);
    }
}

generateStaticContent();
