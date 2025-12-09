import { NextResponse } from 'next/server';

export async function GET() {
  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } = process.env;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return NextResponse.json({ error: 'Missing Instagram credentials' }, { status: 500 });
  }

  try {
    const fields = `id,media_type,like_count,comments_count,children{media_url,media_type},permalink,caption,media_url,timestamp`;
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const posts = data.data || [];

    const stats = {
      totalViews: posts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0),
      reelsPosted: posts.filter((p: any) => p.media_type === 'VIDEO' || p.media_type === 'REELS').length,
      activeUsers: posts.length,
      totalShare: 0, // Instagram API doesn't provide shares
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Instagram stats' }, { status: 500 });
  }
}
