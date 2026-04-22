import request from './request'

export const authApi = {
  login: (username: string, password: string) => request.post('/login', { username, password }),
  logout: (username: string) => request.post('/logout', { username })
}

export const onlineApi = {
  list: (params?: { module?: string; role?: string }) => request.post('/online/list', params || {}),
  count: () => request.post('/online/count', {}),
  kick: (params: { userId: number; role: string; module: string; addToBlacklist?: boolean; banHours?: number }) => request.post('/online/kick', params)
}

export const auditApi = {
  list: (params: { page?: number; pageSize?: number; module?: string; role?: string; operationType?: string; startTime?: string; endTime?: string }) => request.post('/audit/list', params),
  stats: () => request.get('/audit/stats')
}

export const blacklistApi = {
  list: (params?: { status?: string }) => request.post('/blacklist/list', params || {}),
  count: () => request.get('/blacklist/count'),
  add: (params: { userId: number; role: string; module: string; reason: string; hours?: number }) => request.post('/blacklist/add', params),
  release: (id: number) => request.put(`/blacklist/release/${id}`)
}

export const configApi = {
  list: () => request.get('/config/list'),
  update: (params: { key: string; value: string }) => request.post('/config/update', params)
}