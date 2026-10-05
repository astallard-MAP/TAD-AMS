import re
import glob

files = glob.glob('*.html')

header_nav = '''                <div class="nav-links">
                    <a href="/about.html">About</a>
                    <a href="/locations.html">Locations</a>
                    <a href="tel:07834555355" class="btn btn-primary"><i class="fas fa-phone"></i> 07834 555 355</a>
                    
                    <!-- Auth Controls -->
                    <button id="login-btn" class="btn btn-outline">Login</button>
                    <div id="user-profile" class="user-profile" style="display: none;">
                        <span class="user-name">User</span>
                        <div class="user-dropdown">
                            <a id="admin-toggle" href="/admin.html" style="display: none; color: #d32f2f;">Admin Dashboard</a>
                            <a id="portfolio-link" href="/dashboard.html" style="display: none;">My Portfolio</a>
                            <a href="/profile.html">My Profile</a>
                            <button id="logout-btn" class="logout-btn">Sign Out</button>
                        </div>
                    </div>
                </div>'''

footer_nav = '''                <div class="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/about.html">About Our Service</a></li>
                        <li><a href="/locations.html">Areas We Buy</a></li>
                        <li><a href="/contact.html">Contact Us</a></li>
                        <li><a href="/get-offer.html">Get an Offer</a></li>
                        <li><a href="/archive.html">Daily Articles Archive</a></li>
                    </ul>
                </div>'''

header_regex = re.compile(r'<div class="nav-links">.*?</div>\s*</div>', re.DOTALL)
footer_regex = re.compile(r'<div class="footer-links">\s*<h4>Quick Links</h4>\s*<ul>.*?</ul>\s*</div>', re.DOTALL)

for f in files:
    if f.startswith('templates') or f.startswith('spotlight'):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = header_regex.sub(header_nav + '\n            </div>', content)
    new_content = footer_regex.sub(footer_nav, new_content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)

print('Done fixing links!')
