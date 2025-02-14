export default function initFooterAccordion() {
    const isMobileView = () => window.innerWidth <= 768;

    function setupAccordions() {
        const accordionSections = document.querySelectorAll('.footer-section');
        
        // Set initial states
        accordionSections.forEach(section => {
            const trigger = section.querySelector('.accordion-trigger');
            const content = section.querySelector('.accordion-content');
            
            if (!trigger || !content) return;

            // Set initial state based on viewport
            if (isMobileView()) {
                trigger.setAttribute('aria-expanded', 'false');
                content.classList.remove('is-open');
            } else {
                trigger.setAttribute('aria-expanded', 'true');
                content.classList.add('is-open');
            }

            // Remove old event listener by cloning and replacing
            const newTrigger = trigger.cloneNode(true);
            trigger.parentNode.replaceChild(newTrigger, trigger);

            // Add new click handler
            newTrigger.addEventListener('click', () => {
                if (!isMobileView()) return;

                const isExpanded = newTrigger.getAttribute('aria-expanded') === 'true';

                // Close all other sections
                accordionSections.forEach(otherSection => {
                    if (otherSection !== section) {
                        const otherTrigger = otherSection.querySelector('.accordion-trigger');
                        const otherContent = otherSection.querySelector('.accordion-content');
                        if (otherTrigger && otherContent) {
                            otherTrigger.setAttribute('aria-expanded', 'false');
                            otherContent.classList.remove('is-open');
                        }
                    }
                });

                // Toggle current section
                newTrigger.setAttribute('aria-expanded', !isExpanded);
                content.classList.toggle('is-open');
            });
        });
    }

    // Initial setup
    setupAccordions();

    // Handle resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setupAccordions, 250);
    });
}
