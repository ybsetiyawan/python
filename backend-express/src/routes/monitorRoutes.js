const express = require('express');
const router = express.Router();

// 💡 Perbaiki path titik-titik dua (../) agar akurat dari folder routes ke server/api/controllers
const MonitorController = require('../server/api/controllers/monitorController');

// Endpoint: GET /api/monitor/ping
router.get('/ping', MonitorController.pingGateways);

module.exports = router;