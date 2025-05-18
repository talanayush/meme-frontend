const API_BASE = "https://meme-backend-qgxz.onrender.com/api";

// Fetch all shared memes from the community
export const getSharedMemes = async () => {

  try {
    const response = await fetch(`${API_BASE}/meme`);
    if (!response.ok) {
      throw new Error('Failed to fetch memes');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching memes:', error);
    throw error;
  }

};

// Vote on a meme (like/dislike)
export const voteMeme = async (memeId, voteType) => {
  try {
    const response = await fetch(`${API_BASE}/meme/${memeId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to vote on meme');
    }

    return data;
  } catch (error) {
    console.error('Error voting on meme:', error);
    throw error;
  }
};

// Share a meme to the community
export const shareMeme = async (memeData) => {
  try {
    const response = await fetch(`${API_BASE}/meme/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memeData),
    });
    if (!response.ok) {
      throw new Error('Failed to share meme');
    }
    return await response.json();
  } catch (error) {
    console.error('Error sharing meme:', error);
    throw error;
  }
};