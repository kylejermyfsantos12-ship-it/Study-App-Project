// utils/aiRouter.js — routes messages to the correct AI provider

async function routeToAI(aiProvider, messages, systemPrompt) {
  try {
    switch (aiProvider) {
      case "gemini":
        return await callGemini(messages, systemPrompt);
      case "deepseek":
        return await callOpenRouter(
          "deepseek/deepseek-chat-v3.1:free",
          messages,
          systemPrompt,
          "deepseek",
        );
      case "qwen3":
        return await callOpenRouter(
          "qwen/qwen3-coder:free",
          messages,
          systemPrompt,
          "qwen3",
        );
      case "qwen25":
        return await callOpenRouter(
          "deepseek/deepseek-r1-distill-llama-70b:free",
          messages,
          systemPrompt,
          "qwen25",
        );
      case "groq":
      default:
        return await callGroq(messages, systemPrompt);
    }
  } catch (err) {
    console.warn(
      `⚠️  AI provider "${aiProvider}" failed: ${err.message}. Falling back to Groq.`,
    );
    const result = await callGroq(messages, systemPrompt);
    return {
      ...result,
      warning: `${aiProvider} failed, switched to Groq automatically.`,
    };
  }
}

async function callGroq(messages, systemPrompt) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("Groq error:", JSON.stringify(data));
    throw new Error(data.error?.message || "Groq error");
  }
  return { reply: data.choices[0].message.content, aiUsed: "groq" };
}

async function callGemini(messages, systemPrompt) {
  // Build Gemini-format history (all but last message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1].content;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [...history, { role: "user", parts: [{ text: lastMessage }] }],
    generationConfig: { maxOutputTokens: 2048 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Gemini error:", JSON.stringify(data));
    throw new Error(data.error?.message || "Gemini error");
  }

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("Gemini returned empty response");

  return { reply, aiUsed: "gemini" };
}

async function callOpenRouter(model, messages, systemPrompt, aiLabel) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyAI",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    console.error(`OpenRouter (${model}) error:`, JSON.stringify(data));
    throw new Error(data.error?.message || `OpenRouter error for ${model}`);
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply)
    throw new Error(`OpenRouter returned empty response for ${model}`);

  return { reply, aiUsed: aiLabel };
}

module.exports = { routeToAI };
