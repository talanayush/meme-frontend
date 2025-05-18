import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';

export default function MemeGenerator() {
  // App flow states
  const navigate = useNavigate();
  const [flow, setFlow] = useState("choice"); // 'choice', 'generate', 'upload', 'editor'
  
  // Generation states
  const [theme, setTheme] = useState("");
  const [textMeme, setTextMeme] = useState("");
  const [imageMemeUrl, setImageMemeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Upload states
  const [uploadedImage, setUploadedImage] = useState(null);
  
  // Editor states
  const [editorText, setEditorText] = useState("Your meme text");
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");
  const [verticalPos, setVerticalPos] = useState(8);
  const [horizontalPos, setHorizontalPos] = useState(50);
  const [fontFamily, setFontFamily] = useState("Impact");
  const [isSharing, setIsSharing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [textAlign, setTextAlign] = useState("center");
  const canvasRef = useRef();

  // Share meme to community
  const shareMeme = async () => {
    setIsSharing(true);
    
    try {
      const canvas = canvasRef.current;
      const memeData = {
        imageData: canvas.toDataURL("image/png"),
        text: editorText,
        theme: theme || "custom",
        creator: "Anonymous"
      };

      const response = await fetch("https://meme-backend-qgxz.onrender.com/api/meme/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memeData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Meme shared successfully with the community!");
      } else {
        alert("Failed to share meme: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sharing meme:", error);
      alert("Error sharing meme. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setFlow("editor");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle meme generation
  const handleGenerateMeme = async (e) => {
    e.preventDefault();
    if (!theme) return;
    
    setLoading(true);
    setProgress(0);
    setTextMeme("");
    setImageMemeUrl("");
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Generate text meme
      const textRes = await fetch("https://meme-backend-qgxz.onrender.com/api/meme/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const textData = await textRes.json();
      
      if (!textData.success) {
        clearInterval(progressInterval);
        alert("Failed to generate text meme");
        return;
      }
      
      setTextMeme(textData.memeText);
      setEditorText(textData.memeText);
      setProgress(50);
      
      // Generate image meme
      const imageRes = await fetch("https://meme-backend-qgxz.onrender.com/api/meme/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textData.memeText }),
      });
      const imageData = await imageRes.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (imageData.success) {
        setImageMemeUrl(imageData.imageUrl);
        setFlow("editor");
      } else {
        alert("Failed to generate image meme");
      }
    } catch (err) {
      alert("Error generating meme maybe due to insufficient funds of AI : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Draw the meme
  useEffect(() => {
    if (flow !== "editor" || (!imageMemeUrl && !uploadedImage)) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.src = uploadedImage || imageMemeUrl;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Text styling
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.textAlign = textAlign;

      // Calculate positions
      const x = (horizontalPos / 100) * canvas.width;
      const y = (verticalPos / 100) * canvas.height;

      // Handle multiline text
      const lines = editorText.split('\n');
      const lineHeight = fontSize * 1.5;
      const totalHeight = lines.length * lineHeight;

      let textY;
      if (verticalPos < 20) {
        textY = y + totalHeight/2;
      } else if (verticalPos > 80) {
        textY = y - totalHeight/2;
      } else {
        textY = y - totalHeight/2 + lineHeight/2;
      }

      // Draw each line
      lines.forEach((line, index) => {
        const currentY = textY + (index * lineHeight);
        ctx.strokeText(line, x, currentY);
        ctx.fillText(line, x, currentY);
      });
    };
  }, [flow, imageMemeUrl, uploadedImage, editorText, fontSize, color, verticalPos, 
      horizontalPos, fontFamily, strokeColor, strokeWidth, textAlign]);

  // Download meme
  const downloadMeme = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Reset to choice screen
  const resetFlow = () => {
    setFlow("choice");
    setUploadedImage(null);
    setImageMemeUrl("");
    setTextMeme("");
    setTheme("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">MemeMaster Pro</h1>
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">Premium</span>
            <button 
              onClick={() => navigate('/community')}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all"
            >
              <span className="text-white text-sm">Community</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Initial Choice Screen */}
          {flow === "choice" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Create Your Perfect Meme</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Choose how you'd like to create your meme masterpiece</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Generation Option */}
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFlow("generate")}
                  className="relative bg-white p-6 rounded-xl border border-gray-100 cursor-pointer text-center shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-2">AI-Powered Generation</h3>
                  <p className="text-gray-600 mb-4">Let our advanced AI create a meme based on your theme</p>
                  <div className="inline-flex items-center text-sm text-indigo-600 font-medium">
                    Try it now
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
                
                {/* Upload Option */}
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFlow("upload")}
                  className="relative bg-white p-6 rounded-xl border border-gray-100 cursor-pointer text-center shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <div className="bg-purple-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700 mb-2">Custom Image Upload</h3>
                  <p className="text-gray-600 mb-4">Use your own image to create a personalized meme</p>
                  <div className="inline-flex items-center text-sm text-purple-600 font-medium">
                    Upload now
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Need inspiration? <button onClick={() => navigate('/community')} className="text-indigo-600 hover:underline">Browse community creations</button>
                </p>
              </div>
            </motion.div>
          )}

          {/* AI Generation Flow */}
          {flow === "generate" && (
            <motion.form 
              onSubmit={handleGenerateMeme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center mb-6">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 transition-colors"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">AI Meme Generator</h2>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">What's your meme about?</label>
                <p className="text-xs text-gray-500 mb-2">Enter a theme (e.g., "programmer life", "cat memes", "office humor")</p>
                <input
                  type="text"
                  placeholder="Enter theme..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  required
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg transition-all duration-200 relative overflow-hidden ${
                  loading ? "bg-gray-400" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">Create My Meme</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 8 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-gray-200 rounded-full overflow-hidden shadow-inner"
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {textMeme && !imageMemeUrl && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h3 className="text-lg font-medium text-indigo-800 mb-2">AI-Generated Text:</h3>
                  <p className="text-gray-700 italic">"{textMeme}"</p>
                </div>
              )}
            </motion.form>
          )}

          {/* Upload Flow */}
          {flow === "upload" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center mb-6">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 transition-colors"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Upload Your Image</h2>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-4"
                >
                  <div className="bg-white p-4 rounded-full shadow-md">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drag & drop your image here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    Select Image
                  </motion.button>
                  <p className="text-xs text-gray-400">Supports: JPG, PNG, GIF up to 10MB</p>
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Pro Tip:</span> For best results, use images with a clear focal point and space for text. 
                      Landscape orientation works best for most memes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor Screen (for both flows) */}
          {flow === "editor" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="lg:w-2/5 space-y-6">
                <div className="flex items-center mb-2">
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">Meme Customization</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meme Text</label>
                    <textarea
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      placeholder="Enter meme text (press Enter for new lines)"
                      className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Small</span>
                        <span className="text-sm font-medium">{fontSize}px</span>
                        <span className="text-xs text-gray-500">Large</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="p-1 border border-gray-300 rounded-lg h-10 w-10 cursor-pointer"
                        />
                        <span className="ml-2 text-sm">{color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Color</label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="p-1 border border-gray-300 rounded-lg h-10 w-10 cursor-pointer"
                        />
                        <span className="ml-2 text-sm">{strokeColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Width</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Thin</span>
                        <span className="text-sm font-medium">{strokeWidth}px</span>
                        <span className="text-xs text-gray-500">Thick</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Vertical Position</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={verticalPos}
                      onChange={(e) => setVerticalPos(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Top</span>
                      <span>Bottom</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Horizontal Position</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={horizontalPos}
                      onChange={(e) => setHorizontalPos(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Left</span>
                      <span>Right</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="Impact">Impact</option>
                        <option value="Arial">Arial</option>
                        <option value="Comic Sans MS">Comic Sans</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
                      <select
                        value={textAlign}
                        onChange={(e) => setTextAlign(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <motion.button
                    onClick={resetFlow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-2.5 px-4 rounded-lg font-medium text-indigo-600 bg-white border border-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
                  >
                    New Meme
                  </motion.button>
                  
                  <motion.button
                    onClick={downloadMeme}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </motion.button>
                  
                  <motion.button
                    onClick={shareMeme}
                    disabled={isSharing}
                    whileHover={!isSharing ? { scale: 1.02 } : {}}
                    whileTap={!isSharing ? { scale: 0.98 } : {}}
                    className={`py-2.5 px-4 rounded-lg font-medium text-white shadow-sm transition-colors flex items-center justify-center ${
                      isSharing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSharing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="lg:w-3/5">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Live Preview
                  </h3>
                  <div className="flex justify-center bg-white p-2 rounded-lg border border-gray-200">
                    <canvas 
                      ref={canvasRef} 
                      className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Note:</span> For best results when sharing on social media, download the meme and upload it 
                        directly rather than copying the image. This ensures the highest quality.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}