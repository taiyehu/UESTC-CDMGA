import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TaskListPage from './pages/TaskListPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskBingoDetailPage from './pages/TaskBingoDetailPage'
import ActivityListPage from './pages/ActivityListPage'
import ActivityDetailPage from './pages/ActivityDetailPage'
import SignDisplayPage from './pages/SignDisplayPage'
import SignCheckinPage from './pages/SignCheckinPage'
import SignScannerPage from './pages/SignScannerPage'
import RankingPage from './pages/RankingPage'
import RankingNewPage from './pages/RankingNewPage'
import ContestRankingPage from './pages/ContestRankingPage'
import ForumPage from './pages/ForumPage'
import ForumPostPage from './pages/ForumPostPage'
import ProfilePage from './pages/ProfilePage'
import ProfileSettingPage from './pages/ProfileSettingPage'
import LinksPage from './pages/LinksPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPendingPage from './pages/AdminPendingPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import AdminContentPage from './pages/AdminContentPage'
import AdminActivitiesPage from './pages/AdminActivitiesPage'
import AdminForumPage from './pages/AdminForumPage'
import AdminProfilesPage from './pages/AdminProfilesPage'
import AdminProfilesPassedPage from './pages/AdminProfilesPassedPage'
import AdminTitlesPage from './pages/AdminTitlesPage'
import AdminBingoSubmissionsPage from './pages/AdminBingoSubmissionsPage'
import AdminScoresPage from './pages/AdminScoresPage'
import AdminRankConfigsPage from './pages/AdminRankConfigsPage'
import AdminScoreLogsPage from './pages/AdminScoreLogsPage'
import AdminBingoTipsPage from './pages/AdminBingoTipsPage'
import AdminIssuesPage from './pages/AdminIssuesPage'
import AdminTeamsPage from './pages/AdminTeamsPage'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'

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
          <Route path="/task/:id/bingo/:cellId" element={<TaskBingoDetailPage />} />
          <Route path="/activity" element={<ActivityListPage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/sign/:activityId" element={<SignCheckinPage />} />
          <Route path="/scan" element={<SignScannerPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/ranking-new" element={<RankingNewPage />} />
          <Route path="/contest-ranking" element={<ContestRankingPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumPostPage />} />
          <Route path="/profile/:id?" element={<ProfilePage />} />
          <Route path="/profile-setting" element={<ProfileSettingPage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/activity/:id/sign-display" element={<SignDisplayPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/content-publish" element={<AdminContentPage />} />
            <Route path="/admin/courses-publish" element={<Navigate to="/admin/content-publish" replace />} />
            <Route path="/admin/activities-publish" element={<Navigate to="/admin/content-publish" replace />} />
            <Route path="/admin/activities" element={<AdminActivitiesPage />} />
            <Route path="/admin/forum" element={<AdminForumPage />} />
            <Route path="/admin/profiles" element={<AdminProfilesPage />} />
            <Route path="/admin/profiles-passed" element={<AdminProfilesPassedPage />} />
            <Route path="/admin/titles" element={<AdminTitlesPage />} />
            <Route path="/admin/bingo-submissions" element={<AdminBingoSubmissionsPage />} />
            <Route path="/admin/scores" element={<AdminScoresPage />} />
            <Route path="/admin/rank-configs" element={<AdminRankConfigsPage />} />
            <Route path="/admin/score-logs" element={<AdminScoreLogsPage />} />
            <Route path="/admin/bingo-tips/:courseId?" element={<AdminBingoTipsPage />} />
            <Route path="/admin/issues/:courseId?" element={<AdminIssuesPage />} />
            <Route path="/admin/teams/:courseId?" element={<AdminTeamsPage />} />
            <Route path="/admin/*" element={<AdminPendingPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
