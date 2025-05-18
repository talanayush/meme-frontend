import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MemeGenerator from './components/MemeGenerator';
import CommunityMemes from './components/CommunityMemes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MemeGenerator />} />
        <Route path="/community" element={<CommunityMemes />} />
      </Routes>
    </Router>
  );
}

export default App;