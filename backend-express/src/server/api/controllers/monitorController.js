const ping = require('ping');
const { exec } = require('child_process');
const path = require('path');
const MonitorRepository = require('../../../server/repository/monitorRepository');

// Helper delay (jeda waktu dalam milidetik)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Fungsi helper untuk menjalankan sekali proses ping (menghasilkan monitoringResults & offlineCount)
  static async _executePingCheck() {
    const targets = await MonitorRepository.getActiveStockPointGateways();

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
    const offlineCount = monitoringResults.filter(item => item.status === 'OFFLINE').length;
    
    return { monitoringResults, offlineCount };
  }

  // Method untuk mengecek ping (mendukung Triple Check khusus untuk Cron)
  static async pingGateways(req, res) {
    try {
      const isCronTrigger = req.query.trigger === 'cron';

      if (!isCronTrigger) {
        // Jika diakses biasa via Dashboard Web (bukan cron), cukup ping 1 kali saja secara instan
        const { monitoringResults, offlineCount } = await MonitorController._executePingCheck();
        return res.status(200).json({
          success: true,
          total: monitoringResults.length,
          offline_count: offlineCount,
          data: monitoringResults
        });
      }

      // JIKA DIPANGGIL OLEH CRON: Jalankan TRIPLE CHECK (3 kali pengecekan)
      console.log('[MONITOR] Memulai siklus Triple Check (3 kali pengecekan)...');
      let finalResults = [];
      let finalOfflineCount = 0;

      for (let i = 1; i <= 3; i++) {
        console.log(`[TRIPLE CHECK] Pengecekan ke-${i} berjalan...`);
        const { monitoringResults, offlineCount } = await MonitorController._executePingCheck();
        
        finalResults = monitoringResults;
        finalOfflineCount = offlineCount;

        // Jika bukan cek terakhir, berikan jeda 30 detik sebelum cek berikutnya
        if (i < 3) {
          await sleep(10000); // 10 detik jeda
        }
      }

      console.log(`[TRIPLE CHECK SELESAI] Mengambil hasil ke-3. Offline terdeteksi: ${finalOfflineCount} perangkat.`);

      // AMBIL HASIL KETIGA DAN PICU ALARM FISIK
      MonitorController._triggerPhysicalAlarm(finalOfflineCount);

      return res.status(200).json({
        success: true,
        total: finalResults.length,
        offline_count: finalOfflineCount,
        data: finalResults
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