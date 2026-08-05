export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id') || 'demo_user';
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const monthParam = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

    // Format tháng thành dạng 2 chữ số (VD: tháng 8 -> "08")
    const formattedMonth = String(monthParam).padStart(2, '0');
    const targetMonthStr = `${yearParam}-${formattedMonth}`; // VD: "2026-08"

    // Query 1: Tỉnh tổng số điếu của đúng tháng/năm truyền lên
    // Lọc theo định dạng YYYY-MM bằng hàm strftime của SQLite
    const totalResult: any = await context.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).bind(userId, targetMonthStr).first();

    // Query 2: Lấy dữ liệu từng ngày trong tháng để vẽ biểu đồ
    const dailyResult: any = await context.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(userId, targetMonthStr).all();

    return new Response(JSON.stringify({
      total: totalResult?.total || 0,
      daily: dailyResult?.results || []
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}