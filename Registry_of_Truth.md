# TAD-AMS: REGISTRY OF TRUTH
**Document Classification:** Definitive System Blueprint, Operational Protocol & Project Ledger  
**System Designation:** TAD-AMS (The Andy Decision & Automated Management System)  
**Primary Platform:** [Cash 4 Houses (cash4houses.co.uk)](https://cash4houses.co.uk)  
**Principal / Managing Director:** Andrew Stallard  
**Creation Date:** 05 October 2026  
**Status:** Living Canonical Document (MANDATORY UPDATE ON EVERY INSTRUCTION)  

---

## 1. Project Introduction: Form, Function, Purpose & Design

### 1.1 Executive Summary & Mission
Cash 4 Houses is a proprietary, full-stack, AI-orchestrated residential property acquisition platform operating across South East Essex (Southend-on-Sea, Westcliff, Leigh-on-Sea, Basildon, Rayleigh, Chelmsford, and surrounding areas), Greater London, and Hertfordshire.

The commercial purpose of the platform is to acquire residential real estate directly from motivated or distressed property sellers (facing broken chains, bereavement/probate, divorce, structural defects, or financial repossession) providing a guaranteed, transparent cash exit with zero agent fees and completion in as little as 7 to 14 days.

### 1.2 Form (Architecture & Technology Stack)
- **Frontend Architecture:** Pure Vanilla HTML5, Vanilla CSS3 (curated design system tokens, zero utility-bloat frameworks), and Vanilla ES Modules JavaScript.
- **Build & Optimization Pipeline:** Vite (`vite.config.js`) bundling into `dist/` with PWA service worker precaching (`vite-plugin-pwa`).
- **Backend Architecture:** Serverless Firebase Cloud Functions v2 running on Node.js 20 explicitly bound to region **`europe-west4`** (Eemshaven, Netherlands).
- **AI Core Engine:** Google Genkit integrated with Google Cloud Vertex AI (`gemini-2.5-flash` for high-conversion copywriting, visual auditing, and chatbot dialogue; `imagen-3` for hyper-local documentary photography).
- **Data Persistence:** Google Cloud Firestore (multi-tenant structure for leads, audit logs, social intelligence, dynamic SEO pages, and communication transcripts).
- **External Integration Hub:** Meta Graph API v19.0 (Facebook Page & Instagram Business), Google My Business API v4 (Dual Essex GBP locations), and Nodemailer via Gmail SMTP.

### 1.3 Design System & Aesthetics
- **Visual Ethos:** Premium, trustworthy, modern, high-contrast aesthetics. Employs curated Google Fonts (`Inter` for high-legibility body copy and `Outfit` for strong typographic hierarchy).
- **Brand Identity:** Primary Magenta (`#EB287A`), Deep Navy (`#0f172a`), Crisp Slate neutrals, and warm alert badges.
- **Copywriting Persona:** "The Warm Blanket" â€” empathetic, reassuring, hyper-transparent, strictly British English (EN-UK), and focused on immediate relief rather than corporate hard-selling.

---

## 2. The Inviolable Laws of the Construction

Every engineer, agent, AI assistant, and collaborator interacting with this codebase is legally and operationally bound by the following **Immutable Laws**.

### LAW I: "IF IT'S NOT WRITTEN DOWN, IT DOESN'T EXIST"
Nothing is assumed, oral memory is discarded, and undocumented features or configs are considered non-existent. Every architectural change, configuration update, feature addition, and operational pivot must be catalogued in explicit detail within this `Registry_of_Truth.md` and related technical briefs.

### LAW II: THE PRE-FLIGHT ACTION PROTOCOL (PLAN & CATALOGUE FIRST)
Whenever an instruction is issued by the Principal (Andrew Stallard), work **must not begin** on code or configuration until:
1. A **Plan of Action** is formulated and recorded in this Registry.
2. A **List of Tasks** is generated with explicit status tags:
   - `[to be actioned]`
   - `[in progress]`
   - `[Completed]`
   - `[No longer Required]`
3. No task may be marked `[Completed]` without verification of implementation and build validation.

### LAW III: REGIONAL INTEGRITY & DEPLOYMENT COHERENCE
All Firebase Cloud Functions v2 and corresponding Firebase Hosting rewrites must strictly reside in **`europe-west4`**. Multi-region divergence without explicit recorded dispensation is strictly prohibited to avoid deployment collisions, routing latency, and 409 conflict errors.

### LAW IV: DOCUMENTARY REALISM (THE ANTI-POLISHING RULE)
Public-facing marketing imagery, social posts, and visual assets must adhere to Hyper-Local Visual Fidelity (HL-VF). Sterile, shiny, high-spec "show home" imagery is prohibited as it alienates distressed sellers. All generated assets must reflect genuine UK streetscapes, lived-in architectural vernacular, and documentary authenticity.

### LAW V: COMPASSIONATE SAFEGUARDING & STRICT MODERATION
The platform deals with individuals under emotional, relational, or financial distress. The AI conversational agent ("Andy") must strictly enforce the Compassionate Safeguarding Protocol (immediate referral to professional support when distress/self-harm is detected) and must pass every generation through the Sentinel Moderation AI before presentation to the user.

### LAW VI: BUILD DISCIPLINE & ARTIFACT REGENERATION
Whenever modifications are made to root HTML, CSS, or JS files, a production build (`npm run build`) must be executed to ensure the `dist/` directory mirrors the source files before any deployment or git commit.

---

## 3. Master Configuration Settings & Build Standards

To ensure that any future upgrades, edits, or additions conform and comply with existing standards, all implementations must align with these configuration anchors:

### 3.1 Business & Canonical Identifiers
| Key | Canonical Value |
| :--- | :--- |
| **Business Name** | Cash 4 Houses |
| **Principal / MD** | Andrew Stallard |
| **Primary Domain** | `https://cash4houses.co.uk` |
| **Primary Phone** | `07834 555 355` (`+44 7834 555 355`) |
| **Primary Inbound Email** | `astallard65@gmail.com` |
| **Operational Address** | Hillsboro, 377 Southchurch Road, Southend-On-Sea, Essex SS1 2PQ |
| **Registered Postal Address** | 7 High Street, Westcliff-on-Sea, Essex SS0 7NP |
| **Facebook Official** | `https://www.facebook.com/Cash4Houses.co/` |
| **Instagram Official** | `https://www.instagram.com/cash4houses.co.uk/` |

### 3.2 Cloud Infrastructure & Secrets Manifest
- **Firebase Project ID:** `c4h-wesbite` (verified from `.firebaserc`, 05/10/2026 â€” note the spelling "wesbite" is the real ID)
- **Default Cloud Functions Region:** `europe-west4`
- **Node.js Runtime:** `Node.js 20`
- **Secrets Managed via Google Cloud Secret Manager:**
  - `GMAIL_APP_PASSWORD` (SMTP notifications via `astallard65@gmail.com`)
  - `GBP_LOCATION_ID` (Southend Southchurch Road GBP Location)
  - `GBP_CLIENT_ID` (Google Cloud OAuth Client ID for GMB)
  - `GBP_CLIENT_SECRET` (Google Cloud OAuth Client Secret)
  - `GBP_REFRESH_TOKEN` (Google Cloud OAuth Refresh Token)
  - `META_PAGE_ID` (Cash 4 Houses Facebook Page ID)
  - `META_PERMANENT_PAGE_TOKEN` (Long-lived Meta Graph API token)
  - `META_APP_ID` & `META_APP_SECRET`
  - `GA4_PROPERTY_ID` (Google Analytics 4 Property ID)

### 3.3 Target Territories (GSR 14-Town Essex Roster)
The Geographical Synchronization & Rotation (GSR) Protocol governs all social and SEO generation across these 14 locations:
1. Southend-on-Sea
2. Westcliff-on-Sea
3. Leigh-on-Sea
4. Shoeburyness
5. Rochford
6. Rayleigh Weir
7. Rayleigh
8. Basildon
9. Wickford
10. Stanford Le Hope
11. Brentwood
12. Chelmsford
13. Maldon
14. Battelsbridge

### 3.4 Scheduled Autonomous Jobs Matrix
*Verified against `schedule:` declarations in `functions/index.js` on 05/10/2026 (line numbers in brackets). All run on `timeZone: "Europe/London"` unless noted.*

| Schedule (London Time) | Function Name | Purpose |
| :--- | :--- | :--- |
| **Every 5 min** | `emailQueueAgent` (L659) | Processes queued outbound email |
| **Every 2 hours** | `portalSentinel` (L1310) | Portal health audit |
| **Every 4 hours** | `socialMediaSentinel` (L1548) | Post-hoc social policy / image audit (does NOT block publishing) |
| **00:00 Daily** | `generateDailySpotlight` (L1395) | Daily spotlight page |
| **01:00 Daily** | `seoSubmissionAgent` (L1401) | SEO submission |
| **01:00 Daily** | `socialIntelligenceAgent` (L2067) | Meta insights analysis â†’ `socialStrategy/latest` |
| **08:00 Daily** | `dailyMarketAnalysis` (L573) | RSS market news â†’ `marketUpdates/latest` |
| **09:00 Daily** | `socialMorningPost` (L451) | AI post â†’ FB + IG + GBP (both locations) |
| **09:00 Daily** | `gbpMorningPost` (L1064) | Posts `marketUpdates/latest` to GBP (both locations) |
| **12:00 Daily** | `socialLunchPost` (L457) | AI post â†’ FB + IG + GBP (both locations) |
| **12:00 Daily** | `gbpLunchPost` (L1076) | Re-posts latest *Morning* social post to GBP |
| **18:00 Daily** | `socialEveningPost` (L463) | AI post â†’ FB + IG + GBP (both locations) |
| **18:00 Daily** | `gbpEveningPost` (L1093) | Re-posts latest *Lunch* social post to GBP |
| **18:00 Daily** | `dailyMobileAudit` (L1567) | Mobile layout audit |
| **22:00 Daily** | `autonomousSEOGenerator` (L2458) | Daily SEO location page |
| **Monday 08:00** | `weeklyPerformanceDigest` (L2091) | Weekly KPI email to MD |

> **Observation (verified from code, impact UNVERIFIED):** each GBP location may get up to 6 posts a day: 3 from the social posts plus 3 from the `gbp*` jobs. Two of those 3 are repeats of social posts that were already sent to GBP. This is logged for Phase 0 Task 0.2 / 0.4.

---

## 4. Live Ledger: Plans of Action & Task Registers

This section serves as the continuous, real-time activity ledger. Whenever an instruction is received, a new phase is appended here with its plan and itemized task statuses.

```
Task Status Definitions:
- [to be actioned] : Planned and queued; waiting for execution.
- [in progress]    : Currently under active implementation.
- [Completed]      : Built, verified, and confirmed.
- [No longer Required] : Deprecated, superseded, or cancelled by instruction.
```

---

### [PHASE 001]: Initial System Stabilization & Region Unification
- **Objective:** Eliminate deployment collisions (409 Conflict) by establishing uniform `europe-west4` residency across all Cloud Functions and updating Firebase Hosting rewrites.
- **Status:** `[Completed]` (Committed in `d9e7d56`)

| Task ID | Description | Status |
| :--- | :--- | :--- |
| `001-A` | Audit all functions in `functions/index.js` for regional declarations | `[Completed]` |
| `001-B` | Inject `setGlobalOptions({ region: "europe-west4" })` at top of `functions/index.js` | `[Completed]` |
| `001-C` | Explicitly specify `{ region: "europe-west4" }` on all Cloud Functions (correction 05/10/2026: the "28" figure was not verified; `functions/index.js` has 44 `exports.*` definitions (matches the 44 live functions). `manualMobileAudit` (`onCall`) relies on `setGlobalOptions` rather than an explicit region) | `[Completed]` |
| `001-D` | Update `firebase.json` rewrites to point to `europe-west4` | `[Completed]` |

---

### [PHASE 002]: Social Media Canonical URL Harmonization
- **Objective:** Update all Facebook page links across project files to the newly established handle `https://www.facebook.com/Cash4Houses.co/`.
- **Status:** `[Completed]` (Committed in `d9e7d56`)

| Task ID | Description | Status |
| :--- | :--- | :--- |
| `002-A` | Global search for `https://www.facebook.com/Cash4Houses.co.uk` across all project files | `[Completed]` |
| `002-B` | Update footer social link in `index.html` to `https://www.facebook.com/Cash4Houses.co/` | `[Completed]` |
| `002-C` | Update footer social link in `contact.html` to `https://www.facebook.com/Cash4Houses.co/` | `[Completed]` |
| `002-D` | Verify backend automated email template in `functions/index.js` | `[Completed]` |
| `002-E` | Rebuild production assets via `npm run build` | `[Completed]` |
| `002-F` | Git commit and push upstream to GitHub repository | `[Completed]` |

---

### [PHASE 003]: Architecture & Operational Briefing Documentation
- **Objective:** Provide exhaustive architectural and operational briefs on the Social Media Outreach Engine and the Andy AI Chatbot.
- **Status:** `[Completed]`

| Task ID | Description | Status |
| :--- | :--- | :--- |
| `003-A` | Formulate and present comprehensive Social Media Post Protocol briefing | `[Completed]` |
| `003-B` | Formulate and present comprehensive Andy AI Chatbot form, function, and purpose briefing | `[Completed]` |

---

### [PHASE 004]: Creation of the Canonical Registry of Truth & Operating Laws
- **Objective:** Instantiate `Registry_of_Truth.md` as the definitive master record, establish the construction Laws, document build standards, and establish the Task Register protocol for all future instructions.
- **Status:** `[Completed]`

| Task ID | Description | Status |
| :--- | :--- | :--- |
| `004-A` | Create `Registry_of_Truth.md` at project root with Introduction, Form, Function, Purpose, and Design | `[Completed]` |
| `004-B` | Codify the Inviolable Laws of the Construction including "IF IT'S NOT WRITTEN DOWN IT DOESN'T EXIST" | `[Completed]` |
| `004-C` | Document full configuration settings, infrastructure secrets manifest, and scheduled jobs | `[Completed]` |
| `004-D` | Establish the Plan of Action and Task Register protocol for all subsequent user instructions | `[Completed]` |
| `004-E` | Create workspace rule in `.agents/rules/` to ensure permanent adherence across sessions | `[Completed]` |

---

### [PHASE 005]: BRIEF C4H-SLIM-001 â€” AI SLIM Fleet, Hive Mind & Social Outreach Upgrade
- **Issued:** Monday 05 October 2026, by Andrew Stallard (Director)
- **Catalogued:** 05/10/2026 10:05
- **Environment:** Firebase Cloud Functions v2 (`europe-west4`), Firestore, Genkit (Vertex AI), Meta Graph API, Google Business Profile API
- **Overall Status:** `[in progress]`: catalogued. **Phase 0 has not started yet; it is waiting for go-ahead and access (see 005.Q).**

#### 005.1 Mission (re-read before every sub-phase)
Turn the social and chatbot system into a fleet of specialised, self-learning AI modules ("AI SLIMs") that share one persistent "Hive Mind". The aim is to (a) become the best-informed UK property market observer, (b) understand distressed-seller psychology and write with honesty and empathy, (c) generate **real inbound enquiries** (none in six months so far), and (d) give distressed sellers a friendly, secure, fast place to turn.

#### 005.2 Success Definition
- **Primary:** measurable inbound leads (valuation form submissions, chatbot-to-form conversions, phone/WhatsApp clicks) attributed to social posts via GA4.
- **Secondary:** engagement quality (saves, shares, comments, DMs), link clicks, GBP actions (calls, directions, website clicks).
- **Targets:** set by Andrew at GATE 0, once the true baseline is known.
- **Phase-exit test (mandatory):** *"Does this move us closer to a real inbound enquiry from a real distressed seller?"* If not, say so.

#### 005.3 Rules of Engagement (binding; breaking any one fails the brief)
| # | Rule |
| :--- | :--- |
| R1 | Work in order. Do not start a phase until the previous milestone is met **and** has been reported. |
| R2 | Stop at every GATE. Report in the Section 005.7 format and wait for a written **"APPROVED"**. |
| R3 | No hallucination. Verify against code, data or a cited source, or write **UNVERIFIED**. Every market fact needs source name + URL + retrieval date. |
| R4 | No tunnel vision. Re-read 005.1 and 005.2 before each phase and apply the phase-exit test. |
| R5 | Do not break what works. Existing functions (`socialMorningPost`, `gbpMorningPost`, `chatbotAndy`, `socialMediaSentinel`, `socialIntelligenceAgent`, `weeklyPerformanceDigest`, `manualSocialGenerate`, etc.) stay until the replacement is built, tested and approved. Build alongside, then switch over at a GATE. |
| R6 | Phases 0 and 1 are read-only (reports only). No production changes before Phase 2. |
| R7 | No personal data in the Hive Mind: no names, addresses, phones, emails or transcripts. Anonymised, aggregated insights only (UK GDPR). |
| R8 | Vulnerable people come first. No pressure tactics, false urgency or fear. |
| R9 | Every public claim must be true and match what the business can actually deliver. Flag anything unconfirmed. |
| R10 | Document as you go. Every change goes in `/docs/slim-fleet/CHANGELOG.md` (date, file, reason, rollback steps) **and** in this Registry. |
| R11 | If unsure, do not guess. Ask a specific question with options and a recommendation. |

#### 005.4 Plan of Action
1. **Set up documentation** (`/docs/slim-fleet/` + CHANGELOG). This is the only file-system change allowed before Phase 2.
2. **Phase 0, Diagnose (read-only):** find out why there have been zero leads before building anything. Check the funnel, publishing, chatbot, message-market fit, compliance and data. â†’ `PHASE-0-DIAGNOSIS.md` â†’ **GATE 0**.
3. **Phase 1, Research (read-only, cited):** source register, market driver map, seller segments + Trust Checklist â†’ **GATE 1**.
4. **Phase 2, Hive Mind:** design doc â†’ **GATE 2A** â†’ shared `hiveClient`, learning rules, security/PII filter, migration-by-copy â†’ tests in staging/namespaced collections â†’ **GATE 2B**.
5. **Phase 3, SLIM Fleet:** 11 modules built one at a time in dry-run mode, each with kill-switch, `logRun()` and tests, reported module by module. Includes the Andy upgrade and a health dashboard â†’ **GATE 3**.
6. **Phase 4, Post redesign:** format library, help-first ratio, multiple CTAs, rhythm experiment, hashtag 3â€“7 enforced in code, first-party short links, paid/partner options report, 14 days of staged sample posts â†’ **GATE 4** (Andrew reviews personally).
7. **Phase 5, Controlled rollout:** 4 weekly stages, each approved; dashboard upgrades; weekly report; retire legacy only after 30 stable days + approval.

#### 005.5 Ordered Task Register
*Execution order is top to bottom. A GATE row blocks every row below it until Andrew writes "APPROVED".*

**Stage S: Setup**
| Order | Task ID | Description | Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `SLIM-S.1` | Catalogue Brief C4H-SLIM-001 in the Registry (this section) | Registry Phase 005 | `[Completed]` |
| 2 | `SLIM-S.2` | Create `/docs/slim-fleet/` and `CHANGELOG.md` (template: date, file, reason, rollback) | `docs/slim-fleet/CHANGELOG.md` | `[Completed]` |
| 3 | `SLIM-S.3` | Confirm access/credentials route for read-only Phase 0 data (see 005.Q). **05/10 10:10:** Firebase CLI is logged in as astallard65@gmail.com and works (`functions:list` succeeded). `gcloud` is **not installed**, so Firestore document reads, 180-day Cloud Logging and ADC are not yet available. | Answer from Andrew | `[in progress]` |

**Phase 0: Diagnose zero leads (READ-ONLY)**
| Order | Task ID | Description | Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 4 | `SLIM-0.1a` | Valuation form submits on mobile + desktop (browser test with evidence) | Pass/fail + screenshots | `[to be actioned]` |
| 5 | `SLIM-0.1b` | Submission reaches Firestore (`processLead`) and admin notification actually arrives | Pass/fail + log/code refs | `[to be actioned]` |
| 6 | `SLIM-0.1c` | TinyURL resolves with UTMs intact; GA4 records correct source/medium/campaign | Pass/fail + evidence | `[to be actioned]` |
| 7 | `SLIM-0.1d` | Inventory GA4 conversion events (form_submit, click-to-call, WhatsApp, chatbot_to_form): exist vs missing | Event table | `[to be actioned]` |
| 8 | `SLIM-0.1e` | Phone/WhatsApp present and clickable (`tel:` / `wa.me`) on posts + site, on mobile | Pass/fail | `[to be actioned]` |
| 9 | `SLIM-0.1f` | 180-day review: spam folders, form errors, Cloud Function error logs | Findings | `[to be actioned]` |
| 10 | `SLIM-0.1g` | **Added:** verify that frontend endpoints still work after the region move (see 005.P-1) | Pass/fail per endpoint | `[to be actioned]` |
| 11 | `SLIM-0.2a` | 180 days: posts scheduled vs published per channel (FB, IG, GBPÃ—2) | Table | `[to be actioned]` |
| 12 | `SLIM-0.2b` | Failed/rejected/removed/limited posts + reasons | List | `[to be actioned]` |
| 13 | `SLIM-0.2c` | Reach, impressions, clicks, comments, shares, saves per channel; total site link clicks | Metrics table | `[to be actioned]` |
| 14 | `SLIM-0.2d` | Page follower count + location split (are followers in SE Essex?) | Data | `[to be actioned]` |
| 15 | `SLIM-0.2e` | Meta Page-quality flags / GBP rejections; GBP duplicate-post volume (see 005.P-2) | Findings | `[to be actioned]` |
| 16 | `SLIM-0.3a` | Chatbot stats: total conversations, avg length, drop-off point, reached-form count, distress-topic count (no PII in report) | Aggregates | `[to be actioned]` |
| 17 | `SLIM-0.3b` | Top 10 questions asked; top 5 answered badly/evasively | Lists | `[to be actioned]` |
| 18 | `SLIM-0.4` | Review 30 recent posts: template repetition, 3-a-day same-town fatigue, artificial-looking AI images, audience reality | Honest assessment | `[to be actioned]` |
| 19 | `SLIM-0.5a` | List every public claim in post prompts, chatbot prompt, site (e.g. 48-hr offer, legal fees, 7 days, any condition) + whether a documented process backs it | Claims register | `[to be actioned]` |
| 20 | `SLIM-0.5b` | Check against CAP/ASA, CPUTR as amended by DMCC Act 2024, Meta standards, GBP policy, UK GDPR (chat logs), cash-buyer trade body codes | Compliance matrix | `[to be actioned]` |
| 21 | `SLIM-0.5c` | AI-generated "real street" imagery: disclosure and misleading-ness | Finding | `[to be actioned]` |
| 22 | `SLIM-0.6` | Data fixes list (Battelsbridgeâ†’Battlesbridge; verify "Rayleigh Weir"; hashtags 5â€“8â†’3â€“7; plus 005.P items) | Fix list | `[to be actioned]` |
| 23 | `SLIM-0.7` | Write `PHASE-0-DIAGNOSIS.md`: findings 0.1â€“0.6, top 5 likely causes with evidence + confidence (H/M/L), recommended fixes | **MILESTONE 0** | `[to be actioned]` |
| 24 | `GATE 0` | Gate report â†’ wait for "APPROVED"; Andrew sets targets | Approval | `[to be actioned]` |

**Phase 1: UK Property Market Research (READ-ONLY, CITED)**
| Order | Task ID | Description | Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 25 | `SLIM-1.1` | Source register, â‰¥40 sources (Official/Economic, Market data, Industry press, Auction/distressed, Local, Global): name, URL, data type, frequency, RSS/API/CSV, licence/terms checked | `SOURCE-REGISTER.md` | `[to be actioned]` |
| 26 | `SLIM-1.2` | Driver map: rates/mortgage cliff, affordability, inflation, tax, landlord exits, EPC/Renters' Rights, probate delays, divorce, possessions, fall-through rates, regional (London/Essex/East), global shocks. Each driver: what, data point, direction, how it creates a distressed seller | `MARKET-DRIVER-MAP.md` | `[to be actioned]` |
| 27 | `SLIM-1.3` | 9 seller segment profiles (broken chain, probate, divorce, arrears, unmortgageable, landlord exit, relocation/job loss, elderly/care fees, auction fall-through). Each cited or labelled "practitioner assumption - to be validated" | `SELLER-SEGMENTS.md` | `[to be actioned]` |
| 28 | `SLIM-1.4` | Trust & scam landscape + Trust Checklist (inside SELLER-SEGMENTS.md) | Checklist | `[to be actioned]` |
| 29 | `GATE 1` | Gate report â†’ "APPROVED" | Approval | `[to be actioned]` |

**Phase 2: Hive Mind**
| Order | Task ID | Description | Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| 30 | `SLIM-2.1` | Design doc: collections `knowledge`, `experiments`, `marketSnapshot` (+history), `sellerInsights`, `playbook`, `hashtags`, `compliance/rules`, `moduleRegistry`, `auditLog`, with fields as per brief | `HIVE-MIND-DESIGN.md` | `[to be actioned]` |
| 31 | `GATE 2A` | Design approval | Approval | `[to be actioned]` |
| 32 | `SLIM-2.2` | Shared library `functions/hive/hiveClient.js`: `readKnowledge`, `proposeKnowledge`, `validateKnowledge`, `retireKnowledge`, `logRun`. Sole access path | Code + tests | `[to be actioned]` |
| 33 | `SLIM-2.3` | Learning rules: candidateâ†’validated (evidence / 2 independent points / Andrew); expiry; contradiction flagging (no silent overwrite); size-limited Daily Hive Digest | Code + tests | `[to be actioned]` |
| 34 | `SLIM-2.4` | Security: Firestore rules deny client access; dedicated service account; PII filter; retention policy; backups | Rules + doc | `[to be actioned]` |
| 35 | `SLIM-2.5` | Migrate by copy/reference: `socialStrategy/latest`, `marketUpdates/latest`, `supportServices`, `imageLibrary` metadata. Legacy kept until Gate 5 | Migration script | `[to be actioned]` |
| 36 | `SLIM-2.6` | Deploy to staging/namespaced collections; automated tests: A-write visible to B, PII rejected, contradictions flagged, expiry retires | **MILESTONE 2** | `[to be actioned]` |
| 37 | `GATE 2B` | Test results â†’ "APPROVED" | Approval | `[to be actioned]` |

**Phase 3: AI SLIM Fleet** *(each module: separate function, one purpose, one schedule, hiveClient only, `logRun()`, kill-switch `moduleRegistry/{slimId}.enabled`, dry-run mode; report tests after each before starting the next)*
| Order | Task ID | Module | Schedule | Status |
| :--- | :--- | :--- | :--- | :--- |
| 38 | `SLIM-3.1` | SLIM-MKT Market Intelligence (extends `dailyMarketAnalysis`) | 05:30 daily + BoE/ONS release days | `[to be actioned]` |
| 39 | `SLIM-3.2` | SLIM-PSY Seller Psychology & Empathy | 02:00 daily | `[to be actioned]` |
| 40 | `SLIM-3.3` | SLIM-HASH Hashtag Intelligence (3â€“7, â‰¥1 local, â‰¥1 topical, â‰¥1 brand, no consecutive identical sets, code-enforced) | 04:00 + pre-publish | `[to be actioned]` |
| 41 | `SLIM-3.4` | SLIM-COPY Copywriter (2â€“3 variants per slot) | Before each slot | `[to be actioned]` |
| 42 | `SLIM-3.5` | SLIM-VIS Visual Producer (HL-VF, dedupe, real-photo option, text cards, AI labelling) | Before each slot | `[to be actioned]` |
| 43 | `SLIM-3.6` | SLIM-COMP Compliance Sentinel (blocks pre-publish; upgrades `socialMediaSentinel`) | Pre-publish + 4-hourly | `[to be actioned]` |
| 44 | `SLIM-3.7` | SLIM-PERF Performance & Attribution (Meta + GBP + GA4; experiments; upgrades `socialIntelligenceAgent`) | 01:00 daily | `[to be actioned]` |
| 45 | `SLIM-3.8` | SLIM-ANDY chatbot joins fleet (see 3.12) | Real time + nightly export | `[to be actioned]` |
| 46 | `SLIM-3.9` | SLIM-FUNNEL Lead Funnel & Conversion (instant lead/breakage alerts) | Hourly | `[to be actioned]` |
| 47 | `SLIM-3.10` | SLIM-LOCAL Local Presence (GBP Ã—2, review responses, local hooks) | Daily | `[to be actioned]` |
| 48 | `SLIM-3.11` | SLIM-ORCH Orchestrator "Queen" (health, contradictions, Daily Digest, weekly fleet report, kill-switches) | 06:00 daily + weekly | `[to be actioned]` |
| 49 | `SLIM-3.12` | Andy upgrade: (a) Hive context, (b) segment recognition, (c) honest process/cost answers from compliance rules, (d) "talk to a human", (e) independent legal advice / compare options note, (f) anonymised end-of-chat summary, (g) no PII to Hive. Persona, AI-disclosure, safeguarding and Sentinel all kept | Real time | `[to be actioned]` |
| 50 | `SLIM-3.13` | Fleet health dashboard section in admin | UI | `[to be actioned]` |
| 51 | `SLIM-3.14` | All 11 in staging dry-run, tests passing, registered in `moduleRegistry` | **MILESTONE 3** | `[to be actioned]` |
| 52 | `GATE 3` | Per-module results + samples â†’ "APPROVED" | Approval | `[to be actioned]` |

**Phase 4: Social posts redesigned for real leads**
| Order | Task ID | Description | Status |
| :--- | :--- | :--- | :--- |
| 53 | `SLIM-4.1` | Format library (empathy/composite story, myth vs fact, local update, probate/divorce/arrears explainers, 3-step how-it-works with real timings, question posts, Reel scripts), each tagged by segment + goal | `[to be actioned]` |
| 54 | `SLIM-4.2` | Help-first rule: â‰¥2 of every 3 posts give value; â‰¤1 in 3 direct "get an offer" | `[to be actioned]` |
| 55 | `SLIM-4.3` | Multiple CTAs (form, WhatsApp, phone, message); check Meta CTA policy; test conversion | `[to be actioned]` |
| 56 | `SLIM-4.4` | Rhythm experiment: times, 1/2/3 posts a day, daily rotation vs 2-day town focus; evidence-based schedule | `[to be actioned]` |
| 57 | `SLIM-4.5` | Hashtags 3â€“7 enforced in prompts, validators, UI; remove "5â€“8" everywhere; unit test | `[to be actioned]` |
| 58 | `SLIM-4.6` | First-party short links (`cash4houses.co.uk/go/xxxx`) if feasible; UTM by platform/post/segment/town; server-side click log; end-to-end GA4 test lead | `[to be actioned]` |
| 59 | `SLIM-4.7` | Options report (research only): Google Ads, Meta lead ads (special-category rules), community groups, local referral partners, reviews, townÃ—segment landing pages, with cost/effort/compliance risk | `[to be actioned]` |
| 60 | `SLIM-4.8` | 14 days of staged (unpublished) samples across formats/towns/segments, all passing SLIM-COMP + hashtags 3â€“7, each with an evidence note | `[to be actioned]` |
| 61 | `GATE 4` | Andrew personally reviews samples â†’ "APPROVED" | `[to be actioned]` |

**Phase 5: Controlled rollout & measurement**
| Order | Task ID | Description | Status |
| :--- | :--- | :--- | :--- |
| 62 | `SLIM-5.1a` | Week 1 live: SLIM-HASH + SLIM-COMP + SLIM-FUNNEL â†’ approval | `[to be actioned]` |
| 63 | `SLIM-5.1b` | Week 2: + SLIM-COPY / SLIM-VIS in A/B alongside legacy â†’ approval | `[to be actioned]` |
| 64 | `SLIM-5.1c` | Week 3: + SLIM-MKT, SLIM-PSY, SLIM-PERF â†’ approval | `[to be actioned]` |
| 65 | `SLIM-5.1d` | Week 4: + SLIM-ANDY upgrade + SLIM-ORCH â†’ approval | `[to be actioned]` |
| 66 | `SLIM-5.2` | Dashboard: module health, Hive entries, experiments, attribution, per-module kill-switch, approve/reject knowledge | `[to be actioned]` |
| 67 | `SLIM-5.3` | Weekly one-page plain-English report (extends `weeklyPerformanceDigest`) | `[to be actioned]` |
| 68 | `SLIM-5.4` | Retire legacy collections/functions only after 30 stable days + explicit approval | `[to be actioned]` |
| 69 | `MILESTONE 5` | 4 weeks live, funnel verified, weekly reports, no open compliance flags | `[to be actioned]` |

#### 005.6 Definition of Done
- [ ] Phase 0 delivered; every top-5 cause fixed or consciously accepted by Andrew
- [ ] Hive Mind live, tested, used by all 11 modules including Andy
- [ ] Every published post has 3â€“7 hashtags, enforced in code
- [ ] Every public claim substantiated and logged in `compliance/rules`
- [ ] â‰¥1 end-to-end test lead traced: post click â†’ Firestore â†’ Andrew's notification
- [ ] Weekly reporting running
- [ ] All changes in CHANGELOG with rollback steps

#### 005.7 Gate Report Format (mandatory at every GATE)
```
GATE REPORT: [Phase/Task]
1. What I did (bullets, with file names)
2. What I verified, and how (evidence)
3. What I could NOT verify (UNVERIFIED items)
4. Problems, risks or conflicts found
5. Deviations from this brief (and why)
6. Proposed next step
7. Awaiting: "APPROVED" from Andrew
```

#### 005.P Preliminary Observations (seen while cataloguing; verified in code, impact UNVERIFIED; feed into Phase 0)
| ID | Observation | Evidence | Feeds |
| :--- | :--- | :--- | :--- |
| P-1 | **CONFIRMED 05/10/2026 10:10. Live public chatbot and reviews widget are broken (HTTP 404).** `firebase functions:list --project c4h-wesbite` shows all 44 functions in `europe-west4` and **none** in us-central1. A read-only GET to `https://chatbotandy-vjikc6hdhq-uc.a.run.app` and `https://getgooglereviews-vjikc6hdhq-uc.a.run.app` returns **404 Not Found**. The website (`main.js` L46, L275), admin tools and the GMB OAuth redirect still call these old us-central1 URLs. **Cause:** the Phase 001 region move (my change) did not update the frontend endpoint URLs. **Scope:** this has broken things since the Phase 001 deploy; it does NOT explain the six months of zero leads. **Fix:** Exception approved and applied. Replaced URLs with `https://europe-west4-c4h-wesbite.cloudfunctions.net/...` and ran `npm run build`. | `main.js` L46 (chatbot), L275 (reviews); `social.js` L14â€“15; `admin.js` L478, 533â€“534, 561, 614, 700; `dashboard.js` L329; `functions/index.js` L1837, L1877 (GMB OAuth redirect) | 0.1g, 0.3 |
| P-2 | Each GBP location may receive up to 6 posts a day, including duplicates (`gbpLunchPost` / `gbpEveningPost` re-post social posts that were already sent to GBP). | `functions/index.js` L438, L1063â€“1107 | 0.2e, 0.4 |
| P-3 | `chatbotAndy` uses `req.body.userId \|\| user.uid`, but `user` is not defined in that scope. Any request without `userId` would throw, return the "technical hiccup" message and log nothing. The public widget always sends `userId`. | `functions/index.js` L1213 | 0.3 |
| P-4 | Inconsistent social handles. JSON-LD `sameAs` uses `facebook.com/cash4houses` and `instagram.com/cash4houses`. The footer uses `instagram.com/cash4houses.co.uk/`. The email signature uses `instagram.com/cash.4houses/`. The JSON-LD Facebook link was **not** updated in Phase 002 because it did not match the search string. | `index.html` L59â€“61, L331; `functions/index.js` L57â€“60 | 0.6 |
| P-5 | `socialMediaSentinel` only audits after posting; it does not block publication. | `functions/index.js` L1547â€“1553 | 0.5, SLIM-3.6 |
| P-6 | The social prompt includes the line "Sellers in 2026 prioritize certainty and speed", which is an unsourced market claim. | `functions/index.js` L398 | 0.5a |
| P-7 | The JSON-LD address (7 High Street, Westcliff SS0 7NP) differs from the footer address (377 Southchurch Road SS1 2PQ). Which is canonical for NAP consistency is UNVERIFIED. | `index.html` L32â€“38, L327 | 0.6 |

#### 005.Q Open Questions for Andrew (blocking `SLIM-S.3` / Phase 0)
1. **Data access for read-only Phase 0:** Phase 0 needs Firestore reads (`socialPosts`, `communications`, `leads`), Cloud Function logs (180 days), Meta Insights, GBP and GA4. How do I get read access? Options: (a) you run `firebase login` / `gcloud auth login` on this machine and I query read-only via CLI; (b) you export the data/screenshots and I analyse them; (c) a mix. **Recommendation: (a)** for Firestore and logs, plus (b) for Meta/GA4/GBP dashboards.
2. **Test lead for 0.1a/b:** may I submit one clearly labelled test enquiry ("TEST â€” SLIM Phase 0") through the live form? That would trigger a real notification to you.
3. **Staging for Phase 2+:** is there a separate Firebase project, or should I use namespaced test collections in `c4h-wesbite`? (Not needed until GATE 2A.)
4. **EMERGENCY EXCEPTION REQUEST (added 05/10 10:10):** may I fix P-1 now, outside the R6 read-only rule? The fix: point the frontend URLs at the live `europe-west4` endpoints, with each new URL verified before the swap, then rebuild, log it in CHANGELOG with rollback steps, and leave deployment to you. Without this, the public chatbot stays offline throughout Phase 0. **Recommendation: approve.**
5. **gcloud for Firestore and log reads:** `gcloud` is not installed. Options: (a) install the Google Cloud SDK (`winget install Google.CloudSDK`), then `gcloud auth login` and `gcloud auth application-default login`; (b) export the required collections and logs from the Firebase/GCP console for me; (c) a service-account key (not recommended because of the key-handling risk). **Recommendation: (a).**

#### 005.C Corrections Log (Registry accuracy)
| Date | Correction |
| :--- | :--- |
| 05/10/2026 | Firebase Project ID corrected from `c4h-website-68fa8` (unverified, wrong) to `c4h-wesbite` (verified `.firebaserc`). |
| 05/10/2026 | Schedule matrix rebuilt from code; added `emailQueueAgent`, `portalSentinel`, `generateDailySpotlight`, `seoSubmissionAgent`. |
| 05/10/2026 | Removed unverified "28 Cloud Functions" figure. Verified count: 44 `exports.*` in code = 44 live functions. An interim "47" figure was a miscount: it included 3 hits in the scratch files fix.js/fix2.js. |
