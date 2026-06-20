const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { supabase } = require('./services/supabase');

// Load local environment variables if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// 1. Get all websites
app.get('/api/websites', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*');

    if (error) {
      console.error('Error fetching websites:', error);
      return res.status(500).json({ error: error.message });
    }

    // Map database columns to the camelCase structure expected by the frontend
    const formattedWebsites = data.map(site => ({
      id: site.id,
      name: site.name,
      url: site.url,
      enabled: site.enabled,
      status: site.status,
      lastChecked: site.last_checked || null,
      lastError: site.last_error || null
    }));

    res.json(formattedWebsites);
  } catch (err) {
    console.error('Server error fetching websites:', err);
    res.status(500).json({ error: 'Server error fetching websites.' });
  }
});

// 2. Add a new website
app.post('/api/websites', async (req, res) => {
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

  // Create a new website item using the database schema format (letting Supabase generate the UUID id and leaving last_checked null)
  const newWebsiteDb = {
    name: name.trim(),
    url: url.trim(),
    enabled: true,
    status: 'unknown',
    last_error: null
  };

  try {
    const { data, error } = await supabase
      .from('websites')
      .insert([newWebsiteDb])
      .select();

    if (error) {
      console.error('Error inserting website:', error);
      return res.status(500).json({ error: error.message });
    }

    const insertedSite = data && data[0];
    if (!insertedSite) {
      return res.status(500).json({ error: 'Failed to retrieve database-inserted record.' });
    }

    // Map back to the camelCase format expected by the frontend
    const formattedWebsite = {
      id: insertedSite.id,
      name: insertedSite.name,
      url: insertedSite.url,
      enabled: insertedSite.enabled,
      status: insertedSite.status,
      lastChecked: insertedSite.last_checked,
      lastError: insertedSite.last_error
    };

    res.status(201).json(formattedWebsite);
  } catch (err) {
    console.error('Server error adding website:', err);
    res.status(500).json({ error: 'Server error adding website.' });
  }
});

// 3. Update a website (e.g., toggle enabled state or record a manual check update)
app.put('/api/websites/:id', async (req, res) => {
  const { id } = req.params;
  const { enabled, name, url, status, lastChecked } = req.body;

  const updates = {};
  if (enabled !== undefined) updates.enabled = !!enabled;
  if (name !== undefined) updates.name = name.trim();
  if (url !== undefined) {
    try {
      new URL(url);
      updates.url = url.trim();
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }
  }
  if (status !== undefined) updates.status = status;
  if (lastChecked !== undefined) updates.last_checked = lastChecked === 'Never' ? null : lastChecked;

  try {
    const { data, error } = await supabase
      .from('websites')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating website:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Website not found.' });
    }

    const updatedSite = data[0];
    const formattedWebsite = {
      id: updatedSite.id,
      name: updatedSite.name,
      url: updatedSite.url,
      enabled: updatedSite.enabled,
      status: updatedSite.status,
      lastChecked: updatedSite.last_checked || null,
      lastError: updatedSite.last_error || null
    };

    res.json(formattedWebsite);
  } catch (err) {
    console.error('Server error updating website:', err);
    res.status(500).json({ error: 'Server error updating website.' });
  }
});

// 4. Delete a website
app.delete('/api/websites/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting website:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Website not found.' });
    }

    res.json({ message: 'Website deleted successfully.', id });
  } catch (err) {
    console.error('Server error deleting website:', err);
    res.status(500).json({ error: 'Server error deleting website.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🌐 Website Monitor Dashboard running locally!`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
