import type { Env } from '../types';

export interface FinancialAlert {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
}

export interface MailResult {
  provider: 'emailit' | 'resend';
  messageId?: string;
}

export class FinancialMailer {
  constructor(private readonly env: Env) {}

  async sendAlert(alert: FinancialAlert): Promise<MailResult> {
    try {
      return await this.sendWithEmailit(alert);
    } catch (primaryError) {
      console.error('financial_mailer_primary_failed', {
        provider: 'emailit',
        error: primaryError instanceof Error ? primaryError.message : 'Unknown error'
      });

      const result = await this.sendWithResend(alert);
      console.warn('financial_mailer_failover_completed', {
        provider: 'resend',
        subject: alert.subject
      });
      return result;
    }
  }

  private async sendWithEmailit(alert: FinancialAlert): Promise<MailResult> {
    const payload = {
      from: this.env.EMAIL_FROM,
      to: Array.isArray(alert.to) ? alert.to : [alert.to],
      subject: alert.subject,
      html: alert.html,
      text: alert.text,
      tags: alert.tags
    };

    const response = await this.request(
      this.env.EMAILIT_API_URL,
      this.env.EMAILIT_API_KEY,
      payload
    );
    return { provider: 'emailit', messageId: this.extractId(response) };
  }

  private async sendWithResend(alert: FinancialAlert): Promise<MailResult> {
    const payload = {
      from: this.env.EMAIL_FROM,
      to: Array.isArray(alert.to) ? alert.to : [alert.to],
      subject: alert.subject,
      html: alert.html,
      text: alert.text,
      tags: Object.entries(alert.tags || {}).map(([name, value]) => ({ name, value }))
    };

    const response = await this.request(
      this.env.RESEND_API_URL,
      this.env.RESEND_API_KEY,
      payload
    );
    return { provider: 'resend', messageId: this.extractId(response) };
  }

  private async request(
    url: string,
    apiKey: string,
    payload: unknown
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(`Mail provider returned ${response.status}: ${body.slice(0, 200)}`);
      }

      return body ? JSON.parse(body) as Record<string, unknown> : {};
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractId(response: Record<string, unknown>): string | undefined {
    const value = response.id || response.message_id || response.messageId;
    return typeof value === 'string' ? value : undefined;
  }
}