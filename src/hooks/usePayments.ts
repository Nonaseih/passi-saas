import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Payment } from '@/types'

export interface PaymentWithDetails extends Payment {
  ticket_type: {
    id: string
    name: string
    price: number
  }
}

export function usePayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchPayments() {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          ticket_type:ticket_types (id, name, price)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setPayments((data ?? []) as unknown as PaymentWithDetails[])
      }
      setLoading(false)
    }

    fetchPayments()
  }, [user])

  return { payments, loading, error }
}
