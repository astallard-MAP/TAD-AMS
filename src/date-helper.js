/**
 * Forensic Date Orchestration for the Cash 4 Houses Portal.
 * Enforces character-perfect EN-UK date formatting with ordinals.
 * Example: Tuesday 7th of April 2026
 */

export function initLiveDate(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    function getOrdinal(d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }

    function update() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayName = days[now.getDay()];
        const dayDate = now.getDate();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();

        el.innerText = `${dayName} ${dayDate}${getOrdinal(dayDate)} of ${monthName} ${year}`;
    }

    update();
    // Refresh at midnight or every hour to keep it current
    setInterval(update, 3600000); 
}
