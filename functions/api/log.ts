export async function onRequestPost(context: { request: Request; env: { DB: any } }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const userId = body.user_id || 'demo_user';
    const action = body.action || 'add';

    // 1. Tính toán thời gian thực tế theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    const currentYear = vnTime.getUTCFullYear();
    const currentMonth = vnTime.getUTCMonth() + 1;

    // Đọc year & month gửi từ frontend (nếu không có thì lấy tháng/năm hiện tại của VN)
    const selectedYear = body.year ? parseInt(body.year, 10) : currentYear;
    const selectedMonth = body.month ? parseInt(body.month, 10) : currentMonth;

    if (action === 'delete') {
      // Xóa điếu gần nhất thuộc tháng/năm đang chọn
      const targetMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      await context.env.DB.prepare(`
        DELETE FROM smoking_logs 
        WHERE id = (
          SELECT id FROM smoking_logs 
          WHERE user_id = ? AND strftime('%Y-%m', datetime(created_at, '+7 hours')) = ?
          ORDER BY id DESC LIMIT 1
        )
      `).bind(userId, targetMonthStr).run();

      return new Response(JSON.stringify({ success: true, action: 'deleted' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      let logTimestamp: string;

      // 2. Định dạng thời gian lưu vào DB chuẩn giờ Việt Nam (YYYY-MM-DD HH:MM:SS)
      if (selectedYear === currentYear && selectedMonth === currentMonth) {
        // Đang chọn tháng hiện tại -> Lấy giờ thực tế VN
        logTimestamp = vnTime.toISOString().replace('T', ' ').substring(0, 19);
      } else {
        // Nếu chọn tháng khác (VD: Tháng 7) -> Lưu vào ngày 15 (hoặc ngày hiện tại) của tháng đó với giờ VN
        const day = Math.min(vnTime.getUTCDate(), 28);
        const formattedMonth = String(selectedMonth).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const formattedHour = String(vnTime.getUTCHours()).padStart(2, '0');
        const formattedMin = String(vnTime.getUTCMinutes()).padStart(2, '0');
        const formattedSec = String(vnTime.getUTCSeconds()).padStart(2, '0');

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