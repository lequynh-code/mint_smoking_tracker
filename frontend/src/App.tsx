import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SmokingTracker from './pages/SmokingTracker';
import TamGiaoApp from './pages/TamGiaoApp';
import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand(); // Mở rộng toàn màn hình Telegram
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tracker" replace />} />
        <Route path="/tracker" element={<SmokingTracker />} />
        <Route path="/tamgiao" element={<TamGiaoApp />} />
        <Route path="*" element={
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h3>404 - Trang không tồn tại</h3>
            <p>Vui lòng mở app từ Telegram!</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}