// 移除外部导入，使用内部定义的哈希函数
// import { sha256 } from '../js/sha256.js'; 

// 定义一个使用原生 Web Crypto API 的 SHA256 函数
async function sha256(message) {
  // 将字符串编码为 Uint8Array
  const msgBuffer = new TextEncoder().encode(message);
  // 计算哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // 将 ArrayBuffer 转回十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  
  // 先获取原始响应
  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  
  // 只处理 HTML 文件
  if (contentType.includes("text/html")) {
    // 获取环境变量中的 PASSWORD
    const password = env.PASSWORD || "";
    
    // 如果设置了密码，才进行处理
    if (password) {
      // 在服务端计算哈希 (使用上面定义的函数)
      const passwordHash = await sha256(password);
      
      // 读取 HTML 内容
      let html = await response.text();
      
      // 执行替换：将占位符替换为计算好的哈希值
      html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
        `window.__ENV__.PASSWORD = "${passwordHash}";`);
      
      // 返回修改后的响应
      return new Response(html, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }
  }
  
  return response;
}
