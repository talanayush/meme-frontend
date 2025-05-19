# 🖼 Meme Generator Frontend - README

## 🌐 Overview

This is the **frontend** of the Meme Generator project. It is responsible for the user interface and user interactions. The frontend communicates with the backend server, sends API requests, displays generated memes, and allows users to vote and share.

Built using **React.js**, this frontend is styled for performance and responsiveness and is deployed via **Vercel**.

Live Link: [https://meme-generator-nine-roan.vercel.app/](https://meme-generator-nine-roan.vercel.app/)

---

## 🚀 Features

* Input prompts to generate meme captions and images
* Integration with Gemini API for text-based meme suggestions
* Integration with Stability AI for image generation
* Upload memes and retrieve public meme feed
* Like/dislike voting system for memes
* Fully responsive and mobile-friendly UI

---

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/talanayush/meme-frontend.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file inside the `/server` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

Make sure this URL points to your backend server.

### 4. Start the Development Server

```bash
npm start
```

The frontend will run on `http://localhost:5173` by default.

---

## 📂 Project Structure

```
meme-frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Main views/pages
│   ├── services/        # API calls and helper functions
│   ├── App.js           # Main application entry
│   ├── index.js         # App rendering
│   └── App.css          # Global styles
└── .env                 # Environment variables
```

---

## 🌐 Deployment

This frontend is deployed using **Vercel**:

* Auto-deployment on every push to the main branch.
* Continuous Integration and Delivery via GitHub.

---

## 🛠 Technologies Used

* React.js
* Vercel
* Cloudinary (for displaying uploaded memes)
* REST API integration with Express backend

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 📬 Contact

For questions or suggestions, feel free to raise an issue or contact the maintainer.
Email : iamayushtalan@gmail.com

**🎉 Happy Meme-ing!**
