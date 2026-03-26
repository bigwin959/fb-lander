const express = require('express');
const router  = express.Router();
const Lead    = require('../models/lead');

// ─── Helper: detect contact type ────────────────────────────────────────────
function detectContactType(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^\+?[\d\s\-]{7,15}$/.test(value))         return 'telegram';
  return 'other';
}

// ─── POST /api/leads  ────────────────────────────────────────────────────────
// Called by the landing page CTA button
router.post('/', async (req, res) => {
  try {
    const { contact, contactType: ctFromBody, source: srcFromBody } = req.body;

    if (!contact || contact.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Contact is required.' });
    }

    const validTypes = ['email', 'telegram', 'whatsapp', 'other'];
    const contactType = validTypes.includes(ctFromBody) ? ctFromBody : detectContactType(contact.trim());

    const validSources = ['cricket-lander', 'insider-advantage'];
    const source = validSources.includes(srcFromBody) ? srcFromBody : 'cricket-lander';

    const ip        = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const lead = await Lead.create({
      contact:     contact.trim(),
      contactType,
      source,
      ip,
      userAgent,
    });

    return res.status(201).json({ success: true, message: 'You are in! We will reach you shortly.', id: lead._id });
  } catch (err) {
    console.error('POST /api/leads error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/leads  (admin protected) ──────────────────────────────────────
// Usage: GET /api/leads?secret=cricket_admin_2024&page=1&limit=50
router.get('/', async (req, res) => {
  const { secret, page = 1, limit = 50, type, source } = req.query;

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  try {
    const filter = {};
    if (type)   filter.contactType = type;
    if (source) filter.source      = source;

    const total  = await Lead.countDocuments(filter);
    const leads  = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      leads,
    });
  } catch (err) {
    console.error('GET /api/leads error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/leads/:id  (admin protected) ────────────────────────────────
router.delete('/:id', async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  try {
    await Lead.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Lead deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
