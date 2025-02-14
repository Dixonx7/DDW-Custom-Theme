export default function initBrandNavigation() {
    function getFirstChar(brandName) {
        if (!brandName || typeof brandName !== 'string') return '';
        const firstChar = brandName.trim().charAt(0).toUpperCase();
        return /[0-9]/.test(firstChar) ? '#' : firstChar;
    }

    function createAlphabetButtons() {
        const brandItems = document.querySelectorAll('.brand-items li a');
        if (!brandItems.length) return [];

        // Get unique first characters including numbers as '#'
        const letters = new Set(['All', '#']);
        brandItems.forEach(item => {
            const char = getFirstChar(item.textContent);
            if (char && /[A-Z]/.test(char)) {
                letters.add(char);
            }
        });

        // Convert to array and sort with '#' after 'All' and before 'A'
        return Array.from(letters)
            .sort((a, b) => {
                if (a === 'All') return -1;
                if (b === 'All') return 1;
                if (a === '#') return -1;
                if (b === '#') return 1;
                return a.localeCompare(b);
            })
            .map(letter => ({
                letter,
                html: `<button class="alphabet-letter ${letter === 'All' ? 'active' : ''}" 
                              data-letter="${letter}">${letter}</button>`
            }));
    }

    function filterBrands(selected) {
        const brands = document.querySelectorAll('.brand-items li');
        brands.forEach(brand => {
            const link = brand.querySelector('a');
            if (!link) return;

            const firstChar = getFirstChar(link.textContent);
            brand.style.display = (
                selected === 'All' || 
                (selected === '#' && /[0-9]/.test(firstChar)) ||
                firstChar === selected
            ) ? '' : 'none';
        });
    }
    function filterBrands(letter) {
        const brands = document.querySelectorAll('.brand-items li');
        brands.forEach(brand => {
            const link = brand.querySelector('a');
            if (!link) return;

            const brandLetter = getFirstChar(link.textContent);
            brand.style.display = (letter === 'All' || brandLetter === letter) ? '' : 'none';
        });
    }

    function init() {
        const container = document.querySelector('.brands-alphabet');
        if (!container) return;

        // Create and insert buttons
        const buttons = createAlphabetButtons();
        if (!buttons.length) return;

        container.innerHTML = buttons.map(b => b.html).join('');

        // Add click handlers
        container.addEventListener('click', (e) => {
            const button = e.target.closest('.alphabet-letter');
            if (!button) return;

            // Update active state
            container.querySelectorAll('.alphabet-letter').forEach(btn => 
                btn.classList.remove('active')
            );
            button.classList.add('active');

            // Filter brands
            filterBrands(button.dataset.letter);
        });

        // Initial filter
        filterBrands('All');
    }

    // Initialize on page load and when brands tab is clicked
    init();

    // Also initialize when brands tab is clicked
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-tab="brands"]')) {
            setTimeout(init, 100);
        }
    });
}
