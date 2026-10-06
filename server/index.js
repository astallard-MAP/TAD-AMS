import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDynamicContent } from './dynamic-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml',
    '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
    let reqPath = req.url.split('?')[0];

    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'browsing-topics=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://cdn.jsdelivr.net https://maps.googleapis.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://*.google.com https://*.googleapis.com https://images.unsplash.com https://*.unsplash.com https://*.googleusercontent.com https://img.icons8.com; connect-src 'self' https://*.googleapis.com https://*.google.com https://www.google-analytics.com https://*.cloudfunctions.net https://*.a.run.app;");
    
    // Default cache control
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Root mapping
    if (reqPath === '/') {
        reqPath = '/index.html';
    }

    // Dynamic content check
    const dynamicContent = await getDynamicContent(reqPath);
    if (dynamicContent) {
        res.setHeader('Content-Type', dynamicContent.contentType);
        // Do not cache dynamic responses at the CDN level
        res.setHeader('Cache-Control', 'no-cache');
        res.writeHead(200);
        res.end(dynamicContent.content);
        return;
    }

    // Explicit MPA file resolution
    let ext = path.extname(reqPath);
    
    // Resolve extensionless paths
    if (!ext) {
        reqPath += '.html';
        ext = '.html';
    }

    let filePath = path.join(DIST_DIR, reqPath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Real 404
            fs.readFile(path.join(DIST_DIR, '404.html'), (err404, content404) => {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(404);
                res.end(content404 || '404 Not Found');
            });
            return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Server Error');
                return;
            }
            res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
            res.writeHead(200);
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    console.log(`First-Party MPA Runtime Server listening on port ${PORT}`);
});
