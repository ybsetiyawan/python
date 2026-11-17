const ping = require('ping');
const { exec } = require('child_process');
const path = require('path');
const MonitorRepository = require('../../../server/repository/monitorRepository');

class MonitorController {
  
  // Fungsi helper privat untuk memicu alarm fisik secara asinkron
  static _triggerPhysicalAlarm(offlineCount) {
    const scriptPath = path.join(__dirname, 'alert_service.py');
    exec(`python3 ${scriptPath} ${offlineCount}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Gagal memicu alarm fisik: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`Alarm warning: ${stderr}`);
        return;
      }
      console.log(`Alarm fisik aktif: ${stdout.trim()}`);
    });
  }

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

      // 3. HITUNG JUMLAH YANG OFFLINE & PICU ALARM FISIK
      const offlineCount = monitoringResults.filter(item => item.status === 'OFFLINE').length;
      
      // Panggil fungsi alarm fisik di background (non-blocking)
      MonitorController._triggerPhysicalAlarm(offlineCount);

      return res.status(200).json({
        success: true,
        total: monitoringResults.length,
        offline_count: offlineCount,
        data: monitoringResults
      });

    } catch (err) {
      console.error('Error monitoring ping controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async pingSingleGateway(req, res) {
    try {
      const { code } = req.params;
      
      const targets = await MonitorRepository.getActiveStockPointGateways();
      const sp = targets.find(i => i.kode_spoint === code);

      if (!sp) {
        return res.status(404).json({ success: false, message: 'Stock Point tidak ditemukan' });
      }

      const ip = sp.ip_gateway;
      const cfg = { timeout: 2 };
      let status = 'ONLINE';
      let color = 'success';
      let latencyText = '-';

      try {
        const resPing = await ping.promise.probe(ip, cfg);
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
      } catch (pingErr) {
        status = 'OFFLINE';
        color = 'error';
      }

      return res.status(200).json({
        success: true,
        data: {
          kode_spoint: sp.kode_spoint,
          nama_spoint: sp.nama_spoint,
          ip_gateway: ip,
          area: sp.area,
          status: status,
          color: color,
          latency: latencyText,
          waktu: new Date().toLocaleTimeString()
        }
      });

    } catch (err) {
      console.error('Error single ping controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = MonitorController;