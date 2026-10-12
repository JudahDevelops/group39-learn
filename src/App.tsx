import { Route, Routes } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { ItemPlayer } from './pages/ItemPlayer';
import { Reference } from './pages/Reference';
import { Leaderboard } from './pages/Leaderboard';
import { Admin } from './pages/Admin';
import { SignIn } from './pages/SignIn';
import { SetPassword } from './pages/SetPassword';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { RequireAuth } from './pages/RequireAuth';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <div className="shell">
      <TopBar />
      <main className="main">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/set-password" element={<SetPassword />} />
          {/* Everything else needs a signed-in user with a display name. */}
          <Route element={<RequireAuth />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:blockSlug/:itemId" element={<ItemPlayer />} />
            <Route path="/reference" element={<Reference />} />
            <Route path="/reference/:page" element={<Reference />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
