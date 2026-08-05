export async function onRequestPost(context: { request: Request; env: { DB: any } }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const userId = body.user_id || 'demo_user';
    const action = body.action || 'add';
    
    // Đọc year & month gửi từ frontend (nếu có)
    const selectedYear = body.year ? parseInt(body.year, 10) : new Date().getFullYear();
    const selectedMonth = body.month ? parseInt(body.month, 10) : (new Date().getMonth() + 1);

    if (action === 'delete') {
      // Xóa điếu gần nhất thuộc tháng/năm đang chọn
      const targetMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      
      await context.env.DB.prepare(`
        DELETE FROM smoking_logs 
        WHERE id = (
          SELECT id FROM smoking_logs 
          WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
          ORDER BY id DESC LIMIT 1
        )
      `).bind(userId, targetMonthStr).run();

      return new Response(JSON.stringify({ success: true, action: 'deleted' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // TẠO THỜI GIAN THEO THÁNG/NĂM ĐANG CHỌN TRÊN GIAO DIỆN
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      let logTimestamp: string;

      // Nếu đang chọn đúng tháng hiện tại -> Dùng giờ thực tế
      if (selectedYear === currentYear && selectedMonth === currentMonth) {
        logTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);
      } else {
        // Nếu chọn tháng khác (VD: Tháng 7) -> Tạo timestamp rơi vào tháng đó (lấy ngày hiện tại hoặc ngày 15)
        const day = Math.min(now.getDate(), 28); // Đảm bảo ngày hợp lệ cho tất cả các tháng
        const formattedMonth = String(selectedMonth).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const formattedHour = String(now.getHours()).padStart(2, '0');
        const formattedMin = String(now.getMinutes()).padStart(2, '0');
        const formattedSec = String(now.getSeconds()).padStart(2, '0');

        logTimestamp = `${selectedYear}-${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMin}:${formattedSec}`;
      }

      await context.env.DB.prepare(`
        INSERT INTO smoking_logs (user_id, created_at) VALUES (?, ?)
      `).bind(userId, logTimestamp).run();

      return new Response(JSON.stringify({ success: true, created_at: logTimestamp }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}