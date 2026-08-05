import { useState, useEffect } from 'react';

export default function SmokingTracker() {
  const [count, setCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const getUserId = () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    return tgUser?.id ? String(tgUser.id) : 'demo_user';
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?user_id=${getUserId()}&year=${year}&month=${month}`);
      const data = await res.json();
      setAnalytics(data);
      setCount(data.total || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, year]);

  const handleAddCigarette = async () => {
    // 1. Cập nhật giao diện tạm thời cho mượt
    setCount(prev => prev + 1);

    // 2. Gửi request lưu lên Cloudflare D1 Database
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId() })
      });
      fetchAnalytics(); // Làm mới lại số liệu phân tích
    } catch (e) {
      console.error('Lỗi lưu log:', e);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2>🚬 Nhật Ký Hút Thuốc & Phân Tích</h2>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '20px 0' }}>
        <p style={{ color: '#666', margin: 0 }}>Số điếu đã hút trong tháng {month}/{year}</p>
        <h1 style={{ fontSize: '48px', color: '#2e7d32', margin: '10px 0' }}>
          {count} <span style={{ fontSize: '20px' }}>điếu</span>
        </h1>
      </div>

      <button
        onClick={handleAddCigarette}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#ff4d4f',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🚬 Vừa hút 1 điếu (+1)
      </button>

      {/* Khu vực chọn tháng xem báo cáo */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ flex: 1, padding: 8, borderRadius: 8 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ flex: 1, padding: 8, borderRadius: 8 }}>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Thẻ hiển thị số liệu phân tích */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
            <small style={{ color: '#666' }}>Trung bình/ngày</small>
            <h3 style={{ margin: '4px 0', color: '#1976d2' }}>{analytics.avgPerDay} điếu</h3>
          </div>
          <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
            <small style={{ color: '#666' }}>Chi phí ước tính</small>
            <h3 style={{ margin: '4px 0', color: '#d32f2f' }}>{analytics.estimatedCost?.toLocaleString('vi-VN')} đ</h3>
          </div>
        </div>
      )}
    </div>
  );
}