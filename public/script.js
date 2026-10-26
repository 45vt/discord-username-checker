// API Configuration
const API_BASE = 'https://charfinder-api.onrender.com/api';

// DOM Elements
const startBtn = document.getElementById('startBtn');
const startLetterSelect = document.getElementById('startLetter');
const checkedCountEl = document.getElementById('checkedCount');
const availableCountEl = document.getElementById('availableCount');
const takenCountEl = document.getElementById('takenCount');
const percentageEl = document.getElementById('percentage');
const resultsList = document.getElementById('resultsList');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const checkingStatus = document.getElementById('checkingStatus');
const webhookInput = document.getElementById('webhook');
const saveWebhookBtn = document.querySelector('.btn-save');

// State
let isChecking = false;
let stats = {
    checked: 0,
    available: 0,
    taken: 0
};

// Expanded usernames for demonstration
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const sampleUsernames = [];
const seenUsernames = new Set();

while (sampleUsernames.length < 500) {
    let username = '';

    for (let i = 0; i < 4; i++) {
        username += alphabet[
            Math.floor(Math.random() * alphabet.length)
        ];
    }

    if (!seenUsernames.has(username)) {
        seenUsernames.add(username);
        sampleUsernames.push(username);
    }
}
    // A-Z single letters
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    // 2-3 letter combinations\n    'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap',\n    'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj', 'bk', 'bl', 'bm', 'bn', 'bo',\n    'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'cg', 'ch', 'ci', 'cj', 'ck', 'cl', 'cm', 'cn', 'co',\n    'da', 'db', 'dc', 'dd', 'de', 'df', 'dg', 'dh', 'di', 'dj', 'dk', 'dl', 'dm', 'dn', 'do',\n    'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'eg', 'eh', 'ei', 'ej', 'ek', 'el', 'em', 'en', 'eo',\n    // Common words\n    'test', 'user', 'admin', 'root', 'john', 'jane', 'hello', 'world', 'cool', 'pro',\n    'elite', 'dark', 'shadow', 'ninja', 'xxx', 'xyz', 'abc', 'king', 'queen', 'awesome',\n    'gamer', 'player', 'master', 'legend', 'pro', 'vip', 'dev', 'code', 'tech', 'web',\n    'app', 'cloud', 'data', 'sync', 'flow', 'apex', 'nova', 'pixel', 'cyber', 'nexus',\n    // More variations\n    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1',\n    'aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj',\n    'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh', 'iii', 'jjj'\n];\n\n// Initialize event listeners\nfunction init() {\n    startBtn.addEventListener('click', handleStartChecking);\n    saveWebhookBtn.addEventListener('click', handleSaveWebhook);\n    loadStats();\n}\n\n// Handle start checking button\nasync function handleStartChecking() {\n    if (isChecking) return;\n\n    isChecking = true;\n    startBtn.disabled = true;\n    startBtn.textContent = 'CHECKING...';\n    checkingStatus.textContent = 'Checking...';\n    checkingStatus.classList.add('checking');\n    resultsList.innerHTML = '';\n    resultsPlaceholder.style.display = 'none';\n\n    try {\n        const startLetter = startLetterSelect.value;\n        const usernamesToCheck = filterUsernames(startLetter);\n\n        console.log(`Starting check for ${usernamesToCheck.length} usernames...`);\n\n        // Check usernames\n        for (const username of usernamesToCheck) {\n            if (!isChecking) break; // Allow stopping\n\n            try {\n                const response = await fetch(`${API_BASE}/check`, {\n                    method: 'POST',\n                    headers: {\n                        'Content-Type': 'application/json'\n                    },\n                    body: JSON.stringify({ username })\n                });\n\n                const result = await response.json();\n\n                if (result.checked) {\n                    stats.checked++;\n                    if (result.available) {\n                        stats.available++;\n                        addResultItem(username, true);\n                    } else {\n                        stats.taken++;\n                    }\n                }\n\n                updateStats();\n                await sleep(50); // Rate limiting - faster checking\n            } catch (error) {\n                console.error(`Error checking ${username}:`, error);\n            }\n        }\n    } catch (error) {\n        console.error('Error during checking:', error);\n    } finally {\n        isChecking = false;\n        startBtn.disabled = false;\n        startBtn.textContent = 'START CHECKING';\n        checkingStatus.textContent = 'Idle';\n        checkingStatus.classList.remove('checking');\n    }\n}\n\n// Filter usernames by starting letter\nfunction filterUsernames(startLetter) {\n    if (!startLetter) {\n        return sampleUsernames;\n    }\n    return sampleUsernames.filter(name => name.toLowerCase().startsWith(startLetter.toLowerCase()));\n}\n\n// Add result item to the list\nfunction addResultItem(username, isAvailable) {\n    if (!isAvailable) return;\n\n    const item = document.createElement('div');\n    item.className = 'result-item';\n    item.innerHTML = `<span class=\"username-text\">${username}</span>`;\n    resultsList.appendChild(item);\n\n    resultsPlaceholder.style.display = 'none';\n}\n\n// Update statistics display\nfunction updateStats() {\n    checkedCountEl.textContent = stats.checked;\n    availableCountEl.textContent = stats.available;\n    takenCountEl.textContent = stats.taken;\n\n    const percentage = stats.checked > 0 ? ((stats.available / stats.checked) * 100).toFixed(2) : 0;\n    percentageEl.textContent = percentage + '%';\n}\n\n// Load statistics from API\nasync function loadStats() {\n    try {\n        const response = await fetch(`${API_BASE}/stats`);\n        const data = await response.json();\n        stats = {\n            checked: data.checked,\n            available: data.available,\n            taken: data.taken\n        };\n        updateStats();\n    } catch (error) {\n        console.error('Error loading stats:', error);\n    }\n}\n\n// Handle save webhook\nfunction handleSaveWebhook() {\n    const webhookUrl = webhookInput.value;\n    if (webhookUrl) {\n        localStorage.setItem('discordWebhook', webhookUrl);\n        alert('Webhook URL saved!');\n    }\n}\n\n// Load webhook from storage\nfunction loadWebhook() {\n    const saved = localStorage.getItem('discordWebhook');\n    if (saved) {\n        webhookInput.value = saved;\n    }\n}\n\n// Sleep helper\nfunction sleep(ms) {\n    return new Promise(resolve => setTimeout(resolve, ms));\n}\n\n// Initialize on page load\ndocument.addEventListener('DOMContentLoaded', () => {\n    init();\n    loadWebhook();\n});\n