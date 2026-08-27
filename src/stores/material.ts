import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Material, MaterialType, MaterialStatus } from '@/types/material'

export interface MaterialState {
  list: Material[]
  selectedIds: number[]
  loading: boolean
  total: number
  currentPage: number
  pageSize: number
  filters: {
    type?: MaterialType
    status?: MaterialStatus
    keyword?: string
    dateRange?: [string, string]
  }
}

export const useMaterialStore = defineStore('material', () => {
  // State
  const list = ref<Material[]>([])
  const selectedIds = ref<number[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filters = ref<MaterialState['filters']>({})

  // Getters
  const selectedMaterials = computed(() => {
    return list.value.filter(m => selectedIds.value.includes(m.id))
  })

  const hasSelection = computed(() => selectedIds.value.length > 0)

  const filteredList = computed(() => {
    let result = list.value

    if (filters.value.type) {
      result = result.filter(m => m.type === filters.value.type)
    }

    if (filters.value.status) {
      result = result.filter(m => m.status === filters.value.status)
    }

    if (filters.value.keyword) {
      const keyword = filters.value.keyword.toLowerCase()
      result = result.filter(m => 
        m.name.toLowerCase().includes(keyword) ||
        m.tags?.some(t => t.toLowerCase().includes(keyword))
      )
    }

    return result
  })

  // Actions
  const setList = (newList: Material[]) => {
    list.value = newList
  }

  const setLoading = (val: boolean) => {
    loading.value = val
  }

  const setTotal = (val: number) => {
    total.value = val
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
  }

  const setFilters = (newFilters: MaterialState['filters']) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1 // Reset to first page when filters change
  }

  const toggleSelection = (id: number) => {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  const selectAll = () => {
    selectedIds.value = list.value.map(m => m.id)
  }

  const clearSelection = () => {
    selectedIds.value = []
  }

  const removeMaterials = (ids: number[]) => {
    list.value = list.value.filter(m => !ids.includes(m.id))
    selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
  }

  const addMaterials = (materials: Material[]) => {
    list.value.unshift(...materials)
    total.value += materials.length
  }

  const updateMaterial = (id: number, updates: Partial<Material>) => {
    const index = list.value.findIndex(m => m.id === id)
    if (index > -1) {
      list.value[index] = { ...list.value[index], ...updates }
    }
  }

  // Mock fetch
  const fetchMaterials = async () => {
    loading.value = true
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockData: Material[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `素材_${i + 1}.${['mp4', 'jpg', 'png'][i % 3]}`,
        type: ['VIDEO', 'IMAGE', 'IMAGE'][i % 3] as MaterialType,
        status: ['VALID', 'PENDING', 'AUDITING'][i % 3] as MaterialStatus,
        url: `https://example.com/material/${i + 1}`,
        thumbnail: `https://picsum.photos/300/200?random=${i}`,
        size: Math.floor(Math.random() * 100000000),
        width: 1920,
        height: 1080,
        duration: i % 3 === 0 ? Math.floor(Math.random() * 300) : undefined,
        format: ['mp4', 'jpg', 'png'][i % 3],
        signature: `md5_${i}`,
        tags: ['广告', '产品', '宣传'].slice(0, Math.floor(Math.random() * 3) + 1),
        createTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        advertiserId: 123456,
        isAIGC: i % 5 === 0,
        auditStatus: ['PASS', 'REJECT', 'WARNING'][i % 3] as 'PASS' | 'REJECT' | 'WARNING',
        rejectReasons: i % 3 === 1 ? ['画面模糊', '涉及敏感词'] : undefined,
        demandId: `DEMAND_${String(1000 + i).padStart(6, '0')}`,
        cost: Math.floor(Math.random() * 10000),
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 500),
        costPerConversion: Math.floor(Math.random() * 50) + 10,
        conversionRate: (Math.random() * 0.1).toFixed(2) as unknown as number,
      }))

      list.value = mockData
      total.value = mockData.length
    } finally {
      loading.value = false
    }
  }

  return {
    list,
    selectedIds,
    loading,
    total,
    currentPage,
    pageSize,
    filters,
    selectedMaterials,
    hasSelection,
    filteredList,
    setList,
    setLoading,
    setTotal,
    setPage,
    setPageSize,
    setFilters,
    toggleSelection,
    selectAll,
    clearSelection,
    removeMaterials,
    addMaterials,
    updateMaterial,
    fetchMaterials,
  }
})
