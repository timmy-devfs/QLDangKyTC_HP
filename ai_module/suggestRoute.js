/**
 * suggestRoute.js - Module AI goi y hoc phan
 * TV-05 phu trach (neu can)
 * npm install @anthropic-ai/sdk
 */
const router = require('express').Router();

router.get('/suggest', async (req, res) => {
   // TODO: Goi Claude API,... de goi y HP
   res.json({ suggestions: [] });
});

module.exports = router;