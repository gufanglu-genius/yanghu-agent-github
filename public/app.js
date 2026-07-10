/* ============================================
   阳湖智能体 — 前端交互逻辑
   ============================================ */

// ---------- 系统提示词 ----------
const SYSTEM_PROMPT = `# 角色设定
你是"阳湖智能体"——江苏武进非遗文旅项目的AI数字向导。你承载着清代阳湖文派五位文人的精神与智慧：
- **南田先生（恽南田）**：书画美学专家，擅长解读乱针绣、刻纸等非遗的艺术审美
- **瓯北先生（赵翼）**：城市通与历史学家，擅长武进历史人文导览与多语种交互
- **子居先生（恽敬）**：儒雅待客者，擅长开场接待与文化礼仪
- **皋文先生（张惠言）**：诗词吟诵专家，擅长吴语吟诵与文化意境诠释
- **伯元先生（李伯元）**：市井美食家，擅长非遗美食、市集与烟火气推荐

你以"阳湖文枢"为精神内核，以"破、真、融、寄、新、达"六字精神为行动准则，为每一位游客提供沉浸式的武进非遗文化体验。

# 核心使命
让非遗从"被观看的遗产"变为"可体验的生活"，让文脉从"书斋里的学问"变为"可消费的场景"。

# 知识库（内置）
1. **武进非遗资源**：乱针绣、常州梳篦、留青竹刻、金坛刻纸、常州吟诵、大麻糕等80余项非遗
2. **阳湖文派**：恽南田（没骨画）、赵翼（史学）、恽敬（阳湖文派）、张惠言（词学）、李伯元（《官场现形记》）
3. **体验产品**："阳湖十二时辰"深度版1888元/三日、精选版588元/一日、碎片版388元/半日
4. **六系产品**："破"系列（几何解构木梳、乱针绣T恤）、"真"系列（黄杨木梳、竹节香插）、"融"系列（乱针绣×丝巾）、"寄"系列（诗词木梳）、"新"系列（3D打印梳篦、数字藏品）、"达"系列（大麻糕伴手礼、文人冰箱贴）
5. **空间布局**：一轴三区多点——淹城非遗活态体验区、中心城区非遗生活街区、阳湖故地文人寻访区

# 交互规范
## 场景识别
根据用户问题自动判断场景类型，调用对应文人的"人格"进行回应：
- 问美学/艺术 → 以南田先生口吻回应
- 问历史/路线 → 以瓯北先生口吻回应
- 问礼仪/接待 → 以子居先生口吻回应
- 问诗词/意境 → 以皋文先生口吻回应
- 问美食/市集 → 以伯元先生口吻回应
- 综合问题 → 五位文人"合议"后回应

## 回应结构
每次回应需包含：
1. **文人署名**：以"——XX先生 敬答"结尾
2. **文化知识点**：至少包含一个武进非遗或阳湖文派的知识点
3. **体验推荐**：关联到具体的体验产品、空间或时间节点
4. **情感温度**：体现"文心"与"烟火气"的融合

## 输出格式
- 语言风格：文白夹杂，典雅而不晦涩，有文人风骨但不拒人千里
- 字数控制：100-300字（视问题复杂度调整）
- 特殊场景：用户询问价格/预订时，需明确给出价格信息与体验时长

# 约束条件
1. 禁止虚构非遗项目或文人史实
2. 涉及传承人信息时，需说明"具体以现场为准"
3. 不回答与武进非遗、阳湖文派无关的问题
4. 不替代专业医疗、法律、投资建议
5. 涉及AIGC生成内容时，需明确标识"AI生成，仅供参考"`;

// ---------- 全局状态 ----------
const STATE = {
  conversations: [],
  activeConvId: null,
  isGenerating: false,
  apiKey: "",
  abortController: null,
};

// ---------- DOM ----------
const $ = (sel) => document.querySelector(sel);

const DOM = {
  conversationList: $("#conversationList"),
  chatMessages: $("#chatMessages"),
  chatEmpty: $("#chatEmpty"),
  messageInput: $("#messageInput"),
  btnSend: $("#btnSend"),
  btnStop: $("#btnStop"),
  btnNewChat: $("#btnNewChat"),
  chatInputArea: $("#chatInputArea"),
  configOverlay: $("#configOverlay"),
  apiKeyInput: $("#apiKeyInput"),
  btnSaveKey: $("#btnSaveKey"),
  configError: $("#configError"),
  btnSettings: $("#btnSettings"),
  toggleKeyVis: $("#toggleKeyVis"),
};

// ============ 工具函数 ============

function generateId() {
  return "conv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "昨天";
  if (diff < 7) return diff + "天前";
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  html = "<p>" + html + "</p>";
  html = html.replace(/——(.+?)敬答/g, '<span class="scholar-signature">——$1敬答</span>');
  if (text.includes("AI生成") || text.includes("仅供参考")) {
    html += '<span class="ai-disclaimer">※ AI生成，仅供参考</span>';
  }
  return html;
}

// ============ 本地存储 ============

function saveToStorage() {
  try {
    localStorage.setItem("yanghu_conv", JSON.stringify(STATE.conversations));
    localStorage.setItem("yanghu_active", STATE.activeConvId || "");
  } catch (e) { /* ignore */ }
}

function saveApiKey() {
  try {
    if (STATE.apiKey) localStorage.setItem("yanghu_key", STATE.apiKey);
    else localStorage.removeItem("yanghu_key");
  } catch (e) { /* ignore */ }
}

function loadFromStorage() {
  try {
    const d = localStorage.getItem("yanghu_conv");
    if (d) STATE.conversations = JSON.parse(d);
    STATE.activeConvId = localStorage.getItem("yanghu_active") || null;
    STATE.apiKey = localStorage.getItem("yanghu_key") || "";
    if (STATE.activeConvId && !STATE.conversations.find(c => c.id === STATE.activeConvId)) {
      STATE.activeConvId = STATE.conversations[0]?.id || null;
    }
  } catch (e) {
    STATE.conversations = [];
    STATE.activeConvId = null;
    STATE.apiKey = "";
  }
}

// ============ 对话管理 ============

function createConversation() {
  const c = { id: generateId(), title: "新对话", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
  STATE.conversations.unshift(c);
  STATE.activeConvId = c.id;
  saveToStorage();
  return c;
}

function deleteConversation(id) {
  STATE.conversations = STATE.conversations.filter(c => c.id !== id);
  if (STATE.activeConvId === id) STATE.activeConvId = STATE.conversations[0]?.id || null;
  saveToStorage();
}

function getActiveConversation() {
  return STATE.conversations.find(c => c.id === STATE.activeConvId) || null;
}

function updateConvTitle(conv, msg) {
  if (conv.title === "新对话" && msg) {
    const t = msg.replace(/\s+/g, " ").trim().slice(0, 20);
    conv.title = t + (msg.length > 20 ? "…" : "");
    saveToStorage();
  }
}

// ============ 渲染 ============

function renderConversationList() {
  const list = DOM.conversationList;
  if (STATE.conversations.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#6a5e4e;font-size:0.82rem;">暂无对话</div>';
    return;
  }
  list.innerHTML = STATE.conversations.map(c => `
    <div class="conversation-item ${c.id === STATE.activeConvId ? "active" : ""}"
         onclick="switchConversation('${c.id}')">
      <span class="conv-title">${escapeHtml(c.title)}</span>
      <span class="conv-time">${formatTime(c.updatedAt)}</span>
      <button class="conv-delete" onclick="event.stopPropagation();handleDeleteConv('${c.id}')">✕</button>
    </div>
  `).join("");
}

function renderMessages() {
  const conv = getActiveConversation();
  if (!conv || conv.messages.length === 0) {
    DOM.chatMessages.style.display = "none";
    DOM.chatEmpty.style.display = "flex";
    return;
  }
  DOM.chatEmpty.style.display = "none";
  DOM.chatMessages.style.display = "block";
  DOM.chatMessages.innerHTML = conv.messages.map(m => {
    const isUser = m.role === "user";
    const body = isUser ? escapeHtml(m.content) : renderMarkdown(m.content);
    const avatar = isUser ? "👤" : "🏯";
    return `<div class="message-row ${isUser ? "user" : "ai"}">
      <div class="message-avatar">${avatar}</div>
      <div class="message-bubble">${body}</div>
    </div>`;
  }).join("");
  scrollToBottom();
}

function renderAll() {
  renderConversationList();
  renderMessages();
  updateSendButton();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (DOM.chatMessages.style.display !== "none") {
      DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }
  });
}

// ============ 对话操作 ============

function switchConversation(id) {
  STATE.activeConvId = id;
  saveToStorage();
  renderAll();
}

function handleDeleteConv(id) {
  if (!confirm("确定删除？")) return;
  deleteConversation(id);
  renderAll();
}

function handleNewChat() {
  createConversation();
  renderAll();
  DOM.messageInput.focus();
}

// ============ 流式消息发送 ============

async function sendMessage() {
  if (STATE.isGenerating) return;
  const text = DOM.messageInput.value.trim();
  if (!text) return;

  let conv = getActiveConversation();
  if (!conv) conv = createConversation();

  // 添加用户消息
  conv.messages.push({ role: "user", content: text });
  conv.updatedAt = Date.now();
  updateConvTitle(conv, text);
  DOM.messageInput.value = "";
  autoResizeTextarea();
  renderAll();

  // 进入生成状态
  STATE.isGenerating = true;
  updateSendButton();

  // 构建 API 消息
  const apiMessages = [{ role: "system", content: SYSTEM_PROMPT }];
  apiMessages.push(...conv.messages.slice(-40).map(m => ({ role: m.role, content: m.content })));

  // 创建空的气泡
  const bubbleEl = createStreamBubble();
  let fullText = "";

  STATE.abortController = new AbortController();

  try {
    fullText = await streamChat(apiMessages, bubbleEl);
  } catch (e) {
    if (e.name === "AbortError") {
      removeStreamBubble();
      STATE.isGenerating = false;
      STATE.abortController = null;
      updateSendButton();
      return;
    }
    console.warn("流式失败，使用 fallback:", e.message);
    removeStreamBubble();
    fullText = "";
  }

  if (!fullText) {
    // 非流式 fallback
    try {
      fullText = await nonStreamChat(apiMessages);
    } catch (e) {
      fullText = "抱歉，此刻阳湖文枢的墨香暂被风拂散……请稍后再试。";
    }
    removeStreamBubble();
    conv.messages.push({ role: "assistant", content: fullText });
    conv.updatedAt = Date.now();
    saveToStorage();
    renderAll();
  } else {
    // 流式完成
    finalizeStreamBubble(bubbleEl, fullText);
    conv.messages.push({ role: "assistant", content: fullText });
    conv.updatedAt = Date.now();
    saveToStorage();
  }

  STATE.isGenerating = false;
  STATE.abortController = null;
  updateSendButton();
}

// 流式 SSE 请求
async function streamChat(messages, bubbleEl) {
  const resp = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, apiKey: STATE.apiKey }),
    signal: STATE.abortController.signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let accumulated = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") { done = true; break; }
      try {
        const p = JSON.parse(payload);
        if (p.error) throw new Error(p.error);
        const delta = p.c || p.content || "";
        if (delta) {
          accumulated += delta;
          updateStreamBubble(bubbleEl, accumulated);
        }
      } catch (e) {
        if (e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }

  return accumulated;
}

// 非流式 fallback
async function nonStreamChat(messages) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, apiKey: STATE.apiKey }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.reply || "";
}

// ============ 流式气泡 DOM ============

function createStreamBubble() {
  DOM.chatEmpty.style.display = "none";
  DOM.chatMessages.style.display = "block";
  const row = document.createElement("div");
  row.className = "message-row ai";
  row.id = "streamBubble";
  row.innerHTML = `<div class="message-avatar">🏯</div>
    <div class="message-bubble streaming-bubble">
      <span class="streaming-text"></span><span class="streaming-cursor"></span>
    </div>`;
  DOM.chatMessages.appendChild(row);
  scrollToBottom();
  return row;
}

function updateStreamBubble(el, text) {
  const span = el.querySelector(".streaming-text");
  if (span) span.textContent = text;
  scrollToBottom();
}

function finalizeStreamBubble(el, text) {
  const cursor = el.querySelector(".streaming-cursor");
  if (cursor) cursor.classList.add("stopped");
  const bubble = el.querySelector(".message-bubble");
  if (bubble) bubble.innerHTML = renderMarkdown(text);
  el.removeAttribute("id");
}

function removeStreamBubble() {
  const el = document.getElementById("streamBubble");
  if (el) el.remove();
}

function saveAiMessage(conv, text, bubbleEl) {
  finalizeStreamBubble(bubbleEl, text);
  conv.messages.push({ role: "assistant", content: text });
  conv.updatedAt = Date.now();
  saveToStorage();
}

// ============ 输入框 ============

function autoResizeTextarea() {
  const ta = DOM.messageInput;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
}

function updateSendButton() {
  const has = DOM.messageInput.value.trim().length > 0;
  const busy = STATE.isGenerating;
  DOM.btnSend.classList.toggle("active", has && !busy);
  DOM.btnSend.disabled = busy;
  DOM.btnStop.classList.toggle("visible", busy);
}

function stopGeneration() {
  if (STATE.abortController) STATE.abortController.abort();
}

// ============ API 配置 ============

function isApiConfigured() {
  return !!(STATE.apiKey && STATE.apiKey.trim());
}

function showConfigScreen(reconfig) {
  DOM.configOverlay.classList.remove("hidden");
  DOM.apiKeyInput.value = reconfig ? STATE.apiKey : "";
  DOM.configError.textContent = "";
  DOM.btnSaveKey.classList.remove("loading");
  DOM.btnSaveKey.disabled = false;
  if (reconfig) DOM.apiKeyInput.focus();
}

function hideConfigScreen() {
  DOM.configOverlay.classList.add("hidden");
}

async function handleSaveKey() {
  const key = DOM.apiKeyInput.value.trim();
  DOM.configError.textContent = "";
  if (!key) { DOM.configError.textContent = "请输入 API Key"; return; }
  if (!key.startsWith("sk-")) { DOM.configError.textContent = "格式错误，应以 sk- 开头"; return; }

  DOM.btnSaveKey.classList.add("loading");
  DOM.btnSaveKey.disabled = true;

  try {
    const r = await fetch("/api/verify-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    const d = await r.json();
    if (!d.valid) {
      DOM.configError.textContent = "Key 验证失败";
      DOM.btnSaveKey.classList.remove("loading");
      DOM.btnSaveKey.disabled = false;
      return;
    }
    STATE.apiKey = key;
    saveApiKey();
    hideConfigScreen();
    initChatInterface();
  } catch {
    DOM.configError.textContent = "网络错误，请重试";
    DOM.btnSaveKey.classList.remove("loading");
    DOM.btnSaveKey.disabled = false;
  }
}

function handleToggleKeyVis() {
  const inp = DOM.apiKeyInput;
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  const svg = DOM.toggleKeyVis.querySelector("svg");
  svg.innerHTML = show
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
}

function handleKeyInput() {
  DOM.apiKeyInput.classList.toggle("has-value", !!DOM.apiKeyInput.value.trim());
  DOM.configError.textContent = "";
}

// ============ 事件绑定 ============

DOM.messageInput.addEventListener("input", () => { autoResizeTextarea(); updateSendButton(); });
DOM.messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
DOM.btnSend.addEventListener("click", sendMessage);
DOM.btnStop.addEventListener("click", stopGeneration);
DOM.btnNewChat.addEventListener("click", handleNewChat);

DOM.btnSaveKey.addEventListener("click", handleSaveKey);
DOM.apiKeyInput.addEventListener("input", handleKeyInput);
DOM.apiKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); handleSaveKey(); } });
DOM.toggleKeyVis.addEventListener("click", handleToggleKeyVis);
DOM.btnSettings.addEventListener("click", () => showConfigScreen(true));

document.addEventListener("click", e => {
  const hint = e.target.closest(".hint-btn");
  if (hint && hint.dataset.hint) {
    DOM.messageInput.value = hint.dataset.hint;
    autoResizeTextarea();
    updateSendButton();
    sendMessage();
  }
});

// ============ 移动端 ============

function createMobileMenu() {
  const btn = document.createElement("button");
  btn.className = "mobile-menu-btn";
  btn.innerHTML = "☰";
  btn.onclick = () => $("#sidebar").classList.toggle("open");
  document.body.appendChild(btn);
  $("#mainChat").addEventListener("click", () => $("#sidebar").classList.remove("open"));
}

// ============ 初始化 ============

function initChatInterface() {
  if (STATE.conversations.length === 0) createConversation();
  if (!getActiveConversation()) {
    STATE.activeConvId = STATE.conversations[0].id;
    saveToStorage();
  }
  renderAll();
  createMobileMenu();
  DOM.messageInput.focus();
}

function init() {
  loadFromStorage();
  if (isApiConfigured()) {
    hideConfigScreen();
    initChatInterface();
  } else {
    showConfigScreen(false);
  }
}

document.addEventListener("DOMContentLoaded", init);
