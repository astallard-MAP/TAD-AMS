import re
import glob

# Functions that should be admin-only
admin_functions = [
    "manualSystemRepair", "manualSocialGenerate", "fillArchiveAdmin", "testGBPPost", 
    "instantSocialTestAgent", "getGoogleReviews", "manualSocialAudit", "manualMobileAudit",
    "testMetaInsights", "generateGMBAuthUrl", "manualSocialAnalysis", "manualWeeklyDigest",
    "manualMarketUpdate", "manualSlimMkt", "manualSlimPsy"
]

sec_check = """
  // SECURITY GATE: Prevent unauthorized execution
  const cronSecret = process.env.ADMIN_SECRET || "c4h-admin-key-2026";
  if (req.query.key !== cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    console.error(`[SECURITY BLOCK] Unauthorized execution attempt on endpoint.`);
    return res.status(403).send('Unauthorized: Admin access required.');
  }
"""

def secure_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    for func in admin_functions:
        # Regex to find: exports.funcName = onRequest(..., async (req, res) => {
        pattern = re.compile(r'(exports\.' + func + r'\s*=\s*(?:functions\.)?onRequest\([^)]+\)\s*,\s*async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{)')
        
        def replacer(match):
            # Check if it already has the security gate
            block = match.group(0)
            # Find the index in the original content to see what follows
            idx = content.find(block) + len(block)
            next_chars = content[idx:idx+100]
            if "SECURITY GATE" in next_chars:
                return block
            return block + sec_check

        content = pattern.sub(replacer, content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

secure_file('c:/Antigravity Project/C4H Website/TAD-AMS/functions/index.js')
for sf in glob.glob('c:/Antigravity Project/C4H Website/TAD-AMS/functions/slim/*.js'):
    secure_file(sf)

print("Backend API security applied.")
