'use client';
import { useState } from 'react';
import { api } from './api';
export function StartDemo() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <><button className="button primary" disabled={busy} onClick={async () => {
    setBusy(true); setError(''); try { await api('/auth/demo', { method: 'POST' }); window.location.assign('/today'); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }}>{busy ? 'Opening your workspace…' : 'Try the judge demo'}<span aria-hidden="true">↗</span></button>{error && <p role="alert" className="error">{error}</p>}</>;
}
