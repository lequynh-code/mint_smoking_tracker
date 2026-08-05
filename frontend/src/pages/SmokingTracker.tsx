import { useState, useEffect } from 'react';

export default function SmokingTracker() {
  const [userName, setUserName] = useState<string>('Bạn');
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // 1. Lấy tên user Telegram
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user?.first_name) {
      setUserName(user.first_name);
    }

    // 2. Tải số điếu đã lưu từ localStorage
    const savedCount = localStorage.getItem('smoking_today');
    const savedDate = localStorage.getItem('smoking_date');
    const today = new Date().toDateString();

    if (savedDate !== today) {
      // Sang ngày mới -> Reset về 0
      localStorage.setItem('smoking_date', today);
      localStorage.setItem('smoking_today', '0');
      setCount(0);
    } else if (savedCount) {
      setCount(parseInt(savedCount, 10));
    }
  }, []);

  // 3. Hàm bấm nút "Vừa hút 1 điếu"
  const handleAddCigarette = () => {
    const newCount = count + 1;
    setCount(newCount);

    const today = new Date().toDateString();
    localStorage.setItem('smoking_today', newCount.toString());
    localStorage.setItem('smoking_date', today);

    // Lưu log thời gian chi tiết
    const logs = JSON.parse(localStorage.getItem('smoking_logs') || '[]');
    logs.push({ timestamp: new Date().toISOString() });
    localStorage.setItem('smoking_logs', JSON.stringify(logs));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>🚬 Nhật Ký Hút Thuốc</h2>
      <p>Xin chào, <strong>{userName}</strong>!</p>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '20px 0' }}>
        <p style={{ color: '#666', margin: 0 }}>Số điếu đã hút hôm nay</p>
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
          cursor: 'pointer'
        }}
      >
        🚬 Vừa hút 1 điếu (+1)
      </button>

      <div style={{ marginTop: '20px', background: '#fafafa', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
        <strong>Lời khuyên:</strong> Hãy giãn khoảng cách giữa các lần hút tối thiểu 2 tiếng để bảo vệ sức khỏe.
      </div>
    </div>
  );
}