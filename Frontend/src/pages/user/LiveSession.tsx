import React, { useEffect, useState } from 'react';
import { liveSessionAPI } from '@/api/studentAPI';
import { useAuth } from '@/contexts/AuthContext';

const LiveSessionPage: React.FC = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      try {
        const response = await liveSessionAPI.getAll();
        setSessions(response.data.sessions || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch live sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Student Live Sessions</h2>
      {sessions.length === 0 ? (
        <div>No live sessions found.</div>
      ) : (
        <ul>
          {sessions.map(session => (
            <li key={session._id}>{session.title} - {session.instructor}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveSessionPage;
