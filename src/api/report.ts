import request from '@/utils/request'
import type { ViolationScoreQuery, ViolationScoreResponse } from '@/types/report'

/**
 * 查询违规积分明细
 * 对接巨量引擎开放平台：
 *   GET https://api.oceanengine.com/open_api/v3.0/security/score_violation_event/get/
 * Header: Access-Token
 */
export const getViolationScoreList = (
  params: ViolationScoreQuery
): Promise<ViolationScoreResponse> => {
  return request.get('/open_api/v3.0/security/score_violation_event/get/', {
    params,
  })
}
