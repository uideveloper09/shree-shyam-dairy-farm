export async function summarizeWithAi(context: string, question: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an ERP analytics assistant for Shree Shyam Dairy Farm. Reply in concise bullet points. Use Hindi-English mix if context is in Hindi.",
          },
          { role: "user", content: `${context}\n\nQuestion: ${question}` },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
