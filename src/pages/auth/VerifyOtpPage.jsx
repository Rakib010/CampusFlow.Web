import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import useToastStore from '../../stores/useToastStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';
import AppLogo from '../../components/ui/AppLogo.jsx';
import Icon from '../../components/ui/Icon.jsx';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToastStore();

  const initialEmail = params.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  // No email → bounce to register
  useEffect(() => {
    if (!email) {
      toast.error('Please register first to receive a verification code.');
      navigate('/register');
    } else {
      // focus first input
      inputs.current[0]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputs.current[focusIdx]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      toast.error('Please enter all 6 digits.');
      return;
    }
    setVerifying(true);
    try {
      await authService.verifyOtp(email, otp);
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Verification failed.';
      toast.error(msg);
      // If user was deleted, send back to register
      if (status === 410 || status === 429 || status === 404) {
        setTimeout(() => navigate('/register'), 1500);
      } else {
        // wrong code — clear inputs for retry
        setDigits(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await authService.resendOtp(email);
      toast.success('A new code has been sent to your email.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-card" style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <AppLogo size="lg" />
      </div>

      <div style={{
        width: 56, height: 56, margin: '0 auto 16px',
        background: 'rgba(34,211,238,0.1)', borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)',
      }}>
        <Icon name="shield" size={28} strokeWidth={1.6} />
      </div>
      <h1 className="auth-title" style={{ marginBottom: 6 }}>Verify your email</h1>
      <p className="auth-subtitle" style={{ marginBottom: 8 }}>
        We sent a 6-digit code to
      </p>
      <p style={{
        color: 'var(--accent)',
        fontWeight: 600,
        fontSize: 14,
        marginBottom: 28,
        wordBreak: 'break-all',
      }}>
        {email}
      </p>

      <form onSubmit={handleVerify}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 28,
        }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 44,
                height: 52,
                fontSize: 22,
                fontWeight: 600,
                textAlign: 'center',
                background: d ? 'rgba(34,211,238,0.06)' : 'var(--bg-input, rgba(15,23,42,0.6))',
                color: 'var(--text-primary)',
                border: `1.5px solid ${d ? 'var(--accent)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'all var(--transition-fast)',
                fontFamily: 'monospace',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = d ? 'var(--accent)' : 'var(--border-soft)';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={verifying || digits.join('').length !== OTP_LENGTH}
        >
          {verifying ? <Spinner size="sm" /> : 'Verify Email'}
        </button>
      </form>

      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        Didn't get the code?{' '}
        {cooldown > 0 ? (
          <span style={{ color: 'var(--text-muted)' }}>Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: resending ? 'wait' : 'pointer',
              fontWeight: 500,
              fontSize: 13,
              padding: 0,
            }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>

      <div className="auth-footer" style={{ marginTop: 18 }}>
        <Link to="/register">← Back to register</Link>
      </div>
    </div>
  );
}
