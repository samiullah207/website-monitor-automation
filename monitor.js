const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables (useful for local testing)
dotenv.config();

const DATA_FILE = path.join(__dirname, 'websites.json');

// Configuration from environment variables
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ALERT_TO_EMAIL = process.env.ALERT_TO_EMAIL;

// Setup email transporter if credentials are provided
let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
  console.log('✅ Gmail Alert System: Configured successfully.');
} else {
  console.log('⚠️ Gmail Alert System: Credentials not set. Running in status-check only mode.');
  console.log('   (To enable email alerts, configure GMAIL_USER and GMAIL_APP_PASSWORD in your environment/secrets.)');
}

// Helper to send alert emails
async function sendAlertEmail(website, previousStatus, currentStatus) {
  if (!transporter || !ALERT_TO_EMAIL) {
    console.log(`ℹ️ Alert generated but email not configured: "${website.name}" is ${currentStatus}.`);
    return;
  }

  const isDown = currentStatus === 'Down';
  const subject = isDown 
    ? `🚨 ALERT: Website Offline - ${website.name}` 
    : `✅ RECOVERY: Website Online - ${website.name}`;

  const textContent = isDown
    ? `Hello,

Your monitored website "${website.name}" is OFFLINE.

Details:
• Name: ${website.name}
• URL: ${website.url}
• Status: DOWN
• Checked At: ${new Date().toUTCString()}

Please investigate the issue immediately.

Best,
UptimePulse Automation`
    : `Hello,

Your monitored website "${website.name}" has RECOVERED and is now ONLINE.

Details:
• Name: ${website.name}
• URL: ${website.url}
• Status: UP
• Checked At: ${new Date().toUTCString()}

Best,
UptimePulse Automation`;

  const htmlContent = isDown
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ef4444; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">🚨 Uptime Alert: Website Offline</h2>
        </div>
        <div style="padding: 24px; color: #1f2937; background-color: #ffffff; line-height: 1.6;">
          <p style="font-size: 16px;">The following monitored website is <strong>OFFLINE</strong>:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; width: 120px;">Website Name</td>
              <td style="padding: 10px 0; color: #4b5563;">${website.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Target URL</td>
              <td style="padding: 10px 0; color: #2563eb;"><a href="${website.url}" style="color: #2563eb; text-decoration: none;">${website.url}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Status</td>
              <td style="padding: 10px 0;"><span style="background-color: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">DOWN</span></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Time Checked</td>
              <td style="padding: 10px 0; color: #4b5563;">${new Date().toUTCString()}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This is an automated notification from UptimePulse. You will be notified again once the website recovers.</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #10b981; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">✅ Uptime Recovery: Website Online</h2>
        </div>
        <div style="padding: 24px; color: #1f2937; background-color: #ffffff; line-height: 1.6;">
          <p style="font-size: 16px;">Great news! The following website has <strong>RECOVERED</strong> and is now back online:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; width: 120px;">Website Name</td>
              <td style="padding: 10px 0; color: #4b5563;">${website.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Target URL</td>
              <td style="padding: 10px 0; color: #2563eb;"><a href="${website.url}" style="color: #2563eb; text-decoration: none;">${website.url}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">Status</td>
              <td style="padding: 10px 0;"><span style="background-color: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">UP & ONLINE</span></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Time Checked</td>
              <td style="padding: 10px 0; color: #4b5563;">${new Date().toUTCString()}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This is an automated notification from UptimePulse. Your services are running normally.</p>
        </div>
      </div>
    `;

  try {
    await transporter.sendMail({
      from: `"UptimePulse Monitor" <${GMAIL_USER}>`,
      to: ALERT_TO_EMAIL,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`✉️ Email notification sent for "${website.name}" (${currentStatus}).`);
  } catch (error) {
    console.error(`❌ Error sending email alert for "${website.name}":`, error.message);
  }
}

// Function to check a single website status
async function checkWebsite(website) {
  // If not enabled, return the original object without checking
  if (!website.enabled) {
    return website;
  }

  const previousStatus = website.status;
  let currentStatus = 'unknown';
  const checkedTime = new Date().toISOString();

  console.log(`🔍 Checking website: "${website.name}" (${website.url})...`);

  try {
    // Axios request with a 10-second timeout
    // Using a common User-Agent string to prevent blocks from sites that reject basic bots
    const response = await axios.get(website.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      validateStatus: function (status) {
        // Any status code in the 2xx or 3xx range is considered "Up"
        return status >= 200 && status < 400;
      }
    });

    currentStatus = 'Up';
    console.log(`   🟢 STATUS: UP (${response.status})`);
  } catch (error) {
    currentStatus = 'Down';
    let detail = error.message;
    if (error.response) {
      detail = `HTTP ${error.response.status}`;
    } else if (error.code) {
      detail = error.code; // e.g. ENOTFOUND, ECONNREFUSED
    }
    console.log(`   🔴 STATUS: DOWN (${detail})`);
  }

  // Trigger alert if status transition occurs:
  // 1. Goes Down: (Up -> Down) or (unknown -> Down)
  // 2. Recovers: (Down -> Up)
  const isStatusTransition = previousStatus !== currentStatus;
  const isDownTransition = (previousStatus === 'Up' || previousStatus === 'unknown') && currentStatus === 'Down';
  const isUpTransition = previousStatus === 'Down' && currentStatus === 'Up';

  if (isStatusTransition && (isDownTransition || isUpTransition)) {
    console.log(`💥 Status changed for "${website.name}": ${previousStatus} ➡️ ${currentStatus}. Triggering alert...`);
    await sendAlertEmail(website, previousStatus, currentStatus);
  }

  return {
    ...website,
    status: currentStatus,
    lastChecked: checkedTime,
  };
}

// Main execution function
async function runMonitor() {
  console.log(`==================================================`);
  console.log(`🕒 Uptime Monitor Cycle Started: ${new Date().toISOString()}`);
  console.log(`==================================================`);

  // 1. Read websites list
  if (!fs.existsSync(DATA_FILE)) {
    console.log(`⚠️ Data file "${DATA_FILE}" does not exist. Exiting.`);
    return;
  }

  let websites = [];
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    websites = JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Error parsing websites.json:', error);
    process.exit(1);
  }

  if (websites.length === 0) {
    console.log('ℹ️ No websites configured in websites.json. Exiting monitor.');
    return;
  }

  // 2. Check each website (run in parallel)
  const updatedWebsites = await Promise.all(
    websites.map(site => checkWebsite(site))
  );

  // 3. Write results back to websites.json
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedWebsites, null, 2));
    console.log(`💾 Successfully updated websites.json with current statuses.`);
  } catch (error) {
    console.error('❌ Error writing updates to websites.json:', error);
    process.exit(1);
  }

  console.log(`==================================================`);
  console.log(`🏁 Uptime Monitor Cycle Completed.`);
  console.log(`==================================================`);
}

// Execute monitor run
runMonitor();
