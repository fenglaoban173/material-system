import request from '@/utils/request'
import type {
  Material,
  MaterialListQuery,
  MaterialListResponse,
  UploadRequest,
  UploadResponse,
  BatchDeleteRequest,
  PreAuditRequest,
  PreAuditResult,
  QualityAnalysis,
  CleanupTask,
  AIGCElement,
  ShareSettings,
  MaterialStats,
} from '@/types/material'

// Material Upload APIs
export const uploadVideo = (data: UploadRequest): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('advertiser_id', data.advertiserId.toString())
  formData.append('upload_type', data.uploadType)
  formData.append('filename', data.filename)
  
  if (data.isAIGC) {
    formData.append('is_aigc', 'true')
  }
  
  if (data.uploadType === 'UPLOAD_BY_FILE' && data.file) {
    formData.append('video_file', data.file)
    formData.append('video_signature', data.signature || '')
  } else if (data.uploadType === 'UPLOAD_BY_URL' && data.url) {
    formData.append('video_url', data.url)
  }
  
  return request.post('/open_api/2/file/video/ad/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadImage = (data: UploadRequest): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('advertiser_id', data.advertiserId.toString())
  formData.append('upload_type', data.uploadType)
  formData.append('filename', data.filename)
  
  if (data.isAIGC) {
    formData.append('is_aigc', 'true')
  }
  
  if (data.uploadType === 'UPLOAD_BY_FILE' && data.file) {
    formData.append('image_file', data.file)
    formData.append('image_signature', data.signature || '')
  } else if (data.uploadType === 'UPLOAD_BY_URL' && data.url) {
    formData.append('image_url', data.url)
  }
  
  return request.post('/open_api/2/file/image/ad/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadAudio = (data: UploadRequest): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('advertiser_id', data.advertiserId.toString())
  formData.append('upload_type', data.uploadType)
  formData.append('filename', data.filename)
  
  if (data.uploadType === 'UPLOAD_BY_FILE' && data.file) {
    formData.append('audio_file', data.file)
    formData.append('audio_signature', data.signature || '')
  } else if (data.uploadType === 'UPLOAD_BY_URL' && data.url) {
    formData.append('audio_url', data.url)
  }
  
  return request.post('/open_api/2/file/audio/ad/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// Material Management APIs
export const getMaterialList = (params: MaterialListQuery): Promise<MaterialListResponse> => {
  return request.get('/open_api/2/file/material/list/', { params })
}

export const getMaterialDetail = (advertiserId: number, materialId: number): Promise<{ data: Material }> => {
  return request.get('/open_api/2/file/material/detail/', {
    params: { advertiser_id: advertiserId, material_id: materialId },
  })
}

export const batchDeleteVideos = (data: BatchDeleteRequest): Promise<void> => {
  return request.post('/open_api/2/file/video/ad/delete/', data)
}

export const batchDeleteImages = (data: BatchDeleteRequest): Promise<void> => {
  return request.post('/open_api/2/file/image/ad/delete/', data)
}

// Pre-audit APIs
export const submitPreAudit = (data: PreAuditRequest): Promise<{ data: { taskId: string } }> => {
  return request.post('/open_api/2/file/preaudit/submit/', data)
}

export const getPreAuditResult = (advertiserId: number, taskId: string): Promise<{ data: { results: PreAuditResult[] } }> => {
  return request.get('/open_api/2/file/preaudit/get/', {
    params: { advertiser_id: advertiserId, task_id: taskId },
  })
}

// Quality Analysis APIs
export const submitQualityAnalysis = (data: PreAuditRequest): Promise<void> => {
  return request.post('/open_api/2/file/quality/submit/', data)
}

export const getQualityResult = (advertiserId: number, materialId: number): Promise<{ data: QualityAnalysis }> => {
  return request.get('/open_api/2/file/quality/get/', {
    params: { advertiser_id: advertiserId, material_id: materialId },
  })
}

// Cleanup APIs
export const createCleanupTask = (advertiserId: number, filterConditions: CleanupTask['filterConditions']): Promise<{ data: { taskId: number } }> => {
  return request.post('/open_api/2/file/video/material/clear_task/create/', {
    advertiser_id: advertiserId,
    filter_conditions: filterConditions,
  })
}

export const getCleanupTaskList = (advertiserId: number): Promise<{ data: { list: CleanupTask[] } }> => {
  return request.get('/open_api/2/file/video/material/clear_task/get/', {
    params: { advertiser_id: advertiserId },
  })
}

export const getCleanupTaskResult = (advertiserId: number, taskId: number): Promise<{ data: { cleanedMaterials: Material[] } }> => {
  return request.get('/open_api/2/file/video/material/clear_task_result/get/', {
    params: { advertiser_id: advertiserId, task_id: taskId },
  })
}

// AIGC APIs
export const getAIGCElements = (accountId: number, accountType: 'AGENT' | 'BP'): Promise<{ data: { elementList: AIGCElement[] } }> => {
  return request.get('/open_api/v3.0/aic/element/get/', {
    params: { account_id: accountId, account_type: accountType },
  })
}

export const uploadAIGCElement = (accountId: number, accountType: 'AGENT' | 'BP', file: File, elementName: string): Promise<void> => {
  const formData = new FormData()
  formData.append('account_id', accountId.toString())
  formData.append('account_type', accountType)
  formData.append('file', file)
  formData.append('element_name', elementName)
  
  return request.post('/open_api/v3.0/aic/element/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const pushAIGCMaterial = (accountId: number, materialId: number, targetAdvertiserIds: number[]): Promise<void> => {
  return request.post('/open_api/v3.0/aic/material/push/', {
    account_id: accountId,
    material_id: materialId,
    target_advertiser_ids: targetAdvertiserIds,
  })
}

export const createVideoMixcut = (accountId: number, elementIds: number[]): Promise<{ data: { taskId: string } }> => {
  return request.post('/open_api/v3.0/aic/video_mixcut/create/', {
    account_id: accountId,
    element_ids: elementIds,
  })
}

// Share APIs
export const createMaterialAuth = (data: ShareSettings): Promise<void> => {
  return request.post('/open_api/v3.0/tools/ebp/material/auth/create/', data)
}

export const getMaterialAuthList = (advertiserId: number): Promise<{ data: { list: ShareSettings[] } }> => {
  return request.get('/open_api/v3.0/tools/ebp/material/auth/list/', {
    params: { advertiser_id: advertiserId },
  })
}

export const deleteMaterialAuth = (advertiserId: number, materialIds: number[], targetAdvertiserIds: number[]): Promise<void> => {
  return request.post('/open_api/v3.0/tools/ebp/material/auth/delete/', {
    advertiser_id: advertiserId,
    material_ids: materialIds,
    target_advertiser_ids: targetAdvertiserIds,
  })
}

// Stats API
export const getMaterialStats = (advertiserId: number): Promise<{ data: MaterialStats }> => {
  return request.get('/api/v1/material/stats', {
    params: { advertiser_id: advertiserId },
  })
}
