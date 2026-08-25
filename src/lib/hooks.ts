import { useState, useEffect } from 'react'
import type { Food, Place, FoodInsert, PlaceInsert } from '@/types/db'
import {
  fetchFoods,
  addFood as storageAddFood,
  updateFood as storageUpdateFood,
  deleteFood as storageDeleteFood,
  fetchPlaces,
  addPlace as storageAddPlace,
  updatePlace as storageUpdatePlace,
  deletePlace as storageDeletePlace,
  recordHistory as storageRecordHistory,
  fetchHistory as storageFetchHistory,
  type HistoryRecord,
} from '@/lib/storage'
import { isLoggedIn, login, logout, needsSetup as authNeedsSetup, setupPassword } from '@/lib/auth'
import {
  isSyncEnabled,
  getGithubToken,
  syncData,
  clearGithubToken,
} from '@/lib/gist-sync'
import { exportAllData, importAllData } from '@/lib/storage'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setNeedsSetup(authNeedsSetup())
    setSyncStatus(getGithubToken() ? 'connected' : 'disconnected')
  }, [])

  async function signIn(password: string) {
    setLoading(true)
    const ok = login(password)
    setLoading(false)
    if (ok) {
      setLoggedIn(true)
      setNeedsSetup(false)
      // 登录成功后自动同步
      await autoSync(password)
    }
    return ok ? null : new Error('密码错误')
  }

  async function signUp(password: string) {
    setLoading(true)
    setupPassword(password)
    login(password)
    setLoading(false)
    setLoggedIn(true)
    setNeedsSetup(false)
    // 创建账号后自动同步
    await autoSync(password)
    return null
  }

  async function signOut() {
    logout()
    setLoggedIn(false)
  }

  async function autoSync(password: string) {
    if (!getGithubToken() || !isSyncEnabled()) return
    setSyncing(true)
    try {
      const localData = exportAllData()
      const merged = await syncData(password, localData)
      importAllData(merged)
      setSyncStatus('connected')
    } catch (e) {
      console.warn('同步失败:', e)
    } finally {
      setSyncing(false)
    }
  }

  async function forceSync(password: string) {
    if (!getGithubToken()) {
      setSyncStatus(null)
      return false
    }
    setSyncing(true)
    try {
      const localData = exportAllData()
      const merged = await syncData(password, localData)
      importAllData(merged)
      setSyncStatus('connected')
      return true
    } catch (e) {
      console.warn('同步失败:', e)
      setSyncStatus('disconnected')
      return false
    } finally {
      setSyncing(false)
    }
  }

  function disconnectGithub() {
    clearGithubToken()
    setSyncStatus(null)
  }

  return { signIn, signUp, signOut, loading, loggedIn, needsSetup, syncStatus, syncing, forceSync, disconnectGithub }
}

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchFoodsFn() {
    setLoading(true)
    setError(null)
    const data = fetchFoods()
    setLoading(false)
    setFoods(data)
  }

  async function addFood(insert: FoodInsert) {
    try {
      const food = storageAddFood(insert)
      if (food) await fetchFoodsFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '添加失败')
    }
  }

  async function updateFood(id: string, updates: Partial<Food>) {
    try {
      const food = storageUpdateFood(id, updates)
      if (food) await fetchFoodsFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '更新失败')
    }
  }

  async function deleteFood(id: string) {
    try {
      const ok = storageDeleteFood(id)
      if (ok) await fetchFoodsFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '删除失败')
    }
  }

  return { foods, loading, error, fetchFoods: fetchFoodsFn, addFood, updateFood, deleteFood }
}

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchPlacesFn() {
    setLoading(true)
    setError(null)
    const data = fetchPlaces()
    setLoading(false)
    setPlaces(data)
  }

  async function addPlace(insert: PlaceInsert) {
    try {
      const place = storageAddPlace(insert)
      if (place) await fetchPlacesFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '添加失败')
    }
  }

  async function updatePlace(id: string, updates: Partial<Place>) {
    try {
      const place = storageUpdatePlace(id, updates)
      if (place) await fetchPlacesFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '更新失败')
    }
  }

  async function deletePlace(id: string) {
    try {
      const ok = storageDeletePlace(id)
      if (ok) await fetchPlacesFn()
      return null
    } catch (e) {
      return new Error(e instanceof Error ? e.message : '删除失败')
    }
  }

  return { places, loading, error, fetchPlaces: fetchPlacesFn, addPlace, updatePlace, deletePlace }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)

  async function record(foodId: string, filterCity?: string, filterTags?: string[]) {
    setLoading(true)
    storageRecordHistory(foodId, filterCity, filterTags)
    await fetchHistory()
    setLoading(false)
  }

  async function fetchHistory() {
    const data = storageFetchHistory()
    setHistory(data)
  }

  return { history, loading, record, fetchHistory }
}
