export async function onRequestPost(context: { request: Request; env: { DB: any } }) {
  try {
    const { user_id, action } = await context.request.json() as { user_id: string; action?: string };
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tự động kiểm tra & tạo bảng smoking_logs nếu chưa tồn tại
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS smoking_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    if (action === 'delete') {
      await context.env.DB.prepare(`
        DELETE FROM smoking_logs 
        WHERE id = (
          SELECT id FROM smoking_logs 
          WHERE user_id = ? 
          ORDER BY id DESC LIMIT 1
        )
      `).bind(user_id).run();

      return new Response(JSON.stringify({ success: true, action: 'deleted' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Đảm bảo ghi đúng múi giờ UTC ISO string (YYYY-MM-DD HH:MM:SS)
      const nowISO = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      await context.env.DB.prepare(
        'INSERT INTO smoking_logs (user_id, created_at) VALUES (?, ?)'
      ).bind(user_id, nowISO).run();

      return new Response(JSON.stringify({ success: true, action: 'added' }), {
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