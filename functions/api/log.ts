export async function onRequestPost(context: { request: Request; env: { DB: any } }) {
  try {
    const { user_id, action } = await context.request.json() as { user_id: string; action?: string };
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      // Xóa 1 lượt ghi nhận gần nhất của user trong tháng/ngày hiện tại
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
      // Thêm 1 điếu mới (+1)
      await context.env.DB.prepare(
        'INSERT INTO smoking_logs (user_id) VALUES (?)'
      ).bind(user_id).run();

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