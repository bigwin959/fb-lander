require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const leadsRouter = require('./routes/leads');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve static files (index.html, image.png, admin.html, etc.) ────────────
app.use(express.static(path.join(__dirname)));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/leads', leadsRouter);

// ─── Admin Dashboard → serve admin.html ──────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ─── Connect to MongoDB & Start ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 Admin dashboard  → http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
