



const express = require('express');
const axios = require('axios');
const cors = require('cors');
// .env file package for securely loading environment variables
const dotenv = require('dotenv'); 

// Load environment variables from .env file (you must create this file)
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Access credentials securely from environment variables
// Make sure you define these in a file named .env
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID; 

// --- CORS Configuration ---
// This uses the 'cors' package to safely handle cross-origin requests.
// During development, we allow all origins (*).
// In a real application, you would restrict this to your frontend URL: 
// app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(cors());

// --- Data Fetching Logic ---
async function fetchInstagramPosts() {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.error("Missing Instagram credentials. Check your .env file.");
    throw new Error('API Credentials are not set on the server.');
  }

  // All fields are correctly formatted into a single string for the URL
  const fields = `id,caption,followers_count,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,is_comment_enabled,children{media_url,media_type,thumbnail_url},comments.limit(50){id,text,timestamp,like_count,username}`;
  
  const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const response = await axios.get(url);
    // The response.data will contain an object with a 'data' array of posts
    return response.data;
  } catch (error) {
    console.error("Error fetching Instagram posts from API:", error.response?.data || error.message);
    // Throw an error to be handled by the Express route
    throw new Error('Failed to fetch data from Instagram.');
  }
}

// --- API Endpoint: GET /api/instagram ---
app.get('/api/instagram', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Request received for Instagram posts.`);
  try {
    const postsData = await fetchInstagramPosts();
    // Send the data back to the frontend
    res.json(postsData);
  } catch (error) {
    // Send a 500 status code if the fetch failed
    res.status(500).json({ error: error.message });
  }
});
// --- API Endpoint: GET /api/instagram/stats ---
app.get('/api/instagram/stats', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Request received for Instagram stats.`);

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return res.status(500).json({ error: "Missing Instagram credentials in .env" });
  }

  try {
    // Fetch media posts
    const fields = `id,media_type,like_count,comments_count,children{media_url,media_type},permalink,caption,media_url,timestamp`;
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const response = await axios.get(url);
    const posts = response.data.data || [];

    // Compute stats
    const stats = {
      totalViews: posts.reduce((sum, post) => sum + (post.like_count || 0), 0), // Sum of likes as proxy for views
      reelsPosted: posts.filter(p => p.media_type === 'VIDEO' || p.media_type === 'REELS').length,
      activeUsers: posts.reduce((sum, post) => sum + (post.comments_count || 0), 0), // Could be changed based on your definition
      totalShare: 0, // Instagram API does not expose shares, will need approximation if possible
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching Instagram stats:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Instagram stats" });
  }
});
// --- GET /api/instagram/reels ---
app.get('/api/instagram/reels', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Request received for Instagram reels.`);

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return res.status(500).json({ error: "Missing Instagram credentials in .env" });
  }

  try {
    const fields = `id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count`;
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    const response = await axios.get(url);
    const data = response.data.data || [];

    // Filter only video / reel media types
    const reels = data.filter(item =>
      item.media_type === "VIDEO" || item.media_type === "REELS"
    );

    res.json(reels);
  } catch (error) {
    console.error("Error fetching reels:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});



// --- Server Startup ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/api/instagram`);
  console.log(`---`);
  console.log("NOTE: This server requires a .env file with INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID.");
});





