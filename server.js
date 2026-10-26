
const API_BASE = 'https://charfinder-api.onrender.com/api';
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

const $ = id => document.getElementById(id);
let isChecking = false;

let stats = {
    checked: 0,
    available: 0,
    taken: 0
};

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

async function checkUsername(username) {
    const response = await fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || result.error || 'API request failed');
    }

    return result;
}

async function handleStartChecking() {
    const button = $('startBtn');

    if (isChecking || !button) return;

    isChecking = true;
    button.disabled = true;
    button.textContent = 'CHECKING...';

    try {
        stats = { checked: 0, available: 0, taken: 0 };
        updateStats();

        const list = $('resultsList');

        if (list) list.replaceChildren();

        const placeholder = $('resultsPlaceholder');

        if (placeholder) placeholder.style.display = 'none';

        showStatus('Generating candidates...');

        let names = generateUsernames(500);
        const letter = $('startLetter')?.value?.trim().toLowerCase() || '';

        if (letter) {
            names = names.filter(name => name.startsWith(letter));
        }

        if (names.length === 0) {
            showStatus('No candidates match that starting letter.');
            return;
        }

        // Check one candidate per click.
        const username = names[0];

        showStatus(`Checking ${username} with Discord...`);

        const result = await checkUsername(username);

        if (result.status === 'Available' || result.status === 'Taken') {
            stats.checked++;

            if (result.status === 'Available') {
                stats.available++;
            } else {
                stats.taken++;
            }

            updateStats();
            showStatus(`${username}: ${result.status}`);

            if (list) {
                const item = document.createElement('div');
                item.textContent = `${username} — ${result.status}`;
                list.appendChild(item);
            }
        } else {
            showStatus(
                `${username}: Unknown — ${
                    result.message || 'Discord did not confirm availability.'
                }`
            );
        }
    } catch (error) {
        showStatus(`Checker error: ${error.message}`);
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
        showStatus('Could not load statistics.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = $('startBtn');

    if (button) {
        button.addEventListener('click', handleStartChecking);
    } else {
        console.error('Could not find startBtn in index.html');
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
