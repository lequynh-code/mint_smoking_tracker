import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SmokingTracker from './pages/SmokingTracker';
import TamGiaoApp from './pages/TamGiaoApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tự động chuyển trang chủ sang /tracker */}
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