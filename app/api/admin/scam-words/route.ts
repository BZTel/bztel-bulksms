import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET all scam words (DB + built-in stats)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const where: any = {};
    if (search) {
      where.word = { contains: search, mode: 'insensitive' };
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

// POST new scam word(s)
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { word, words, category = 'general' } = body;

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
        const record = await prisma.scamWord.upsert({
          where: { word: w },
          update: { category },
          create: { word: w, category }
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
