import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SmokingTracker() {
  const [count, setCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // State AI Insight
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

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
        setAnalytics(null);
      }
    } catch (e) {
      console.error('Lỗi lấy dữ liệu:', e);
    } finally {
      setLoading(false);
    }
  };

  // Gọi AI lấy nhận xét
  const fetchAiInsight = async () => {
    if (!analytics || analytics.total === 0) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: analytics.total,
          avgPerDay: analytics.avgPerDay,
          peakHour: analytics.peakHour,
          month: `${month}/${year}`
        })
      });
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (e) {
      console.error('Lỗi AI Insight:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(month, year);
    setAiInsight(''); // Reset AI text khi đổi tháng
  }, [month, year]);

  const handleAddCigarette = async () => {
    setCount(prev => prev + 1);
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), action: 'add', month, year })
      });
      fetchAnalytics(month, year);
    } catch (e) {
      setCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleRemoveCigarette = async () => {
    if (count <= 0) return;
    setCount(prev => Math.max(0, prev - 1));
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), action: 'delete', month, year })
      });
      fetchAnalytics(month, year);
    } catch (e) {
      setCount(prev => prev + 1);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>🚬 Nhật Ký Hút Thuốc & Phân Tích</h2>

      {/* Thẻ tổng quan */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', textAlign: 'center', margin: '15px 0' }}>
        <p style={{ color: '#666', margin: 0 }}>Số điếu đã hút trong tháng {month}/{year}</p>
        <h1 style={{ fontSize: '48px', color: '#2e7d32', margin: '10px 0' }}>
          {loading ? '...' : count} <span style={{ fontSize: '20px' }}>điếu</span>
        </h1>
      </div>

      {/* Nút bấm +1 / -1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={handleAddCigarette}
          style={{ width: '100%', padding: '16px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🚬 Vừa hút 1 điếu (+1)
        </button>

        <button
          onClick={handleRemoveCigarette}
          disabled={count <= 0}
          style={{ width: '100%', padding: '10px', backgroundColor: count <= 0 ? '#e0e0e0' : '#f0f0f0', color: count <= 0 ? '#a0a0a0' : '#555', border: '1px solid #ccc', borderRadius: '8px', cursor: count <= 0 ? 'not-allowed' : 'pointer' }}
        >
          ↩ Click nhầm / Trừ 1 điếu (-1)
        </button>
      </div>

      {/* Dropdown Bộ Lọc */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* 2 Thẻ Chỉ Số Trung Bình & Chi Phí */}
      {analytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
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

          {/* Thẻ Khung giờ cao điểm */}
          <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', border: '1px solid #ffe0b2', marginBottom: '20px' }}>
            <small style={{ color: '#e65100', fontWeight: 'bold' }}>⏰ Khung giờ hút nhiều nhất:</small>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#bf360c', fontWeight: 'bold' }}>{analytics.peakHour}</p>
          </div>

          {/* BIỂU ĐỒ 1: TẦN SUẤT THEO NGÀY TRONG THÁNG */}
          {analytics.daily && analytics.daily.length > 0 && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Số điếu theo ngày trong tháng</h4>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.daily}>
                    <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} width={25} />
                    <Tooltip formatter={(value: any) => [`${value} điếu`, 'Số lượng']} labelFormatter={(label) => `Ngày ${label}`} />
                    <Bar dataKey="count" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CỤM PHÂN TÍCH AI INSIGHT */}
          <div style={{ background: '#f0f7ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae0ff', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#0958d9' }}>🤖 AI Đánh Giá Thói Quen</strong>
              <button 
                onClick={fetchAiInsight} 
                disabled={loadingAi}
                style={{ background: '#1677ff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                {loadingAi ? 'Đang suy nghĩ...' : 'Phân tích ngay'}
              </button>
            </div>
            {aiInsight ? (
              <p style={{ margin: 0, fontSize: '14px', color: '#1d39c4', lineHeight: '1.5' }}>{aiInsight}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#8c8c8c' }}>Bấm nút "Phân tích ngay" để nhận đánh giá và lời khuyên cá nhân hóa từ AI.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}