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
- **Live Election Monitoring:** A dedicated administrative view provides live election results, with a privacy-conscious data refresh delay to protect voter anonymity.
- **Mandatory Voting Protocol:** To ensure election integrity, every authorized voting session requires a vote to be cast.
- **Voter Session Timer & Alerts:** Each voter has a visible 60-second timer. The session automatically locks on timeout, and administrators are alerted to voter inactivity.
- **Secure Access:** Critical administrative functions are protected by multi-key sequences and password confirmation.
- **Focused Kiosk UI:** The non-scrolling, vertically centered interface eliminates distractions and provides a clean, professional experience on any display.

---

### 3. User Roles & Workflow

The system operates with two primary roles: the **Voting Booth** (for the voter) and the **Administrator**.

#### 3.1 The Voting Booth

This is the standard interface that a voter interacts with. Each physical device must be logged in to be identified as a specific booth.

##### Login Credentials

| Booth Name       | Username | Password      |
| :--------------- | :------- | :------------ |
| Voting Booth 1   | `booth1` | `booth1MITC`  |
| Voting Booth 2   | `booth2` | `booth2MITC`  |
| Voting Booth 3   | `booth3` | `booth3MITC`  |
| Voting Booth 4   | `booth4` | `booth4MITC`  |
| Voting Booth 5   | `booth5` | `booth5MITC`  |
| Voting Booth 6   | `booth6` | `booth6MITC`  |

##### Booth States

- **WAITING:** After a successful login, the booth is ready and awaits activation from an administrator.
- **VOTING_ALLOWED:** The booth is active and a voter can cast their ballot within the 60-second timer.
- **SUCCESS:** A vote has been successfully cast. The screen displays a confirmation and automatically resets for the next voter after 10 seconds.
- **TIMEOUT:** The 60-second voting timer has expired. The booth is locked and requires an election official's attention.
- **OFFLINE:** The booth is disconnected or not logged in.
- **DISABLED:** The booth has been administratively disabled and cannot be used for voting.

#### 3.2 The Administrator

Administrators can access multiple control panels and functions using keyboard shortcuts. **All administrative functions require password authentication for security.**

---

### 4. Keyboard Shortcuts & Administrative Access

**SECURITY NOTICE:** All keyboard shortcuts that access administrative functions require password authentication to prevent unauthorized access.

#### 4.1 Administrative Panel Access

##### Administration Panel
- **Shortcut:** `Shift + V`
- **Password Required:** Yes - Master Administrator Password
- **Default Password:** `masterkey2024`
- **Purpose:** Primary control panel for managing individual voting booths
- **Features:**
  - View real-time status of all connected booths
  - Authorize voters at "READY" booths by clicking "VERIFY VOTE"
  - Monitor booth activity with inactivity alerts
  - Enable/disable individual voting booths

##### Live Count Monitoring
- **Shortcut:** `Shift + W`
- **Password Required:** Yes - Master Administrator Password
- **Default Password:** `masterkey2024`
- **Purpose:** Real-time election results monitoring
- **Features:**
  - Live vote count display
  - Candidate ranking and statistics
  - Total votes cast counter
  - Last updated timestamp

##### Master Control Panel
- **Shortcut:** `Shift + @` (Shift + 2), then `A`
- **Password Required:** Yes - Master Administrator Password
- **Default Password:** `masterkey2024`
- **Purpose:** High-level election control and management
- **Features:**
  - **Global Election Control:**
    - `PAUSE ELECTION`: Temporarily halt all voting activity
    - `RESUME ELECTION`: Resume paused election
    - `CLOSE ELECTION`: Permanently end the election (irreversible)
  - **Booth Management:**
    - Enable/disable individual voting booths
    - View detailed booth status information
  - **Audit Trail:**
    - Complete log of all administrative actions
    - Timestamped security events
    - System activity monitoring

#### 4.2 Emergency & Testing Functions

##### Force Vote (Emergency Bypass)
- **Shortcut:** `Shift + P`
- **Password Required:** No (Emergency function)
- **Purpose:** Emergency voting bypass for testing or special circumstances
- **Features:**
  - Bypasses normal booth login process
  - Allows direct access to voting interface
  - Can be used multiple times (resets after each vote)
  - Logs all force votes for audit purposes
- **Security Note:** This function should only be used by authorized personnel for testing or emergency situations

#### 4.3 Password Security

**Master Administrator Password:** `masterkey2024`
- Used for all administrative panel access
- Required for election control functions
- Should be changed in production environments
- Stored securely and can be updated via environment variables

**Password Requirements:**
- All administrative shortcuts require password authentication
- Passwords are validated server-side for security
- Failed authentication attempts are logged for audit
- Rate limiting prevents brute force attacks

---

### 5. Security Features

- **Multi-layer Authentication:** Keyboard shortcuts + password confirmation
- **Audit Logging:** All administrative actions are logged with timestamps
- **Rate Limiting:** Protection against brute force attacks
- **Session Management:** Secure WebSocket connections with automatic reconnection
- **Input Validation:** All user inputs are sanitized and validated
- **Emergency Bypass Tracking:** Force votes are logged for accountability

---

### 6. Operational Procedures

#### 6.1 Election Setup
1. Start backend and frontend servers
2. Access Master Control Panel (`Shift + @`, then `A`)
3. Verify all booths are configured and offline
4. Test booth login credentials
5. Verify candidate data is loaded

#### 6.2 During Election
1. Monitor booth status via Administration Panel (`Shift + V`)
2. Authorize voters using "VERIFY VOTE" buttons
3. Handle timeouts and technical issues
4. Monitor live results if needed (`Shift + W`)

#### 6.3 Emergency Procedures
- Use `Shift + P` for emergency voting bypass
- Access Master Control Panel for election pause/resume
- Check audit logs for any security concerns

---

### 7. Technical Notes

- **Booth Limit:** System supports up to 6 voting booths
- **Session Timeout:** 60 seconds per voting session
- **Reconnection:** Automatic WebSocket reconnection maintains session state
- **Browser Compatibility:** Modern browsers with WebSocket support required
- **Network Requirements:** Stable local network connection between booths and server