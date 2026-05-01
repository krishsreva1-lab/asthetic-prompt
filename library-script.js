const dataSource = 'data.json';
let allLibraryPrompts = [];

function buildCard(tag, image, prompt) {
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

async function loadLibrary() {
    const grid = document.getElementById('library-grid');
    try {
        const response = await fetch(dataSource);
        allLibraryPrompts = await response.json();
        
        grid.innerHTML = '';
        allLibraryPrompts.forEach(item => {
            // This shows EVERY prompt (Featured AND Normal)
            grid.insertAdjacentHTML('beforeend', buildCard(item.tag, item.image, item.prompt));
        });
    } catch (err) {
        grid.innerHTML = '<p style="color:white;text-align:center;">No prompts found in library.</p>';
    }
}

loadLibrary();
