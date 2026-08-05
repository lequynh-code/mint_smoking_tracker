export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  const url = new URL(context.request.url);
  const user_id = url.searchParams.get('user_id');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (!user_id || !year || !month) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const summary: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_cigarettes,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).bind(user_id, monthStr).first();

    const total = summary?.total_cigarettes || 0;
    const activeDays = summary?.active_days || 0;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : 0;

    return new Response(JSON.stringify({
      month: monthStr,
      total,
      activeDays,
      avgPerDay,
      estimatedCost: total * 1500
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}