require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const aiRoutes = require('./routes/ai');
const vocabRoutes = require('./routes/vocab');
const libraryRoutes = require('./routes/library');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Serve uploaded PDFs statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/library', libraryRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
