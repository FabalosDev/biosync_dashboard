export async function postWebhook(payload: any) {
  const url = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!url) throw new Error("VITE_N8N_WEBHOOK_URL not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status}${text ? " — " + text : ""}`);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
