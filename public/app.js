/* ============================================
   阳湖智能体 — 前端交互逻辑
   功能：对话管理 / 打字机效果 / 语言风格切换
        / 千问图片生成 / 快捷按钮 / 本地存储
   ============================================ */

// ---------- 双风格系统提示词 ----------
const PROMPT_CLASSICAL = `# 角色设定
你是"阳湖智能体"——江苏武进非遗文旅项目的AI数字向导。你承载着清代阳湖文派五位文人的精神与智慧：
- **南田先生（恽南田）**：书画美学专家，擅长解读乱针绣、刻纸等非遗的艺术审美
- **瓯北先生（赵翼）**：城市通与历史学家，擅长武进历史人文导览与多语种交互
- **子居先生（恽敬）**：儒雅待客者，擅长开场接待与文化礼仪
- **皋文先生（张惠言）**：诗词吟诵专家，擅长吴语吟诵与文化意境诠释
- **伯元先生（李伯元）**：市井美食家，擅长非遗美食、市集与烟火气推荐

你以"阳湖文枢"为精神内核，以"破、真、融、寄、新、达"六字精神为行动准则。

# 核心使命
让非遗从"被观看的遗产"变为"可体验的生活"，让文脉从"书斋里的学问"变为"可消费的场景"。

# 知识库（内置）
1. 武进非遗：乱针绣、常州梳篦、留青竹刻、金坛刻纸、常州吟诵、大麻糕等80余项
2. 阳湖文派：恽南田（没骨画）、赵翼（史学）、恽敬（阳湖文派）、张惠言（词学）、李伯元（《官场现形记》）
3. 体验产品："阳湖十二时辰"深度版1888元/三日、精选版588元/一日、碎片版388元/半日
4. 六系产品：破（几何解构）、真（手作体验）、融（跨界融合）、寄（文人故事）、新（3D打印）、达（平价伴手礼）
5. 空间布局：一轴三区多点——淹城非遗活态体验区、中心城区非遗生活街区、阳湖故地文人寻访区

# 交互规范
根据用户问题自动判断场景类型，调用对应文人的"人格"进行回应：
- 问美学/艺术 → 以南田先生口吻回应
- 问历史/路线 → 以瓯北先生口吻回应
- 问礼仪/接待 → 以子居先生口吻回应
- 问诗词/意境 → 以皋文先生口吻回应
- 问美食/市集 → 以伯元先生口吻回应
- 综合问题 → 五位文人"合议"后回应

# 输出格式
- 语言风格：**文白夹杂，典雅而不晦涩**，有文人风骨但不拒人千里。多用"之""亦""然""耳""矣"等文言虚词，多用四字短语，如"墨韵流芳""市井烟火"。
- 字数控制：100-300字
- 每次回应以"——XX先生 敬答"结尾
- 询问价格/预订时，需明确给出价格信息与体验时长`;

const PROMPT_MODERN = `# 角色设定
你是"阳湖智能体"——江苏武进非遗文旅项目的AI数字向导。你以现代导游的身份，用亲切、通俗易懂的白话文为游客介绍武进非遗文化。你熟悉清代阳湖文派五位文人的特长：
- **南田先生（恽南田）**：书画美学，乱针绣、刻纸
- **瓯北先生（赵翼）**：城市历史，多语种交互
- **子居先生（恽敬）**：接待礼仪
- **皋文先生（张惠言）**：诗词吟诵
- **伯元先生（李伯元）**：美食与市集

你以"阳湖文枢"为精神内核，以"破、真、融、寄、新、达"六字精神为行动准则。

# 核心使命
让非遗从"被观看的遗产"变为"可体验的生活"，让文脉从"书斋里的学问"变为"可消费的场景"。

# 知识库（内置）
1. 武进非遗：乱针绣、常州梳篦、留青竹刻、金坛刻纸、常州吟诵、大麻糕等80余项
2. 阳湖文派：恽南田（没骨画）、赵翼（史学）、恽敬（阳湖文派）、张惠言（词学）、李伯元（《官场现形记》）
3. 体验产品："阳湖十二时辰"深度版1888元/三日、精选版588元/一日、碎片版388元/半日
4. 六系产品：破（几何解构）、真（手作体验）、融（跨界融合）、寄（文人故事）、新（3D打印）、达（平价伴手礼）
5. 空间布局：一轴三区多点——淹城非遗活态体验区、中心城区非遗生活街区、阳湖故地文人寻访区

# 交互规范
根据用户问题自动判断场景类型：
- 问美学/艺术 → 以南田先生口吻回应
- 问历史/路线 → 以瓯北先生口吻回应
- 问礼仪/接待 → 以子居先生口吻回应
- 问诗词/意境 → 以皋文先生口吻回应
- 问美食/市集 → 以伯元先生口吻回应
- 综合问题 → 综合推荐

# 输出格式
- 语言风格：**现代白话文，亲切自然**，像朋友聊天一样介绍文化。避免文言词汇，用"的""了""呢""吧"等现代语气词，让年轻人也能轻松理解。
- 字数控制：100-300字
- 每次回应以"——XX先生 推荐"结尾
- 询问价格/预订时，需明确给出价格信息与体验时长`;

// ---------- 快捷按钮提示词映射 ----------
const QUICK_ACTIONS = {
  travel: "请为我定制一份武进非遗一日游的详细方案，包括上午、下午、晚上的行程安排，推荐具体的体验项目和交通建议。",
  culture: "请为我系统介绍武进的传统文化，包括阳湖文派的历史渊源、常州吟诵的艺术特色、以及最具代表性的非遗项目。",
  souvenir: "我想了解武进有哪些值得购买的非遗文创纪念品，请推荐几款有特色的产品，并告知价格区间和购买地点。",
  food: "请以伯元先生的身份，为我推荐武进本地最地道的美食和非遗小吃，包括大麻糕等传统名吃，以及值得去的餐馆或夜市。",
};

// ---------- 全局状态 ----------
const STATE = {
  conversations: [],
  activeConvId: null,
  isGenerating: false,
  apiKey: "",
  qwenApiKey: "",
  styleMode: "classical",  // classical | modern
  abortController: null,
  typewriterTimer: null,
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
  btnImage: $("#btnImage"),
  btnNewChat: $("#btnNewChat"),
  quickActions: $("#quickActions"),
  styleToggle: $("#styleToggle"),
  configOverlay: $("#configOverlay"),
  apiKeyInput: $("#apiKeyInput"),
  qwenKeyInput: $("#qwenKeyInput"),
  btnSaveKey: $("#btnSaveKey"),
  configError: $("#configError"),
  btnSettings: $("#btnSettings"),
  toggleKeyVis: $("#toggleKeyVis"),
  imageModal: $("#imageModal"),
  imageModalImg: $("#imageModalImg"),
  imageModalHint: $("#imageModalHint"),
  imageModalClose: $("#imageModalClose"),
  imageModalBackdrop: $("#imageModalBackdrop"),
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
  html = html.replace(/——(.+?)(敬答|推荐)/g, '<span class="scholar-signature">——$1$2</span>');
  if (text.includes("AI生成") || text.includes("仅供参考")) {
    html += '<span class="ai-disclaimer">※ AI生成，仅供参考</span>';
  }
  return html;
}

function getSystemPrompt() {
  return STATE.styleMode === "classical" ? PROMPT_CLASSICAL : PROMPT_MODERN;
}

// ============ 本地存储 ============

function saveToStorage() {
  try {
    localStorage.setItem("yanghu_conv", JSON.stringify(STATE.conversations));
    localStorage.setItem("yanghu_active", STATE.activeConvId || "");
    localStorage.setItem("yanghu_style", STATE.styleMode);
  } catch (e) {}
}

function saveKeys() {
  try {
    if (STATE.apiKey) localStorage.setItem("yanghu_key", STATE.apiKey);
    else localStorage.removeItem("yanghu_key");
    if (STATE.qwenApiKey) localStorage.setItem("yanghu_qwen_key", STATE.qwenApiKey);
    else localStorage.removeItem("yanghu_qwen_key");
  } catch (e) {}
}

function loadFromStorage() {
  try {
    const d = localStorage.getItem("yanghu_conv");
    if (d) STATE.conversations = JSON.parse(d);
    STATE.activeConvId = localStorage.getItem("yanghu_active") || null;
    STATE.apiKey = localStorage.getItem("yanghu_key") || "";
    STATE.qwenApiKey = localStorage.getItem("yanghu_qwen_key") || "";
    STATE.styleMode = localStorage.getItem("yanghu_style") || "classical";
    if (STATE.activeConvId && !STATE.conversations.find(c => c.id === STATE.activeConvId)) {
      STATE.activeConvId = STATE.conversations[0]?.id || null;
    }
  } catch (e) {
    STATE.conversations = [];
    STATE.activeConvId = null;
    STATE.apiKey = "";
    STATE.qwenApiKey = "";
    STATE.styleMode = "classical";
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
    DOM.quickActions.style.display = "flex";
    return;
  }
  DOM.chatEmpty.style.display = "none";
  DOM.chatMessages.style.display = "block";
  DOM.quickActions.style.display = "flex";
  DOM.chatMessages.innerHTML = conv.messages.map(m => {
    if (m.role === "user") {
      return `<div class="message-row user"><div class="message-avatar">👤</div><div class="message-bubble">${escapeHtml(m.content)}</div></div>`;
    }
    // AI 消息：支持图片附件
    let body = renderMarkdown(m.content);
    if (m.imageUrl) {
      body += `<img class="ai-image" src="${escapeHtml(m.imageUrl)}" alt="AI生成图片" onclick="openImagePreview('${escapeHtml(m.imageUrl)}', '${escapeHtml(m.imagePrompt || '')}')" loading="lazy" />`;
    }
    return `<div class="message-row ai"><div class="message-avatar">🏯</div><div class="message-bubble">${body}</div></div>`;
  }).join("");
  scrollToBottom();
}

function renderAll() {
  renderConversationList();
  renderMessages();
  updateSendButton();
  updateStyleToggle();
  updateImageButton();
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

// ============ 语言风格切换 ============

function updateStyleToggle() {
  DOM.styleToggle.querySelectorAll(".style-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === STATE.styleMode);
  });
}

DOM.styleToggle.addEventListener("click", e => {
  const btn = e.target.closest(".style-option");
  if (!btn) return;
  STATE.styleMode = btn.dataset.style;
  saveToStorage();
  updateStyleToggle();
});

// ============ 核心：发送消息 + 打字机效果 ============

async function sendMessage(textOverride) {
  if (STATE.isGenerating) return;
  const text = (textOverride || DOM.messageInput.value).trim();
  if (!text) return;

  let conv = getActiveConversation();
  if (!conv) conv = createConversation();

  conv.messages.push({ role: "user", content: text });
  conv.updatedAt = Date.now();
  updateConvTitle(conv, text);
  DOM.messageInput.value = "";
  autoResizeTextarea();
  renderAll();

  STATE.isGenerating = true;
  updateSendButton();

  const bubbleEl = createStreamBubble();

  const apiMessages = [{ role: "system", content: getSystemPrompt() }];
  apiMessages.push(...conv.messages.slice(-40).map(m => ({ role: m.role, content: m.content })));

  STATE.abortController = new AbortController();

  let fullText = "";
  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, apiKey: STATE.apiKey }),
      signal: STATE.abortController.signal,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || "请求失败");
    }
    const data = await resp.json();
    fullText = data.reply || "";
  } catch (e) {
    if (e.name === "AbortError") {
      removeStreamBubble();
      STATE.isGenerating = false;
      STATE.abortController = null;
      updateSendButton();
      return;
    }
    fullText = "抱歉，阳湖文枢的墨香暂被风拂散……请稍后再试。";
  }

  if (!STATE.isGenerating) { removeStreamBubble(); STATE.abortController = null; updateSendButton(); return; }

  await typewrite(bubbleEl, fullText);

  finalizeStreamBubble(bubbleEl, fullText);
  conv.messages.push({ role: "assistant", content: fullText });
  conv.updatedAt = Date.now();
  saveToStorage();

  STATE.isGenerating = false;
  STATE.abortController = null;
  updateSendButton();
}

function typewrite(bubbleEl, text) {
  return new Promise((resolve) => {
    const span = bubbleEl.querySelector(".streaming-text");
    const cursor = bubbleEl.querySelector(".streaming-cursor");
    if (!span) { resolve(); return; }
    let i = 0;
    const len = text.length;
    if (len === 0) { resolve(); return; }
    function next() {
      if (!STATE.isGenerating) { span.textContent = text; if (cursor) cursor.classList.add("stopped"); resolve(); return; }
      i++;
      span.textContent = text.slice(0, i);
      scrollToBottom();
      if (i >= len) { if (cursor) cursor.classList.add("stopped"); resolve(); }
      else {
        const prev = text[i - 1];
        const d = /[。！？\n]/.test(prev) ? 120 : /[，、；：]/.test(prev) ? 60 : 22;
        STATE.typewriterTimer = setTimeout(next, d);
      }
    }
    next();
  });
}

// ============ 图片生成（千问 API）============

async function generateImage() {
  if (STATE.isGenerating) return;
  const prompt = DOM.messageInput.value.trim();
  if (!prompt) {
    alert("请先在输入框中输入图片描述文字");
    return;
  }
  if (!STATE.qwenApiKey) {
    alert("请先在 API 设置中配置千问 API Key");
    return;
  }

  let conv = getActiveConversation();
  if (!conv) conv = createConversation();

  // 添加用户消息
  conv.messages.push({ role: "user", content: "🎨 生成图片：" + prompt });
  conv.updatedAt = Date.now();
  updateConvTitle(conv, prompt);
  DOM.messageInput.value = "";
  autoResizeTextarea();
  renderAll();

  STATE.isGenerating = true;
  updateSendButton();

  // 创建加载气泡
  const bubbleEl = createStreamBubble();
  updateStreamBubbleRaw(bubbleEl, "🎨 正在为您生成图片，请稍候……");
  scrollToBottom();

  try {
    const resp = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, apiKey: STATE.qwenApiKey }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || "图片生成失败");
    }

    const data = await resp.json();
    if (data.imageUrl) {
      const msg = "已为您生成图片：\n\n![AI生成图片](" + data.imageUrl + ")\n\n※ AI生成，仅供参考";
      finalizeStreamBubbleWithImage(bubbleEl, "已根据「" + prompt + "」为您生成以下图片：", data.imageUrl);
      conv.messages.push({
        role: "assistant",
        content: "已根据「" + prompt + "」为您生成图片。\n\n※ AI生成，仅供参考",
        imageUrl: data.imageUrl,
        imagePrompt: prompt,
      });
    } else {
      throw new Error("未能获取图片结果");
    }
  } catch (e) {
    updateStreamBubbleRaw(bubbleEl, "抱歉，图片生成失败：" + e.message);
    finalizeStreamBubble(bubbleEl, "抱歉，图片生成失败：" + e.message);
    conv.messages.push({ role: "assistant", content: "抱歉，图片生成失败：" + e.message });
  }

  conv.updatedAt = Date.now();
  saveToStorage();
  STATE.isGenerating = false;
  updateSendButton();
}

function updateStreamBubbleRaw(el, text) {
  const span = el.querySelector(".streaming-text");
  const cursor = el.querySelector(".streaming-cursor");
  if (span) span.textContent = text;
  if (cursor) cursor.classList.add("stopped");
}

function finalizeStreamBubbleWithImage(el, text, imageUrl) {
  const cursor = el.querySelector(".streaming-cursor");
  if (cursor) cursor.classList.add("stopped");
  const bubble = el.querySelector(".message-bubble");
  if (bubble) {
    bubble.innerHTML = renderMarkdown(text) + `<img class="ai-image" src="${escapeHtml(imageUrl)}" alt="AI生成图片" onclick="openImagePreview('${escapeHtml(imageUrl)}')" loading="lazy" />`;
  }
  el.removeAttribute("id");
}

// 图片预览
function openImagePreview(url, hint) {
  DOM.imageModalImg.src = url;
  DOM.imageModalHint.textContent = hint || "";
  DOM.imageModal.classList.add("open");
}

function closeImagePreview() {
  DOM.imageModal.classList.remove("open");
  DOM.imageModalImg.src = "";
}

DOM.imageModalClose.addEventListener("click", closeImagePreview);
DOM.imageModalBackdrop.addEventListener("click", closeImagePreview);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeImagePreview(); });

// ============ 流式气泡 DOM ============

function createStreamBubble() {
  DOM.chatEmpty.style.display = "none";
  DOM.chatMessages.style.display = "block";
  DOM.quickActions.style.display = "flex";
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

function updateImageButton() {
  DOM.btnImage.classList.toggle("has-key", !!STATE.qwenApiKey);
}

function stopGeneration() {
  if (STATE.typewriterTimer) { clearTimeout(STATE.typewriterTimer); STATE.typewriterTimer = null; }
  if (STATE.abortController) STATE.abortController.abort();
}

// ============ API 配置界面 ============

function isApiConfigured() {
  return !!(STATE.apiKey && STATE.apiKey.trim());
}

function showConfigScreen(reconfig) {
  DOM.configOverlay.classList.remove("hidden");
  DOM.apiKeyInput.value = reconfig ? STATE.apiKey : "";
  DOM.qwenKeyInput.value = reconfig ? STATE.qwenApiKey : "";
  DOM.configError.textContent = "";
  DOM.btnSaveKey.classList.remove("loading");
  DOM.btnSaveKey.disabled = false;
  if (reconfig) DOM.apiKeyInput.focus();
}

function hideConfigScreen() {
  DOM.configOverlay.classList.add("hidden");
}

async function handleSaveKey() {
  const dsKey = DOM.apiKeyInput.value.trim();
  const qwKey = DOM.qwenKeyInput.value.trim();
  DOM.configError.textContent = "";

  if (!dsKey) { DOM.configError.textContent = "请输入 DeepSeek API Key"; return; }
  if (!dsKey.startsWith("sk-")) { DOM.configError.textContent = "DeepSeek Key 格式错误，应以 sk- 开头"; return; }

  DOM.btnSaveKey.classList.add("loading");
  DOM.btnSaveKey.disabled = true;

  try {
    const r = await fetch("/api/verify-key", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: dsKey }),
    });
    const d = await r.json();
    if (!d.valid) {
      DOM.configError.textContent = "DeepSeek Key 验证失败";
      DOM.btnSaveKey.classList.remove("loading");
      DOM.btnSaveKey.disabled = false;
      return;
    }

    // 如果有千问 Key，也验证一下
    if (qwKey && qwKey.startsWith("sk-")) {
      const qr = await fetch("/api/verify-qwen-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: qwKey }),
      });
      const qd = await qr.json();
      if (!qd.valid) {
        DOM.configError.textContent = "千问 Key 验证失败，图片生成功能将不可用";
        // 不阻止保存，只警告
      }
    }

    STATE.apiKey = dsKey;
    STATE.qwenApiKey = qwKey;
    saveKeys();
    hideConfigScreen();
    updateImageButton();
    initChatInterface();
  } catch {
    DOM.configError.textContent = "网络错误，请重试";
    DOM.btnSaveKey.classList.remove("loading");
    DOM.btnSaveKey.disabled = false;
  }
}

function handleToggleKeyVis(e) {
  const btn = e.target.closest(".config-toggle-vis");
  if (!btn) return;
  const group = btn.parentElement;
  const inp = group.querySelector("input");
  if (!inp) return;
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  const svg = btn.querySelector("svg");
  svg.innerHTML = show
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
}

function handleKeyInput(e) {
  e.target.classList.toggle("has-value", !!e.target.value.trim());
  DOM.configError.textContent = "";
}

// ============ 事件绑定 ============

DOM.messageInput.addEventListener("input", () => { autoResizeTextarea(); updateSendButton(); });
DOM.messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
DOM.btnSend.addEventListener("click", () => sendMessage());
DOM.btnStop.addEventListener("click", stopGeneration);
DOM.btnImage.addEventListener("click", generateImage);
DOM.btnNewChat.addEventListener("click", handleNewChat);

DOM.btnSaveKey.addEventListener("click", handleSaveKey);
// 两个密码切换按钮
document.addEventListener("click", e => {
  if (e.target.closest(".config-toggle-vis")) handleToggleKeyVis(e);
});
DOM.apiKeyInput.addEventListener("input", handleKeyInput);
DOM.qwenKeyInput.addEventListener("input", handleKeyInput);
DOM.apiKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); handleSaveKey(); } });
DOM.qwenKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); handleSaveKey(); } });
DOM.btnSettings.addEventListener("click", () => showConfigScreen(true));

// 快捷按钮
DOM.quickActions.addEventListener("click", e => {
  const btn = e.target.closest(".quick-btn");
  if (!btn) return;
  const action = btn.dataset.action;
  const prompt = QUICK_ACTIONS[action];
  if (prompt) sendMessage(prompt);
});

// 快捷提示（空状态）
document.addEventListener("click", e => {
  const hint = e.target.closest(".hint-btn");
  if (hint && hint.dataset.hint) {
    sendMessage(hint.dataset.hint);
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
  updateStyleToggle();
  updateImageButton();
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
