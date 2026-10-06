import { getAdminFirestore } from './firebase-admin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getDynamicContent(reqPath) {
    const now = Date.now();
    if (cache.has(reqPath)) {
        const cached = cache.get(reqPath);
        if (now - cached.timestamp < CACHE_TTL) {
            return cached.content;
        }
    }

    const db = getAdminFirestore();

    try {
        if (!db) {
            // Mock archive page for local development without DB
            if (reqPath === '/archive.html' || reqPath === '/archive') {
                let templatePath = path.resolve(__dirname, '../dist/archive.html');
                if (!fs.existsSync(templatePath)) templatePath = path.resolve(__dirname, '../archive.html');
                let html = fs.readFileSync(templatePath, 'utf8');
                html = html.replace('<!-- DYNAMIC_ARCHIVE_CONTENT -->', '<p style="text-align:center;">Local Dev: Database bypassed.</p>');
                return { content: html, contentType: 'text/html' };
            }
            return null;
        }
        
        if (reqPath === '/sitemap.xml') {
            const pagesSnap = await db.collection("seoPages").orderBy("timestamp", "desc").limit(1000).get();
            const siteUrl = "https://cash4houses.co.uk";
            
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
            
            const staticPages = ['', 'contact.html', 'about.html', 'dashboard.html', 'archive.html'];
            staticPages.forEach(p => {
                xml += `  <url><loc>${siteUrl}/${p}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
            });

            pagesSnap.forEach(doc => {
                const fileName = `${doc.id}.html`;
                xml += `  <url><loc>${siteUrl}/${fileName}</loc><changefreq>never</changefreq><priority>0.5</priority></url>\n`;
            });

            xml += '</urlset>';
            cache.set(reqPath, { content: xml, contentType: 'application/xml', timestamp: now });
            return { content: xml, contentType: 'application/xml' };
        }
        
        if (reqPath.startsWith('/cashforhouses') && reqPath.endsWith('.html')) {
            const dateStr = reqPath.replace('/', '').replace('.html', '');
            const doc = await db.collection('seoPages').doc(dateStr).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.html) {
                    cache.set(reqPath, { content: data.html, contentType: 'text/html', timestamp: now });
                    return { content: data.html, contentType: 'text/html' };
                }
            }
            return null;
        }

        if (reqPath === '/archive.html' || reqPath === '/archive') {
            const pagesSnap = await db.collection("seoPages").orderBy("timestamp", "desc").limit(1000).get();
            let archiveLinksHtml = '';
            
            pagesSnap.forEach(docSnap => {
                const data = docSnap.data();
                const fileName = `${docSnap.id}.html`;
                
                const rawDateStr = docSnap.id.replace('cashforhouses', '');
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

            // Read the static template from dist/archive.html and replace a placeholder
            let templatePath = path.resolve(__dirname, '../dist/archive.html');
            if (!fs.existsSync(templatePath)) {
                 templatePath = path.resolve(__dirname, '../archive.html'); // fallback
            }
            let html = fs.readFileSync(templatePath, 'utf8');
            html = html.replace('<!-- DYNAMIC_ARCHIVE_CONTENT -->', archiveLinksHtml || '<p style="grid-column: 1/-1; text-align: center; color: #64748b; font-size: 1.1rem; padding: 3rem;">No articles generated yet.</p>');
            
            cache.set('/archive.html', { content: html, contentType: 'text/html', timestamp: now });
            return { content: html, contentType: 'text/html' };
        }

        return null;
    } catch (err) {
        console.error('Error fetching dynamic content:', err);
        return null;
    }
}
