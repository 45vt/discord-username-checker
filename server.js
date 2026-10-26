
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

// Validate candidate format; this does not establish availability.
function validateUsername(username) {
  return typeof username === 'string' &&
    /^[a-z0-9]{4}$/.test(username);
}

// No verified Discord availability endpoint is configured.
// Return Unknown rather than guessing.
async function checkDiscordUsername(username) {
  if (!validateUsername(username)) {
    return {
      username,
      status: 'Invalid',
      checked: false,
      message: 'Enter exactly four letters or numbers.'
    };
  }

  return {
    username,
    status: 'Unknown',
    checked: false,
    message: 'A verified Discord availability check is not configured.'
  };
}

app.post('/api/check', async (req, res) => {
  const result = await checkDiscordUsername(req.body?.username);
  res.status(result.status === 'Invalid' ? 400 : 200).json(result);
});

app.post('/api/check-bulk', async (req, res) => {
  const { usernames } = req.body || {};

  if (!Array.isArray(usernames) || usernames.length !== 1) {
    return res.status(400).json({
      error: 'Submit exactly one username per request.'
    });
  }

  const result = await checkDiscordUsername(usernames[0]);

  res.status(result.status === 'Invalid' ? 400 : 200).json({
    results: [result]
  });
}
  }

  if (usernames.length > 100) {
    return res.status(400).json({
      error: 'Maximum 100 usernames per request.'
    });
  }

  const results = await Promise.all(
    usernames.map(checkDiscordUsername)
  );

  res.json({ results });
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
    availabilityChecking: 'not-configured'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CharFinder API running on port ${PORT}`);
});
