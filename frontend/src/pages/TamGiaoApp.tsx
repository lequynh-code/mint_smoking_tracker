import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import { Sparkles, Compass } from 'lucide-react';

export default function TamGiaoApp() {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Kiểm tra an toàn trước khi gọi hàm của SDK
    const tg = (WebApp as any)?.default || WebApp;
    if (tg && typeof tg.ready === 'function') {
      tg.ready();
      tg.expand();
    }
  }, []);

  const getAdvice = async (mood: string) => {
    setLoading(true);
    const tg = (WebApp as any)?.default || WebApp;

    try {
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      // Bỏ qua lỗi HapticFeedback trên trình duyệt thường
    }

    try {
      const res = await axios.post(`${API_URL}/api/tamgiao/advice`, {
        initData: tg?.initData || '',
        mood: mood
      });
      setAdvice(res.data.advice);
    } catch (e) {
      setAdvice('Không thể kết nối với Backend hoặc AI. (Đang test trên trình duyệt local).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'serif', backgroundColor: '#faf8f5', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', paddingTop: 10 }}>
        <Compass size={44} color="#8c6d46" />
        <h2 style={{ color: '#5c4033', marginTop: 8, marginBottom: 4 }}>Tam Giáo Chiêm Nghiệm</h2>
        <p style={{ fontSize: 12, color: '#7f6a5b', margin: 0 }}>Nho gia Khắc kỷ • Phật gia Chánh niệm • Đạo gia Vô vi</p>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '24px 0' }}>
        <button onClick={() => getAdvice('Đang thèm thuốc lá')} style={btnStyle}>🚬 Thèm thuốc</button>
        <button onClick={() => getAdvice('Căng thẳng áp lực')} style={btnStyle}>🧘 Căng thẳng</button>
        <button onClick={() => getAdvice('Cầu sự bình an')} style={btnStyle}>📜 Bình an</button>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: '#8c6d46', fontStyle: 'italic' }}>
          Minh sư đang quán chiếu triết lý...
        </p>
      )}

      {advice && !loading && (
        <div style={{
          background: '#fff',
          border: '1px solid #e8dfd8',
          borderRadius: 12,
          padding: 20,
          lineHeight: 1.7,
          color: '#3c2f2f',
          boxShadow: '0 4px 12px rgba(140, 109, 70, 0.08)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#8c6d46', display: 'flex', alignItems: 'center', gap: 6, fontSize: 16 }}>
            <Sparkles size={18} /> Lời Khuyên Minh Sư:
          </h4>
          <p style={{ whiteSpace: 'pre-line', margin: 0, fontSize: 15 }}>{advice}</p>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  flex: 1,
  padding: '12px 6px',
  borderRadius: 8,
  border: '1px solid #c8b9ab',
  background: '#fff',
  color: '#5c4033',
  fontSize: 13,
  fontWeight: 'bold' as const,
  cursor: 'pointer'
};