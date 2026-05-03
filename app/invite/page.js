'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function InviteRedirect() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('invite')
    if (code) {
      router.replace(`/?code=${encodeURIComponent(code.trim().toUpperCase())}`)
    } else {
      router.replace('/')
    }
  }, [searchParams, router])

  return null
}

export default function InvitePage() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0814',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,rgba(99,102,241,.35),rgba(50,30,120,.12))',
          border: '1px solid rgba(99,102,241,.28)',
        }}>👁</div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(99,102,241,.15)', borderTopColor: '#6366f1',
          animation: 'spin-cw .8s linear infinite',
        }} />
        <div style={{ color: 'rgba(255,255,255,.4)', fontFamily: 'Space Grotesk', fontSize: 13, letterSpacing: '.05em' }}>
          جارٍ التوجيه...
        </div>
        <Suspense>
          <InviteRedirect />
        </Suspense>
      </div>
    </div>
  )
}
