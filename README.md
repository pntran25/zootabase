# Welcome to Zootabase! 🦒

Hey there! If you're looking to get familiar with our zoo management system, you're in the right place. We built Zootabase to handle everything from keeping track of animal health records to selling tickets and managing employees. It's a full-stack project broken down into a modern React frontend and a robust Node.js/Express backend. 

Here is a breakdown of how the repository is structured, what the important files do, and how you can get it up and running on your own machine.

---

## What's Inside? (Project Structure)

### 1. The Frontend (`/frontend`)
This is what our guests and zoo staff see and interact with. It's built in React and stylized heavily with TailwindCSS for a clean, responsive flair.
*   **`src/App.js` & `src/index.js`**: The main entry points where everything gets loaded. We use React Router here to bounce between our public pages (home, tickets, exhibits) and our hidden admin dashboards.
*   **`src/components/`**: This folder handles all the UI blocks. We separated it clearly into `Admin/` (which holds all the heavy data tables and management forms) and `User/` (for the aesthetic pages guests look at).
*   **`src/layout/`**: Files like `AdminLayout.js` and `Sidebar.js`. These wrappers ensure our navigation menus and footers stay consistent across different views without having to rewrite them.
*   **Authentication (Firebase)**: We use the Firebase Client SDK on the frontend. When a user creates an account or logs in, these scripts reach out to Firebase directly, grabbing an authentication token that tracks their active session.

### 2. The Backend (`/backend`)
The engine behind the scenes. It's an Express server that handles data requests, talks to our SQL database, and verifies user identities.
*   **`server.js`**: The foundational setup file. It loads environment variables, enables CORS headers, connects to our SQL Server instance via the `mssql` package, and pulls in all of our individual route files.
*   **`routes/`**: You'll find modular files here (like `animals.js`, `staff.js`, `products.js`). Instead of having one massive API file, we gave each major feature its own specific routing file to keep the codebase readable and easy to debug. 

### 3. The Middleware (`/backend/middleware`)
*   **`authMiddleware.js`**: Security is critical, especially for admin tools. Every time someone tries to modify data or visit an admin route, this script catches the request first. It rips open the authorization headers, decodes the Firebase ID token, and checks with Google to make sure the user is legit. If the token is invalid or expired, it kicks them out immediately.

### 4. Firebase Authentication (`/backend/services`)
*   **`firebaseSetup.js`**: While the frontend handles the visual login screen, the backend needs to verify those logins securely. This file initializes the Firebase Admin SDK using a secure service account. It acts as our server-side connection to Firebase, allowing our middleware to independently verify tokens without just blindly trusting what the frontend sends.

---

## 💻 Installing and Running Zootabase Locally

If you're bringing this onto a new computer, follow these steps to get everything running nicely. 

### Prerequisites
Before you start, make sure you have:
1.  **Node.js** installed on your machine.
2.  A local instance of **Microsoft SQL Server** running, or a cloud-hosted equivalent.
3.  A **Firebase account/project** configured for web authentication.

### Step 1: Set Up the Database
1. Open your SQL Server management tool (like SSMS or Azure Data Studio).
2. Create a brand new database (you might call it `ZootabaseDB`).
3. Take the raw contents of `backend/Schema.sql` and execute the query against your new database. This instantly creates all the necessary tables with correct relationships.

### Step 2: Configure and Boot the Backend
1. Open up your terminal and change directories into the backend folder to install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. The server needs to know where your database and Firebase project are located. Create a file named exactly `.env` inside the `backend` folder.
3. Fill it out with your personal credentials:
   ```env
   DB_USER=your_sql_user_here
   DB_PASSWORD=your_sql_password_here
   DB_SERVER=localhost
   DB_DATABASE=ZootabaseDB
   ```
4. **Firebase Key:** Drop your Firebase private key JSON file into the backend folder (rename it to `service-account.json` so `firebaseSetup.js` automatically picks it up).
5. Start the server!
   ```bash
   npm run dev
   ```
   *(We use `nodemon`, so your server will automatically restart if you save any changes to backend files).*

### Step 3: Configure and Boot the Frontend
1. Open up a second, completely separate terminal window. Navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Just like the backend, the frontend needs to know your specific Firebase endpoints to process guest logins. Create a `.env` in the `frontend` directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

And that's it! Your browser will automatically pop open to `http://localhost:3000` and the app should be staring back at you. If you run into issues, always double-check those `.env` variables or ensure your SQL server actually has TCP connections enabled. Happy coding! 🦁
