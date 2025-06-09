import { db } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if(!dbUser) return NextResponse.json({ error: 'no user found'}, { status: 404 })

  return NextResponse.json(dbUser.role);
}