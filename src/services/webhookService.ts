
class WebhookService {
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
