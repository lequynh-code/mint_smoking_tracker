export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id') || 'demo_user';
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const monthParam = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

    // Format tháng dạng 2 chữ số: 7 -> "07"
    const formattedMonth = String(monthParam).padStart(2, '0');
    const targetMonthStr = `${yearParam}-${formattedMonth}`; // VD: "2026-07"

    // Query 1: Lấy tổng số điếu và số ngày thực tế có ghi nhận hút thuốc trong tháng
    const summaryResult: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).bind(userId, targetMonthStr).first();

    const total = summaryResult?.total || 0;
    const activeDays = summaryResult?.active_days || 0;

    // Tính trung bình/ngày (chia cho số ngày active trong tháng, nếu chưa có ngày nào thì bằng 0)
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';

    // Tính chi phí ước tính (ví dụ: 1.500đ / điếu)
    const COST_PER_CIGARETTE = 1500;
    const estimatedCost = total * COST_PER_CIGARETTE;

    // Query 2: Lấy dữ liệu thống kê theo từng ngày (dùng vẽ biểu đồ nếu cần)
    const dailyResult: any = await context.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(userId, targetMonthStr).all();

    // Trả về đầy đủ tất cả các trường cho Frontend
    return new Response(JSON.stringify({
      month: targetMonthStr,
      total: total,
      activeDays: activeDays,
      avgPerDay: avgPerDay,
      estimatedCost: estimatedCost,
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