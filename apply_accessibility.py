import glob
import re
import os

html_files = glob.glob('*.html')

# Function to add title attributes to <a> tags
def add_titles_to_links(content):
    def replace_a_tag(match):
        full_tag = match.group(0)
        attrs = match.group(1)
        inner_html = match.group(2)
        
        # If it already has a title, leave it alone
        if 'title="' in attrs or "title='" in attrs:
            return full_tag
            
        # Extract plain text from inner_html for the title
        clean_text = re.sub(r'<[^>]+>', '', inner_html).strip()
        
        # If no text (e.g. just an icon), try to infer from href or class
        if not clean_text:
            href_match = re.search(r'href=["\']([^"\']+)["\']', attrs)
            if href_match:
                href = href_match.group(1)
                if 'facebook' in href: clean_text = 'Facebook Page'
                elif 'instagram' in href: clean_text = 'Instagram Profile'
                elif 'tel:' in href: clean_text = 'Call Us'
                elif href == '/': clean_text = 'Home Page'
                else:
                    clean_text = href.replace('.html', '').replace('/', ' ').title().strip()
        
        if not clean_text:
            clean_text = "Link"
            
        # Add the title attribute safely
        new_attrs = f'{attrs} title="{clean_text}" aria-label="{clean_text}"'
        return f'<a{new_attrs}>{inner_html}</a>'

    # Regex to match <a> tags and capture their attributes and inner HTML
    pattern = re.compile(r'<a([^>]*)>(.*?)</a>', re.IGNORECASE | re.DOTALL)
    return pattern.sub(replace_a_tag, content)


# We also want to inject Google Translate and an Accessibility widget
# We will inject this right after the opening <body> tag
translate_and_a11y_code = """
    <!-- Google Translate Widget -->
    <div id="google_translate_element" style="position: absolute; top: 10px; right: 10px; z-index: 9999;"></div>
    <script type="text/javascript">
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
        }
    </script>
    <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

    <!-- Accessibility Widget (UserWay free tier for contrast/text size/dyslexia) -->
    <script src="https://cdn.userway.org/widget.js" data-account="V9zGkV4z3m"></script>
"""

def inject_widgets(content):
    if 'google_translate_element' in content:
        return content # Already injected
    
    # Replace body tag
    return re.sub(r'<body[^>]*>', lambda m: m.group(0) + '\n' + translate_and_a11y_code, content, count=1)


for file_path in html_files:
    if file_path.startswith('templates') or file_path.startswith('spotlight'):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    html = add_titles_to_links(html)
    html = inject_widgets(html)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)

print("Accessibility updates applied successfully.")
