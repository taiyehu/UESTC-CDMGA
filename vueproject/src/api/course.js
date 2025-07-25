import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const fetchCourses = (params) => {
    return axios.get(`${API_BASE_URL}/course/`, {
        params: {
            page: params.page - 1, // 后端从0开始计数
            size: params.pageSize,
            title: params.searchQuery,
            category: params.categoryFilter
        }
    })
}