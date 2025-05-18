import React, { useRef, useState, useEffect } from "react";

export default function MemeEditor() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("Your meme text");
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState("center");
  const [fontFamily, setFontFamily] = useState("Impact");
  const canvasRef = useRef();

  // Draw the meme whenever input changes
  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";

      let y;
      if (position === "top") y = 50;
      else if (position === "center") y = canvas.height / 2;
      else if (position === "bottom") y = canvas.height - 30;

      ctx.strokeText(text, canvas.width / 2, y);
      ctx.fillText(text, canvas.width / 2, y);
    };
  }, [image, text, fontSize, color, position, fontFamily]);

  // Download canvas as image
  const downloadMeme = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      {/* Left Controls */}
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold">Meme Controls</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="block w-full p-2 border rounded"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter meme text"
          className="block w-full p-2 border rounded"
        />

        <div className="flex gap-2">
          <label className="flex flex-col">
            Font Size
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="p-1 border rounded w-24"
            />
          </label>

          <label className="flex flex-col">
            Color
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="p-1 border rounded"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <label className="flex flex-col">
            Position
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="p-1 border rounded"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>

          <label className="flex flex-col">
            Font
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="p-1 border rounded"
            >
              <option value="Impact">Impact</option>
              <option value="Arial">Arial</option>
              <option value="Comic Sans MS">Comic Sans</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier</option>
            </select>
          </label>
        </div>
      </div>

      {/* Right Preview */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-2">Live Preview</h2>
        {image ? (
          <>
            <canvas ref={canvasRef} className="w-full border rounded shadow" />
            <button
              onClick={downloadMeme}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Download Meme
            </button>
          </>
        ) : (
          <div className="text-gray-500 italic">Upload an image to start</div>
        )}
      </div>
    </div>
  );
}
