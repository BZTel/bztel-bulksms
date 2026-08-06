import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { seedDefaultScamWords, categorizeScamWord } from '@/lib/safeguard';

// GET all scam words (DB + auto-seed if empty)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const category = searchParams.get('category')?.trim().toLowerCase() || '';
    const seed = searchParams.get('seed') === 'true';

    // Auto-seed defaults if table is empty or if seed=true is requested
    const count = await prisma.scamWord.count();
    if (count === 0 || seed) {
      await seedDefaultScamWords(prisma);
    }

    const where: any = {};
    if (search) {
      where.word = { contains: search, mode: 'insensitive' };
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const dbWords = await prisma.scamWord.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const formatted = dbWords.map(w => ({
      id: w.id,
      word: w.word,
      category: w.category,
      created_at: w.createdAt
    }));

    return NextResponse.json({
      scam_words: formatted,
      total_count: dbWords.length
    });
  } catch (error) {
    console.error('Fetch scam words error:', error);
    return NextResponse.json({ error: 'Failed to fetch scam words' }, { status: 500 });
  }
}

// POST new scam word(s) or restore defaults
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { word, words, category, action } = body;

    if (action === 'restore_defaults' || action === 'seed') {
      const seeded = await seedDefaultScamWords(prisma);
      return NextResponse.json({
        message: `Successfully seeded/restored default scam keywords (${seeded} total)`,
        count: seeded
      });
    }

    const rawInput = words || word;
    if (!rawInput || typeof rawInput !== 'string') {
      return NextResponse.json({ error: 'At least one scam word is required' }, { status: 400 });
    }

    // Support comma-separated or newline-separated entry
    const wordList = rawInput
      .split(/[\n,]+/)
      .map(w => w.trim().toLowerCase())
      .filter(Boolean);

    if (wordList.length === 0) {
      return NextResponse.json({ error: 'No valid words provided' }, { status: 400 });
    }

    const createdRecords = [];
    for (const w of wordList) {
      try {
        const assignedCategory = category || categorizeScamWord(w);
        const record = await prisma.scamWord.upsert({
          where: { word: w },
          update: { category: assignedCategory },
          create: { word: w, category: assignedCategory }
        });
        createdRecords.push(record);
      } catch (e) {
        console.warn(`Error upserting scam word "${w}":`, e);
      }
    }

    return NextResponse.json({
      message: `Successfully added ${createdRecords.length} scam word(s)`,
      added: createdRecords
    }, { status: 201 });
  } catch (error) {
    console.error('Create scam word error:', error);
    return NextResponse.json({ error: 'Failed to create scam word' }, { status: 500 });
  }
}

