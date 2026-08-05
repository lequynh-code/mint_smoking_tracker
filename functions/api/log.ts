export async function onRequestPost(context: { request: Request; env: { DB: any } }) {
  try {
    const { user_id } = await context.request.json() as { user_id: string };
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
    }

    await context.env.DB.prepare(
      'INSERT INTO smoking_logs (user_id) VALUES (?)'
    ).bind(user_id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}