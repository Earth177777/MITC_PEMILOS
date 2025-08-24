# Local Testing Guide for the Electronic Voting System

This guide provides step-by-step instructions on how to set up and test the entire application on your local machine.

## 1. Prerequisites & Setup

Before you begin, ensure you have the following software installed:

-   **Node.js:** [v18 or later](https://nodejs.org/) is recommended.
-   **MongoDB:** The database for the application. You can install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) to run it locally.
-   **Git:** For cloning the repository.

## 2. Installation & Configuration

1.  **Clone the Repository:**
    ```bash
    git clone <your_repository_url>
    cd <project_folder>np
    ```

2.  **Install All Dependencies:**
    From the root directory of the project, run:
    ```bash
    npm install
    ```
    This will install dependencies for both the `frontend` and `backend` workspaces.

3.  **Configure the Backend:**
    Navigate to the backend folder, copy the example environment file, and edit it if necessary.
    ```bash
    cd backend
    cp .env.example .env
    ```
    The default settings in `.env` are `MONGO_URI=mongodb://127.0.0.1:27017/electronic-voting-system` and `PORT=3001`, which are perfect for a standard local MongoDB setup.

4.  **Start Your Local MongoDB Server:**
    Open a new terminal window and start the MongoDB service. The command may vary based on your OS and installation method. For many systems, it is:
    ```bash
    mongod
    ```
    Keep this terminal running in the background.

5.  **Seed the Database:**
    In your project terminal (from the root directory), run the seed script to populate the database with initial candidate data.
    ```bash
    npm run seed --workspace=backend
    ```

## 3. Running the Application

From the **root directory** of the project, start both the backend and frontend servers with a single command:
```bash
npm run dev
```

You will see output from both servers in your terminal.
-   The **backend API** is now running at `http://localhost:3001`.
-   The **frontend application** is now accessible at `http://localhost:5173`.

## 4. Step-by-Step Testing Walkthrough

To effectively test the system's workflow, it's best to simulate both an administrator and a voter. We recommend using two separate browser windows or tabs.

#### **Window 1: The Administrator's View**

1.  Open your web browser and navigate to `http://localhost:5173`.
2.  Press **`Shift + V`** to open the **Administration Panel**. You will see the status of all five voting booths, currently "OFFLINE".

#### **Window 2: The Voter's View**

1.  Open a second browser window (or tab) and navigate to `http://localhost:5173`.
2.  You will see the **Device Login** screen.
3.  Log in with the credentials for the first booth:
    -   **Username:** `booth1`
    -   **Password:** `password1`
4.  After a successful login, this window will now display the **"Waiting Page"**, indicating that the booth is ready and waiting for authorization.

#### **Simulating the Vote**

1.  **Authorize the Vote:**
    -   Switch back to **Window 1 (Administrator)**.
    -   You will see that "Voting Booth 1" status has changed from "OFFLINE" to **"READY"** in real-time.
    -   Click the **"VERIFY VOTE"** button for Booth 1.

2.  **Cast the Vote:**
    -   Quickly switch back to **Window 2 (Voter)**.
    -   The screen has now changed to the **candidate selection page**, and the 60-second timer has started.
    -   Click the **"VOTE"** button for any candidate. A confirmation modal will appear.
    -   Click **"Confirm Vote"**.

3.  **Observe the Result:**
    -   The Voter window will display the **"VOTE CAST SUCCESSFULLY"** overlay for 10 seconds, then automatically return to the **"Waiting Page"** for the next voter.
    -   The Administrator window will show Booth 1's status returning to **"READY"**.

#### **Verifying Results and Master Controls**

1.  **Live Monitoring:**
    -   In the Administrator window, press **`Shift + W`** to open the **Live Election Monitoring** panel.
    -   You will see the total vote count has increased, and the vote distribution chart reflects the vote you just cast.

2.  **Master Controls:**
    -   In the Administrator window, press **`Shift + @`**, then **`A`**.
    -   This opens the **Master Control Panel**. Enter the password (`masterkey2024`) to perform an action like **"PAUSE ELECTION"**.
    -   Switch to the Voter window to see that the waiting page now shows the "ELECTION PAUSED" message.

You have now successfully tested the core end-to-end workflow of the application!
