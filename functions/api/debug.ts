export async function onRequestGet(context: { request: Request; env: { DB: any } }) {
  try {
    // Lấy 20 bản ghi mới nhất
    const records = await context.env.DB.prepare(
      'SELECT id, user_id, created_at FROM smoking_logs ORDER BY id DESC LIMIT 20'
    ).all();

    // Lấy cấu trúc bảng (schema)
    const tableInfo = await context.env.DB.prepare(
      "PRAGMA table_info(smoking_logs)"
    ).all();

    return new Response(JSON.stringify({ tableInfo: tableInfo.results, records: records.results }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}