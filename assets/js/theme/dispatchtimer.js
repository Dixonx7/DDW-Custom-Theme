class DispatchTimer {
    constructor() {
        this.holidays = [
            new Date(2025, 3, 18), // Good Friday
            new Date(2025, 3, 21), // Easter Monday
            new Date(2025, 4, 5),  // Early May Bank Holiday
            new Date(2025, 4, 26), // Spring Bank Holiday
            new Date(2025, 7, 25), // Summer Bank Holiday
            new Date(2025, 11, 24), // Christmas Eve
            new Date(2025, 11, 25), // Christmas Day
            new Date(2025, 11, 26), // Boxing Day
            new Date(2025, 11, 31), // New Year's Eve
            new Date(2026, 0, 1),   // New Year's Day
            new Date(2026, 3, 3),   // Good Friday
            new Date(2026, 3, 6),   // Easter Monday
            new Date(2026, 4, 4),   // Early May Bank Holiday
            new Date(2026, 4, 25),  // Spring Bank Holiday
            new Date(2026, 7, 31),  // Summer Bank Holiday
            new Date(2026, 11, 24), // Christmas Eve
            new Date(2026, 11, 25), // Christmas Day
            new Date(2026, 11, 28), // Boxing Day (substitute day)
        ];
    }

    isHoliday(date) {
        return this.holidays.some(holiday =>
            date.getFullYear() === holiday.getFullYear() &&
            date.getMonth() === holiday.getMonth() &&
            date.getDate() === holiday.getDate()
        );
    }

    isBusinessDay(date) {
        const dayOfWeek = date.getUTCDay();
        return dayOfWeek > 0 && dayOfWeek < 6;
    }

    nextBusinessDay(date) {
        let nextDay = new Date(date);
        nextDay.setUTCDate(date.getUTCDate() + 1);

        while (!this.isBusinessDay(nextDay) || this.isHoliday(nextDay)) {
            nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        }

        return nextDay;
    }

    countdownToDispatch() {
        const now = new Date();
        let dispatchDate;

        if (now.getHours() < 14 && this.isBusinessDay(now) && !this.isHoliday(now)) {
            dispatchDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0);
        } else {
            dispatchDate = this.nextBusinessDay(now);
            dispatchDate.setHours(14, 0, 0, 0);
        }

        const timeUntilDispatch = dispatchDate.getTime() - now.getTime();
        const hours = Math.floor((timeUntilDispatch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilDispatch % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilDispatch % (1000 * 60)) / 1000);

        return `${hours}h ${minutes}m ${seconds}s`.trim();
    }

    ordinalSuffix(day) {
        const j = day % 10, k = day % 100;
        if (j === 1 && k !== 11) return day + "st";
        if (j === 2 && k !== 12) return day + "nd";
        if (j === 3 && k !== 13) return day + "rd";
        return day + "th";
    }

    setOrderArrivalDate() {
        const now = new Date();
        let dispatchDate = (now.getHours() < 14 && this.isBusinessDay(now) && !this.isHoliday(now)) ? now : this.nextBusinessDay(now);

        const formattedDate = dispatchDate.toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short' });
        const finalDispatchDateString = `${formattedDate.split(' ')[0]} ${this.ordinalSuffix(parseInt(formattedDate.split(' ')[1]))} ${formattedDate.split(' ')[2]}`;

        const dispatchDateElement = document.getElementById("dispatch-date");
        const deliveryTextElements = document.querySelectorAll(".delivery-text");

        if (dispatchDateElement) dispatchDateElement.textContent = finalDispatchDateString;
        deliveryTextElements.forEach(el => el.textContent = `Order within the next ${this.countdownToDispatch()} to have your order dispatched by ${finalDispatchDateString}`);
    }

    startTimer() {
        const init = () => {
            console.log('DispatchTimer initializing...'); // Debug log
            const expressTimerElement = document.querySelector('.express-timer');
            const expressTimerSpan = document.getElementById('express-timer');
            const dispatchDateElement = document.getElementById('dispatch-date');
            const standardDeliveryElement = document.getElementById('standard-delivery-estimate');
            const expressDeliveryElement = document.getElementById('express-delivery-estimate');
            

            if (!expressTimerElement || !expressTimerSpan || !dispatchDateElement) {
                console.log('Required elements not found, retrying...'); // Debug log
                setTimeout(init, 500); // Retry after 500ms
                return;
            }

            console.log('Elements found, starting timer...'); // Debug log

            expressTimerElement.style.display = 'block';

            const updateTimer = () => {
                const countdownText = this.countdownToDispatch();
                expressTimerSpan.textContent = countdownText;
                
                // Calculate delivery dates
                const now = new Date();
                let dispatchDate = (now.getHours() < 14 && this.isBusinessDay(now) && !this.isHoliday(now)) 
                    ? now 
                    : this.nextBusinessDay(now);

                // Format dispatch date
                const formattedDate = dispatchDate.toLocaleDateString("en-GB", { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short'
                });
                const finalDispatchDateString = formattedDate; // This will give "Thu, 6 Feb" format
                
                dispatchDateElement.textContent = finalDispatchDateString;

                // Calculate standard delivery (3-4 working days)
                let standardDate = new Date(dispatchDate);
                standardDate.setDate(standardDate.getDate() + 3);
                let standardEndDate = new Date(dispatchDate);
                standardEndDate.setDate(standardEndDate.getDate() + 4);

                // Calculate express delivery (next working day)
                let expressDate = this.nextBusinessDay(dispatchDate);

                // Update delivery estimates
                if (standardDeliveryElement) {
                    standardDeliveryElement.textContent = `${standardDate.toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short' })} - ${standardEndDate.toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short' })}`;
                }
                
                if (expressDeliveryElement) {
                    expressDeliveryElement.textContent = expressDate.toLocaleDateString("en-GB", { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                    });
                }

                // Add availability text update
                const availabilityElement = document.getElementById('availability-text');
                if (availabilityElement && availabilityElement.parentElement.textContent.includes('Available For Dispatch')) {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    let availabilityText = ' - ';
                    if (dispatchDate.getDate() === today.getDate()) {
                        availabilityText += 'Today';
                    } else if (dispatchDate.getDate() === tomorrow.getDate()) {
                        availabilityText += 'Tomorrow';
                    } else {
                        availabilityText += dispatchDate.toLocaleDateString("en-GB", { weekday: 'long' });
                    }
                    availabilityElement.textContent = availabilityText;
                }
            };

            updateTimer();
            setInterval(updateTimer, 1000);
        };

        // Start initialization
        init();
    }
}

// Export a singleton instance
const dispatchTimer = new DispatchTimer();
export default dispatchTimer;
