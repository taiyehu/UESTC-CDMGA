import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TaskListPage from './pages/TaskListPage'
import TaskDetailPage from './pages/TaskDetailPage'
import ActivityListPage from './pages/ActivityListPage'
import ActivityDetailPage from './pages/ActivityDetailPage'
import RankingPage from './pages/RankingPage'
import ForumPage from './pages/ForumPage'
import ForumPostPage from './pages/ForumPostPage'
import ProfilePage from './pages/ProfilePage'
import LinksPage from './pages/LinksPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPendingPage from './pages/AdminPendingPage'
import RequireAuth from './components/RequireAuth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/task" element={<TaskListPage />} />
          <Route path="/awards" element={<TaskListPage awardMode />} />
          <Route path="/task/:id" element={<TaskDetailPage />} />
          <Route path="/activity" element={<ActivityListPage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumPostPage />} />
          <Route path="/profile/:id?" element={<ProfilePage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/admin/*" element={<AdminPendingPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
