# Zoo Database Project – Visual Studio Code Setup Requirements

This document outlines the **minimum required software, tools, and configuration** needed to install, develop, and deploy the Zoo Database Full-Stack Application using **React (Frontend)**, **Node.js (Backend)**, **SQL Server Express 2019 (Database)**, and **Azure (Deployment)** in **Visual Studio Code (VS Code)**.

No Visual Studio Code extensions are required.

---

## 1. System Requirements

### 1.1 Operating System

* Windows 10 / 11 (recommended for SQL Server Express)

### 1.2 Hardware (Minimum Recommended)

* CPU: Dual-core processor
* RAM: 8 GB (minimum 4 GB)
* Storage: 10 GB free disk space
* Internet connection (for package installation and Azure deployment)

---

## 2. Required Software

### 2.1 Visual Studio Code

* Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)
* Purpose: Code editor for frontend and backend development

No additional VS Code extensions are required for this project.

---

### 2.2 Node.js and npm

* Version: **Node.js LTS (18.x or later)**
* Download: [https://nodejs.org/](https://nodejs.org/)

Includes:

* **npm** (Node Package Manager)

Verify installation:

```bash
node -v
npm -v
```

---

### 2.3 SQL Server Express 2019

* Version: **Microsoft SQL Server Express 2019**
* Download: [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)

Includes:

* SQL Server Database Engine only

Purpose:

* Store and manage zoo data (animals, staff, customers, sales, revenue)

Note:

* SQL Server Management Studio (SSMS) is **not required** and must not be used for this project
* Database creation and management may be performed using SQL scripts or application code

---

### 2.4 Git (Version Control)

* Download: [https://git-scm.com/](https://git-scm.com/)
* Purpose: Source control and collaboration

Verify installation:

```bash
git --version
```

---

## 3. Project Dependencies

### 3.1 Frontend – React

Create the React application:

```bash
npx create-react-app zoo-frontend
```

Key dependencies:

* react
* react-dom
* react-router-dom
* axios (for API communication)

Run frontend locally:

```bash
npm start
```

---

### 3.2 Backend – Node.js & Express

Initialize backend:

```bash
mkdir zoo-backend
cd zoo-backend
npm init -y
```

Install backend dependencies:

```bash
npm install express mssql cors dotenv
```

Optional development dependency:

```bash
npm install --save-dev nodemon
```

Key packages:

* express – REST API framework
* mssql – SQL Server database connectivity
* cors – Cross-origin request handling
* dotenv – Environment variable management

Run backend locally:

```bash
node server.js
# or
npx nodemon server.js
```

---

### 3.3 Database Configuration

Create a new database using a SQL script (executed via application setup or command-line tools):

```sql
CREATE DATABASE ZooDB;
```

Example environment variables (`.env` file):

```env
DB_SERVER=localhost
DB_DATABASE=ZooDB
DB_USER=sa
DB_PASSWORD=yourpassword
PORT=5000
```

---

## 4. Azure Deployment Requirements

### 4.1 Azure Account

* An active Azure account is required
* Azure Portal: [https://portal.azure.com/](https://portal.azure.com/)

---

### 4.2 Backend Deployment (Azure App Service)

* Deploy Node.js backend to **Azure App Service**
* Configure environment variables in Azure App Service settings
* Ensure SQL Server connection string is stored securely in Azure configuration

---

### 4.3 Database Deployment

* Use one of the following:

  * Azure SQL Database
  * SQL Server hosted on Azure Virtual Machine

Purpose:

* Provide cloud-hosted access to zoo data for the deployed application

---

### 4.4 Frontend Deployment

* Build React app:

```bash
npm run build
```

* Deploy using one of the following:

  * Azure Static Web Apps
  * Azure App Service

---

## 5. Running the Application Locally

1. Start SQL Server Express
2. Run backend server
3. Run React frontend
4. Access the application through the browser

---

## 6. Summary

This document defines the **minimum setup requirements** to successfully develop and deploy the Zoo Database Full-Stack Application using:

* React (Frontend)
* Node.js & Express (Backend)
* SQL Server Express 2019 (Database)
* Azure (Cloud Deployment)
* Visual Studio Code (Editor)

No additional VS Code extensions or enforced folder structure are required.

---

*End of Document*
