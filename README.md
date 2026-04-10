# 🔐 Privacy Twin

A full-stack privacy risk analysis system that evaluates user behavior and detects potential security risks in real time using a **Chrome Extension + Web Dashboard**.

---

## 🚀 Overview

**Privacy Twin** helps users understand how their digital habits impact their online security.
It analyzes multiple behavioral and environmental factors (like password strength, public WiFi usage, etc.) and generates a **risk score with actionable insights**.

The system integrates:

* 🌐 **Chrome Extension** → detects risk in real time
* 📊 **React Dashboard** → visualizes and simulates risk
* 🗄 **Backend API (Node.js + MongoDB)** → stores and processes data

---

## ✨ Features

### 🔍 Real-Time Risk Detection

* Detects login forms and sensitive fields on websites
* Displays instant warning popups using the extension

### 📊 Risk Simulation Engine

* Calculates risk score based on user inputs
* Categorizes risk into:

  * 🟢 Low
  * 🟡 Medium
  * 🔴 High

### 🧠 Smart Recommendations

* Suggests improvements like:

  * Enable 2FA
  * Avoid public WiFi
  * Use strong passwords

### 🕓 Recent Activity Tracking

* Stores user simulations in MongoDB
* Displays recent activity in dashboard sidebar

### 🧹 Clear History

* Allows users to delete all stored simulation records

### 🎨 Modern UI/UX

* Glassmorphism design
* Smooth animations and hover effects
* Clean and interactive dashboard

---

## 🛠 Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

### Chrome Extension

* Manifest V3
* Content Scripts
* Background Scripts

---

## 🧩 System Architecture

```
Chrome Extension → Backend API → MongoDB
                       ↓
                 React Dashboard
```

---

## 📂 Project Structure

```
/frontend        → React dashboard
/backend         → Express server + APIs
/extension       → Chrome extension files
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Arjit-dev/privacy-digital-twin.git
cd privacy-digital-twin
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```
MONGO_URI=your_mongodb_connection_string
```

Run backend:

```bash
npm start
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### 4. Chrome Extension Setup

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `/extension` folder

---

## 📸 Demo Workflow

1. Open any website
2. Extension detects sensitive inputs
3. Displays risk popup
4. Open dashboard
5. Simulate user behavior
6. View risk score, recommendations, and recent activity

---

## 🧠 Key Learnings

* Built a complete **full-stack application + browser extension**
* Designed a **risk scoring system based on user behavior**
* Implemented **real-time communication between extension and backend**
* Managed persistent data using MongoDB
* Created a modern UI with strong UX focus

---

## 🚧 Future Improvements

* Full history analytics with filtering
* Machine learning-based risk prediction
* Cloud deployment (AWS / Vercel / Mongo Atlas)
* Multi-user authentication improvements

---

## 👤 Author

**Arjit M**

* Full-stack development
* Chrome Extension development
* UI/UX Design
* System architecture

---

## 📌 Note

This project was developed as part of an academic project and demonstrates practical implementation of privacy risk analysis using modern web technologies.
