// API Configuration

const API_BASE = 'https://charfinder-api.onrender.com/api';
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

const $ = id => document.getElementById(id);
let isChecking = false;

let stats = { checked: 0, available: 0, taken: 0 };

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function generateUsernames(count = 500) {
    const names = new Set();

    while (names.size < count) {
        let name = '';
        for (let i = 0; i < 4; i++) {
            name += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        names.add(name);
    }

    return [...names];
}

function updateStats() {
    setText('checkedCount', stats.checked);
    setText('availableCount', stats.available);
    setText('takenCount', stats.taken);
    setText(
        'percentage',
        stats.checked
            ? ((stats.available / stats.checked) * 100).toFixed(2) + '%'
            : '0%'
    );
}

function showStatus(message) {
    setText('checkingStatus', message);
}

async function handleStartChecking() {
    const button = $('startBtn');

    if (isChecking || !button) return;

    isChecking = true;
    button.disabled = true;
    button.textContent = 'WORKING...';

    try {
        stats = { checked: 0, available: 0, taken: 0 };
        updateStats();

        const list = $('resultsList');
        if (list) list.replaceChildren();

        const placeholder = $('resultsPlaceholder');
        if (placeholder) placeholder.style.display = 'none';

        showStatus('Generating candidates...');

        let names = generateUsernames(500);
        const letter = $('startLetter')?.value || '';

        if (letter) {
            names = names.filter(name => name.startsWith(letter.toLowerCase()));
        }

        showStatus(`Generated ${names.length} candidates. Testing API...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${API_BASE}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: names[0] }),
                signal: controller.signal
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'API request failed');
            }

            if (result.status === 'Unknown' || result.checked === false) {
                showStatus(
                    `Generator works! API is online, but real Discord checking isn't configured. Test candidate: ${names[0]}`
                );
            } else {
                showStatus(
                    `API responded for ${names[0]}. Verify its result before trusting availability.`
                );
            }
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        showStatus(
            error.name === 'AbortError'
                ? 'API timed out. Try again in a moment.'
                : `Could not check API: ${error.message}`
        );
    } finally {
        isChecking = false;

        const button = $('startBtn');
        if (button) {
            button.disabled = false;
            button.textContent = 'START CHECKING';
        }
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
    } catch {
        showStatus('API statistics unavailable. You can still generate candidates.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = $('startBtn');

    if (button) {
        button.addEventListener('click', handleStartChecking);
    } else {
        console.error('Could not find the startBtn element in index.html');
    }

    const webhook = $('webhook');
    const saveButton = document.querySelector('.btn-save');

    if (webhook) {
        webhook.value = localStorage.getItem('discordWebhook') || '';
    }

    if (saveButton && webhook) {
        saveButton.addEventListener('click', () => {
            localStorage.setItem('discordWebhook', webhook.value.trim());
            alert('Webhook saved locally.');
        });
    }

    loadStats();
});

