const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load local environment variables if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'websites.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read data from websites.json
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // If it doesn't exist, start with empty array
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading websites.json:', error);
    return [];
  }
}

// Helper to write data to websites.json
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to websites.json:', error);
    return false;
  }
}

// API Routes

// 1. Get all websites
app.get('/api/websites', (req, res) => {
  const websites = readData();
  res.json(websites);
});

// 2. Add a new website
app.post('/api/websites', (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required.' });
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format. Please include http:// or https://' });
  }

  const websites = readData();

  // Create a new website item
  const newWebsite = {
    id: Date.now().toString(), // Simple unique ID generator
    name: name.trim(),
    url: url.trim(),
    enabled: true,
    status: 'unknown',
    lastChecked: 'Never'
  };

  websites.push(newWebsite);
  const success = writeData(websites);

  if (success) {
    res.status(201).json(newWebsite);
  } else {
    res.status(500).json({ error: 'Failed to save website data.' });
  }
});

// 3. Update a website (e.g., toggle enabled state)
app.put('/api/websites/:id', (req, res) => {
  const { id } = req.params;
  const { enabled, name, url, status, lastChecked } = req.body;

  const websites = readData();
  const websiteIndex = websites.findIndex(w => w.id === id);

  if (websiteIndex === -1) {
    return res.status(404).json({ error: 'Website not found.' });
  }

  // Update only the provided fields
  if (enabled !== undefined) websites[websiteIndex].enabled = !!enabled;
  if (name !== undefined) websites[websiteIndex].name = name.trim();
  if (url !== undefined) {
    try {
      new URL(url);
      websites[websiteIndex].url = url.trim();
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }
  }
  if (status !== undefined) websites[websiteIndex].status = status;
  if (lastChecked !== undefined) websites[websiteIndex].lastChecked = lastChecked;

  const success = writeData(websites);

  if (success) {
    res.json(websites[websiteIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update website data.' });
  }
});

// 4. Delete a website
app.delete('/api/websites/:id', (req, res) => {
  const { id } = req.params;
  const websites = readData();
  const filteredWebsites = websites.filter(w => w.id !== id);

  if (websites.length === filteredWebsites.length) {
    return res.status(404).json({ error: 'Website not found.' });
  }

  const success = writeData(filteredWebsites);

  if (success) {
    res.json({ message: 'Website deleted successfully.', id });
  } else {
    res.status(500).json({ error: 'Failed to delete website data.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🌐 Website Monitor Dashboard running locally!`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`📂 Data File: ${DATA_FILE}`);
  console.log(`==================================================`);
});
