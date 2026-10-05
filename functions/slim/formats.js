/**
 * Phase 4 Format Library & Rules (SLIM-4.1, SLIM-4.2, SLIM-4.3)
 */

const FORMATS = [
    {
        id: "empathy_story",
        type: "value",
        tags: ["arrears", "probate", "divorce"],
        template: "We recently helped a family in {town} who felt completely overwhelmed by {painPoint}. By guaranteeing a timeline, we removed the stress so they could focus on their next chapter. You don't have to navigate this alone."
    },
    {
        id: "myth_vs_fact",
        type: "value",
        tags: ["general", "arrears"],
        template: "Myth: Cash buyers always drop the price at the last minute.\nFact: We guarantee our offer in writing within 24 hours of viewing, and cover your legal fees up to £1,500. Absolute certainty, no surprises."
    },
    {
        id: "local_update",
        type: "value",
        tags: ["general"],
        template: "The {town} property market is shifting. With recent interest rate changes, traditional sales are taking on average 14 weeks. If you need certainty, a direct cash sale bypasses the chain completely."
    },
    {
        id: "how_it_works",
        type: "value",
        tags: ["general"],
        template: "How selling to us works in 3 simple steps:\n1. We value your home (No obligation)\n2. You receive a guaranteed cash offer in 24h\n3. We complete in 7 days (or on your timeline), covering £1,500 in legal fees."
    },
    {
        id: "direct_offer",
        type: "offer",
        tags: ["general"],
        template: "Need to sell your {town} property quickly? Get a guaranteed cash offer within 24 hours. No estate agent fees, no chain, and your legal fees paid."
    }
];

const CTAs = [
    { type: "form", text: "Get your free cash offer today: cash4houses.co.uk/go/offer" },
    { type: "whatsapp", text: "Message us securely on WhatsApp: cash4houses.co.uk/go/wa" },
    { type: "phone", text: "Call our team directly on 01268 937006 for a confidential chat." }
];

/**
 * SLIM-4.2 Help-First Rule: >=2 of 3 posts give value; <=1 in 3 direct offer.
 * Determines the next post type based on recent history.
 */
function determineNextPostType(recentPostTypes) {
    // recentPostTypes: array of last 3 post types (e.g. ['value', 'offer', 'value'])
    const offerCount = recentPostTypes.filter(t => t === 'offer').length;
    if (offerCount >= 1) {
        return 'value'; // Force value if we've had an offer recently
    }
    // Otherwise 33% chance to be an offer
    return Math.random() > 0.66 ? 'offer' : 'value';
}

function selectFormat(type, segment = "general") {
    const validFormats = FORMATS.filter(f => f.type === type && (f.tags.includes(segment) || f.tags.includes("general")));
    return validFormats[Math.floor(Math.random() * validFormats.length)];
}

function getCta(type = "form") {
    return CTAs.find(c => c.type === type).text;
}

module.exports = { FORMATS, CTAs, determineNextPostType, selectFormat, getCta };
