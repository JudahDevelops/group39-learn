import { useNavigate } from 'react-router-dom';
import { ProfileForm } from './ProfileForm';

export function Onboarding() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <h1>Set up your profile</h1>
      <p>This takes under a minute. You only do it once.</p>
      <ProfileForm submitLabel="Start learning" onSaved={() => navigate('/', { replace: true })} />
    </div>
  );
}
