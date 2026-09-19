import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home.jsx';
import DramaDetail from './pages/DramaDetail.jsx';
import Watch from './pages/Watch.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drama/:id" element={<DramaDetail />} />
        <Route path="/watch" element={<Watch />} />
      </Routes>
    </BrowserRouter>
  );
}
