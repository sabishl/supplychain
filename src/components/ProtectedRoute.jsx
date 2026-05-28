import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        setChecking(false);
        return;
      }
      // Check if user exists in admin_users table
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      setAuthorized(!!adminRecord);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return <div className="route-loading">Checking secure session...</div>;
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
