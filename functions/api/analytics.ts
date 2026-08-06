export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id') || url.searchParams.get('userId') || 'demo_user';
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const monthParam = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

    const formattedMonth = String(monthParam).padStart(2, '0');
    const targetMonthStr = `${yearParam}-${formattedMonth}`;

    // 1. Tổng số điếu & Số ngày active (Múi giờ +7)
    const summaryResult: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT DATE(datetime(created_at, '+7 hours'))) as active_days
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', datetime(created_at, '+7 hours')) = ?
    `).bind(userId, targetMonthStr).first();

    const total = summaryResult?.total || 0;
    const activeDays = summaryResult?.active_days || 0;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';
    const estimatedCost = total * 1000; // 1.000đ / điếu

    // 2. Dữ liệu số điếu theo từng NGÀY trong tháng (Đã sửa từ %H sang %d và GROUP BY day)
    const dailyResult: any = await context.env.DB.prepare(`
      SELECT 
        CAST(strftime('%d', datetime(created_at, '+7 hours')) AS INTEGER) as day, 
        COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', datetime(created_at, '+7 hours')) = ?
      GROUP BY day
      ORDER BY day ASC
    `).bind(userId, targetMonthStr).all();

    // 3. Dữ liệu phân bổ theo KHUNG GIỜ (Đã bổ sung múi giờ +7)
    const hourlyResult: any = await context.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', datetime(created_at, '+7 hours')) AS INTEGER) as hour, 
        COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? AND strftime('%Y-%m', datetime(created_at, '+7 hours')) = ?
      GROUP BY hour
      ORDER BY hour ASC
    `).bind(userId, targetMonthStr).all();

    // Tìm khung giờ hút nhiều nhất (Peak Hour)
    let peakHour = 'Chưa có';
    if (hourlyResult?.results && hourlyResult.results.length > 0) {
      const maxObj = hourlyResult.results.reduce(
        (max: any, item: any) => (item.count > max.count ? item : max),
        hourlyResult.results[0]
      );
      const startH = String(maxObj.hour).padStart(2, '0');
      const endH = String((maxObj.hour + 1) % 24).padStart(2, '0');
      peakHour = `${startH}:00 - ${endH}:00 (${maxObj.count} điếu)`;
    }

    return new Response(
      JSON.stringify({
        month: targetMonthStr,
        total,
        activeDays,
        avgPerDay,
        estimatedCost,
        peakHour,
        daily: dailyResult?.results || [],
        hourly: hourlyResult?.results || []
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}