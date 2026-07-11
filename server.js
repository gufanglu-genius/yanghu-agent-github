const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// DeepSeek API 流式代理 — SSE 逐字推送
// ============================================
app.post("/api/chat/stream", async (req, res) => {
  const { messages, apiKey } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "消息格式错误" });
  }

  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return res.status(401).json({ error: "未配置 API Key" });
  }

  // SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.8,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek 流式错误:", response.status, errText.slice(0, 200));
      if (response.status === 401 || response.status === 403) {
        res.write(`data: ${JSON.stringify({ error: "API Key 无效" })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ error: `API 错误 ${response.status}` })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Node.js fetch 返回的 body 是 web ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice(5).trim(); // 去掉 "data:" 前缀
        if (payload === "[DONE]") {
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ c: delta })}\n\n`);
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("流式异常:", err.message);
    if (!aborted) {
      try { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); } catch {}
      try { res.write("data: [DONE]\n\n"); } catch {}
      try { res.end(); } catch {}
    }
  }
});

// ============================================
// 非流式端点（fallback 用）
// ============================================
app.post("/api/chat", async (req, res) => {
  const { messages, apiKey } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "消息格式错误" });
  }

  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return res.status(401).json({ error: "未配置 API Key" });
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.8,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek 错误:", response.status, errText.slice(0, 200));
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({ error: "API Key 无效" });
      }
      return res.status(response.status).json({ error: `API 错误 ${response.status}` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "（未收到回复）";
    res.json({ reply });
  } catch (err) {
    console.error("请求异常:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 验证 API Key
app.post("/api/verify-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: "未提供 API Key" });
  try {
    const r = await fetch("https://api.deepseek.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    res.json({ valid: r.ok });
  } catch {
    res.json({ valid: false });
  }
});

// 验证千问 API Key
app.post("/api/verify-qwen-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: "未提供 API Key" });
  try {
    const r = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "wan2.1-t2i-turbo",
        input: { prompt: "test" },
        parameters: { size: "1024*1024", n: 1 },
      }),
    });
    const data = await r.json();
    // 有 output 或非 401 即视为有效
    res.json({ valid: !(r.status === 401 || r.status === 403) });
  } catch {
    res.json({ valid: false });
  }
});

// 千问图片生成代理
app.post("/api/generate-image", async (req, res) => {
  const { prompt, apiKey } = req.body;

  if (!prompt) return res.status(400).json({ error: "未提供图片描述" });
  if (!apiKey) return res.status(400).json({ error: "未配置千问 API Key" });

  try {
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: "wan2.1-t2i-turbo",
        input: { prompt },
        parameters: { size: "1024*1024", n: 1 },
      }),
    });

    const data = await response.json();

    if (data.output?.task_id) {
      // 异步任务，轮询等待结果
      const taskId = data.output.task_id;
      const imageUrl = await pollTaskResult(taskId, apiKey);
      if (imageUrl) {
        res.json({ imageUrl, taskId });
      } else {
        res.status(500).json({ error: "图片生成超时" });
      }
    } else if (data.output?.results?.[0]?.url) {
      // 同步返回
      res.json({ imageUrl: data.output.results[0].url });
    } else {
      console.error("千问图片生成失败:", JSON.stringify(data).slice(0, 300));
      res.status(500).json({ error: data.message || "图片生成失败" });
    }
  } catch (err) {
    console.error("图片生成异常:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 轮询异步图片任务结果
async function pollTaskResult(taskId, apiKey, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const r = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await r.json();
      if (data.output?.task_status === "SUCCEEDED") {
        return data.output.results?.[0]?.url || null;
      } else if (data.output?.task_status === "FAILED") {
        console.error("图片任务失败:", data.output.message);
        return null;
      }
    } catch { /* 继续轮询 */ }
  }
  return null;
}

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "阳湖智能体" });
});

app.listen(PORT, () => {
  console.log(`\n  🏯 阳湖智能体 → http://localhost:${PORT}\n`);
});
