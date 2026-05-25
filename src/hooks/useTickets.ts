import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Ticket } from '@/types'

export interface TicketWithDetails extends Omit<Ticket, 'ticket_type' | 'event'> {
  ticket_type: {
    id: string
    name: string
    price: number
    description: string | null
  }
  event: {
    id: string
    title: string
    date: string
    venue: string
  }
}

export function useTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_type:ticket_types (id, name, price, description),
        event:events (id, title, date, venue)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'used'])
      .order('purchased_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTickets((data ?? []) as unknown as TicketWithDetails[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return { tickets, loading, error, refetch: fetchTickets }
}

export function useActiveTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchActiveTickets() {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_type:ticket_types (id, name, price, description),
          event:events (id, title, date, venue)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setTickets((data ?? []) as unknown as TicketWithDetails[])
      }
      setLoading(false)
    }

    fetchActiveTickets()
  }, [user])

  return { tickets, loading, error }
}
