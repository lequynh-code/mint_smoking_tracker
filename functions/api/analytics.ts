export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  const url = new URL(context.request.url);
  const user_id = url.searchParams.get('user_id');
  const yearStr = url.searchParams.get('year');
  const monthStr = url.searchParams.get('month');

  if (!user_id || !yearStr || !monthStr) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Tính ngày bắt đầu tháng (VD: 2026-04-01 00:00:00)
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
  
  // Tính ngày bắt đầu của tháng tiếp theo để làm mốc chặn trên
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`;

  try {
    // Query đếm đúng khoảng thời gian từ đầu tháng đến trước đầu tháng sau
    const summary: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_cigarettes,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM smoking_logs 
      WHERE user_id = ? 
        AND created_at >= ? 
        AND created_at < ?
    `).bind(user_id, startOfMonth, startOfNextMonth).first();

    const total = summary?.total_cigarettes || 0;
    const activeDays = summary?.active_days || 0;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';

    return new Response(JSON.stringify({
      month: `${year}-${String(month).padStart(2, '0')}`,
      total: total,
      activeDays: activeDays,
      avgPerDay: avgPerDay,
      estimatedCost: total * 1500
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}