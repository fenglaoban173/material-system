import type { WorkHoursSetting, WorkHoursQuery, WorkHoursFormData } from '@/types/settings'

// 当前为前端 mock 数据; 后续接入后端时替换以下实现即可

const seed: WorkHoursSetting[] = [
  {
    id: 1,
      creator: '张经理',
    typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_YB'],
    format: '竖版视频',
    hours: 4,
    remark: '有脚本混剪, 含脚本、分镜、初剪、终剪',
    enabled: true,
    createTime: '2026-04-12 10:00:00',
    updateTime: '2026-06-01 14:32:18',
  },
  {
    id: 2,
      creator: '李经理',
    typePath: ['VIDEO', 'VIDEO_MIXCUT', 'VIDEO_MIXCUT_BKN'],
    format: '竖版视频',
    hours: 1.5,
    remark: '爆款裂变, 15s 以内竖版',
    enabled: true,
    createTime: '2026-04-12 10:05:00',
    updateTime: '2026-06-02 09:18:42',
  },
  {
    id: 3,
      creator: '王经理',
    typePath: ['IMAGE'],
    format: '详情页',
    hours: 0.5,
    remark: '首图 / 封面通用',
    enabled: true,
    createTime: '2026-04-15 16:22:11',
  },
  {
    id: 4,
      creator: '张经理',
    typePath: ['IMAGE'],
    format: '落地页',
    hours: 6,
    remark: '含首屏大图 + 详情页模块图',
    enabled: true,
    createTime: '2026-04-20 09:14:33',
    updateTime: '2026-05-28 11:02:05',
  },
  {
    id: 5,
      creator: '李经理',
    typePath: ['VIDEO', 'VIDEO_TALK'],
    format: '横版视频',
    hours: 2,
    remark: '单人口播, 横版',
    enabled: true,
    createTime: '2026-05-02 13:45:00',
  },
  {
    id: 6,
      creator: '王经理',
    typePath: ['VIDEO', 'VIDEO_STORY', 'VIDEO_STORY_SOLO'],
    format: '竖版视频',
    hours: 3,
    remark: '单人剧情, 需脚本 + 分镜',
    enabled: true,
    createTime: '2026-05-08 10:11:00',
  },
  {
    id: 7,
      creator: '孙总监',
    typePath: ['IMAGE'],
    format: '开屏/海报',
    hours: 0.8,
    remark: '',
    enabled: false,
    createTime: '2026-05-10 18:08:21',
  },
]

let mockStore: WorkHoursSetting[] = [...seed]
let nextId = mockStore.reduce((max, it) => Math.max(max, it.id), 0) + 1

const nowStr = () => {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const getWorkHoursList = (query: WorkHoursQuery = {}): Promise<{ data: { list: WorkHoursSetting[]; total: number } }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...mockStore]
      // 素材类型: 选中任意节点(父或子)即匹配 typePath 中包含该 value 的记录
      if (query.materialType) {
        list = list.filter((it) => it.typePath.includes(query.materialType!))
      }
      if (query.enabled !== undefined) list = list.filter((it) => it.enabled === query.enabled)
      list.sort((a, b) => b.createTime.localeCompare(a.createTime))
      resolve({ data: { list, total: list.length } })
    }, 200)
  })
}

export const createWorkHours = (form: WorkHoursFormData): Promise<{ data: WorkHoursSetting }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const record: WorkHoursSetting = {
        id: nextId++,
        typePath: [...form.typePath],
        format: form.format,
        hours: form.hours,
        remark: form.remark,
        enabled: form.enabled,
        createTime: nowStr(),
        creator: '张经理',
      }
      mockStore.unshift(record)
      resolve({ data: record })
    }, 200)
  })
}

export const updateWorkHours = (form: WorkHoursFormData): Promise<{ data: WorkHoursSetting }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockStore.findIndex((it) => it.id === form.id)
      if (idx < 0) {
        reject(new Error('记录不存在'))
        return
      }
      mockStore[idx] = {
        ...mockStore[idx],
        typePath: [...form.typePath],
        format: form.format,
        hours: form.hours,
        remark: form.remark,
        enabled: form.enabled,
        updateTime: nowStr(),
      }
      resolve({ data: mockStore[idx] })
    }, 200)
  })
}

export const deleteWorkHours = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockStore.findIndex((it) => it.id === id)
      if (idx < 0) {
        reject(new Error('记录不存在'))
        return
      }
      mockStore.splice(idx, 1)
      resolve()
    }, 200)
  })
}

export const toggleWorkHoursEnabled = (id: number, enabled: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockStore.findIndex((it) => it.id === id)
      if (idx < 0) {
        reject(new Error('记录不存在'))
        return
      }
      mockStore[idx].enabled = enabled
      mockStore[idx].updateTime = nowStr()
      resolve()
    }, 200)
  })
}