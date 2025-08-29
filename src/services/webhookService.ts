/* class WebhookService {
  private requestQueue = new Map<string, Promise<any>>();
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestKey(url: string, body: any): string {
    return `${url}_${JSON.stringify(body)}`;
  }

  private async makeRequest(url: string, requestBody: any, operation: string): Promise<any> {
    console.log(`🚀 ${operation.toUpperCase()} REQUEST - Starting webhook call`);
    console.log('📍 Webhook URL:', url);
    console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log('⏱️ Response Time:', responseTime + 'ms');
        console.log('📈 Response Status:', response.status);

        let responseData;
        try {
          responseData = await response.text();
          console.log('📄 Raw Response:', responseData);
        } catch (e) {
          console.log('ℹ️ No response body');
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ ${operation.toUpperCase()} REQUEST - Webhook call successful`);
        return { success: true, data: responseData };

      } catch (error) {
        console.error(`❌ ${operation.toUpperCase()} REQUEST - Attempt ${attempt} failed:`, error);

        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Exponential backoff
        const delayTime = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayTime}ms...`);
        await this.delay(delayTime);
      }
    }
  }

  async sendWebhookRequest(url: string, requestBody: any, operation: string): Promise<any> {
    const requestKey = this.generateRequestKey(url, requestBody);

    // If the same request is already in progress, wait for it
    if (this.requestQueue.has(requestKey)) {
      console.log(`⏸️ ${operation.toUpperCase()} - Request already in progress, waiting...`);
      return this.requestQueue.get(requestKey);
    }

    // Create new request promise
    const requestPromise = this.makeRequest(url, requestBody, operation)
      .finally(() => {
        // Remove from queue when done
        this.requestQueue.delete(requestKey);
      });

    // Add to queue
    this.requestQueue.set(requestKey, requestPromise);

    return requestPromise;
  }

  getWebhookUrls(contentType: string) {
    switch (contentType) {
      case "regenerated":
      case "content":
        return {
          approve: "https://biohackyourself.app.n8n.cloud/webhook/updatesheet",
          reject: "https://biohackyourself.app.n8n.cloud/webhook/updateno"
        };
      case "news":
        return {
          approve: "https://biohackyourself.app.n8n.cloud/webhook/newsapiupdateyes",
          reject: "https://biohackyourself.app.n8n.cloud/webhook/newsapiupdateno"
        };
      case "journals":
        return {
          approve: "https://biohackyourself.app.n8n.cloud/webhook/journalsupdateyes",
          reject: "https://biohackyourself.app.n8n.cloud/webhook/journalsupdateno"
        };
      case "rss":
        return {
          approve: "https://biohackyourself.app.n8n.cloud/webhook/RSSUPDATEYES",
          reject: "https://biohackyourself.app.n8n.cloud/webhook/RSSupdateno"
        };
      default:
        return {
          approve: "https://biohackyourself.app.n8n.cloud/webhook/updatesheet",
          reject: "https://biohackyourself.app.n8n.cloud/webhook/updateno"
        };
    }
  }

  getDeleteWebhookUrl(contentType: string) {
    switch (contentType) {
      case "content":
      case "regenerated":
        return "https://biohackyourself.app.n8n.cloud/webhook/deleterow";
      case "news":
        return "https://biohackyourself.app.n8n.cloud/webhook/deletenewsapi";
      case "journals":
        return "https://biohackyourself.app.n8n.cloud/webhook/deletejournals";
      case "rss":
        return "https://biohackyourself.app.n8n.cloud/webhook/deleterss";
      default:
        return "https://biohackyourself.app.n8n.cloud/webhook/deleterow";
    }
  }
}

export const webhookService = new WebhookService();
*/

// Unified webhook service: everything goes to /webhook/content-action
type ActionType = "submit" | "approve" | "reject";
type ContentType =
  | "content"
  | "news"
  | "rss"
  | "rssNews"
  | "rssDentistry"
  | "dentistry";

class WebhookService {
  private endpoint =
    "https://biohackyourself.app.n8n.cloud/webhook/content-action";

  private requestQueue = new Map<string, Promise<any>>();
  private retryAttempts = 3;
  private retryDelay = 1000; // ms

  // ---------- utils ----------
  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private requestKey(url: string, body: unknown) {
    return `${url}_${JSON.stringify(body)}`;
  }

  // ---------- core POST with retry, timeout, logging ----------
  private async post(url: string, body: unknown, label: string) {
    const started = Date.now();
    console.log(`🚀 ${label.toUpperCase()} → ${url}`);
    console.log("📦 Payload:", JSON.stringify(body, null, 2));

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const txt = await res.text().catch(() => "");
        console.log("⏱️ Duration:", Date.now() - started, "ms");
        console.log("📈 Status:", res.status);
        if (txt) console.log("📄 Response:", txt);

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        console.log(`✅ ${label.toUpperCase()} OK`);
        return { ok: true, status: res.status, data: txt };
      } catch (err) {
        console.error(
          `❌ ${label.toUpperCase()} attempt ${attempt} failed:`,
          err
        );
        if (attempt === this.retryAttempts) throw err;

        const backoff = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ retrying in ${backoff}ms…`);
        await this.delay(backoff);
      }
    }
  }

  // ---------- public: single unified call ----------
  /**
   * Send a unified action to the single n8n endpoint.
   * Required fields:
   * - action: "submit" | "approve" | "reject"
   * - contentType: "content" | "news" | "rss" | "rssNews" | "rssDentistry" | "dentistry"
   * - anything else your flow needs (sheet, row, title, caption, etc.)
   */
  async sendAction(
    action: ActionType,
    contentType: ContentType,
    payload: Record<string, any> = {}
  ) {
    const body = { action, contentType, ...payload };
    const key = this.requestKey(this.endpoint, body);

    if (this.requestQueue.has(key)) {
      console.log("⏸️ duplicate request in flight — waiting…");
      return this.requestQueue.get(key)!;
    }

    const p = this.post(
      this.endpoint,
      body,
      `${contentType}:${action}`
    ).finally(() => this.requestQueue.delete(key));
    this.requestQueue.set(key, p);
    return p;
  }

  // ---------- compatibility shims (optional) ----------
  /**
   * Old code calls getWebhookUrls(contentType). We return the same endpoint
   * for both approve/reject so nothing else breaks.
   */
  getWebhookUrls(_contentType: ContentType) {
    return { approve: this.endpoint, reject: this.endpoint };
  }

  /**
   * Old code calls sendWebhookRequest(url, body, operation).
   * We just route to the unified endpoint and ignore the passed url.
   */
  async sendWebhookRequest(
    _url: string,
    body: Record<string, any>,
    operation: string
  ) {
    const action =
      (body.action as ActionType) ||
      (operation === "approve"
        ? "approve"
        : operation === "reject"
        ? "reject"
        : "submit");
    const contentType = (body.contentType || "content") as ContentType;

    return this.sendAction(action, contentType, body);
  }
}

export const webhookService = new WebhookService();
export type { ActionType, ContentType };
