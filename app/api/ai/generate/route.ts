import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateOpenRouterCompletion, ChatMessage } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { aiGenerateRateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to use AI features.' }, { status: 401 });
    }

    const rateLimit = await aiGenerateRateLimiter(String(user.id));
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please slow down and try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const { action, prompt, currentText, senderIdName } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required.' }, { status: 400 });
    }

    let messages: ChatMessage[] = [];

    switch (action) {
      case 'GENERATE_SMS': {
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt is required for SMS generation.' }, { status: 400 });
        }
        messages = [
          {
            role: 'system',
            content: `You are an expert Bulk SMS Marketing Assistant for BZTel.
Generate 3 distinct, high-converting SMS message variations based on the user's prompt.
Rules:
1. Each variation MUST be under 160 characters (1 SMS credit).
2. Include dynamic placeholders like {first_name} where relevant.
3. Separate each variation clearly with "---".
4. Do not include markdown headers or meta descriptions. Return only the 3 variations.`,
          },
          { role: 'user', content: `Campaign Goal: ${prompt}` },
        ];
        break;
      }

      case 'OPTIMIZE_LENGTH': {
        if (!currentText) {
          return NextResponse.json({ error: 'currentText is required for length optimization.' }, { status: 400 });
        }
        messages = [
          {
            role: 'system',
            content: `You are an SMS Cost Optimization AI.
Rewrite the user's message to fit strictly under 150 characters (1 GSM-7 SMS credit) while preserving all key information, discount codes, and link placeholders.
Return ONLY the rewritten SMS text, without any quotes or explanations.`,
          },
          { role: 'user', content: `Draft SMS: "${currentText}"` },
        ];
        break;
      }

      case 'FIX_SCAM_WORDS': {
        if (!currentText) {
          return NextResponse.json({ error: 'currentText is required for compliance check.' }, { status: 400 });
        }

        // Fetch registered scam words from DB
        let scamWordsList: string[] = [];
        try {
          const dbScamWords = await prisma.scamWord.findMany({ select: { word: true } });
          scamWordsList = dbScamWords.map((s) => s.word);
        } catch {
          scamWordsList = ['FREE', 'URGENT', 'WINNER', 'CLAIM NOW', 'CLICK HERE', '100% FREE', 'CASH GIVEN'];
        }

        messages = [
          {
            role: 'system',
            content: `You are an SMS Carrier Compliance & Anti-Spam Specialist.
Review the user's message against carrier spam filters and these restricted words: [${scamWordsList.join(', ')}].
Rewrite the SMS so it sounds professional, legitimate, passes telecom filters, and stays under 160 characters.
Return ONLY the compliant rewritten text.`,
          },
          { role: 'user', content: `Message to fix: "${currentText}"` },
        ];
        break;
      }

      case 'GENERATE_SENDER_ID_REASON': {
        if (!senderIdName) {
          return NextResponse.json({ error: 'senderIdName is required.' }, { status: 400 });
        }
        messages = [
          {
            role: 'system',
            content: `You are a Telecom Regulatory Compliance Writer.
Write a formal 2-sentence business justification for registering the Sender ID "${senderIdName}" on telecom networks.
Explain the business purpose (e.g. sending transactional SMS, order updates, customer alerts).
Return ONLY the justification text.`,
          },
          { role: 'user', content: `Sender ID: ${senderIdName}` },
        ];
        break;
      }

      case 'FORMAT_VOICE_SCRIPT': {
        if (!currentText) {
          return NextResponse.json({ error: 'currentText is required for Voice script formatting.' }, { status: 400 });
        }
        messages = [
          {
            role: 'system',
            content: `You are a Text-To-Speech (TTS) Voice Broadcast Director.
Format the provided text to sound natural when spoken by an automated voice caller.
Rules:
- Insert [pause] markers for commas or natural breaks.
- Spell out abbreviations or numbers clearly (e.g., "dollar" instead of "$").
- Keep sentences short and clear.
Return ONLY the formatted voice script.`,
          },
          { role: 'user', content: `Script: "${currentText}"` },
        ];
        break;
      }

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const result = await generateOpenRouterCompletion(messages);

    return NextResponse.json({
      success: true,
      result: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('AI generation API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process AI generation request.' },
      { status: 500 }
    );
  }
}
