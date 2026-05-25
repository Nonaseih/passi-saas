import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Event, TicketType } from '@/types'

export interface EventWithTicketTypes extends Event {
  ticket_types: TicketType[]
}

export function useEvents() {
  const [events, setEvents] = useState<EventWithTicketTypes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          ticket_types (*)
        `)
        .in('status', ['published', 'ongoing'])
        .order('date', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setEvents((data ?? []) as unknown as EventWithTicketTypes[])
      }
      setLoading(false)
    }

    fetchEvents()
  }, [])

  return { events, loading, error }
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventWithTicketTypes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return

    async function fetchEvent() {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`*, ticket_types (*)`)
        .eq('id', eventId)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setEvent(data as unknown as EventWithTicketTypes)
      }
      setLoading(false)
    }

    fetchEvent()
  }, [eventId])

  return { event, loading, error }
}
