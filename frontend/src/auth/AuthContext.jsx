import { useEffect, useState } from 'react'
import AuthContext from './context.js'
import { isSupabaseConfigured, supabase } from './supabase.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return undefined

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Authentication is not configured. Add the Supabase URL and anon key to frontend/.env.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)
    return data
  }

  async function signUp(businessName, email, password) {
    if (!supabase) throw new Error('Authentication is not configured. Add the Supabase URL and anon key to frontend/.env.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName } },
    })
    if (error) throw error
    if (data.session) setUser(data.user)
    return data
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
