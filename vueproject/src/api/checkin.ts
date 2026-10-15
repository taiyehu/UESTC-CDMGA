import request from '@/utils/request'

export type CheckinToday = {
  date: string
  checkedIn: boolean
  fortune?: {
    fortuneLevel: string
    fortuneText: string
    fortunePayload: string
    createdAt: string
  }
}

function resultData<T>(response: any): T {
  if (response.data?.code !== 0) throw new Error(response.data?.message || '请求失败')
  return response.data.data as T
}

export async function getTodayCheckin(): Promise<CheckinToday> {
  return resultData<CheckinToday>(await request.get('/checkin/today', { withCredentials: true }))
}

export async function submitCheckin(): Promise<CheckinToday> {
  return resultData<CheckinToday>(await request.post('/checkin', null, { withCredentials: true }))
}
