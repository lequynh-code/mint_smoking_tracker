require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware xác minh initData từ Telegram
function verifyTelegramData(req, res, next) {
  const { initData } = req.body;
  if (!initData) {
    return res.status(401).json({ error: 'Không tìm thấy initData' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      req.user = JSON.parse(urlParams.get('user'));
      next();
    } else {
      return res.status(403).json({ error: 'Xác thực Telegram thất bại!' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'initData không hợp lệ' });
  }
}

// --- API APP 1: TRACKER HÚT THUỐC ---

// Ghi nhận 1 điếu thuốc
app.post('/api/track/log', verifyTelegramData, (req, res) => {
  const userId = req.user.id;
  const firstName = req.user.first_name || 'User';

  db.run(`INSERT OR IGNORE INTO users (telegram_id, first_name) VALUES (?, ?)`, [userId, firstName]);
  db.run(`INSERT INTO smoking_logs (telegram_id) VALUES (?)`, [userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, timestamp: new Date() });
  });
});

// Lấy thống kê số điếu hôm nay
app.post('/api/track/stats', verifyTelegramData, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT COUNT(*) as today_count 
    FROM smoking_logs 
    WHERE telegram_id = ? AND DATE(logged_at, 'localtime') = DATE('now', 'localtime')
  `;

  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ todayCount: row ? row.today_count : 0 });
  });
});

// --- API APP 2: TAM GIÁO CHIÊM NGHIỆM ---

app.post('/api/tamgiao/advice', verifyTelegramData, async (req, res) => {
  const { mood } = req.body;

  try {
    const prompt = `Bạn là một bậc minh sư thông tuệ triết lý Tam Giáo Đồng Nguyên (Nho - Phật - Đạo).
    Người dùng đang cảm thấy/gặp trạng thái: "${mood || 'Thèm thuốc lá / Tâm trí xao động'}".
    Hãy đưa ra một lời khuyên ngắn gọn (khoảng 3-4 câu), đan xen tinh hoa:
    - Nho gia (Self-control, Kỷ luật, Trung dung)
    - Phật gia (Quán chiếu tâm, Buông bỏ cơn thèm, Chánh niệm)
    - Đạo gia (Thuận tự nhiên, Hít thở bình tĩnh, Vô vi)
    Văn phong trầm ấm, thanh tịnh, súc tích và có tính ứng dụng thực hành ngay.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ advice: response.text });
  } catch (error) {
    console.error('Lỗi AI:', error);
    res.status(500).json({ error: 'Không thể kết nối với Minh Sư AI' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));