import type { NextApiRequest, NextApiResponse } from 'next';

type Stats = {
  totalViews: number;
  reelsPosted: number;
  activeUsers: number;
  totalShare: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stats | { error: string }>
) {
  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } = process.env;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return res.status(500).json({ error: 'Missing Instagram credentials' });
  }

  try {
    const fields = `id,media_type,like_count,comments_count,children{media_url,media_type},permalink,caption,media_url,timestamp`;
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    const posts = data.data || [];

    const stats = {
      totalViews: posts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0),
      reelsPosted: posts.filter((p: any) => p.media_type === 'VIDEO' || p.media_type === 'REELS').length,
      activeUsers: posts.length,
      totalShare: 0, // Instagram API doesn't provide shares
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Instagram stats' });
  }
}
