'use client'

export default function PreDashboardShell({
  visualPanel,
  children,
}) {
  return (
    <main className="pre-shell" dir="ltr">
      <div className="pre-shell-bg" aria-hidden="true">
        <div className="pre-orb pre-orb-a" />
        <div className="pre-orb pre-orb-b" />
        <div className="pre-orb pre-orb-c" />
        <div className="pre-shell-gridline" />
      </div>

      <div className="pre-shell-stage">
        <div className="pre-auth-card">
          <aside className="pre-visual-panel" aria-label="AIEyes product introduction">
            {visualPanel}
          </aside>

          <section className="pre-form-panel">
            <div className="pre-form-panel-inner">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
