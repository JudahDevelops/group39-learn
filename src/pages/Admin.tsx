import '../styles/admin.css';
import { useCurrentUser } from '../store/StoreContext';
import { AdminDashboard } from './admin/AdminDashboard';
import { NotFound } from './NotFound';

/**
 * /admin: the dashboard for the admin (Judah). Anyone else gets the same page as an address that
 * does not exist, and the dashboard (and its data request) is never mounted for them. The
 * database enforces this too: only an admin's profile lets them read other members' rows.
 */
export function Admin() {
  const user = useCurrentUser();
  if (user?.role !== 'admin') return <NotFound />;
  return <AdminDashboard />;
}
