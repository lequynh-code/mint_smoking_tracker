export async function onRequestPost(context: { request: Request; env: { DB: any; GEMINI_API_KEY?: string } }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { total, avgPerDay, peakHour, month } = body;

    if (!total || total === 0) {
      return new Response(JSON.stringify({ 
        insight: "Tháng này bạn chưa hút điếu nào. Tuyệt vời! Hãy tiếp tục duy trì phong độ này nhé!" 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = context.env.GEMINI_API_KEY || 'AIzaSyD2DXrbn-4wP-FrmHR_evV2iO17EkZQG58';
    const prompt = `Bạn là một trợ lý sức khỏe tinh tế và hóm hỉnh. 
Hãy phân tích ngắn gọn thói quen hút thuốc tháng ${month} của người dùng với các thông số:
- Tổng số điếu: ${total} điếu
- Trung bình: ${avgPerDay} điếu/ngày
- Khung giờ hút nhiều nhất: ${peakHour}

Đưa ra đánh giá ngắn gọn trong 2-3 câu: 1 nhận xét thực tế về thói quen/khung giờ và 1 lời khuyên hoặc động viên tích cực.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data: any = await res.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hãy chú ý kiểm soát khung giờ hút thuốc cao điểm để giảm bớt số điếu hàng ngày nhé!";

    return new Response(JSON.stringify({ insight: aiText }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ insight: "Không thể kết nối AI phân tích lúc này. Vẫn hãy chú ý giữ gìn sức khỏe nhé!" }), { status: 500 });
  }
}