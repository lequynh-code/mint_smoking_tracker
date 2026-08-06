export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id') || url.searchParams.get('userId') || 'demo_user';
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const monthParam = url.searchParams.get('month') || (new Date().getMonth() + 1).toString();

    const formattedMonth = String(monthParam).padStart(2, '0');
    const targetMonthStr = `${yearParam}-${formattedMonth}`;

    // Helper: Chuẩn hóa chuỗi thời gian SQLite (Xử lý linh hoạt cả giờ UTC lẫn giờ đã convert VN)
    // Nếu created_at lưu ISO dạng '2026-08-16T...' hoặc '2026-08-16 10:00:00'
    const sqlDatetime = "datetime(replace(created_at, 'T', ' '))";

    // 1. Tổng số điếu & Số ngày active trong tháng
    const summaryResult: any = await context.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT DATE(${sqlDatetime})) as active_days
      FROM smoking_logs 
      WHERE user_id = ? 
        AND strftime('%Y-%m', ${sqlDatetime}) = ?
    `).bind(userId, targetMonthStr).first();

    const total = summaryResult?.total || 0;
    const activeDays = summaryResult?.active_days || 0;
    
    // Tính trung bình theo số ngày trong tháng để trực quan (hoặc activeDays tùy nhu cầu)
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';
    const estimatedCost = total * 1000; // 1.000đ / điếu

    // 2. Dữ liệu số điếu theo từng NGÀY trong tháng
    const dailyResult: any = await context.env.DB.prepare(`
      SELECT 
        CAST(strftime('%d', ${sqlDatetime}) AS INTEGER) as day, 
        COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? 
        AND strftime('%Y-%m', ${sqlDatetime}) = ?
      GROUP BY day
      ORDER BY day ASC
    `).bind(userId, targetMonthStr).all();

    // 3. Dữ liệu phân bổ theo KHUNG GIỜ
    const hourlyResult: any = await context.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', ${sqlDatetime}) AS INTEGER) as hour, 
        COUNT(*) as count 
      FROM smoking_logs 
      WHERE user_id = ? 
        AND strftime('%Y-%m', ${sqlDatetime}) = ?
      GROUP BY hour
      ORDER BY hour ASC
    `).bind(userId, targetMonthStr).all();

    // Tìm khung giờ cao điểm (Peak Hour)
    let peakHour = 'Chưa có dữ liệu';
    const hourlyList = hourlyResult?.results || [];
    
    if (hourlyList.length > 0) {
      const maxObj = hourlyList.reduce(
        (max: any, item: any) => (item.count > max.count ? item : max),
        hourlyList[0]
      );
      if (maxObj && maxObj.count > 0) {
        const startH = String(maxObj.hour).padStart(2, '0');
        const endH = String((maxObj.hour + 1) % 24).padStart(2, '0');
        peakHour = `${startH}:00 - ${endH}:00 (${maxObj.count} điếu)`;
      }
    }

    const dailyLogs = dailyResult?.results || [];

    return new Response(
      JSON.stringify({
        month: targetMonthStr,
        total,
        activeDays,
        avgPerDay,
        estimatedCost,
        peakHour,
        dailyLogs, // Trả về dailyLogs trùng khớp với FE
        daily: dailyLogs, // Backup thêm key daily
        hourly: hourlyList
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}