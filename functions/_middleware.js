export async function onRequest(context) {
  const { request, env, next } = context;
  const response = await next();
  
  // 获取响应的 Content-Type
  const contentType = response.headers.get("content-type") || "";
  
  // 仅拦截处理 HTML 文件
  if (contentType.includes("text/html")) {
    let html = await response.text();
    
    // 获取环境变量 PASSWORD
    const password = env.PASSWORD || "";
    let passwordHash = "";
    
    if (password) {
      // 核心修正：直接在这里计算 SHA256，不依赖外部文件
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // 执行替换
    html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
      `window.__ENV__.PASSWORD = "${passwordHash}";`);
    
    return new Response(html, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  
  return response;
}
