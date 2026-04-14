export function initAnalogueClock(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="clock-component">
            <div class="analogue-clock">
                <div class="hand hour-hand"></div>
                <div class="hand minute-hand"></div>
                <div class="hand second-hand"></div>
                <div class="clock-center"></div>
            </div>
            <div class="digital-date" id="clock-date"></div>
            <div class="digital-time" id="clock-time"></div>
        </div>
    `;

    function updateClock() {
        const now = new Date();
        
        // Force UK Time (Europe/London)
        const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
        
        const seconds = ukTime.getSeconds();
        const minutes = ukTime.getMinutes();
        const hours = ukTime.getHours();

        const secondsDegrees = ((seconds / 60) * 360) + 90;
        const minsDegrees = ((minutes / 60) * 360) + ((seconds/60)*6) + 90;
        const hourDegrees = ((hours / 12) * 360) + ((minutes/60)*30) + 90;

        container.querySelector('.second-hand').style.transform = `rotate(${secondsDegrees}deg)`;
        container.querySelector('.minute-hand').style.transform = `rotate(${minsDegrees}deg)`;
        container.querySelector('.hour-hand').style.transform = `rotate(${hourDegrees}deg)`;

        // Update Date Display (dd/mm/yyyy)
        const dateStr = ukTime.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Update Time Display (hh:mm)
        const timeStr = ukTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('clock-date').textContent = dateStr;
        document.getElementById('clock-time').textContent = timeStr;
    }

    setInterval(updateClock, 1000);
    updateClock();
}
