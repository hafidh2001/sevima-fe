import { useEffect, useCallback } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ROUTES } from "@/utils/routes";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { RoleEnum } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { LoginPage, RegisterPage, DashboardPage, WorkflowListPage, WorkflowFormPage, WorkflowDetailPage, AIWorkflowBuilderPage } from "./pages";
import { queryClient } from "@/configs/queryClient";

function App() {
  const { isInitialized } = useAuthStore();
  const init = useCallback(() => useAuthStore.getState().init(), []);

  useEffect(() => {
    init();
  }, [init]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
        {/* Auth */}
        <Route
          path={ROUTES.login}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path={ROUTES.register}
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route
          path={ROUTES.logout}
          element={<Navigate to={ROUTES.login} replace />}
        />

        {/* Protected Routes */}
        <Route
          path={ROUTES.base}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR, RoleEnum.VIEWER]}
            >
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.workflowList}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR, RoleEnum.VIEWER]}
            >
              <AdminLayout>
                <WorkflowListPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.workflowCreate}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR]}
            >
              <AdminLayout>
                <WorkflowFormPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.workflowEdit}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR]}
            >
              <AdminLayout>
                <WorkflowFormPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.workflowDetail}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR, RoleEnum.VIEWER]}
            >
              <AdminLayout>
                <WorkflowDetailPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.aiBuilder}
          element={
            <ProtectedRoute
              allowedRoles={[RoleEnum.ADMIN, RoleEnum.EDITOR]}
            >
              <AdminLayout>
                <AIWorkflowBuilderPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
