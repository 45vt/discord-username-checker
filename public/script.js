// API Configuration

const API_BASE = 'https://charfinder-api.onrender.com/api';

const $ = id => document.getElementById(id);
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

const checkedNames = new Set();
const favorites = new Set(
  JSON.parse(localStorage.getItem('charfinder-favorites') || '[]')
);

let checking = false;

function generateCandidate(first = '') {
  const patterns = [
    'CVCV', 'CVVC', 'CCVC', 'VCVC',
    'CVCC', 'CCVV', 'VCVV'
  ];
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  let name = '';

  for (let i = 0; i < 4; i++) {
    const type = pattern[i];
    const chars = type === 'V' ? vowels
      : type === 'C' ? consonants
      : alphabet;

    name += chars[Math.floor(Math.random() * chars.length)];
  }

  if (first) name = first + name.slice(1);

  return name;
}

async function checkCandidate(username) {
  const response = await fetch(`${API_BASE}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }

  return result;
}

function renderFavorite(username) {
  const list = $('resultsList');
  if (!list) return;

  const item = document.createElement('div');
  item.textContent = `${username} — ⭐ Saved`;

  const remove = document.createElement('button');
  remove.textContent = 'Remove';
  remove.onclick = () => {
    favorites.delete(username);
    localStorage.setItem(
      'charfinder-favorites',
      JSON.stringify([...favorites])
    );
    item.remove();
  };

  item.appendChild(remove);
  list.prepend(item);
}

async function startChecking() {
  if (checking) return;

  const button = $('startBtn');
  const status = $('checkingStatus');
  const first = $('startLetter')?.value.trim().toLowerCase() || '';

  if (first && !/^[a-z0-9]$/.test(first)) {
    if (status) status.textContent = 'Enter one letter or number.';
    return;
  }

  checking = true;
  if (button) {
    button.disabled = true;
    button.textContent = 'CHECKING...';
  }

  try {
    let username;

    // Find a candidate that has not already been checked this session.
    for (let i = 0; i < 200; i++) {
      const candidate = generateCandidate(first);
      if (!checkedNames.has(candidate)) {
        username = candidate;
        break;
      }
    }

    if (!username) {
      if (status) status.textContent = 'No new candidates found. Change the starting character.';
      return;
    }

    checkedNames.add(username);
    if (status) status.textContent = `Checking ${username}...`;

    const result = await checkCandidate(username);

    if (status) {
      status.textContent = result.checked === true &&
        ['Available', 'Taken'].includes(result.status)
        ? `${username}: ${result.status}`
        : `${username}: Unknown — ${result.message || 'Not confirmed by Discord.'}`;
    }

    const list = $('resultsList');

    if (list) {
      const item = document.createElement('div');
      item.textContent = `${username} — ${result.status}`;

      if (result.checked === true && result.status === 'Available') {
        const save = document.createElement('button');
        save.textContent = favorites.has(username) ? '⭐ Saved' : '⭐ Save';

        save.onclick = () => {
          favorites.add(username);
          localStorage.setItem(
            'charfinder-favorites',
            JSON.stringify([...favorites])
          );
          save.textContent = '⭐ Saved';
        };

        item.appendChild(save);
      }

      list.prepend(item);
    }
  } catch (error) {
    if (status) status.textContent = `Check failed: ${error.message}`;
  } finally {
    checking = false;
    if (button) {
      button.disabled = false;
      button.textContent = 'CHECK NEXT';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const button = $('startBtn');
  if (button) button.addEventListener('click', startChecking);

  const list = $('resultsList');
  if (list) {
    list.replaceChildren();
    for (const username of favorites) renderFavorite(username);
  }
});


