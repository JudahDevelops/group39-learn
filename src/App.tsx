import { Route, Routes } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { ItemPlayer } from './pages/ItemPlayer';
import { Reference } from './pages/Reference';
import { Leaderboard } from './pages/Leaderboard';
import { Admin } from './pages/Admin';
import { SignIn } from './pages/SignIn';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <div className="shell">
      <TopBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:blockSlug/:itemId" element={<ItemPlayer />} />
          <Route path="/reference/:page" element={<Reference />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
