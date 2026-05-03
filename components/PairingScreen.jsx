'use client'
import { useState } from 'react'
import PreDashboardShell from './PreDashboardShell'

function userLabel(u) {
  if (!u) return '—'
  return u.display_name || u.email?.split('@')[0] || u.email || '—'
}

function userInitial(u) {
  return userLabel(u).charAt(0).toUpperCase()
}

function PairingVisualPanel() {
  return (
    <div className="pre-visual-stack pre-visual-stack--pairing">
      <div className="pre-visual-topbar">
        <div className="pre-brand-lockup pre-brand-lockup--visual">
          <div className="pre-brand-mark pre-brand-mark--small" aria-hidden="true">
            <span className="pre-brand-mark-orbit" />
            <span className="pre-brand-mark-core" />
            <span className="pre-brand-mark-glint" />
          </div>
          <div>
            <div className="pre-brand-name">AIEyes</div>
            <div className="pre-brand-sub">FAMILY ACCESS</div>
          </div>
        </div>

        <div className="pre-visual-pill">Protected linking</div>
      </div>

      <div className="pre-visual-art pre-visual-art--pairing" aria-hidden="true">
        <div className="pre-visual-link-arc pre-visual-link-arc--a" />
        <div className="pre-visual-link-arc pre-visual-link-arc--b" />
        <div className="pre-visual-node pre-visual-node--left" />
        <div className="pre-visual-node pre-visual-node--right" />
        <div className="pre-visual-glow" />
      </div>

      <div className="pre-visual-copy">
        <div className="pre-visual-kicker">Family access linking</div>
        <h1>Connect an AIEyes account</h1>
        <p>Securely link this dashboard to an AIEyes mobile account.</p>
      </div>
    </div>
  )
}

export default function PairingScreen({
  parentProfile,
  linkedUsers = [],
  onConnect,
  onLogout,
  onSelectUser,
  inviteError,
  initError,
  onClearInviteError,
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(inviteError || initError || null)

  const handleCodeChange = (e) => {
    const nextValue = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    setCode(nextValue)
    if (error) {
      setError(null)
      onClearInviteError?.()
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)

    try {
      await onConnect(code.trim())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const parentName = parentProfile?.display_name || parentProfile?.email?.split('@')[0] || 'Family member'
  const parentInitial = parentName.charAt(0).toUpperCase()

  return (
    <PreDashboardShell visualPanel={<PairingVisualPanel />}>
      <div className="pre-panel-stack pre-panel-stack--pairing" dir="ltr">
        <div className="pre-panel-head">
          <div className="pre-panel-brand-wrap">
            <div className="pre-brand-mark pre-brand-mark--small" aria-hidden="true">
              <span className="pre-brand-mark-orbit" />
              <span className="pre-brand-mark-core" />
              <span className="pre-brand-mark-glint" />
            </div>
            <div>
              <div className="pre-panel-brand">AIEyes</div>
              <div className="pre-panel-brand-sub">Family access</div>
            </div>
          </div>

          {parentProfile && (
            <div className="pre-account-chip" dir="ltr">
              <div className="pre-account-avatar">{parentInitial}</div>
              <div className="pre-account-copy">
                <div className="pre-account-name">{parentName}</div>
                <button onClick={onLogout} className="pre-inline-link pre-inline-link--muted" style={{ padding: 0 }}>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pre-auth-copy">
          <div className="pre-panel-eyebrow">Family access</div>
          <h2 className="pre-panel-title">Connect an AIEyes account</h2>
          <p className="pre-panel-subtitle">Enter the family access code from the mobile app.</p>
        </div>

        <div className="pre-callout pre-callout--neutral pre-callout--compact" dir="ltr">
          Open AIEyes mobile app → Family Access → scan QR or copy invite code.
        </div>

        {linkedUsers.length > 0 && (
          <div className="pre-mini-section">
            <div className="pre-mini-label">Linked profiles</div>
            <div className="pre-mini-list">
              {linkedUsers.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onSelectUser(link)}
                  className="pre-mini-chip"
                >
                  <div className="pre-mini-avatar">{userInitial(link.app_user)}</div>
                  <div className="pre-mini-copy">
                    <div className="pre-mini-name">{userLabel(link.app_user)}</div>
                    <div className="pre-mini-sub">Switch</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleConnect} className="auth-form auth-form--pairing">
          <div className="auth-field">
            <label dir="ltr">Family access code</label>
            <input
              value={code}
              onChange={handleCodeChange}
              placeholder="AIEYES-XXXXXXXX"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              inputMode="text"
              className="pairing-code-input"
            />
          </div>

          <div className="pre-code-hint pre-code-hint--compact" dir="ltr">
            Once accepted, alerts, location, and activity will appear in your dashboard.
          </div>

          {error && <div className="auth-message auth-message--error" dir="rtl">{error}</div>}

          <button type="submit" disabled={loading || !code.trim()} className="auth-submit" dir="ltr">
            {loading ? <span className="auth-spinner" /> : 'Connect account'}
          </button>
        </form>
      </div>
    </PreDashboardShell>
  )
}
