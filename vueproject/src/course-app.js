// 全局变量
let currentPage = 1;
const pageSize = 8;
let allCategories = [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    fetchCourses();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('search-btn').addEventListener('click', function () {
        currentPage = 1;
        fetchCourses();
    });

    document.getElementById('category-filter').addEventListener('change', function () {
        currentPage = 1;
        fetchCourses();
    });
}

// 获取课程数据
async function fetchCourses() {
    try {
        showLoading(true);

        const searchTerm = document.getElementById('search-input').value;
        const categoryFilter = document.getElementById('category-filter').value;

        // 构建查询参数
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('size', pageSize);
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);

        const response = await axios.get(`/api/courses?${params.toString()}`);
        const data = response.data;

        // 如果是第一页，更新类别过滤器选项
        if (currentPage === 1) {
            updateCategoryFilter(data.allCategories || []);
        }

        displayCourses(data.courses);
        setupPagination(data.total, currentPage, pageSize);
    } catch (error) {
        console.error('获取课程数据失败:', error);
        alert('获取课程数据失败，请稍后重试');
    } finally {
        showLoading(false);
    }
}

// 更新类别过滤器
function updateCategoryFilter(categories) {
    allCategories = categories;
    const categorySelect = document.getElementById('category-filter');

    // 保留"所有类别"选项
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }

    // 添加新的类别选项
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// 显示课程卡片
function displayCourses(courses) {
    const container = document.getElementById('courses-container');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>没有找到相关课程</p></div>';
        return;
    }

    let html = '';

    courses.forEach(course => {
        html += `
        <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="card course-card h-100">
                ${course.image ? `
                <img src="${course.image}" class="card-img-top course-img" alt="${course.title}">
                ` : `
                <div class="course-img bg-light d-flex align-items-center justify-content-center">
                    <i class="fas fa-book-open fa-3x text-muted"></i>
                </div>
                `}
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-primary category-badge">${course.category}</span>
                        <span class="badge time-badge">
                            ${formatDate(course.startTime)} ~ ${formatDate(course.endTime)}
                        </span>
                    </div>
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text text-muted line-clamp-2">${course.description || '暂无描述'}</p>
                </div>
                <div class="card-footer bg-white">
                    <button class="btn btn-sm btn-outline-primary view-detail" data-id="${course.id}">
                        查看详情
                    </button>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;

    // 为详情按钮添加事件监听
    document.querySelectorAll('.view-detail').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            showCourseDetail(courseId);
        });
    });
}

// 显示课程详情
async function showCourseDetail(courseId) {
    try {
        const response = await axios.get(`/api/courses/${courseId}`);
        const course = response.data;

        const modalTitle = document.getElementById('courseDetailTitle');
        const modalContent = document.getElementById('courseDetailContent');

        modalTitle.textContent = course.title;

        modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                ${course.image ? `
                <img src="${course.image}" class="img-fluid rounded mb-3" alt="${course.title}">
                ` : ''}
                <div class="mb-3">
                    <h5>课程类别</h5>
                    <p>${course.category}</p>
                </div>
                <div class="mb-3">
                    <h5>时间安排</h5>
                    <p>${formatDateTime(course.startTime)} 至 ${formatDateTime(course.endTime)}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <h5>课程描述</h5>
                    <p>${course.description || '暂无详细描述'}</p>
                </div>
                <div class="mb-3">
                    <h5>创建信息</h5>
                    <p>创建于: ${formatDateTime(course.createdAt)}</p>
                    ${course.updatedAt ? `<p>最后更新: ${formatDateTime(course.updatedAt)}</p>` : ''}
                </div>
            </div>
        </div>
        `;

        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
        modal.show();
    } catch (error) {
        console.error('获取课程详情失败:', error);
        alert('获取课程详情失败，请稍后重试');
    }
}

// 设置分页
function setupPagination(totalItems, currentPage, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination = document.getElementById('pagination');

    pagination.innerHTML = '';

    // 上一页按钮
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchCourses();
        }
    });
    pagination.appendChild(prevLi);

    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            fetchCourses();
        });
        pagination.appendChild(li);
    }

    // 下一页按钮
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            fetchCourses();
        }
    });
    pagination.appendChild(nextLi);
}

// 辅助函数：格式化日期
function formatDate(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('zh-CN');
}

// 辅助函数：格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN');
}

// 显示/隐藏加载状态
function showLoading(show) {
    const container = document.getElementById('courses-container');
    if (show) {
        container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
        </div>
        `;
    }
}