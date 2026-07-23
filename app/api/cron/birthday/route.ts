import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerWorker } from '@/lib/queue';

export async function GET(req: Request) {
  try {
    // Basic Bearer Token Authorization check using Vercel CRON_SECRET if configured
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Birthday Daemon] Cron triggered: Scanning contacts for birthdays...');
    const today = new Date();
    const todayMD = today.toISOString().substring(5, 10); // "MM-DD"

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all active birthday campaigns
    const activeCampaigns = await prisma.birthdayCampaign.findMany({
      where: { isActive: true },
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({ message: 'No active birthday campaigns found.' });
    }

    let processedCount = 0;

    for (const campaign of activeCampaigns) {
      // Find contacts belonging to this campaign owner
      const contacts = await prisma.contact.findMany({
        where: {
          userId: campaign.userId,
          birthdate: { not: null },
        },
      });

      // Filter contacts in JS to be database-agnostic (MM-DD match)
      const birthdayContacts = contacts.filter((c) => {
        if (!c.birthdate) return false;
        const m = c.birthdate.match(/\d{2}-\d{2}$/);
        return m && m[0] === todayMD;
      });

      // Filter by groupName constraint
      const matchingContacts = birthdayContacts.filter((c) => {
        return campaign.targetGroup === 'All' || c.groupName === campaign.targetGroup;
      });

      for (const contact of matchingContacts) {
        // Check if greeting already sent today
        const alreadySent = await prisma.smsLog.findFirst({
          where: {
            recipient: contact.phone,
            userId: campaign.userId,
            sentAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
            message: {
              contains: 'Birthday',
            },
          },
        });

        if (alreadySent) {
          console.log(`[Birthday Daemon] Greeting already sent today to ${contact.name} (${contact.phone}). Skipping.`);
          continue;
        }

        // Check user balance and status
        const user = await prisma.user.findUnique({
          where: { id: campaign.userId },
          select: { balance: true, status: true },
        });

        if (!user || user.balance < 1) {
          console.warn(`[Birthday Daemon] User ${campaign.userId} has insufficient balance to send birthday wish.`);
          continue;
        }

        if (user.status === 'suspended') {
          console.warn(`[Birthday Daemon] User ${campaign.userId} is suspended. Skipping campaign execution.`);
          continue;
        }

        const msg = campaign.messageTemplate.replace(/\[Name\]/gi, contact.name);

        // Deduct balance, log transaction, and write SMS log inside prisma transaction
        const smsLog = await prisma.$transaction(async (tx) => {
          // Deduct 1 credit
          await tx.user.update({
            where: { id: campaign.userId },
            data: { balance: user.balance - 1 },
          });

          // Write Transaction log
          await tx.transaction.create({
            data: {
              userId: campaign.userId,
              type: 'sms_debit',
              amount: -1,
              balanceBefore: user.balance,
              balanceAfter: user.balance - 1,
              description: `Automated Birthday Greetings to ${contact.name}`,
            },
          });

          // Insert SMS log (pending)
          return tx.smsLog.create({
            data: {
              userId: campaign.userId,
              senderId: campaign.senderId,
              recipient: contact.phone,
              message: msg,
              credits: 1,
              status: 'pending',
            },
          });
        });

        processedCount++;

      }
    }

    if (processedCount > 0) {
      triggerWorker();
    }

    return NextResponse.json({
      message: 'Birthday greeting scan completed.',
      processed_greetings: processedCount,
    });
  } catch (error) {
    console.error('[Birthday Daemon] Cron error:', error);
    return NextResponse.json({ error: 'Failed to process birthday greeting cron' }, { status: 500 });
  }
}
