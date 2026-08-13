/** DeepL 翻訳（Freeキーは api-free.deepl.com） */

function getEndpoint(apiKey: string) {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

/** すでに日本語っぽいテキストか簡易判定 */
export function looksJapanese(text: string): boolean {
  const jp = (text.match(/[\u3040-\u30ff\u4e00-\u9faf]/g) ?? []).length;
  return jp >= Math.min(4, Math.ceil(text.length * 0.2));
}

export async function translateToJa(
  texts: string[],
  apiKey = process.env.DEEPL_API_KEY
): Promise<string[]> {
  if (!apiKey) throw new Error("DEEPL_API_KEY が未設定です");
  if (texts.length === 0) return [];

  const body = new URLSearchParams();
  body.set("target_lang", "JA");
  body.set("source_lang", "EN");
  for (const t of texts) {
    body.append("text", t);
  }

  const res = await fetch(getEndpoint(apiKey), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    translations: { text: string }[];
  };
  return data.translations.map((t) => t.text);
}
