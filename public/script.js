// API Configuration

const API_BASE = 'https://charfinder-api.onrender.com/api';

const $ = id => document.getElementById(id);
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
let isChecking = false;

const startBtn = $('startBtn');
const startLetter = $('startLetter');
const checkedEl = $('checkedCount');
const availableEl = $('availableCount');
const takenEl = $('takenCount');
const percentageEl = $('percentage');
const resultsList = $('resultsList');
const placeholder = $('resultsPlaceholder');
const statusEl = $('checkingStatus');

let stats = { checked: 0, available: 0, taken: 0 };

function generateUsernames(count = 500) {
    const results = new Set();
    while (results.size < count) {
        let name = '';
        for (let i = 0; i < 4; i++) {
            name += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        results.add(name);
    }
    return [...results];
}

function updateStats() {
    checkedEl.textContent = stats.checked;
    availableEl.textContent = stats.available;
    takenEl.textContent = stats.taken;
    percentageEl.textContent = stats.checked
        ? ((stats.available / stats.checked) * 100).toFixed(2) + '%'
        : '0%';
}

function addResult(name) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.textContent = name;
    resultsList.appendChild(item);
}

async function handleStartChecking() {
    if (isChecking) return;

    isChecking = true;
    startBtn.disabled = true;
    startBtn.textContent = 'CHECKING...';
    statusEl.textContent = 'Generating usernames...';
    resultsList.replaceChildren();
    placeholder.style.display = 'none';
    stats = { checked: 0, available: 0, taken: 0 };
    updateStats();

    try {
        let names = generateUsernames(500);
        const letter = startLetter.value;
        if (letter) names = names.filter(n => n.startsWith(letter));

        statusEl.textContent = `Generated ${names.length} candidates. Checking API...`;
console.log("Candidates generated:", names.length);

        for (const username of names) {
            if (!isChecking) break;

            try {
                const response = await fetch(`${API_BASE}/check`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) continue;
                const result = await response.json();

                if (result.checked === true) {
                    stats.checked++;
                    if (result.available === true) {
                        stats.available++;
                        addResult(username);
                    } else {
                        stats.taken++;
                    }
                    updateStats();
                }
            } catch (error) {
                console.error('API check failed:', error);
                statusEl.textContent = 'API check failed. Check the backend route.';
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 250));
        }

        if (isChecking) {
            statusEl.textContent = `Finished. Checked ${stats.checked} results.`;
        }
    } finally {
        isChecking = false;
        startBtn.disabled = false;
        startBtn.textContent = 'START CHECKING';
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) return;
        const data = await response.json();
        stats = {
            checked: Number(data.checked) || 0,
            available: Number(data.available) || 0,
            taken: Number(data.taken) || 0
        };
        updateStats();
    } catch (error) {
        console.log('Stats endpoint unavailable.');
    }
}

const saveWebhookBtn = document.querySelector('.btn-save');
if (startBtn) startBtn.addEventListener('click', handleStartChecking);
if (saveWebhookBtn) {
    saveWebhookBtn.addEventListener('click', () => {
        const input = $('webhook');
        if (input && input.value.trim()) {
            localStorage.setItem('discordWebhook', input.value.trim());
            alert('Webhook saved locally.');
        }
    });
}

const webhookInput = $('webhook');
if (webhookInput) {
    webhookInput.value = localStorage.getItem('discordWebhook') || '';
}

loadStats();
