const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    
    await page.goto('http://localhost:5173/');
    console.log('Navigated to Home');
    
    // Click on About link
    await page.click('a[href="/about.html"]');
    
    // Wait a moment for navigation or JS execution
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Current URL after click:', page.url());
    await browser.close();
})();
