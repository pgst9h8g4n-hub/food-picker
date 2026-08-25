import type { Food, Place, FoodInsert, PlaceInsert } from '@/types/db'

const STORAGE_KEY_FOODS = 'food_picker_foods'
const STORAGE_KEY_PLACES = 'food_picker_places'
const STORAGE_KEY_HISTORY = 'food_picker_history'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function now() {
  return new Date().toISOString()
}

// 数据导出（用于同步）
export function exportAllData(): { foods: Food[]; places: Place[]; history: any[] } {
  return {
    foods: loadFood(),
    places: loadPlace(),
    history: loadHistory(),
  }
}

// 数据导入（从云端合并）
export function importAllData(data: { foods?: Food[]; places?: Place[]; history?: any[] }): void {
  if (data.foods) saveFoods(data.foods)
  if (data.places) savePlaces(data.places)
  if (data.history) saveHistory(data.history)
}

// 数据加载
function loadFood(): Food[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_FOODS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function loadPlace(): Place[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PLACES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_HISTORY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 数据保存
function saveFoods(foods: Food[]) {
  localStorage.setItem(STORAGE_KEY_FOODS, JSON.stringify(foods))
}

function savePlaces(places: Place[]) {
  localStorage.setItem(STORAGE_KEY_PLACES, JSON.stringify(places))
}

function saveHistory(history: any[]) {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
}

// Food CRUD
export function fetchFoods(): Food[] {
  return loadFood()
}

export function addFood(insert: FoodInsert): Food | null {
  const foods = loadFood()
  const food: Food = {
    ...insert,
    id: generateId(),
    user_id: 'local',
    created_at: now(),
    updated_at: now(),
  }
  foods.unshift(food)
  saveFoods(foods)
  return food
}

export function updateFood(id: string, updates: Partial<Food>): Food | null {
  const foods = loadFood()
  const idx = foods.findIndex((f) => f.id === id)
  if (idx === -1) return null
  foods[idx] = { ...foods[idx], ...updates, updated_at: now() }
  saveFoods(foods)
  return foods[idx]
}

export function deleteFood(id: string): boolean {
  const foods = loadFood()
  const filtered = foods.filter((f) => f.id !== id)
  if (filtered.length === foods.length) return false
  saveFoods(filtered)
  return true
}

// Place CRUD
export function fetchPlaces(): Place[] {
  return loadPlace()
}

export function addPlace(insert: PlaceInsert): Place | null {
  const places = loadPlace()
  const place: Place = {
    ...insert,
    id: generateId(),
    user_id: 'local',
    created_at: now(),
    updated_at: now(),
  }
  places.unshift(place)
  savePlaces(places)
  return place
}

export function updatePlace(id: string, updates: Partial<Place>): Place | null {
  const places = loadPlace()
  const idx = places.findIndex((p) => p.id === id)
  if (idx === -1) return null
  places[idx] = { ...places[idx], ...updates, updated_at: now() }
  savePlaces(places)
  return places[idx]
}

export function deletePlace(id: string): boolean {
  const places = loadPlace()
  const filtered = places.filter((p) => p.id !== id)
  if (filtered.length === places.length) return false
  savePlaces(filtered)
  return true
}

// History
export interface HistoryRecord {
  id: string
  food_id: string
  filter_city?: string
  filter_tags?: string[]
  created_at: string
}

export function recordHistory(foodId: string, filterCity?: string, filterTags?: string[]) {
  const history = loadHistory()
  const record: HistoryRecord = {
    id: generateId(),
    food_id: foodId,
    filter_city: filterCity,
    filter_tags: filterTags,
    created_at: now(),
  }
  history.unshift(record)
  saveHistory(history)
  return record
}

export function fetchHistory() {
  return loadHistory()
}
