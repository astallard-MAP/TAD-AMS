const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const admin = {
    get apps() { return getApps(); },
    initializeApp: initializeApp,
    firestore: () => getFirestore(),
    storage: () => getStorage()
};
admin.firestore.FieldValue = FieldValue;
admin.firestore.Timestamp = Timestamp;
const cryptoUtils = require('./cryptoUtils');

// Ensure firebase-admin is initialized before using
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * PII Filter to sanitize strings before saving to sellerInsights.
 * Replaces potential phone numbers and email addresses with [REDACTED].
 */
function filterPII(text) {
    if (!text) return text;
    // Basic regex for UK phones and emails
    let sanitized = text.replace(/(?:(?:\+44\s?|0)(?:\d\s?){9,10})/g, '[PHONE REDACTED]');
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
    return sanitized;
}

const HiveClient = {
    /**
     * Reads validated knowledge facts for a given category.
     */
    async readKnowledge(category) {
        const snapshot = await db.collection('knowledge')
            .where('category', '==', category)
            .where('status', '==', 'validated')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Proposes a new knowledge fact. Checks for contradictions against existing validated facts.
     */
    async proposeKnowledge(category, fact, evidence, moduleId) {
        // Check for direct contradiction by finding existing validated facts in the same category
        // (A true semantic contradiction check would require an LLM pass, but we flag by category/overlap for manual review)
        const existingDocs = await this.readKnowledge(category);
        let status = 'candidate';
        let flags = [];

        if (existingDocs.length > 0) {
            // If there's already knowledge in this category, flag it to prevent silent overwrite
            status = 'conflict_flagged';
            flags.push(`Potential contradiction with ${existingDocs.length} existing validated facts in category '${category}'.`);
        }

        const data = {
            category,
            fact,
            evidence,
            status,
            addedBy: moduleId,
            proposedAt: admin.firestore.FieldValue.serverTimestamp(),
            flags
        };

        const docRef = await db.collection('knowledge').add(data);
        await this.logRun(moduleId, 'proposeKnowledge', { factId: docRef.id, category, status });
        return docRef.id;
    },

    /**
     * Validates a candidate fact. 
     * Requirement: Needs either Admin override, or evidence of 2 independent verifications.
     */
    async validateKnowledge(factId, validatedBy, forceAdmin = false) {
        const docRef = db.collection('knowledge').doc(factId);
        const doc = await docRef.get();
        
        if (!doc.exists) throw new Error("Fact not found");
        
        const data = doc.data();
        if (data.status === 'validated') return true; // Already validated

        // Example logic: if forceAdmin is true, validate immediately
        if (forceAdmin) {
            await docRef.update({ 
                status: 'validated',
                validatedAt: admin.firestore.FieldValue.serverTimestamp(),
                validatedBy: [validatedBy]
            });
            return true;
        }

        // Otherwise, add this validator. If we hit 2, promote.
        let validators = data.validatedBy || [];
        if (!validators.includes(validatedBy)) {
            validators.push(validatedBy);
        }

        if (validators.length >= 2) {
            await docRef.update({ 
                status: 'validated',
                validatedAt: admin.firestore.FieldValue.serverTimestamp(),
                validatedBy: validators
            });
        } else {
            await docRef.update({ validatedBy: validators });
        }
        return true;
    },

    /**
     * Retires a knowledge fact (e.g., when a policy changes or it expires).
     */
    async retireKnowledge(factId, retiredBy, reason) {
        await db.collection('knowledge').doc(factId).update({
            status: 'retired',
            retiredAt: admin.firestore.FieldValue.serverTimestamp(),
            retiredBy,
            retireReason: reason
        });
    },

    /**
     * Adds an insight to sellerInsights, filtering PII first and applying application-layer encryption (SLIM-6.1).
     */
    async addSellerInsight(segment, painPoint, objection, successfulCounter, confidenceScore, moduleId) {
        // First layer of defense: Redaction
        const cleanPainPoint = filterPII(painPoint);
        const cleanObjection = filterPII(objection);
        
        // Second layer: Encryption at rest
        const data = {
            segment,
            painPoint: cryptoUtils.encrypt(cleanPainPoint),
            objection: cryptoUtils.encrypt(cleanObjection),
            successfulCounter: cryptoUtils.encrypt(filterPII(successfulCounter)),
            confidenceScore,
            addedBy: moduleId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('sellerInsights').add(data);
        await this.logRun(moduleId, 'addSellerInsight', { segment, confidenceScore });
    },

    /**
     * Fetches the daily Hive Digest (size-limited to prevent massive payload costs).
     * Retrieves the last 24 hours of validated knowledge, new insights, and active playbooks.
     */
    async getDailyDigest() {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [knowledgeSnap, insightSnap, playbookSnap] = await Promise.all([
            db.collection('knowledge')
                .where('status', '==', 'validated')
                .where('validatedAt', '>=', yesterday)
                .limit(20).get(),
            db.collection('sellerInsights')
                .where('createdAt', '>=', yesterday)
                .limit(20).get(),
            db.collection('playbook')
                .where('priority', '>=', 5)
                .limit(10).get()
        ]);

        return {
            newKnowledge: knowledgeSnap.docs.map(d => d.data().fact),
            newInsights: insightSnap.docs.map(d => d.data()),
            activePlaybooks: playbookSnap.docs.map(d => d.data().rule)
        };
    },

    /**
     * Logs fleet module execution.
     */
    async logRun(moduleId, action, details = {}, severity = 'info') {
        const logData = {
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            moduleId,
            action,
            details,
            severity
        };
        await db.collection('auditLog').add(logData);
    }
};

module.exports = HiveClient;
