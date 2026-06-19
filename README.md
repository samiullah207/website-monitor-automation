# 🌐 UptimePulse | 24/7 Website Monitoring & Alerting Dashboard

**UptimePulse** is a clean, modern, self-contained dashboard and automation system designed to monitor website uptime 24/7. When a website goes down, UptimePulse instantly detects the offline status and dispatches email alerts using Gmail and Node.js.

The monitoring runs entirely **for free** on GitHub Actions every 5 minutes, updating a local status data file (`websites.json`) so your local dashboard always shows the latest checked state.

---

## ⚡ Features
- 🚀 **Modern Web Dashboard**: Glassmorphic dark UI with live statistics and responsive table.
- ⚙️ **Easy Management**: Add, remove, and toggle monitoring (enable/disable) for any site in real time.
- 🕒 **GitHub Actions Scheduler**: Automatically runs checks every 5 minutes (using free GitHub runners).
- 📧 **Gmail Alerts**: Sends beautiful responsive HTML emails as soon as a site goes offline or recovers.
- 💾 **State Persistence**: Checks update `websites.json` directly within the repository.

---

## 📂 Project Structure
```text
site-monitor/
├── .github/
│   └── workflows/
│       └── monitor.yml  # GitHub Actions schedule check runner
├── public/              # Web Dashboard assets (served locally)
│   ├── index.html       # Clean structural interface
│   ├── style.css        # Premium dark glassmorphic design
│   └── app.js           # Interactive state and API calls
├── .env.example         # Sample local environment settings
├── .gitignore           # File exclusion list
├── monitor.js           # Uptime checking & SMTP emailing logic
├── package.json         # Node.js project definition
├── README.md            # You are here!
├── server.js            # Express API server for dashboard
└── websites.json        # Database storing all website statuses
```

---

## 🛠️ Getting Started

### 1. Local Dashboard Setup
To manage your list of websites, run the dashboard server locally:

1. Make sure [Node.js](https://nodejs.org) (v18+) is installed.
2. Clone/download this repository.
3. Open a terminal in the project directory and install dependencies:
   ```bash
   npm install
   ```
4. Start the local server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

### 2. Configure Email Alert Credentials
UptimePulse uses Gmail to send notifications. To prevent using your raw Google account password, you must create a secure **Google App Password**:

1. Go to your **Google Account Settings** -> **Security**.
2. Enable **2-Step Verification** (required to generate App Passwords).
3. Search for **App Passwords** in the search bar or go to [Google App Passwords](https://myaccount.google.com/apppasswords).
4. Create a new app (e.g. name it "UptimePulse Monitor") and copy the generated **16-character password** (remove spaces).
5. For local testing, copy `.env.example` to a new file named `.env`, and fill in the values:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-password
   ALERT_TO_EMAIL=receiver-email@gmail.com
   ```

---

### 3. Deploying 24/7 Automation via GitHub Actions
To automate status checks every 5 minutes:

1. Push this project to a **GitHub Repository**.
2. In your GitHub repository, click on **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
3. Add the following secrets:
   - `GMAIL_USER`: Your Gmail email address.
   - `GMAIL_APP_PASSWORD`: The 16-character Google App Password generated in Step 2.
   - `ALERT_TO_EMAIL`: The recipient email address that should receive down/recovery alerts.
4. **Enable Repository Writes for GitHub Actions**:
   - Go to **Settings** -> **Actions** -> **General**.
   - Scroll down to **Workflow permissions**.
   - Select **Read and write permissions**.
   - Click **Save**.
   *(This allows GitHub Actions to push updated check statuses in `websites.json` back to your repository so your local dashboard stays updated).*

---

## 🧠 Why Google Antigravity Was Used Instead of VS Code

This project was built entirely from scratch using the **Google Antigravity AI Agent** instead of traditional development in VS Code. Here is why Antigravity offers a superior experience for end-to-end project building:

1. **Autonomous Architecture & Orchestration**: While VS Code is a text editor requiring the developer to manually create folders, install packages, write templates, and debug links, Antigravity acts as a pair-programmer that plans the architecture, constructs multiple files synchronously (Express server, CSS styles, UI logic, and Git workflows), and links them correctly without manual intervention.
2. **Living Execution Plans**: Antigravity maintains living documents like `implementation_plan.md` and `task.md` inside its runtime. This establishes a continuous loop of review, refinement, and step-by-step validation. In VS Code, the developer must manage checklists and review cycles manually.
3. **Background Validation & Command Execution**: Antigravity executes system shell commands directly (such as configuring `npm install` in the background) and watches the log outputs. It identifies and acts on issues autonomously, removing friction.
4. **Zero-Placeholder Guarantee**: Unlike online templates or standard coding assistants that output incomplete snippets (e.g., `// TODO: add code here`), Antigravity writes complete, production-grade, and well-commented code files ready for immediate deployment.
