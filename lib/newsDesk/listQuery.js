/** Query param builder for GET /platform/newsdesk/jobs */

export function buildNewsDeskListQuery(params = {}) {
  const q = {}
  if (params.page != null) q.page = params.page
  if (params.pageSize != null) q.pageSize = params.pageSize
  if (params.q) q.q = params.q
  if (params.pipelineStatus) q.pipelineStatus = params.pipelineStatus
  if (params.extractionStatus) q.extractionStatus = params.extractionStatus
  if (params.categoryId) q.categoryId = params.categoryId
  if (params.fromDate) q.fromDate = params.fromDate
  if (params.toDate) q.toDate = params.toDate
  if (params.sort) q.sort = params.sort
  if (params.order) q.order = params.order
  return q
}