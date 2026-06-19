// DOM Elements
const websitesTbody = document.getElementById('websites-tbody');
const addWebsiteForm = document.getElementById('add-website-form');
const siteNameInput = document.getElementById('site-name');
const siteUrlInput = document.getElementById('site-url');
const btnAddSite = document.getElementById('btn-add-site');
const btnRefreshList = document.getElementById('btn-refresh-list');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statOffline = document.getElementById('stat-offline');

// API Base URL (runs on the same host)
const API_URL = '/api/websites';

// Toast Notification Helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') {
    icon = '<i class="fa-solid fa-circle-exclamation"></i>';
  } else if (type === 'info') {
    icon = '<i class="fa-solid fa-circle-info"></i>';
  }

  toast.innerHTML = `${icon} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Automatically remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Fetch and Render Websites
async function fetchWebsites() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to retrieve websites.');
    }
    const websites = await response.json();
    renderWebsites(websites);
    updateStats(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    showToast('Error loading websites list', 'error');
    websitesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="color: var(--color-down);">
          <i class="fa-solid fa-triangle-exclamation"></i> Connection error. Make sure the local server is running.
        </td>
      </tr>
    `;
  }
}

// Render the Website Table Rows
function renderWebsites(websites) {
  if (websites.length === 0) {
    websitesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="color: var(--text-dimmed); padding: 3rem 1rem;">
          <i class="fa-solid fa-globe" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
          No websites are configured. Add your first site below!
        </td>
      </tr>
    `;
    return;
  }

  websitesTbody.innerHTML = '';

  websites.forEach(site => {
    const row = document.createElement('tr');
    
    // Status Badge
    let statusClass = 'unknown';
    let statusIcon = 'fa-circle-question';
    if (site.status === 'Up') {
      statusClass = 'up';
      statusIcon = 'fa-circle-check';
    } else if (site.status === 'Down') {
      statusClass = 'down';
      statusIcon = 'fa-circle-exclamation';
    }

    // Format lastChecked text
    let displayChecked = site.lastChecked;
    if (site.lastChecked && site.lastChecked !== 'Never') {
      try {
        const date = new Date(site.lastChecked);
        if (!isNaN(date.getTime())) {
          displayChecked = date.toLocaleString();
        }
      } catch (e) {
        // Fallback to raw string
      }
    }

    row.innerHTML = `
      <td>
        <div class="cell-name-info">
          <span class="site-name">${escapeHTML(site.name)}</span>
        </div>
      </td>
      <td>
        <a href="${escapeHTML(site.url)}" target="_blank" class="site-url-link">
          ${escapeHTML(site.url)} <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </td>
      <td>
        <span class="badge-status ${statusClass}">
          <i class="fa-solid ${statusIcon}"></i> ${site.status}
        </span>
      </td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">
        ${displayChecked}
      </td>
      <td>
        <label class="switch">
          <input type="checkbox" ${site.enabled ? 'checked' : ''} onchange="toggleMonitoring('${site.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </td>
      <td class="text-right">
        <button class="btn-danger-icon" onclick="deleteWebsite('${site.id}', '${escapeJS(site.name)}')" title="Delete Monitor">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    websitesTbody.appendChild(row);
  });
}

// Calculate and Update Stat Cards
function updateStats(websites) {
  const total = websites.length;
  const active = websites.filter(w => w.enabled).length;
  const offline = websites.filter(w => w.enabled && w.status === 'Down').length;

  statTotal.textContent = total;
  statActive.textContent = active;
  statOffline.textContent = offline;

  // Add flashing effect if any site is offline
  const offlineCard = document.getElementById('stat-offline-card');
  if (offline > 0) {
    offlineCard.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
    offlineCard.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  } else {
    offlineCard.style.boxShadow = 'var(--glass-shadow)';
    offlineCard.style.borderColor = 'var(--glass-border)';
  }
}

// Add Website Submit Handler
addWebsiteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = siteNameInput.value.trim();
  const url = siteUrlInput.value.trim();

  if (!name || !url) return;

  // Set button loading state
  btnAddSite.disabled = true;
  btnAddSite.querySelector('.btn-text').textContent = 'Adding...';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, url }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add website.');
    }

    showToast(`Started monitoring: ${name}`);
    addWebsiteForm.reset();
    fetchWebsites();
  } catch (error) {
    console.error('Error adding site:', error);
    showToast(error.message, 'error');
  } finally {
    btnAddSite.disabled = false;
    btnAddSite.querySelector('.btn-text').textContent = 'Start Monitoring';
  }
});

// Toggle Monitoring Active/Inactive
async function toggleMonitoring(id, enabled) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to update toggle state.');
    }

    const updatedSite = await response.json();
    showToast(`${updatedSite.name} monitoring ${enabled ? 'enabled' : 'disabled'}.`);
    fetchWebsites();
  } catch (error) {
    console.error('Error toggling monitoring:', error);
    showToast(error.message, 'error');
    // Refresh to revert the visually checked state on failure
    fetchWebsites();
  }
}

// Delete Website
async function deleteWebsite(id, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from monitoring?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete website.');
    }

    showToast(`Removed website: ${name}`, 'info');
    fetchWebsites();
  } catch (error) {
    console.error('Error deleting website:', error);
    showToast(error.message, 'error');
  }
}

// Manual Refresh Button Event
btnRefreshList.addEventListener('click', () => {
  const icon = btnRefreshList.querySelector('i');
  icon.classList.add('fa-spin');
  fetchWebsites().finally(() => {
    setTimeout(() => icon.classList.remove('fa-spin'), 600);
  });
});

// Utility Helpers
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJS(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Initial Fetch on Load
document.addEventListener('DOMContentLoaded', fetchWebsites);
