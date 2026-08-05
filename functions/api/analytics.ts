export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id') || 'demo_user';
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const monthParam = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

    const formattedMonth = String(monthParam).padStart(2, '0');
    const targetMonthStr = `${yearParam}-${formattedMonth}`;

    // 1. Tổng số điếu & Số ngày active
    const summaryResult: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).bind(userId, targetMonthStr).first();

    const total = summaryResult?.total || 0;
    const activeDays = summaryResult?.active_days || 0;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';
    const estimatedCost = total * 1500; // 1.500đ / điếu

    // 2. Dữ liệu số điếu theo từng ngày trong tháng (Dùng vẽ biểu đồ ngày)
    const dailyResult: any = await context.env.DB.prepare(`
      SELECT CAST(strftime('%d', created_at) AS INTEGER) as day, COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      GROUP BY day
      ORDER BY day ASC
    `).bind(userId, targetMonthStr).all();

    // 3. Dữ liệu phân bổ theo khung giờ (Dùng vẽ biểu đồ giờ / Peak Hours)
    const hourlyResult: any = await context.env.DB.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      GROUP BY hour
      ORDER BY hour ASC
    `).bind(userId, targetMonthStr).all();

    // Tìm khung giờ hút nhiều nhất (Peak Hour)
    let peakHour = 'Chưa có';
    if (hourlyResult?.results?.length > 0) {
      const maxObj = hourlyResult.results.reduce((max: any, item: any) => item.count > max.count ? item : max, hourlyResult.results[0]);
      peakHour = `${maxObj.hour}h:00 - ${maxObj.hour + 1}h:00 (${maxObj.count} điếu)`;
    }

    return new Response(JSON.stringify({
      month: targetMonthStr,
      total,
      activeDays,
      avgPerDay,
      estimatedCost,
      peakHour,
      daily: dailyResult?.results || [],
      hourly: hourlyResult?.results || []
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