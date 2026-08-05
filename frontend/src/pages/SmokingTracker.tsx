import { useState, useEffect } from 'react';

export default function SmokingTracker() {
  const [count, setCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const getUserId = () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    return tgUser?.id ? String(tgUser.id) : 'demo_user';
  };

  const fetchAnalytics = async (selectedMonth: number, selectedYear: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?user_id=${getUserId()}&year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
        setCount(data.total || 0);
      } else {
        setCount(0);
      }
    } catch (e) {
      console.error('Lỗi lấy dữ liệu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(month, year);
  }, [month, year]);

  // Xử lý CỘNG (+1)
  const handleAddCigarette = async () => {
    // 1. Tăng ngay trên màn hình để giao diện phản hồi lập tức
    setCount(prev => prev + 1);

    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), action: 'add' })
      });
      fetchAnalytics(month, year);
    } catch (e) {
      console.error('Lỗi cộng điếu:', e);
      // Nếu lỗi thì hoàn tác
      setCount(prev => Math.max(0, prev - 1));
    }
  };

  // Xử lý TRỪ (-1)
  const handleRemoveCigarette = async () => {
    if (count <= 0) return;

    // 1. Giảm ngay trên màn hình
    setCount(prev => Math.max(0, prev - 1));

    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), action: 'delete' })
      });
      fetchAnalytics(month, year);
    } catch (e) {
      console.error('Lỗi trừ điếu:', e);
      setCount(prev => prev + 1);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>🚬 Nhật Ký Hút Thuốc & Phân Tích</h2>

      {/* Khung hiển thị số điếu */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '20px 0' }}>
        <p style={{ color: '#666', margin: 0 }}>Số điếu đã hút trong tháng {month}/{year}</p>
        <h1 style={{ fontSize: '48px', color: '#2e7d32', margin: '10px 0' }}>
          {loading ? '...' : count} <span style={{ fontSize: '20px' }}>điếu</span>
        </h1>
      </div>

      {/* Cụm nút Cộng / Trừ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
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
            boxShadow: '0 4px 10px rgba(255, 77, 79, 0.2)'
          }}
        >
          🚬 Vừa hút 1 điếu (+1)
        </button>

        <button
          onClick={handleRemoveCigarette}
          disabled={count <= 0}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: count <= 0 ? '#e0e0e0' : '#f0f0f0',
            color: count <= 0 ? '#a0a0a0' : '#555',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: count <= 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ↩ Click nhầm / Trừ 1 điếu (-1)
        </button>
      </div>

      {/* Bộ lọc Tháng / Năm */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select 
          value={month} 
          onChange={(e) => setMonth(Number(e.target.value))} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '15px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>

        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '15px', border: '1px solid #ccc' }}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Khung Phân Tích Thống Kê */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
          <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
            <small style={{ color: '#666' }}>Trung bình/ngày</small>
            <h3 style={{ margin: '4px 0', color: '#1976d2' }}>{analytics.avgPerDay} điếu</h3>
          </div>
          <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
            <small style={{ color: '#666' }}>Chi phí ước tính</small>
            <h3 style={{ margin: '4px 0', color: '#d32f2f' }}>
              {Number(analytics.estimatedCost || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}