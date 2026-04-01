// Item Database
const items = {
    Common: [
        { name: 'Rusty Blade', icon: '🗡️' },
        { name: 'Old Boots', icon: '🥾' },
        { name: 'Pebble', icon: '🪨' },
        { name: 'Wooden Shield', icon: '🛡️' },
        { name: 'Leather Scrap', icon: '📜' }
    ],
    Rare: [
        { name: 'Steel Sword', icon: '⚔️' },
        { name: 'Iron Helmet', icon: '🪖' },
        { name: 'Sapphire Ring', icon: '💍' },
        { name: 'Healing Potion', icon: '🧪' },
        { name: 'Magic Scroll', icon: '📃' }
    ],
    Epic: [
        { name: 'Void Dagger', icon: '🗡️' },
        { name: 'Crystal Staff', icon: '🪄' },
        { name: 'Amethyst Amulet', icon: '🧿' },
        { name: 'Shadow Cloak', icon: '🧥' },
        { name: 'Dragon Scale', icon: '🐉' }
    ],
    Legend: [
        { name: 'Excalibur', icon: '⚔️' },
        { name: 'Aegis Shield', icon: '🛡️' },
        { name: 'Phoenix Feather', icon: '🪶' },
        { name: 'Crown of Kings', icon: '👑' },
        { name: 'Sun Core', icon: '☀️' }
    ],
    Myth: [
        { name: 'Tear of the Cosmos', icon: '🌌' },
        { name: 'Abyssal Scythe', icon: '💀' },
        { name: 'Heart of the Leviathan', icon: '🫀' },
        { name: 'Ethereal Wings', icon: '🪽' }
    ],
    God: [
        { name: 'Omnipotence Orb', icon: '✨' },
        { name: 'Grasp of Creation', icon: '🌌' },
        { name: 'Infinity Gem', icon: '💎' },
        { name: 'Eye of the Universe', icon: '👁️' }
    ]
};

// Probabilities (in percentage, must sum to 100)
const probabilities = [
    { rarity: 'God', chance: 0.1 },
    { rarity: 'Myth', chance: 1.9 },
    { rarity: 'Legend', chance: 5.0 },
    { rarity: 'Epic', chance: 13.0 },
    { rarity: 'Rare', chance: 30.0 },
    { rarity: 'Common', chance: 50.0 }
];

// Colors mapped (CSS variables)
const rarityColors = {
    Common: 'var(--common)',
    Rare: 'var(--rare)',
    Epic: 'var(--epic)',
    Legend: 'var(--legend)',
    Myth: 'var(--myth)',
    God: 'var(--god)'
};

// State
let currency = 10000;
let spinsCount = 0;
let inventory = [];

// Synthesis State
let isCombineMode = false;
let selectedForCombine = [];

// Rarity Order for Upgrades
const rarityOrder = ['Common', 'Rare', 'Epic', 'Legend', 'Myth', 'God'];

// DOM Elements
const gemCountEl = document.getElementById('gem-count');
const spinCountEl = document.getElementById('spin-count');
const inventoryGrid = document.getElementById('inventory-grid');
const pull1Btn = document.getElementById('pull-btn');
const pull10Btn = document.getElementById('pull-multi-btn');
const pullCard = document.getElementById('pull-card');
const showcaseGlow = document.getElementById('showcase-glow');
const resultRarity = document.getElementById('result-rarity');
const resultImage = document.getElementById('result-image');
const resultName = document.getElementById('result-name');

// Multi-pull
const multiPullOverlay = document.getElementById('multi-pull-overlay');
const multiPullGrid = document.getElementById('multi-pull-grid');
const closeMultiBtn = document.getElementById('close-multi-btn');

// Synthesis Elements
const openCombineBtn = document.getElementById('open-combine-btn');
const closeCombineBtn = document.getElementById('close-combine-btn');
const synthesisOverlay = document.getElementById('synthesis-overlay');
const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const fuseBtn = document.getElementById('fuse-btn');
const fusionFlash = document.getElementById('fusion-flash');
const fusionResultContainer = document.getElementById('fusion-result-container');
const fusionResultCard = document.getElementById('fusion-result-card');
const fusionDoneBtn = document.getElementById('fusion-done-btn');

// System Logic
function getRandomItem() {
    let rand = Math.random() * 100;
    let cumulative = 0;
    let pulledRarity = 'Common';

    for (const prob of probabilities) {
        cumulative += prob.chance;
        if (rand <= cumulative) {
            pulledRarity = prob.rarity;
            break;
        }
    }

    const itemPool = items[pulledRarity];
    const pickedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
    
    // Assign a unique ID to every item for exact inventory tracking
    return { ...pickedItem, rarity: pulledRarity, id: Date.now() + Math.random().toString(36).substr(2, 9) };
}

function renderInventory() {
    inventoryGrid.innerHTML = '';
    
    // Sort logic: Keep oldest (or newest) at top. Let's just reverse iterate to show newest first.
    [...inventory].reverse().forEach(item => {
        const uiItem = document.createElement('div');
        uiItem.className = 'inventory-item';
        uiItem.dataset.id = item.id;
        uiItem.style.setProperty('--i-color', rarityColors[item.rarity]);
        
        uiItem.innerHTML = `
            <div class="inv-img">${item.icon}</div>
            <div class="inv-name">${item.name}</div>
            <div class="inv-rarity" style="color: ${rarityColors[item.rarity]}">${item.rarity}</div>
        `;
        
        inventoryGrid.appendChild(uiItem);
    });
}

function addToInventory(item) {
    inventory.push(item);
    spinsCount++;
    renderInventory();
}

function updateStats() {
    gemCountEl.textContent = currency;
    spinCountEl.textContent = spinsCount;
}

// Single Pull Animation & Logic
function doSinglePull() {
    if(currency < 100) return alert('Not enough Currency!');
    currency -= 100;
    updateStats();

    setButtonsState(true);
    
    // Reset Card
    pullCard.classList.remove('flipped');
    pullCard.className = 'item-card current-pull shake';
    showcaseGlow.style.opacity = '0';
    showcaseGlow.style.background = 'transparent';

    setTimeout(() => {
        pullCard.classList.remove('shake');
        const pulledItem = getRandomItem();
        
        // Setup Result Card Content
        resultRarity.textContent = pulledItem.rarity;
        resultRarity.style.color = rarityColors[pulledItem.rarity];
        resultRarity.style.textShadow = `0 0 10px ${rarityColors[pulledItem.rarity]}`;
        
        resultImage.textContent = pulledItem.icon;
        resultName.textContent = pulledItem.name;
        
        pullCard.className = `item-card current-pull rarity-${pulledItem.rarity}`;
        
        // Flip Anim
        pullCard.classList.add('flipped');
        
        // Glow effect based on rarity
        showcaseGlow.style.opacity = pulledItem.rarity === 'God' || pulledItem.rarity === 'Myth' ? '1' : '0.6';
        showcaseGlow.style.background = `radial-gradient(circle, ${rarityColors[pulledItem.rarity]} 0%, transparent 60%)`;
        
        addToInventory(pulledItem);

        setTimeout(() => setButtonsState(false), 500);

    }, 800);
}

// Multi Pull Animation & Logic
function doMultiPull() {
    if(currency < 1000) return alert('Not enough Currency!');
    currency -= 1000;
    updateStats();
    setButtonsState(true);

    // Get 10 items
    const results = [];
    for(let i=0; i<10; i++) {
        const item = getRandomItem();
        results.push(item);
        addToInventory(item);
    }

    // Prepare overlay UI
    multiPullGrid.innerHTML = '';
    multiPullOverlay.classList.add('active');

    // Create cards & stagger animation
    results.forEach((item, index) => {
        const dItem = document.createElement('div');
        dItem.className = 'multi-item';
        dItem.style.borderTop = `3px solid ${rarityColors[item.rarity]}`;
        
        if(item.rarity === 'God') {
            dItem.style.boxShadow = `0 0 30px ${rarityColors.God}`;
            dItem.style.animation = `godPulse 2s infinite`;
        }

        dItem.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px; filter: drop-shadow(0 0 10px ${rarityColors[item.rarity]})">${item.icon}</div>
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 1.1rem">${item.name}</div>
            <div style="color: ${rarityColors[item.rarity]}; font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px">${item.rarity}</div>
        `;

        multiPullGrid.appendChild(dItem);

        // Stagger reveal
        setTimeout(() => {
            dItem.classList.add('revealed');
        }, 150 * (index + 1));
    });

}

// Utils
function setButtonsState(disabled) {
    pull1Btn.disabled = disabled;
    pull10Btn.disabled = disabled;
}

function closeMulti() {
    multiPullOverlay.classList.remove('active');
    setTimeout(() => {
        multiPullGrid.innerHTML = '';
        setButtonsState(false);
    }, 300);
}

// Bind Events
pull1Btn.addEventListener('click', doSinglePull);
pull10Btn.addEventListener('click', doMultiPull);
closeMultiBtn.addEventListener('click', closeMulti);

// Synthesis Logic -----------------------------

// Picker Elements
const pickerOverlay = document.getElementById('picker-overlay');
const pickerGrid = document.getElementById('picker-grid');
const closePickerBtn = document.getElementById('close-picker-btn');
const confirmPickBtn = document.getElementById('confirm-pick-btn');

function toggleCombineMode(state) {
    if (state) {
        synthesisOverlay.classList.add('active');
        selectedForCombine = [];
        updateSynthesisUI();
    } else {
        synthesisOverlay.classList.remove('active');
        selectedForCombine = [];
    }
}

function openPicker() {
    pickerOverlay.classList.add('active');
    renderPickerGrid();
}

function closePicker() {
    pickerOverlay.classList.remove('active');
}

function renderPickerGrid() {
    pickerGrid.innerHTML = '';
    
    // Sort logic: newest first
    [...inventory].reverse().forEach(item => {
        const uiItem = document.createElement('div');
        uiItem.className = 'inventory-item select-mode';
        uiItem.dataset.id = item.id;
        uiItem.style.setProperty('--i-color', rarityColors[item.rarity]);
        uiItem.style.cursor = 'pointer';
        
        uiItem.innerHTML = `
            <div class="inv-img">${item.icon}</div>
            <div class="inv-name">${item.name}</div>
            <div class="inv-rarity" style="color: ${rarityColors[item.rarity]}">${item.rarity}</div>
        `;
        
        // Handle selection toggle inside picker
        uiItem.addEventListener('click', () => {
            const existingIndex = selectedForCombine.findIndex(sel => sel.id === item.id);
            if (existingIndex > -1) {
                // Deselect
                selectedForCombine.splice(existingIndex, 1);
            } else {
                // Select (Max 2, must be same rarity)
                if (selectedForCombine.length >= 2) return;
                if (selectedForCombine.length === 1 && selectedForCombine[0].rarity !== item.rarity) return;
                selectedForCombine.push(item);
            }
            renderPickerGrid(); // Re-render to update states
        });
        
        // Update Visual States
        if (selectedForCombine.some(sel => sel.id === item.id)) {
            uiItem.style.borderColor = `var(--i-color)`;
            uiItem.style.boxShadow = `inset 0 0 15px rgba(255,255,255,0.2), 0 0 10px var(--i-color)`;
            uiItem.style.transform = `scale(0.95)`;
        } else if (selectedForCombine.length > 0 && selectedForCombine[0].rarity !== item.rarity) {
            uiItem.style.opacity = '0.3';
            uiItem.style.pointerEvents = 'none';
        }

        pickerGrid.appendChild(uiItem);
    });
}

function confirmPicker() {
    closePicker();
    updateSynthesisUI();
}

function updateSynthesisUI() {
    [slot1, slot2].forEach((slot, idx) => {
        const item = selectedForCombine[idx];
        if (item) {
            slot.className = 'syn-slot filled';
            slot.style.setProperty('--i-color', rarityColors[item.rarity]);
            slot.innerHTML = `
                <div class="inv-img">${item.icon}</div>
                <div class="inv-name">${item.name}</div>
            `;
        } else {
            slot.className = 'syn-slot';
            slot.style.removeProperty('--i-color');
            slot.innerHTML = `<div class="slot-placeholder">+</div>`;
        }
    });

    fuseBtn.disabled = selectedForCombine.length < 2;
}

function executeFusion() {
    if (selectedForCombine.length < 2) return;
    
    const baseRarity = selectedForCombine[0].rarity;
    
    // Remove fused items from inventory
    inventory = inventory.filter(invItem => 
        invItem.id !== selectedForCombine[0].id && invItem.id !== selectedForCombine[1].id
    );

    fuseBtn.disabled = true;

    // Calculate Result
    let resultRarity = baseRarity;
    
    // If not God, 5% chance to upgrade
    if (baseRarity !== 'God') {
        const upgradeRoll = Math.random();
        if (upgradeRoll < 0.05) {
            const currentIdx = rarityOrder.indexOf(baseRarity);
            resultRarity = rarityOrder[currentIdx + 1];
        }
    }

    // Get random item of the resulting rarity
    const itemPool = items[resultRarity];
    const pickedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
    const fusionResult = { ...pickedItem, rarity: resultRarity, id: Date.now() + Math.random().toString(36).substr(2, 9) };

    // Play visual flash
    fusionFlash.classList.add('play');
    
    setTimeout(() => {
        fusionFlash.classList.remove('play');
        
        // Show result modal
        fusionResultContainer.classList.add('show');
        
        fusionResultCard.style.setProperty('--card-color', rarityColors[fusionResult.rarity]);
        if(fusionResult.rarity === 'God') {
            fusionResultCard.style.animation = `godPulse 2s infinite`;
        } else {
            fusionResultCard.style.animation = 'none';
        }

        fusionResultCard.innerHTML = `
            <div class="inv-img">${fusionResult.icon}</div>
            <div class="inv-rarity">${fusionResult.rarity}</div>
            <div class="inv-name">${fusionResult.name}</div>
        `;

        // Add to inventory behind the scenes
        inventory.push(fusionResult);
        renderInventory();
        selectedForCombine = [];
        updateSynthesisUI();

    }, 300); // sync with flash peak
}

function closeFusionResult() {
    fusionResultContainer.classList.remove('show');
}

openCombineBtn.addEventListener('click', () => toggleCombineMode(true));
closeCombineBtn.addEventListener('click', () => toggleCombineMode(false));
fuseBtn.addEventListener('click', executeFusion);
fusionDoneBtn.addEventListener('click', closeFusionResult);

// Open picker on slot click
slot1.addEventListener('click', openPicker);
slot2.addEventListener('click', openPicker);

// Picker actions
closePickerBtn.addEventListener('click', closePicker);
confirmPickBtn.addEventListener('click', confirmPicker);

// Simple Particle System for background aesthetic
function createParticles() {
    const container = document.getElementById('particle-container');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        let p = document.createElement('div');
        p.style.position = 'absolute';
        p.style.width = Math.random() * 5 + 'px';
        p.style.height = p.style.width;
        p.style.background = 'white';
        p.style.opacity = Math.random() * 0.3;
        p.style.borderRadius = '50%';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = Math.random() * 100 + 'vh';
        p.style.pointerEvents = 'none';

        container.appendChild(p);

        animateParticle(p);
    }
}

function animateParticle(particle) {
    const duration = Math.random() * 10000 + 10000;
    const xDist = (Math.random() - 0.5) * 200;
    const yDist = -Math.random() * 200 - 100;

    particle.animate([
        { transform: 'translate(0, 0)' },
        { transform: `translate(${xDist}px, ${yDist}px)` }
    ], {
        duration: duration,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
    });
}

// Init
createParticles();
updateStats();
