
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
  taken: 0,
  unknown: 0
};

function validUsername(username) {
  return typeof username === 'string' &&
    /^[a-z0-9]{4}$/.test(username);
}

async function checkUsername(username) {
  if (!validUsername(username)) {
    return {
      username,
      status: 'Unknown',
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

    if (!response.ok) {
      return {
        username,
        status: 'Unknown',
        checked: false,
        message: response.status === 429
          ? 'Discord rate-limited this check. Try again later.'
          : `Discord did not confirm the result (HTTP ${response.status}).`
      };
    }

    const data = await response.json();

    if (typeof data.taken !== 'boolean') {
      return {
        username,
        status: 'Unknown',
        checked: false,
        message: 'Discord returned no clear availability result.'
      };
    }

    stats.checked++;

    if (data.taken) {
      stats.taken++;
      return {
        username,
        status: 'Taken',
        checked: true,
        available: false
      };
    }

    stats.available++;
    return {
      username,
      status: 'Available',
      checked: true,
      available: true
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
  const result = await checkUsername(req.body?.username);
  res.json(result);
});

app.post('/api/check-bulk', async (req, res) => {
  const usernames = req.body?.usernames;

  if (!Array.isArray(usernames) || usernames.length !== 1) {
    return res.status(400).json({
      error: 'Check one username per request.'
    });
  }

  const result = await checkUsername(usernames[0]);
  res.json({ results: [result] });
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.get('/api', (req, res) => {
  res.json({
    name: 'CharFinder API',
    status: 'online',
    rule: 'Only explicit boolean responses are classified.'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CharFinder running on port ${PORT}`);
});
