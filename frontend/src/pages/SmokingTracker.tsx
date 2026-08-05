import { useState, useEffect } from 'react';

export default function SmokingTracker() {
  const [count, setCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Mặc định chọn tháng/năm hiện tại
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
        setCount(data.total || 0); // Gán số điếu đúng của tháng đó
      } else {
        setCount(0);
      }
    } catch (e) {
      console.error('Lỗi lấy dữ liệu tháng:', e);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi API mỗi khi biến month hoặc year thay đổi
  useEffect(() => {
    fetchAnalytics(month, year);
  }, [month, year]);

  const handleAddCigarette = async () => {
    try {
      // Gửi timestamp chính xác lên server
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: getUserId(),
          created_at: new Date().toISOString()
        })
      });
      // Load lại đúng số liệu tháng đang chọn
      fetchAnalytics(month, year);
    } catch (e) {
      console.error('Lỗi lưu log:', e);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>🚬 Nhật Ký Hút Thuốc & Phân Tích</h2>

      {/* Thẻ hiển thị số điếu của tháng đang chọn */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '20px 0' }}>
        <p style={{ color: '#666', margin: 0 }}>Số điếu đã hút trong tháng {month}/{year}</p>
        <h1 style={{ fontSize: '48px', color: '#2e7d32', margin: '10px 0' }}>
          {loading ? '...' : count} <span style={{ fontSize: '20px' }}>điếu</span>
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