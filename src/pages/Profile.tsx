import { ProfileForm } from './ProfileForm';

/** Where a member changes their display name, daily goal or GitHub username after onboarding. */
export function Profile() {
  return (
    <div className="page">
      <h1>Your profile</h1>
      <p>Change how you appear to the group, or how much you want to learn each day.</p>
      <ProfileForm
        submitLabel="Save changes"
        savedMessage="Saved. Your changes are in the top bar."
      />
    </div>
  );
}
