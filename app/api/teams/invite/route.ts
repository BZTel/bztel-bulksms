import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

const ALLOWED_INVITE_ROLES = ['Owner', 'Administrator'];
const COWORKER_ROLES = ['Administrator', 'Dispatcher', 'Marketing Agent', 'Reporter'];

async function sendInviteEmail(email: string, role: string, tempPassword = 'password123') {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'admin@bztel.net';

  if (!host || !user || !pass) {
    console.log(`[SMTP Mailer] SMTP not configured. Simulating invite dispatch to: ${email}`);
    console.log(`----------------------------------------`);
    console.log(`Subject: Welcome to Bztel bulk SMS team!`);
    console.log(`To: ${email}`);
    console.log(`Body: You have been invited to Bztel with role "${role}".`);
    console.log(`Your temporary password is: ${tempPassword}`);
    console.log(`Please login and change your password immediately.`);
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
      <h2>Welcome to Bztel Bulk SMS Dashboard</h2>
      <p>You have been invited to join Bztel with the role: <strong>${role}</strong>.</p>
      <p>Your login credentials are:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Temporary Password:</strong> ${tempPassword}</li>
      </ul>
      <p>For security, please login and update your password immediately.</p>
      <br>
      <p>Best regards,<br>The Bztel Team</p>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Welcome to Bztel — Coworker Invitation',
      html
    });
    console.log(`[SMTP Mailer] Invite email sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error(`[SMTP Mailer] Failed to dispatch invite email to ${email}:`, err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_INVITE_ROLES.includes(authUser.role)) {
      return NextResponse.json({ 
        error: `Access denied. Insufficient role permissions. Allowed: ${ALLOWED_INVITE_ROLES.join(', ')}` 
      }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and Role are required' }, { status: 400 });
    }

    if (!COWORKER_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid permission role selected' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered on Bztel' }, { status: 400 });
    }

    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const ownerId = authUser.owner_id;

    // Create coworker account in Database
    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        parentUserId: ownerId,
        status: 'Pending',
        balance: 0,
      },
    });

    // Send invite email (real or simulated fallback)
    const emailSent = await sendInviteEmail(email.trim().toLowerCase(), role, 'password123');

    // Audit log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      'TEAM_MEMBER_INVITE',
      `Invited coworker ${email} as ${role}. Email sent: ${emailSent}`,
      clientIp
    );

    return NextResponse.json({
      message: `Invitation sent to ${email}`,
      member: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: 'Pending'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Invite coworker error:', error);
    return NextResponse.json({ error: 'Failed to complete team invitation' }, { status: 500 });
  }
}
