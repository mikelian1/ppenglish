const https = require("https");

const DEFAULT_MODEL = "deepseek-v4-flash";
const MAX_SOURCE_LENGTH = Number(process.env.TRANSLATE_MAX_SOURCE_LENGTH || 20000);
const MAX_BODY_BYTES = Number(process.env.TRANSLATE_MAX_BODY_BYTES || 64 * 1024);

function loadLocalTranslateConfig() {
  try {
    return require("../localTranslateConfig");
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") return {};
    throw error;
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error("请求内容过大。"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error("请求 JSON 格式不正确。"));
      }
    });

    req.on("error", reject);
  });
}

function normalizeDeepSeekError(payload, statusCode) {
  const fallback = `DeepSeek 翻译失败（HTTP ${statusCode}）。`;
  if (!payload || typeof payload !== "object") return fallback;

  const error = payload.error;
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.code || fallback;
}

function requestDeepSeek(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: "api.deepseek.com",
        path: "/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const rawBody = Buffer.concat(chunks).toString("utf8");
          let data = null;

          try {
            data = rawBody ? JSON.parse(rawBody) : null;
          } catch (error) {
            reject(new Error("DeepSeek 返回了无法解析的响应。"));
            return;
          }

          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(normalizeDeepSeekError(data, response.statusCode)));
            return;
          }

          resolve(data);
        });
      }
    );

    request.setTimeout(60000, () => {
      request.destroy(new Error("DeepSeek 翻译超时，请稍后重试。"));
    });

    request.on("error", reject);
    request.write(requestBody);
    request.end();
  });
}

function buildPrompt({ source, sourceLang, targetLang, title, paragraphCount }) {
  const context = [];
  if (title) context.push(`文章标题：${title}`);
  if (Number.isInteger(paragraphCount)) {
    context.push(`原文段落数：${paragraphCount}`);
  }

  return [
    context.length ? context.join("\n") : "",
    "你是专业英文到中文译者。",
    `请将下面的 ${sourceLang} 文本翻译成 ${targetLang}。`,
    "要求：保留原意，输出自然标准中文，只返回译文，不要解释。",
    "必须保留原文段落数量、段落顺序和段落结构。",
    "译文段落之间必须使用两个换行符分隔，也就是一个空白行。",
    paragraphCount
      ? `译文必须正好包含 ${paragraphCount} 个段落。`
      : "",
    source,
  ]
    .filter(Boolean)
    .join("\n\n");
}

module.exports = async function translateMiddleware(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "只支持 POST /api/translate。" });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "读取请求失败。" });
    return;
  }

  const source = typeof body.source === "string" ? body.source.trim() : "";
  const sourceLang = body.sourceLang || "en";
  const targetLang = body.targetLang || "zh-CN";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const paragraphCount =
    typeof body.paragraphCount === "number" ? body.paragraphCount : null;

  if (!source) {
    sendJson(res, 400, { error: "缺少要翻译的原文。" });
    return;
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    sendJson(res, 413, {
      error: `文章文本过长，请控制在 ${MAX_SOURCE_LENGTH} 字符以内。`,
    });
    return;
  }

  const localConfig = loadLocalTranslateConfig();
  const apiKey = localConfig.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "缺少 DeepSeek API Key，请在 server/localTranslateConfig.js 中填写 deepseekApiKey 后重启开发服务。",
    });
    return;
  }

  const model = localConfig.deepseekModel || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const prompt = buildPrompt({
    source,
    sourceLang,
    targetLang,
    title,
    paragraphCount,
  });

  try {
    const result = await requestDeepSeek(
      {
        model,
        thinking: { type: "disabled" },
        temperature: 1,
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      apiKey
    );

    const translation =
      result &&
      result.choices &&
      result.choices[0] &&
      result.choices[0].message &&
      result.choices[0].message.content;

    if (!translation || !translation.trim()) {
      sendJson(res, 502, { error: "DeepSeek 没有返回有效译文。" });
      return;
    }

    sendJson(res, 200, {
      provider: model,
      translation: translation.trim(),
      usage: result.usage || null,
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error.message || "DeepSeek 翻译失败，请稍后重试。",
    });
  }
};
