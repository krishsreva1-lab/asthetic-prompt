const dataSource = 'data.json'; 
let allPrompts = [];

function buildCard(tag, image, prompt) {
    // Escapes quotes to handle long detailed prompts without breaking HTML
    const safePrompt = prompt.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    return `
        <div class="card glass-card" data-tag="${tag}">
            <div class="image-wrapper">
                <img src="${image}" alt="Prompt">
                <div class="tag glass-tag">${tag}</div>
            </div>
            <div class="card-content">
                <button class="liquid-glass-btn" onclick="unlock('${safePrompt}','${image}')">
                    Unlock Prompt
                </button>
            </div>
        </div>`;
}

function unlock(p, i) {
    localStorage.setItem('tempPrompt', p);
    localStorage.setItem('tempImage', i);
    window.location.href = 'unlock-page.html';
}

async function loadPrompts() {
    const grid = document.getElementById('main-grid');
    try {
        const response = await fetch(dataSource);
        allPrompts = await response.json();
        
        grid.innerHTML = '';
        allPrompts.forEach(item => {
            // Uses lowercase to match your Python App logic
            if (item.status === 'featured') {
                grid.insertAdjacentHTML('beforeend', buildCard(item.tag, item.image, item.prompt));
            }
        });
    } catch (err) {
        grid.innerHTML = '<p style="color:white;text-align:center;grid-column:1/-1;">No data found. Use your Python Admin Panel to add prompts.</p>';
    }
}

// Search Logic
const searchInput = document.querySelector('.search-container input');
const searchBtn   = document.querySelector('.search-btn');

if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.toLowerCase().trim();
        const grid  = document.getElementById('main-grid');
        grid.innerHTML = '';
        let count = 0;
        allPrompts.forEach(item => {
            if (item.status !== 'featured') return;
            if (query && !item.tag.toLowerCase().includes(query) && !item.prompt.toLowerCase().includes(query)) return;
            grid.insertAdjacentHTML('beforeend', buildCard(item.tag, item.image, item.prompt));
            count++;
        });
    });
}

loadPrompts();
