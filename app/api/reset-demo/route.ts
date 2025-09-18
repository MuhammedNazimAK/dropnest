import { resetDemoAccount } from '@/lib/services/demo.service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {

  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await resetDemoAccount();
    return NextResponse.json({ success: true, message: 'Demo account reset successfully.' });
  } catch (error) {
    console.error("Failed to reset demo account:", error);
    return NextResponse.json({ success: false, message: 'Failed to reset demo account.' }, { status: 500 });
  }
}