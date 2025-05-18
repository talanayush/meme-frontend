import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getSharedMemes, voteMeme } from './apiService';
import { saveAs } from 'file-saver';

const CommunityMemes = () => {
  const navigate = useNavigate();
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterTheme, setFilterTheme] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      
      if (searchQuery) {
        filteredMemes = filteredMemes.filter(meme => 
          meme.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meme.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (meme.creator && meme.creator.toLowerCase().includes(searchQuery.toLowerCase()))
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
    saveAs(imageUrl, `meme-${memeText.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.jpg`);
  };

  const handleShare = (platform, memeUrl, memeText) => {
    const text = encodeURIComponent(`Check out this meme: ${memeText}`);
    const url = encodeURIComponent(memeUrl);
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${url}&title=${text}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(`${memeText} - ${memeUrl}`);
        alert('Link copied to clipboard!');
        break;
    }
  };

  const themes = ['all', ...new Set(memes.map(meme => meme.theme.toLowerCase()))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Premium Header with Home Button */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            {/* Home Button */}
            <motion.button 
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mr-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Go to home page"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </motion.button>
            
            <div>
              <motion.h1 
                className="text-3xl sm:text-4xl font-bold text-white"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                Community Creations
              </motion.h1>
              <p className="text-indigo-100 mt-1">Explore memes created by our community</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">Premium</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Search and Filter Bar */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search memes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchMemes()}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-w-0 p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="top">Top Rated</option>
              </select>
              
              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="flex-1 min-w-0 p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Themes</option>
                {themes.filter(t => t !== 'all').map(theme => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <motion.button
              onClick={fetchMemes}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Apply Filters
            </motion.button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-600">Loading community memes...</p>
            </div>
          ) : memes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200"
            >
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No memes found</h3>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                {searchQuery || filterTheme !== 'all' 
                  ? "Try adjusting your search or filter criteria"
                  : "Be the first to share your meme creation!"}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {memes.map((meme) => (
                  <motion.div
                    key={meme._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative group">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.text} 
                        className="w-full h-auto max-h-[400px] object-contain bg-gray-100"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white font-medium text-lg truncate">{meme.text}</p>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {meme.theme}
                          </span>
                          {meme.creator && (
                            <span className="ml-2 text-sm text-gray-600 truncate max-w-[120px]">
                              @{meme.creator}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(meme.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <motion.button 
                            onClick={() => handleVote(meme._id, 'like')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors p-1 rounded-md hover:bg-green-50"
                            aria-label="Like this meme"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            <span className="text-lg font-semibold min-w-[20px] text-center">{meme.likes}</span>
                          </motion.button>
                          
                          <motion.button 
                            onClick={() => handleVote(meme._id, 'dislike')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center text-gray-600 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                            aria-label="Dislike this meme"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m0 0v9m0-9h2.5M17 20h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2.5"></path>
                            </svg>
                          </motion.button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={() => handleDownload(meme.imageUrl, meme.text)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            title="Download"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                          </motion.button>
                          
                          <div className="relative group">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                              title="Share"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                              </svg>
                            </motion.button>
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col bg-white shadow-lg rounded-lg overflow-hidden z-10 border border-gray-200">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleShare('twitter', meme.imageUrl, meme.text)}
                                className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                                </svg>
                                Twitter
                              </motion.button>
                              {/* Other share buttons... */}
                            </div>
                          </div>
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