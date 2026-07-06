import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Food, Place, FoodInsert, PlaceInsert } from '@/types/db'

export function useAuth() {
  const [loading, setLoading] = useState(false)

  async function signIn(email: string, password: string) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { signIn, signOut, loading }
}

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchFoods() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('type', 'food')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setFoods(data ?? [])
    }
  }

  async function addFood(insert: FoodInsert) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('foods').insert({
      ...insert,
      type: 'food',
      user_id: session.user.id,
    } as Food)
    if (!error) await fetchFoods()
    return error
  }

  async function updateFood(id: string, updates: Partial<Food>) {
    const { error } = await supabase.from('foods').update(updates).eq('id', id)
    if (!error) await fetchFoods()
    return error
  }

  async function deleteFood(id: string) {
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (!error) await fetchFoods()
    return error
  }

  return { foods, loading, error, fetchFoods, addFood, updateFood, deleteFood }
}

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchPlaces() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('type', 'place')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setPlaces(data ?? [])
    }
  }

  async function addPlace(insert: PlaceInsert) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('foods').insert({
      ...insert,
      type: 'place',
      user_id: session.user.id,
    } as Place)
    if (!error) await fetchPlaces()
    return error
  }

  async function updatePlace(id: string, updates: Partial<Place>) {
    const { error } = await supabase.from('foods').update(updates).eq('id', id)
    if (!error) await fetchPlaces()
    return error
  }

  async function deletePlace(id: string) {
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (!error) await fetchPlaces()
    return error
  }

  return { places, loading, error, fetchPlaces, addPlace, updatePlace, deletePlace }
}

export function useHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function record(food: Food, filterCity?: string, filterTags?: string[]) {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('random_history').insert({
      user_id: session.user.id,
      food_id: food.id,
      filter_city: filterCity || null,
      filter_tags: filterTags || null,
    })

    if (!error) {
      await fetchHistory()
    }
    setLoading(false)
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('random_history')
      .select(`
        *,
        foods!inner (name, city, rating, tags, type)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setHistory(data)
  }

  return { history, loading, record, fetchHistory }
}
