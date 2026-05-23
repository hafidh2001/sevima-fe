import { lazyLoad } from '@/components/LazyLoad';

// Auth Pages
export const LoginPage = lazyLoad(() => import('./auth/login/LoginPage'));
export const RegisterPage = lazyLoad(() => import('./auth/register/RegisterPage'));

// Dashboard Pages
export const DashboardPage = lazyLoad(() => import('./dashboard/DashboardPage'));

// Workflow Pages
export const WorkflowListPage = lazyLoad(() => import('./workflows/list/WorkflowListPage'));
export const WorkflowFormPage = lazyLoad(() => import('./workflows/form/WorkflowFormPage'));
export const WorkflowDetailPage = lazyLoad(() => import('./workflows/detail/WorkflowDetailPage'));