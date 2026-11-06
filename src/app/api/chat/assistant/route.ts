import { NextResponse } from "next/server";

const AFRIJOURNAL_SYSTEM_PROMPT = `
You are the official 24/7 AfriJournal Index Assistant for afrijournalindexing.org.
You chat inside a simple mobile chat widget.

CRITICAL RULES:
- Write strictly in simple, clean conversational English.
- NEVER use markdown syntax: NO asterisks (**), NO hashes (#), NO backticks, NO underscores, NO markdown links.
- Use plain paragraphs or clean numbered lists (1. 2. 3.) or simple dots (•).
- Keep answers under 3 short paragraphs.
- Never output reasoning or thinking tags (<think>).

Key Facts & Contacts:
- Support Email: afrijournalindex@gmail.com
- Support Phone / WhatsApp: +254 725 788 400
- Office: Kenya Projects Organization (KENPRO), Nairobi, Kenya

Journal Indexing:
- Requires active ISSN (print/online), African-affiliated editorial board, transparent peer review, and publishing ethics.
- Apply online via the Services or Submit page on afrijournalindexing.org.
- Global Indexation Pathway: Compliance reviews and readiness support for Scopus and Web of Science (WoS).

AfriScholar ID (ASID):
- 12-digit persistent identifier (ASID-XXXX-XXXX-XXXX) for African researchers.
- Connects with ORCID, OpenAlex, and Google Scholar.
- Scholars can claim profiles, curate works, and download an authenticated academic PDF dossier.
`;

/**
 * Strips all markdown syntax so a non-tech user sees only clean, readable text.
 */
function cleanPlainChatText(raw: string): string {
  let text = raw;
  // 1. Remove <think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  // 2. Remove markdown bold/italics markers (**text** or *text* or __text__)
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/\*(.*?)\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/_(.*?)_/g, "$1");
  // 3. Remove markdown headers (# Title)
  text = text.replace(/^#{1,6}\s+/gm, "");
  // 4. Remove inline code / backticks (`code`)
  text = text.replace(/`([^`]+)`/g, "$1");
  // 5. Clean markdown links [Text](url) -> Text (url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  // 6. Clean loose asterisks and hashes
  text = text.replace(/[*#]/g, "");
  return text.trim();
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "AfriJournal Assistant is temporarily offline. Please reach our editorial team directly at afrijournalindex@gmail.com or via WhatsApp at +254 725 788 400."
      });
    }

    const formattedMessages = [
      { role: "system", content: AFRIJOURNAL_SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: formattedMessages,
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || "";
      const cleaned = cleanPlainChatText(rawText);

      if (cleaned) {
        return NextResponse.json({ reply: cleaned });
      }
    }

    return NextResponse.json({
      reply: "Thank you for contacting AfriJournal Index. For immediate assistance with indexing, claims, or publisher services, our editorial team is available at afrijournalindex@gmail.com or on WhatsApp at +254 725 788 400."
    });

  } catch (error: any) {
    console.error("Groq AI assistant error:", error);
    return NextResponse.json({
      reply: "Thank you for reaching out. Please contact our editorial desk at afrijournalindex@gmail.com or WhatsApp +254 725 788 400."
    });
  }
}
