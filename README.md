# Vocabulary PDF Reader

A GenAI-powered web application that allows users to upload and read PDF documents, select English text, and instantly get structured Sinhala translations along with extracted advanced vocabulary.

This tool is designed to enhance language learning by transforming real reading material into an interactive study aid.

## ✨ Features

- **Interactive PDF Viewer**: Upload and read PDFs directly in the browser with zoom and page navigation.
- **AI-Powered Extraction**: Select text within a PDF and right-click to send it to Gemini AI for translation and vocabulary extraction.
- **Smart Vocabulary Lists**: Automatically extracts non-trivial English words and provides both English and Sinhala meanings.
- **Non-Volatile Storage**: Saves your extracted vocabulary to a MongoDB database.
- **"My Vocabulary" Dashboard**: A searchable modal dashboard to view and manage all historically saved words.
- **Duplicate Prevention**: AI extraction avoids saving duplicate words to keep your vocabulary clean.
- **Premium UI**: Designed with modern glassmorphism aesthetics, interactive glowing elements, and dark mode optimizations.

## 🛠 Tech Stack

### Frontend
- **React (Vite 5)**
- **Zustand** (State Management)
- **react-pdf** (PDF Rendering)
- **Axios** (API Requests)
- Vanilla CSS + Modern UI/UX

### Backend
- **Node.js** & **Express**
- **MongoDB** via **Mongoose** (Atlas Cloud DB)
- **Google Gen AI SDK** (`@google/genai` utilizing `gemini-2.5-flash`)

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en) (v20+ recommended)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- A [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) string (or local MongoDB database)

### 1. Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster.mongodb.net/?appName=appName
   GEMINI_API_KEY=AIzaSy...your-api-key...
   ```
4. Start the backend:
   ```bash
   node index.js
   ```
   *The server should run on `http://localhost:5000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies (we use `--legacy-peer-deps` due to some React 18 / pdfjs-dist strict peer resolution):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The app should be available at `http://localhost:5173`.*

## 📖 Usage

1. Open `http://localhost:5173` in your browser.
2. Click the upload area to select a PDF from your computer.
3. Highlight any English text in the document.
4. Right-click the highlighted text and click "Ask AI".
5. View the context menu pop-up showing the translation.
6. The side panel will display extracted vocabulary, categorized by "New" and "Already Saved".
7. Click "Save to DataBase" to safely store the newly discovered words.
8. Click the "My Vocabulary" icon (📚) in the top right to access all historically saved words in your learning dashboard.

## 📝 License

This project is open-source and available under the MIT License.
