// API Configuration

const API_BASE = 'https://charfinder-api.onrender.com/api';

const $ = id => document.getElementById(id);
let isChecking = false;

async function checkUsername(username) {
  const response = await fetch(`${API_BASE}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || `HTTP ${response.status}`);
  }

  return result;
}

async function handleStartChecking() {
  const button = $('startBtn');
  const status = $('checkingStatus');
  const list = $('resultsList');

  if (isChecking || !button) return;

  const firstLetter = $('startLetter')?.value?.trim().toLowerCase() || '';

  if (firstLetter && !/^[a-z0-9]$/.test(firstLetter)) {
    if (status) status.textContent = 'Enter one letter or number.';
    return;
  }

  const username = firstLetter
    ? firstLetter + Math.random().toString(36).slice(2, 5)
    : Math.random().toString(36).slice(2, 6);

  isChecking = true;
  button.disabled = true;
  button.textContent = 'CHECKING...';

  if (status) status.textContent = `Checking ${username}...`;

  try {
    const result = await checkUsername(username);

    if (status) {
      status.textContent = result.checked
        ? `${username}: ${result.status}`
        : `${username}: Unknown — ${result.message || 'Discord did not confirm.'}`;
    }

    if (list) {
      const item = document.createElement('div');
      item.textContent = `${username} — ${result.status}`;
      list.prepend(item);
    }
  } catch (error) {
    if (status) status.textContent = `Checker error: ${error.message}`;
  } finally {
    isChecking = false;
    button.disabled = false;
    button.textContent = 'START CHECKING';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const button = $('startBtn');

  if (button) {
    button.addEventListener('click', handleStartChecking);
  } else {
    console.error('CharFinder: startBtn not found in index.html');
  }
});


