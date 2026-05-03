import { supabase } from './supabase'

export async function ensureFamilyProfile(authUser) {
  // Step 1: try to read the existing row.
  // upsert + RLS can silently hide the existing row and then crash on INSERT with a
  // duplicate-key error, so we use select-first instead.
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (selectError) {
    console.error('[AIEyes] profile select error:', selectError.code, selectError.message)
  }

  if (existing) {
    // Patch only if role is missing (don't overwrite display_name or other user data).
    if (!existing.role) {
      await supabase
        .from('profiles')
        .update({ role: 'family_user', email: authUser.email })
        .eq('id', authUser.id)
    }
    return existing
  }

  // Step 2: row not found — insert it.
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id:           authUser.id,
      email:        authUser.email,
      display_name: authUser.email.split('@')[0],
      role:         'family_user',
      created_at:   new Date().toISOString(),
    })
    .select('id, email, display_name, role')
    .single()

  if (error) {
    // 23505 = unique_violation: another concurrent call already inserted the row.
    // Fetch and return whatever is there.
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', authUser.id)
        .maybeSingle()
      return retry || { id: authUser.id, email: authUser.email, display_name: authUser.email.split('@')[0], role: 'family_user' }
    }

    console.error('[AIEyes] profile insert error:', error.code, error.message)
    // Non-fatal fallback so the rest of the auth flow is not blocked.
    return { id: authUser.id, email: authUser.email, display_name: authUser.email.split('@')[0], role: 'family_user' }
  }

  return data || { id: authUser.id, email: authUser.email, display_name: authUser.email.split('@')[0], role: 'family_user' }
}

export async function acceptInvite(code, parentUserId) {
  const normalized = code.trim().toUpperCase()

  const { data: invite, error } = await supabase
    .from('family_invites')
    .select('*')
    .eq('invite_code', normalized)
    .maybeSingle()

  if (error) throw new Error('خطأ في الاتصال بالخادم')
  if (!invite) throw new Error('رمز الدعوة غير صالح أو غير موجود')

  const now = new Date()
  if (invite.expires_at && new Date(invite.expires_at) < now) {
    throw new Error('انتهت صلاحية رمز الدعوة')
  }

  // Check if already linked regardless of invite used_at
  const { data: existingLink } = await supabase
    .from('family_links')
    .select('*')
    .eq('app_user_id', invite.app_user_id)
    .eq('family_user_id', parentUserId)
    .maybeSingle()

  if (existingLink) {
    if (existingLink.status !== 'active') {
      await supabase
        .from('family_links')
        .update({ status: 'active' })
        .eq('id', existingLink.id)
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aieyes_pending_invite_code')
    }
    return invite.app_user_id
  }

  if (invite.used_at !== null) {
    throw new Error('تم استخدام رمز الدعوة مسبقاً من قِبَل شخص آخر')
  }

  const { error: linkError } = await supabase
    .from('family_links')
    .insert({
      app_user_id:    invite.app_user_id,
      family_user_id: parentUserId,
      relationship:   'family',
      status:         'active',
    })

  if (linkError) throw new Error('فشل إنشاء الرابط العائلي')

  await supabase
    .from('family_invites')
    .update({ used_at: now.toISOString(), used_by: parentUserId })
    .eq('id', invite.id)

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('aieyes_pending_invite_code')
  }
  return invite.app_user_id
}

export async function loadLinkedUsers(parentUserId) {
  const { data: links, error } = await supabase
    .from('family_links')
    .select('*')
    .eq('family_user_id', parentUserId)
    .eq('status', 'active')

  if (error) throw error
  if (!links || links.length === 0) return []

  const appUserIds = [...new Set(links.map(l => l.app_user_id))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, role')
    .in('id', appUserIds)

  const profileMap = {}
  ;(profiles || []).forEach(p => { profileMap[p.id] = p })

  return links.map(link => ({
    ...link,
    app_user: profileMap[link.app_user_id] || {
      id:           link.app_user_id,
      email:        link.app_user_id,
      display_name: null,
    },
  }))
}

export async function unlinkUser(linkId) {
  const { error } = await supabase
    .from('family_links')
    .update({ status: 'revoked' })
    .eq('id', linkId)

  if (error) throw error
}
