import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendContactNotificationEmail(
  senderName: string,
  senderEmail: string,
  subject: string,
  bodyText: string
) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'admin@bztel.net';
  const recipient = 'admin@bztel.net';

  if (!host || !user || !pass) {
    console.log(`[SMTP Mailer] SMTP not configured. Simulating Contact Form Notification:`);
    console.log(`----------------------------------------`);
    console.log(`To: ${recipient}`);
    console.log(`From: ${from}`);
    console.log(`Subject: [New Contact Inquiry] ${subject}`);
    console.log(`Sender Name: ${senderName}`);
    console.log(`Sender Email: ${senderEmail}`);
    console.log(`Message:\n${bodyText}`);
    console.log(`----------------------------------------`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const html = `
      <h2>New Public Contact Form Submission</h2>
      <p>A new contact inquiry has been received from the Bztel website:</p>
      <ul>
        <li><strong>Sender Name:</strong> ${senderName}</li>
        <li><strong>Sender Email:</strong> ${senderEmail}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
        ${bodyText}
      </div>
      <br>
      <p>This message has been persisted in the database.</p>
    `;

    await transporter.sendMail({
      from,
      to: recipient,
      subject: `[New Contact Inquiry] ${subject}`,
      html
    });
    console.log(`[SMTP Mailer] Contact notification email sent successfully to ${recipient}`);
    return true;
  } catch (err) {
    console.error(`[SMTP Mailer] Failed to dispatch contact notification email:`, err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields (name, email, subject, message) are required.' }, { status: 400 });
    }

    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // Insert into contact messages
    await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    // Dispatch notification
    await sendContactNotificationEmail(name.trim(), email.trim(), subject.trim(), message.trim());

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. Our support desk will reach out within 12 hours.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ error: 'Failed to submit contact message. Please try again later.' }, { status: 500 });
  }
}
