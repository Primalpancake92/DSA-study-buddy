import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/authApi.js';

export function VerifyEmailPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  useEffect(() => {
    const token = search.get('token');
    if (!token) { setStatus('error'); setError('This verification link is missing its token.'); return; }
    authApi.verifyEmail(token).then(() => { setStatus('success'); window.history.replaceState({}, '', '/verify-email'); }).catch((reason) => { setStatus('error'); setError(reason.message); window.history.replaceState({}, '', '/verify-email'); });
  }, [navigate, search]);
  return <div className="auth-page"><section className="auth-benefits"><div className="eyebrow">EMAIL VERIFICATION</div><h1>{status === 'success' ? 'Your account is ready.' : 'Confirming your email.'}</h1><p>A verified email keeps your learning account secure and recoverable.</p></section><section className="auth-card"><div className="auth-card-heading"><div className="section-kicker">{status === 'verifying' ? 'VERIFYING' : status === 'success' ? 'VERIFIED' : 'LINK UNAVAILABLE'}</div><h2>{status === 'verifying' ? 'Checking your link…' : status === 'success' ? 'Email verified' : 'Verification failed'}</h2></div>{status === 'verifying' && <p className="lede">Please wait while we securely validate the one-time link.</p>}{status === 'success' && <div className="success-message">Your email is verified. You can now sign in and access the complete curriculum.</div>}{status === 'error' && <div className="form-error">{error || 'This verification link is invalid or expired.'}</div>}{status !== 'verifying' && <button className="button primary submit-button" onClick={() => navigate('/login')}>Go to login</button>}</section></div>;
}
