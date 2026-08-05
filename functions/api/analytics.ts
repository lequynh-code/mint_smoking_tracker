export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  const url = new URL(context.request.url);
  const user_id = url.searchParams.get('user_id');
  const yearStr = url.searchParams.get('year');
  const monthStr = url.searchParams.get('month');

  if (!user_id || !yearStr || !monthStr) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const targetYearMonth = `${year}-${String(month).padStart(2, '0')}`;

  try {
    // Ép kiểu created_at về dạng YYYY-MM bằng strftime của SQLite
    const summary: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_cigarettes,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM smoking_logs 
      WHERE user_id = ? 
        AND (
          strftime('%Y-%m', created_at) = ? 
          OR strftime('%Y-%m', datetime(created_at, 'unixepoch')) = ?
        )
    `).bind(user_id, targetYearMonth, targetYearMonth).first();

    const total = summary?.total_cigarettes || 0;
    const activeDays = summary?.active_days || 0;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';

    return new Response(JSON.stringify({
      month: targetYearMonth,
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}