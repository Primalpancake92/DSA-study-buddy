import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/authApi.js';
import { useAuth } from '../components/AuthProvider.jsx';
import { recoveryEmailError } from '../../../shared/recoveryEmail.js';

function PasswordInput({ label, name, value, onChange, error, autoComplete }) {
    const [visible, setVisible] = useState(false);
    return (
        <label className="field">
            {label}
            <div className="password-field">
                <input
                    name={name}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                />{' '}
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
            {error && <span className="field-error">{error}</span>}
        </label>
    );
}

function AuthFrame({ title, eyebrow, intro, children }) {
    return (
        <div className="auth-page">
            <section className="auth-benefits">
                <div className="eyebrow">{eyebrow}</div>
                <h1>{title}</h1>
                <p>{intro}</p>
                <div className="auth-proof">
                    <span>16</span>
                    <div>
                        <strong>weeks of deliberate practice</strong>
                        <small>Learn patterns, not isolated tricks.</small>
                    </div>
                </div>
                <div className="auth-orbit" aria-hidden="true">
                    <span>Map</span>
                    <span>DP</span>
                    <span>DFS</span>
                    <span>⌁</span>
                </div>
            </section>
            <section className="auth-card">{children}</section>
        </div>
    );
}

function Field({ label, name, type = 'text', value, onChange, error, autoComplete }) {
    return (
        <label className="field">
            {label}
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            {error && (
                <span className="field-error" id={`${name}-error`} role="alert">
                    {error}
                </span>
            )}
        </label>
    );
}

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [fields, setFields] = useState({});
    const [busy, setBusy] = useState(false);
    const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setFields({});
        try {
            const result = await register(form);
            navigate('/check-your-email', { state: { email: result.email || form.email } });
        } catch (reason) {
            setError(reason.message);
            setFields(reason.fields || {});
        } finally {
            setBusy(false);
        }
    };
    return (
        <AuthFrame
            eyebrow="START YOUR REPETITIONS"
            title="Build interview calm, one pattern at a time."
            intro="Create a free account to save lessons, revisit hard problems and keep your 16-week JavaScript roadmap moving."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">CREATE ACCOUNT</div>
                <h2>Join DSA Grind</h2>
                <p>
                    Already learning here? <Link to="/login">Sign in</Link>
                </p>
            </div>
            <form className="auth-form" onSubmit={submit} noValidate>
                <div className="field-grid">
                    <Field
                        label="First name"
                        name="firstName"
                        value={form.firstName}
                        onChange={change}
                        error={fields.firstName?.[0]}
                        autoComplete="given-name"
                    />
                    <Field
                        label="Last name"
                        name="lastName"
                        value={form.lastName}
                        onChange={change}
                        error={fields.lastName?.[0]}
                        autoComplete="family-name"
                    />
                </div>
                <Field
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={change}
                    error={fields.username?.[0]}
                    autoComplete="username"
                />
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    error={fields.email?.[0]}
                    autoComplete="email"
                />
                <PasswordInput
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={change}
                    error={fields.password?.[0]}
                    autoComplete="new-password"
                />
                <PasswordInput
                    label="Confirm password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={change}
                    error={fields.confirmPassword?.[0]}
                    autoComplete="new-password"
                />
                {error && (
                    <div className="form-error" role="alert">
                        {error}
                    </div>
                )}
                <button className="button primary submit-button" disabled={busy}>
                    {busy ? 'Creating account…' : 'Create Account'}
                </button>
                <small className="form-note">
                    By creating an account, you agree to use DSA Grind for learning and practice.
                </small>
            </form>
        </AuthFrame>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [search] = useSearchParams();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(form);
            navigate(search.get('next') || '/app/dashboard');
        } catch (reason) {
            setError(reason.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <AuthFrame
            eyebrow="WELCOME BACK"
            title="Return to the work that compounds."
            intro="Your roadmap, checkpoints and review habits stay with your account wherever you sign in."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">SIGN IN</div>
                <h2>Welcome back</h2>
                <p>
                    New to DSA Grind? <Link to="/register">Create an account</Link>
                </p>
            </div>
            <form className="auth-form" onSubmit={submit}>
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    autoComplete="email"
                />
                <PasswordInput
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    autoComplete="current-password"
                />
                <div className="form-row">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>
                {error && (
                    <div className="form-error" role="alert">
                        {error}
                    </div>
                )}
                <button className="button primary submit-button" disabled={busy}>
                    {busy ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </AuthFrame>
    );
}

export function ForgotPasswordPage() {
    const pending = useRef(false);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        if (pending.current) {
            return;
        }
        const normalizedEmail = email.trim();
        const validationError = recoveryEmailError(normalizedEmail);
        if (validationError) {
            setError(validationError);
            return;
        }
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            await authApi.forgotPassword(normalizedEmail);
            setSent(true);
        } catch (reason) {
            setError(reason.message);
        } finally {
            pending.current = false;
            setBusy(false);
        }
    };
    return (
        <AuthFrame
            eyebrow="ACCOUNT RECOVERY"
            title="Get back to your next breakthrough."
            intro="Enter your account email and we’ll send a time-limited password reset link."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">RESET PASSWORD</div>
                <h2>Forgot your password?</h2>
            </div>
            {sent ? (
                <div className="success-message">
                    If an account matches that email, reset instructions have been sent.
                </div>
            ) : (
                <form className="auth-form" onSubmit={submit} noValidate>
                    <Field
                        label="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError(recoveryEmailError(event.target.value));
                        }}
                        error={error}
                        autoComplete="email"
                    />
                    <button className="button primary submit-button" disabled={busy}>
                        {busy ? 'Sending…' : 'Send reset link'}
                    </button>
                    <Link className="center-link" to="/login">
                        Back to login
                    </Link>
                </form>
            )}
        </AuthFrame>
    );
}

export function ResetPasswordPage() {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await authApi.resetPassword({ ...form, token: search.get('token') });
            setDone(true);
        } catch (reason) {
            setError(reason.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <AuthFrame
            eyebrow="ACCOUNT RECOVERY"
            title="Choose a password you can trust."
            intro="Reset links expire quickly and are valid only once."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">NEW PASSWORD</div>
                <h2>Reset password</h2>
            </div>
            {done ? (
                <div className="success-message">
                    Password updated.{' '}
                    <button className="text-button" onClick={() => navigate('/login')}>
                        Sign in
                    </button>
                </div>
            ) : (
                <form className="auth-form" onSubmit={submit}>
                    <PasswordInput
                        label="New password"
                        name="password"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        autoComplete="new-password"
                    />
                    <PasswordInput
                        label="Confirm password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={(event) =>
                            setForm({ ...form, confirmPassword: event.target.value })
                        }
                        autoComplete="new-password"
                    />
                    {error && <div className="form-error">{error}</div>}
                    <button className="button primary submit-button" disabled={busy}>
                        {busy ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            )}
        </AuthFrame>
    );
}

export function CheckYourEmailPage() {
    const location = useLocation();
    const email = location.state?.email || '';
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const resend = async () => {
        setResending(true);
        setMessage('');
        setError('');
        try {
            await authApi.resendVerification(email);
            setMessage('If the account is awaiting verification, a new email has been sent.');
            setCooldown(60);
            const timer = setInterval(
                () =>
                    setCooldown((value) => {
                        if (value <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return value - 1;
                    }),
                1000
            );
        } catch (reason) {
            setError(reason.message);
        } finally {
            setResending(false);
        }
    };
    return (
        <AuthFrame
            eyebrow="ONE MORE STEP"
            title="Check your inbox before you start."
            intro="We sent a verification link to your email address. Verify it to unlock your DSA Grind learning space."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">EMAIL VERIFICATION</div>
                <h2>Check your email</h2>
                <p>{email || 'Check the email address you used to register.'}</p>
            </div>
            <div className="success-message">
                Check your inbox and spam folder. The link expires soon and can only be used once.
            </div>
            <div className="auth-form">
                <button
                    className="button primary submit-button"
                    onClick={resend}
                    disabled={resending || cooldown > 0}
                >
                    {resending
                        ? 'Sending…'
                        : cooldown
                          ? `Resend available in ${cooldown}s`
                          : 'Resend verification email'}
                </button>
                {message && <div className="success-message">{message}</div>}
                {error && <div className="form-error">{error}</div>}
                <Link className="center-link" to="/login">
                    Back to login
                </Link>
            </div>
        </AuthFrame>
    );
}

export function VerifyEmailPage() {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');
    // Keep the initial one-time token when navigation removes it from the URL.
    const [token] = useState(() => search.get('token'));

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('This verification link is missing its token.');
            return undefined;
        }

        let active = true;
        async function verify() {
            try {
                await authApi.verifyEmail(token);
                if (active) setStatus('success');
            } catch (reason) {
                if (active) {
                    setStatus('error');
                    setError(reason.message);
                }
            } finally {
                if (active) navigate('/verify-email', { replace: true });
            }
        }

        verify();
        return () => {
            active = false;
        };
    }, [navigate, token]);

    return (
        <AuthFrame
            eyebrow="EMAIL VERIFICATION"
            title={status === 'success' ? 'Your account is ready.' : 'Confirming your email.'}
            intro="A verified email keeps your learning account secure and recoverable."
        >
            <div className="auth-card-heading">
                <div className="section-kicker">
                    {status === 'verifying'
                        ? 'VERIFYING'
                        : status === 'success'
                          ? 'VERIFIED'
                          : 'LINK UNAVAILABLE'}
                </div>
                <h2>
                    {status === 'verifying'
                        ? 'Checking your link…'
                        : status === 'success'
                          ? 'Email verified'
                          : 'Verification failed'}
                </h2>
            </div>
            {status === 'verifying' && (
                <p className="lede">Please wait while we securely validate the one-time link.</p>
            )}
            {status === 'success' && (
                <div className="success-message">
                    Your email is verified. You can now sign in and access the complete curriculum.
                </div>
            )}
            {status === 'error' && (
                <div className="form-error">
                    {error || 'This verification link is invalid or expired.'}
                </div>
            )}
            {status !== 'verifying' && (
                <button className="button primary submit-button" onClick={() => navigate('/login')}>
                    Go to login
                </button>
            )}
        </AuthFrame>
    );
}
