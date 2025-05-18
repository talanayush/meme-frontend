import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MemeGenerator() {
  // App flow states
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
      alert("Error generating meme: " + err.message);
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
      ctx.lineWidth = fontSize / 8;
      ctx.strokeStyle = "black";
      ctx.textAlign = "center";

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
  }, [flow, imageMemeUrl, uploadedImage, editorText, fontSize, color, verticalPos, horizontalPos, fontFamily]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <motion.h1 
            className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Meme Generator
          </motion.h1>
          <motion.h1
            onClick={() => window.location.href = '/community'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full hover:shadow-md transition-all"
          >
            Explore Community Creations →
          </motion.h1>

          {/* Initial Choice Screen */}
          {flow === "choice" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-semibold text-center text-gray-800">How would you like to create your meme?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Generation Option */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFlow("generate")}
                  className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-100 cursor-pointer text-center"
                >
                  <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-indigo-700 mb-2">Generate with AI</h3>
                  <p className="text-gray-600">Let AI create a meme based on your theme</p>
                </motion.div>
                
                {/* Upload Option */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFlow("upload")}
                  className="bg-purple-50 p-6 rounded-xl border-2 border-purple-100 cursor-pointer text-center"
                >
                  <div className="bg-purple-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700 mb-2">Upload Your Own</h3>
                  <p className="text-gray-600">Use your own image to create a custom meme</p>
                </motion.div>
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
                  className="text-indigo-600 hover:text-indigo-800 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">Generate with AI</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What's your meme about?</label>
                <input
                  type="text"
                  placeholder="Enter theme (e.g. programmer life, cat memes, etc.)"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white shadow-lg transition-all duration-200 ${
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
                  "Create My Meme"
                )}
              </motion.button>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 8 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-gray-200 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
                  className="text-indigo-600 hover:text-indigo-800 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">Upload Your Image</h2>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-gray-600">Click to upload an image</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                  >
                    Select Image
                  </motion.button>
                </label>
              </div>
            </motion.div>
          )}

          {/* Editor Screen (for both flows) */}
          {flow === "editor" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center mb-4">
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="text-indigo-600 hover:text-indigo-800 mr-4"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                  </button>
                  <h2 className="text-2xl font-semibold text-gray-800">Customize Your Meme</h2>
                </div>

                <textarea
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Enter meme text (press Enter for new lines)"
                  className="block w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  rows={4}
                />

                <div className="flex gap-4">
                  <label className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-gray-700 mb-1">Font Size</span>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </label>

                  <label className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-gray-700 mb-1">Color</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="p-1 border-2 border-gray-200 rounded-lg h-10 w-full"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Vertical Position: {verticalPos}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={verticalPos}
                    onChange={(e) => setVerticalPos(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Top (0%)</span>
                    <span>Bottom (100%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Horizontal Position: {horizontalPos}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={horizontalPos}
                    onChange={(e) => setHorizontalPos(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Left (0%)</span>
                    <span>Right (100%)</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-gray-700 mb-1">Font</span>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Impact">Impact</option>
                      <option value="Arial">Arial</option>
                      <option value="Comic Sans MS">Comic Sans</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier</option>
                    </select>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    onClick={resetFlow}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 px-6 rounded-lg font-bold text-indigo-600 bg-white border-2 border-indigo-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Start Over
                  </motion.button>
                  
                  <motion.button
                    onClick={downloadMeme}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Download Meme
                  </motion.button>
                  
                  <motion.button
                    onClick={shareMeme}
                    disabled={isSharing}
                    whileHover={!isSharing ? { scale: 1.03 } : {}}
                    whileTap={!isSharing ? { scale: 0.98 } : {}}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                      isSharing ? 'bg-gray-400' : 'bg-gradient-to-r from-green-600 to-emerald-600'
                    }`}
                  >
                    {isSharing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sharing...
                      </span>
                    ) : (
                      "Share to Community"
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
                <canvas 
                  ref={canvasRef} 
                  className="w-full border-2 border-gray-200 rounded-xl shadow-md"
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}