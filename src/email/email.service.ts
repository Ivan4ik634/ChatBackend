import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.API_SENDGRID!);
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const msg = {
      to,
      from: 'ivanlevadny2010@gmail.com',
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(
        'Error sending email:',
        error.response?.body || error.message,
      );
      throw error;
    }
  }
}
