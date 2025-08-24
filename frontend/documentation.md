# SMA Maitreyawira & Mitc Club - Electronic Voting System
## Technical & Operational Manual

---

### 1. System Overview

This document provides a comprehensive operational guide for the SMA Maitreyawira & Mitc Club Electronic Voting System.

**Purpose:** The application is a professional, kiosk-style electronic voting system designed for supervised elections. It operates on a multi-device model where individual voting "booths" (devices) are managed by a central administrator from a series of hidden control panels.

**Design Philosophy:** The system is built on a foundation of security, integrity, and user experience. The entire interface is designed as a non-scrolling, single-screen application to create a focused and seamless experience for the voter. All administrative functions are centralized and protected to ensure a controlled and fair election process.

**Branding:** The user interface reflects the professional identity of SMA Maitreyawira, utilizing a clean, light theme with a distinct brand color palette.

---

### 2. Core Features

- **Centralized Administration:** Hidden control panels accessible via keyboard shortcuts allow for complete management of voting booths and the overall election state.
- **Real-time Updates:** The administrator panels are powered by WebSockets, providing instant, real-time status updates without any delay.
- **Live Election Monitoring:** A dedicated administrative view provides live election results, pushed directly from the server.
- **Mandatory Voting Protocol:** To ensure election integrity, every authorized voting session requires a vote to be cast.
- **Voter Session Timer & Alerts:** Each voter has a visible 60-second timer. The session automatically locks on timeout, and administrators are alerted with audio-visual cues to voter inactivity.
- **Secure Access:** Critical administrative functions are protected by multi-key sequences and password confirmation.
- **Focused Kiosk UI:** The non-scrolling, vertically centered interface eliminates distractions and provides a clean, professional experience on any display.

---

### 3. User Roles & Workflow

The system operates with two primary roles: the **Voting Booth** (for the voter) and the **Administrator**.

#### 3.1 The Voting Booth

This is the standard interface that a voter interacts with. Each physical device must be logged in to be identified as a specific booth.

##### Login Credentials

| Booth Name       | Username | Password    |
| :--------------- | :------- | :---------- |
| Voting Booth 1   | `booth1` | `booth1MITC` |
| Voting Booth 2   | `booth2` | `booth2MITC` |
| Voting Booth 3   | `booth3` | `booth3MITC` |
| Voting Booth 4   | `booth4` | `booth4MITC` |
| Voting Booth 5   | `booth5` | `booth5MITC` |

##### Booth States

- **WAITING:** After a successful login, the booth is ready and awaits activation from an administrator.
- **VOTING_ALLOWED:** The administrator has authorized the session. The voter has 60 seconds to select a candidate.
- **SUCCESS:** A vote has been successfully cast. The screen displays a confirmation and automatically resets for the next voter after 10 seconds.
- **TIMEOUT:** The 60-second voting timer has expired. The booth is locked and requires an election official's attention.

#### 3.2 The Administrator

An administrator can access three hidden control panels from any device running the application using specific keyboard shortcuts.

##### Administration Panel
- **Access:** Press `Shift + V`
- **Purpose:** This is the primary control panel for managing individual voting booths.
- **Features:**
  - View the real-time status of all connected booths (OFFLINE, READY, ACTIVE, PAUSED, DISABLED).
  - Authorize a voter at a "READY" booth by clicking the "VERIFY VOTE" button. This action changes the booth's state to "VOTING_ALLOWED" and starts the 60-second timer for the voter.
  - **Inactivity Alert:** If a booth remains in the "ACTIVE" state for more than 60 seconds, a prominent visual and audible alert will notify the administrator.

##### Master Control Panel
- **Access:** Press `Shift + @`, then `A` (Shift+2, then A)
- **Purpose:** This panel provides high-level control over the entire election. All actions require master password confirmation.
- **Master Password:** `masterkey2024`
- **Features:**
  - **Global Election Control:**
    - `PAUSE ELECTION`: Temporarily halts all voting activity. Booths in the "WAITING" state will display a "PAUSED" message. New logins are blocked.
    - `RESUME ELECTION`: Lifts the global pause, allowing voting to continue.
    - `CLOSE ELECTION`: Permanently ends the election. All voting is stopped, and the system is locked. This action is irreversible.
  - **Voting Booth Management:**
    - `DISABLE`: Deactivates a specific booth, preventing it from being used.
    - `ENABLE`: Re-activates a disabled booth, returning it to an "OFFLINE" state (it must be logged in again).
  - **Administrator Audit Log:** Displays a timestamped log of all major administrative actions taken from this panel.

##### Live Election Monitoring
- **Access:** Press `Shift + W`
- **Purpose:** Provides a real-time view of the election results.
- **Features:**
  - **Live Vote Count:** Displays the total number of votes cast.
  - **Live Vote Distribution:** Shows a bar chart and individual statistics for each candidate, including their total votes and percentage share.
  - **Real-time Updates:** Data is pushed live from the server, ensuring the display is always current.

---

### 4. Technical Architecture

- **Frontend:** A Single-Page Application (SPA) built with React and TypeScript, using Vite for a fast development experience.
- **Backend:** A robust and scalable server built with the Nest.js framework.
- **Database:** MongoDB is used for persistent storage of candidate data, vote counts, and audit logs.
- **Real-time Communication:** The entire system uses a WebSocket connection (via Socket.IO) for instant, bidirectional communication between the clients and the Nest.js server. This eliminates the need for HTTP polling and ensures all administrator views are updated in real-time.