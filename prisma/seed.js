import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bztel.net';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        isAdmin: true,
        role: 'Owner',
        status: 'active',
        balance: 10000,
      },
    });
    console.log(`Admin user created: ${adminEmail}`);

    await prisma.virtualNumber.create({
      data: {
        userId: adminUser.id,
        number: '+1234567890',
        status: 'active',
      },
    });
    console.log(`Admin virtual number created: +1234567890`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
    const adminVn = await prisma.virtualNumber.findFirst({
      where: { userId: existing.id }
    });
    if (!adminVn) {
      await prisma.virtualNumber.create({
        data: {
          userId: existing.id,
          number: '+1234567890',
          status: 'active'
        }
      });
      console.log(`Default virtual number +1234567890 assigned to existing Admin.`);
    }
  }

  // Seed default scam words if missing
  const scamWords = [
    "0803","0pay","131","180","1stbank","1xbet","272","777","abuad","access","access bank",
    "accessbank","acct","airtel","alert","amazon","apple","army","atm","bank","bet9ja","bitcoin",
    "bvn","bvnalert","cashpay","cbn","chippercash","credit","creditalert","crypto","customs","dhl",
    "diamond","diamondbank","easemoni","ecobank","efcc","express","facebook","fairmoneybank","fbn",
    "fcmb","fedex","fidelity","fidelitybank","first bank","firstbank","firstmonie","fraud","gb",
    "glo","gtb","gtbank","gtco","heritage","heritagebank","hsbc","icloud","instagram","interswitch",
    "jaizbank","jamb","jumia","keystonebank","konga","kuda","kudabank","lotusbank","mcafee","moniepoint",
    "mtn","nin","opay","opaybank","otp","palmpay","paxful","paypal","paystack","piggyvest","polarisbank",
    "police","providusbank","quickteller","rubiesbank","samsung","stanbic","stanbicibtc","sterlingbank",
    "suntrustbank","tiktok","uba","ubaplc","unionbank","unitybank","vfd mfb","waec","wemabank","whatsapp",
    "worldbank","yahoo","zenith","zenithbank"
  ];

  let addedWordsCount = 0;
  for (const w of scamWords) {
    try {
      await prisma.scamWord.upsert({
        where: { word: w },
        update: {},
        create: { word: w, category: w.includes('bank') || w.includes('acct') || w.includes('gtb') || w.includes('access') || w.includes('uba') || w.includes('zenith') ? 'bank' : 'general' }
      });
      addedWordsCount++;
    } catch (e) {}
  }
  console.log(`Seeded ${addedWordsCount} default scam words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
