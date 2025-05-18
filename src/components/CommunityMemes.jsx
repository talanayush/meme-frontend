import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSharedMemes, voteMeme } from './apiService';
import { saveAs } from 'file-saver'; // For download functionality

const CommunityMemes = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterTheme, setFilterTheme] = useState('all');

  useEffect(() => {
    fetchMemes();
  }, [sortBy, filterTheme]);

  const fetchMemes = async () => {
    setLoading(true);
    try {
      const response = await getSharedMemes();
      
      if (!response || !response.success || !Array.isArray(response.memes)) {
        throw new Error('Invalid response format from server');
      }

      let filteredMemes = [...response.memes];
      
      if (filterTheme !== 'all') {
        filteredMemes = filteredMemes.filter(meme => 
          meme.theme.toLowerCase() === filterTheme.toLowerCase()
        );
      }
      
      if (sortBy === 'newest') {
        filteredMemes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'top') {
        filteredMemes.sort((a, b) => b.likes - a.likes);
      }
      
      setMemes(filteredMemes);
    } catch (error) {
      console.error('Error fetching memes:', error);
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (memeId, voteType) => {
    try {
      const result = await voteMeme(memeId, voteType);
      
      if (result.success) {
        setMemes(prevMemes => 
          prevMemes.map(meme => 
            meme._id === memeId 
              ? { ...meme, likes: result.likes } 
              : meme
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.message || 'Failed to vote. Please try again.');
    }
  };

  const handleDownload = (imageUrl, memeText) => {
    saveAs(imageUrl, `meme-${memeText.substring(0, 20)}.jpg`);
  };

  const handleShare = (platform, memeUrl, memeText) => {
    const text = encodeURIComponent(`Check out this meme: ${memeText}`);
    const url = encodeURIComponent(memeUrl);
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL
        alert('Copy the image and paste it directly in Instagram');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${url}&title=${text}`, '_blank');
        break;
      default:
        break;
    }
  };

  const themes = ['all', ...new Set(memes.map(meme => meme.theme.toLowerCase()))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <motion.h1 
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              Community Memes
            </motion.h1>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border-2 border-gray-200 rounded-lg"
              >
                <option value="newest">Newest First</option>
                <option value="top">Top Rated</option>
              </select>
              
              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="p-2 border-2 border-gray-200 rounded-lg"
              >
                {themes.map(theme => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : memes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No memes found. Be the first to share!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <AnimatePresence>
                {memes.map((meme) => (
                  <motion.div
                    key={meme._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                  >
                    <div className="relative">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.text} 
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white font-medium text-lg">{meme.text}</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-md text-gray-600">By: {meme.creator || 'Anonymous'}</span>
                        <span className="text-md text-gray-600">Theme: {meme.theme}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleVote(meme._id, 'like')}
                            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            <span className="text-xl font-semibold">{meme.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleVote(meme._id, 'dislike')}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m0 0v9m0-9h2.5M17 20h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2.5"></path>
                            </svg>
                          </button>
                        </div>
                        
                        <span className="text-md text-gray-500">
                          {new Date(meme.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Download and Share Buttons */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleDownload(meme.imageUrl, meme.text)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          Download
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShare('twitter', meme.imageUrl, meme.text)}
                            className="p-2 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200 transition"
                            title="Share on Twitter"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                            </svg>
                          </button>

                          <button
                            onClick={() => handleShare('instagram', meme.imageUrl, meme.text)}
                            className="p-2 bg-pink-100 text-pink-500 rounded-full hover:bg-pink-200 transition"
                            title="Share on Instagram"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
                            </svg>
                          </button>

                          <button
                            onClick={() => handleShare('reddit', meme.imageUrl, meme.text)}
                            className="p-2 bg-orange-100 text-orange-500 rounded-full hover:bg-orange-200 transition"
                            title="Share on Reddit"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.02 12a1.75 1.75 0 012.999-1.123 10.05 10.05 0 014.304-1.072l.835-3.91a1.342 1.342 0 01-.802-.981 1.25 1.25 0 011.249-1.25zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.12-.07 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.966-.196-2.512-.73a.326.326 0 00-.232-.095z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CommunityMemes;