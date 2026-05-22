import { lazyLoad } from '@/components/LazyLoad';

// Auth Pages
export const LoginPage = lazyLoad(() => import('./auth/login/LoginPage'));
export const RegisterPage = lazyLoad(() => import('./auth/register/RegisterPage'));