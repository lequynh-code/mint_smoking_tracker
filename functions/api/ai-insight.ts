export async function onRequestPost(context: { request: Request; env: { MISTRAL_API_KEY?: string } }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { total, avgPerDay, peakHour, month } = body;

    // Lấy API Key từ Environment Variable của Cloudflare
    //const apiKey = context.env.MISTRAL_API_KEY;
    const apiKey = "CVnecv6JWR1jJzVIVOPrYnlgAd9EK8hM";

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        insight: "⚠️ Chưa cấu hình MISTRAL_API_KEY trên Cloudflare Dashboard. Vui lòng kiểm tra lại bối cảnh môi trường." 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!total || total === 0) {
      return new Response(JSON.stringify({ 
        insight: "Tháng này bạn chưa ghi nhận điếu nào. Tuyệt vời! Hãy tiếp tục duy trì phong độ này nhé!" 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const prompt = `Bạn là một trợ lý sức khỏe cá nhân tinh tế. 
Hãy phân tích ngắn gọn thói quen hút thuốc tháng ${month} của người dùng dựa trên các số liệu sau:
- Tổng số điếu: ${total} điếu
- Trung bình: ${avgPerDay} điếu/ngày
- Khung giờ cao điểm: ${peakHour}

Yêu cầu: Đưa ra nhận xét CỰC KỲ NGẮN GỌN (tối đa 2 câu): 1 nhận xét thực tế về khung giờ/thói quen và 1 lời khuyên ngắn mang tính động viên tích cực. Viết bằng tiếng Việt.`;

    // Gọi trực tiếp REST API của Mistral AI
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest', // Bạn cũng có thể dùng 'open-mistral-7b' hoặc 'mistral-medium-latest'
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data: any = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ 
        insight: `Lỗi Mistral API: ${data.error.message || 'Key không hợp lệ hoặc hết quota'}` 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const aiText = data?.choices?.[0]?.message?.content?.trim() || "Hãy chú ý kiểm soát khung giờ hút thuốc cao điểm để giảm dần số điếu hàng ngày nhé!";

    return new Response(JSON.stringify({ insight: aiText }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      insight: `Lỗi hệ thống: ${err.message}` 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}