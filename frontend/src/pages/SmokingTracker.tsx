import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import { Cigarette, HeartPulse, RefreshCw } from 'lucide-react';

export default function SmokingTracker() {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Lấy đối tượng Telegram WebApp an toàn
  const tg = (WebApp as any)?.default || WebApp;

  useEffect(() => {
    try {
      if (tg && typeof tg.ready === 'function') {
        tg.ready();
        tg.expand();
      }
    } catch (e) {
      console.warn('Đang test ngoài Telegram');
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/track/stats`, { 
        initData: tg?.initData || '' 
      });
      setTodayCount(res.data.todayCount || 0);
    } catch (e) {
      console.error('Lỗi tải dữ liệu:', e);
    }
  };

  const logSmoking = async () => {
    setLoading(true);
    try {
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
    } catch (e) {}

    try {
      await axios.post(`${API_URL}/api/track/log`, { 
        initData: tg?.initData || '' 
      });
      setTodayCount(prev => prev + 1);
      
      if (tg?.showAlert) {
        tg.showAlert('Đã ghi nhận 1 điếu!');
      } else {
        alert('Đã ghi nhận 1 điếu!');
      }
    } catch (e) {
      alert('Không thể kết nối Backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2>🚬 Nhật Ký Hút Thuốc</h2>
      <p style={{ color: '#666' }}>
        Xin chào, <b>{tg?.initDataUnsafe?.user?.first_name || 'Bạn'}</b>!
      </p>

      <div style={{ background: '#f5f5f5', borderRadius: 16, padding: '24px 16px', margin: '24px 0' }}>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Số điếu đã hút hôm nay</p>
        <h1 style={{ fontSize: 56, margin: '12px 0', color: todayCount > 10 ? '#d32f2f' : '#2e7d32' }}>
          {todayCount} <span style={{ fontSize: 20, fontWeight: 'normal' }}>điếu</span>
        </h1>
      </div>

      <button
        onClick={logSmoking}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          backgroundColor: loading ? '#ccc' : '#ff4d4f',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
        }}
      >
        {loading ? <RefreshCw className="animate-spin" /> : <Cigarette />} 
        Vừa hút 1 điếu (+1)
      </button>

      <div style={{ marginTop: 32, textAlign: 'left', fontSize: 13, color: '#777', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 }}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <HeartPulse size={16} color="#d32f2f" />
          <b>Lời khuyên:</b> Hãy giãn khoảng cách giữa các lần hút tối thiểu 2 tiếng để bảo vệ sức khỏe.
        </p>
      </div>
    </div>
  );
}