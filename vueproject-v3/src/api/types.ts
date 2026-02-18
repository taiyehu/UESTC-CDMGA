export interface Course {
  id: number
  title: string
  category: string
  startTime: string
  endTime: string
  description: string
  image: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Identity {
  id: number
  account: string
  password: string
  role: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Score {
  id: number
  uploadTime: string
  image: string
  score: number
  isScored: boolean
  remark: string | null
  isDeleted: boolean
  createdAt: string | null
  updatedAt: string
  course: Course
  identity: Identity
}
