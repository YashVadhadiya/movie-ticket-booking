import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function SmsLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getSmsLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRetry = async (bookingId) => {
    try {
      const data = await api.retrySms(bookingId);
      window.open(data.whatsappUrl, '_blank');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>SMS / WhatsApp Logs</h1>
          <p className="subtitle">Delivery history for booking confirmations</p>
        </div>
        <button className="btn" onClick={load}>🔄 Refresh</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="info-note">
        📱 This system uses WhatsApp click-to-chat for ticket confirmations.
        Click <strong>"Send WhatsApp"</strong> to open WhatsApp with the pre-filled message.
      </div>

      {logs.length === 0 && (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p style={{ color: 'var(--text-muted)' }}>No message logs yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Logs appear here when bookings are made.
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Mobile</th>
                <th>Message</th>
                <th>Status</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const timeAgo = log.createdAt
                  ? new Date(log.createdAt).toLocaleString()
                  : '-';
                return (
                  <tr key={log.id}>
                    <td><code className="mono">{log.bookingId?.slice(0, 8)}...</code></td>
                    <td>{log.mobile}</td>
                    <td className="msg-cell" title={log.message}>
                      {log.message?.substring(0, 60)}...
                    </td>
                    <td>
                      <span className={`badge ${log.status}`}>
                        {log.status === 'logged' || log.status === 'retry_logged' ? '📝 Logged' : log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {timeAgo}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleRetry(log.bookingId)}
                      >
                        📱 Send WhatsApp
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
