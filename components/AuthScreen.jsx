'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PreDashboardShell from './PreDashboardShell'

function AuthVisualPanel({ mode }) {
  const headline = mode === 'register'
    ? 'Create your account'
    : mode === 'forgot'
      ? 'Reset access'
      : 'Welcome back'

  const subtitle = mode === 'register'
    ? 'Secure family monitoring for AIEyes users.'
    : mode === 'forgot'
      ? 'Recover access without exposing the dashboard.'
      : 'Stay connected with the people who matter most.'

  return (
    <div className="pre-visual-stack pre-visual-stack--auth">
      <div className="pre-visual-topbar">
        <div className="pre-brand-lockup pre-brand-lockup--visual">
          <div className="pre-brand-mark pre-brand-mark--small" aria-hidden="true">
            <span className="pre-brand-mark-orbit" />
            <span className="pre-brand-mark-core" />
            <span className="pre-brand-mark-glint" />
          </div>
          <div>
            <div className="pre-brand-name">AIEyes</div>
            <div className="pre-brand-sub">FAMILY DASHBOARD</div>
          </div>
        </div>

        <div className="pre-visual-pill">Secure access</div>
      </div>

      <div className="pre-visual-art pre-visual-art--auth" aria-hidden="true">
        <div className="pre-visual-eye pre-visual-eye--a" />
        <div className="pre-visual-eye pre-visual-eye--b" />
        <div className="pre-visual-wave" />
        <div className="pre-visual-glow" />
      </div>

      <div className="pre-visual-copy">
        <div className="pre-visual-kicker">AIEyes Family Dashboard</div>
        <h1>{headline}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function PanelBrand() {
  return (
    <div className="pre-panel-brand-wrap">
      <div className="pre-brand-mark pre-brand-mark--small" aria-hidden="true">
        <span className="pre-brand-mark-orbit" />
        <span className="pre-brand-mark-core" />
        <span className="pre-brand-mark-glint" />
      </div>
      <div>
        <div className="pre-panel-brand">AIEyes</div>
        <div className="pre-panel-brand-sub">Family Dashboard</div>
      </div>
    </div>
  )
}

function BackBtn({ onClick, label = 'Back to sign in' }) {
  return (
    <button type="button" onClick={onClick} className="pre-back-btn">
      {label}
    </button>
  )
}

export default function AuthScreen({ pendingCode, initError, onClearInitError }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState(initError || null)

  const isForgot = mode === 'forgot'
  const title = isForgot
    ? 'Reset access'
    : mode === 'register'
      ? 'Create your account'
      : 'Welcome back'
  const subtitle = isForgot
    ? 'Enter your email and we will send a recovery link.'
    : mode === 'register'
      ? 'Create a secure family account to continue.'
      : 'Sign in to continue to your family dashboard.'

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError(null)
    setResent(false)
    onClearInitError?.()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })

        if (err) {
          if (err.message.includes('Email not confirmed') || err.message.includes('email_not_confirmed') || err.code === 'email_not_confirmed') {
            setMode('confirm_email')
            return
          }

          if (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials')) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          }

          throw new Error('فشل تسجيل الدخول — حاول مجدداً')
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password })

        if (err) {
          if (err.message.includes('already registered') || err.message.includes('already been registered')) {
            throw new Error('هذا البريد الإلكتروني مسجل بالفعل — سجّل دخولك')
          }

          if (err.message.toLowerCase().includes('password')) {
            throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
          }

          throw new Error('فشل إنشاء الحساب — حاول مجدداً')
        }

        if (data?.session === null) {
          setMode('confirm_email')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email)
      if (err) throw new Error('فشل إرسال رابط إعادة التعيين — حاول مجدداً')
      setMode('forgot_sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    setError(null)

    try {
      const { error: err } = await supabase.auth.resend({ type: 'signup', email })
      if (err) throw new Error('فشل إعادة الإرسال — حاول مجدداً')
      setResent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  const shellProps = {
    visualPanel: <AuthVisualPanel mode={mode} />,
  }

  if (mode === 'confirm_email') {
    return (
      <PreDashboardShell {...shellProps}>
        <div className="pre-panel-stack pre-panel-stack--auth" dir="ltr">
          <div className="pre-panel-head">
            <PanelBrand />
            <div className="pre-status-pill">Secure access</div>
          </div>

          <div className="pre-auth-copy">
            <div className="pre-panel-eyebrow">Email verification</div>
            <h2 className="pre-panel-title">Check your inbox</h2>
            <p className="pre-panel-subtitle">We sent a verification link to</p>
            <div className="pre-inline-email pre-inline-email--auth" dir="ltr">{email}</div>
          </div>

          <div className="pre-callout pre-callout--neutral" dir="rtl">
            افتح البريد، ثم ابحث عن رسالة التفعيل. إذا لم تظهر، راجع مجلد Spam أو Junk.
          </div>

          {error && <div className="pre-message pre-message--error" dir="rtl">{error}</div>}
          {resent && <div className="pre-message pre-message--success" dir="rtl">تم إعادة إرسال رسالة التفعيل</div>}

          <div className="pre-stack-actions">
            <button type="button" onClick={handleResend} disabled={resending} className="pre-submit" dir="ltr">
              {resending ? <span className="auth-spinner" /> : 'Resend verification email'}
            </button>
            <BackBtn onClick={() => switchMode('login')} />
          </div>
        </div>
      </PreDashboardShell>
    )
  }

  if (mode === 'forgot_sent') {
    return (
      <PreDashboardShell {...shellProps}>
        <div className="pre-panel-stack pre-panel-stack--auth" dir="ltr">
          <div className="pre-panel-head">
            <PanelBrand />
            <div className="pre-status-pill">Secure access</div>
          </div>

          <div className="pre-auth-copy">
            <div className="pre-panel-eyebrow">Password reset</div>
            <h2 className="pre-panel-title">Check your inbox</h2>
            <p className="pre-panel-subtitle">We sent a password reset link to</p>
            <div className="pre-inline-email pre-inline-email--auth" dir="ltr">{email}</div>
          </div>

          <div className="pre-callout pre-callout--neutral" dir="rtl">
            أعد فتح البريد من أي جهاز مسجل لديك، ثم استخدم الرابط للعودة إلى تسجيل الدخول.
          </div>

          {error && <div className="pre-message pre-message--error" dir="rtl">{error}</div>}
          <BackBtn onClick={() => switchMode('login')} />
        </div>
      </PreDashboardShell>
    )
  }

  return (
    <PreDashboardShell {...shellProps}>
      <div className="pre-panel-stack pre-panel-stack--auth" dir="ltr">
        <div className="pre-panel-head">
          <PanelBrand />
          <div className="pre-status-pill">Secure access</div>
        </div>

        <div className="pre-auth-copy">
          <div className="pre-panel-eyebrow">AIEyes Family Dashboard</div>
          <h2 className="pre-panel-title">{title}</h2>
          <p className="pre-panel-subtitle">{subtitle}</p>
        </div>

        {pendingCode && !isForgot && (
          <div className="pre-callout pre-callout--success" dir="rtl">
            <div className="pre-callout-title">رمز دعوة معلق</div>
            <div className="pre-inline-email">{pendingCode}</div>
            <div className="pre-callout-copy">سيتم قبوله تلقائياً بعد تسجيل الدخول.</div>
          </div>
        )}

        {!isForgot && (
          <div className="auth-tabs">
            {[
              ['login', 'Log in'],
              ['register', 'Create account'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                className={`auth-tab${mode === key ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={isForgot ? handleForgot : handleSubmit} className="auth-form">
          <div className="auth-field">
            <label dir="ltr">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          {!isForgot && (
            <div className="auth-field">
              <div className="auth-field-row" dir="ltr">
                <label>Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="pre-inline-link"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                dir="ltr"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="pre-callout pre-callout--neutral" dir="rtl">
              ستصلك رسالة تفعيل بعد إنشاء الحساب. إذا لم تجدها، راجع مجلد Spam أو Junk.
            </div>
          )}

          {error && <div className="auth-message auth-message--error" dir="rtl">{error}</div>}

          <button type="submit" disabled={loading} className="auth-submit" dir="ltr">
            {loading
              ? <span className="auth-spinner" />
              : isForgot
                ? 'Send recovery link'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
          </button>

          {isForgot && <BackBtn onClick={() => switchMode('login')} label="Back to sign in" />}
        </form>
      </div>
    </PreDashboardShell>
  )
}
