const express = require('express');
const router = express.Router();

// Beispielroute
router.get('/status', (req, res) => {
  res.json({ status: 'API läuft' });
});

module.exports = router;
