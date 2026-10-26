
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const stats = {
  checked: 0,
  available: 0,
  taken: 0
};

function validateUsername(username) {
  return typeof username === 'string' &&
    /^[a-z0-9]{4}$/.test(username);
}

async function checkDiscordUsername(username) {
  if (!validateUsername(username)) {
    return {
      username,
      status: 'Invalid',
      checked: false,
      message: 'Enter exactly four letters or numbers.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      'https://discord.com/api/v9/unique-username/username-attempt-unauthed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        signal: controller.signal
      }
    );

    if (response.status === 429) {
      return {
        username,
        status: 'Unknown',
        checked: false,
        message: 'Discord rate-limited this check. Try again later.'
      };
    }

    if (!response.ok) {
      return {
        username,
        status: 'Unknown',
        checked: false,
        message: `Discord did not confirm availability (HTTP ${response.status}).`
      };
    }

    const data = await response.json();

    if (typeof data.taken !== 'boolean') {
      return {
        username,
        status: 'Unknown',
        checked: false,
        message: 'Discord returned an unrecognized response.'
      };
    }

    stats.checked++;
    if (data.taken) stats.taken++;
    else stats.available++;

    return {
      username,
      status: data.taken ? 'Taken' : 'Available',
      checked: true,
      available: !data.taken
    };
  } catch (error) {
    return {
      username,
      status: 'Unknown',
      checked: false,
      message: error.name === 'AbortError'
        ? 'Discord check timed out.'
        : 'Could not reach Discord.'
    };
  } finally {
    clearTimeout(timeout);
  }
}

app.post('/api/check', async (req, res) => {
  try {
    const result = await checkDiscordUsername(req.body?.username);
    res.status(result.status === 'Invalid' ? 400 : 200).json(result);
  } catch {
    res.status(500).json({ status: 'Unknown', message: 'Server error.' });
  }
});

app.post('/api/check-bulk', async (req, res) => {
  const { usernames } = req.body || {};

  if (!Array.isArray(usernames) || usernames.length !== 1) {
    return res.status(400).json({
      error: 'Submit exactly one username per request.'
    });
  }

  try {
    const result = await checkDiscordUsername(usernames[0]);
    res.status(result.status === 'Invalid' ? 400 : 200).json({
      results: [result]
    });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.post('/api/reset-stats', (req, res) => {
  stats.checked = 0;
  stats.available = 0;
  stats.taken = 0;
  res.json({ message: 'Statistics reset', stats });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'CharFinder API',
    status: 'online',
    availabilityChecking: 'unofficial-endpoint'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CharFinder API running on port ${PORT}`);
});
