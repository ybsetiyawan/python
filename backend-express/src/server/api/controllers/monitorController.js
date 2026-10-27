const ping = require('ping');
const MonitorRepository = require('../../../server/repository/monitorRepository');

class MonitorController {
  // Method untuk mengecek ping seluruh gateway stock point sekaligus
  static async pingGateways(req, res) {
    try {
      // 1. Ambil seluruh data target dari repository database
      const targets = await MonitorRepository.getActiveStockPointGateways();

      // 2. Lakukan fungsi ping secara paralel menggunakan library npm `ping`
      const pingPromises = targets.map(async (sp) => {
        const ip = sp.ip_gateway;
        
        try {
          const cfg = { timeout: 2 };
          const resPing = await ping.promise.probe(ip, cfg);

          let status = 'ONLINE';
          let color = 'success';
          let latencyText = '-';

          if (!resPing.alive) {
            status = 'OFFLINE';
            color = 'error';
          } else {
            const timeMs = typeof resPing.time === 'number' ? Math.round(resPing.time) : parseInt(resPing.time, 10);
            
            if (isNaN(timeMs) || resPing.time === 'unknown') {
              latencyText = '<1 ms';
            } else {
              latencyText = `${timeMs} ms`;
              if (timeMs > 300) {
                status = 'ONLINE (LAG)';
                color = 'warning';
              }
            }
          }

          return {
            kode_spoint: sp.kode_spoint,
            nama_spoint: sp.nama_spoint,
            ip_gateway: ip,
            area: sp.area,
            status: status,
            color: color,
            latency: latencyText,
            waktu: new Date().toLocaleTimeString()
          };
        } catch (err) {
          return {
            kode_spoint: sp.kode_spoint,
            nama_spoint: sp.nama_spoint,
            ip_gateway: ip,
            area: sp.area,
            status: 'OFFLINE',
            color: 'error',
            latency: '-',
            waktu: new Date().toLocaleTimeString()
          };
        }
      });

      const monitoringResults = await Promise.all(pingPromises);

      return res.status(200).json({
        success: true,
        total: monitoringResults.length,
        data: monitoringResults
      });

    } catch (err) {
      console.error('Error monitoring ping controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = MonitorController;