const express = require('express');
const router  = express.Router();
const LeadV2  = require('../models/leadV2');

// ─── Helper: detect contact type ────────────────────────────────────────────
function detectContactType(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^\+?[\d\s\-]{7,15}$/.test(value))         return 'telegram';
  return 'other';
}

// ─── POST /api/leads-v2  ─────────────────────────────────────────────────────
// Called by the V2 landing page CTA
router.post('/', async (req, res) => {
  try {
    const { contact, contactType: ctFromBody } = req.body;

    if (!contact || contact.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Contact is required.' });
    }

    const validTypes = ['email', 'telegram', 'whatsapp', 'other'];
    const contactType = validTypes.includes(ctFromBody) ? ctFromBody : detectContactType(contact.trim());

    const ip        = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const lead = await LeadV2.create({
      contact:     contact.trim(),
      contactType,
      ip,
      userAgent,
    });

    return res.status(201).json({ success: true, message: 'You are in! We will reach you shortly.', id: lead._id });
  } catch (err) {
    console.error('POST /api/leads-v2 error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/leads-v2  (admin protected) ────────────────────────────────────
router.get('/', async (req, res) => {
  const { secret, page = 1, limit = 50, type } = req.query;

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  try {
    const filter = {};
    if (type) filter.contactType = type;

    const total  = await LeadV2.countDocuments(filter);
    const leads  = await LeadV2.find(filter)
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
    console.error('GET /api/leads-v2 error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/leads-v2/:id  (admin protected) ─────────────────────────────
router.delete('/:id', async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  try {
    await LeadV2.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Lead deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
