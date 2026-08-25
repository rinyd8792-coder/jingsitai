import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "@/components/Layout";
import NowPage from "@/pages/NowPage/NowV2Page";
import InboxPage from "@/pages/InboxPage/InboxPage";
import TodayPage from "@/pages/TodayPage/TodayPage";
import WaitingPage from "@/pages/WaitingPage/WaitingPage";
import ProjectsPage from "@/pages/ProjectsPage/ProjectsPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import TaskDetailPage from "@/pages/TaskDetailPage/TaskDetailPage";
import SettingsPage from "@/pages/SettingsPage/SettingsPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/now" replace />} />
          <Route path="now" element={<NowPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="waiting" element={<WaitingPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
