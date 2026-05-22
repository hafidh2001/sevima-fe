import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/utils/routes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputField } from "@/components/fields/inputField";
import { PasswordField } from "@/components/fields/passwordField";
import { loginSchema, LoginFormData } from "@/validations/auth/login";
import { showToast } from "@/utils/toast";
import { Spinner } from "@/components/Spinner";
import { LockIcon, MailIcon } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data);

    if (success) {
      const successMessage = useAuthStore.getState().success;
      showToast(successMessage ?? "Login berhasil", "success", {
        duration: 3000,
      });
      navigate(ROUTES.base);
    } else {
      const errorMessage = useAuthStore.getState().error;
      showToast(errorMessage ?? "Login gagal", "error", { duration: 4000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            FlowForge
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Multi-Tenant Workflow Orchestration Engine
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Masuk ke Akun Anda
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Email"
                  type="email"
                  placeholder="Masukkan email"
                  startIcon={<MailIcon className="h-5 w-5 text-gray-400" />}
                  errorMessage={errors.email?.message}
                  autoComplete="email"
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordField
                  {...field}
                  label="Password"
                  placeholder="Masukkan password"
                  startIcon={<LockIcon className="h-5 w-5 text-gray-400" />}
                  errorMessage={errors.password?.message}
                  autoComplete="current-password"
                />
              )}
            />

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm text-gray-600 font-normal cursor-pointer"
                    >
                      Ingat saya
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isLoading ? <Spinner text="Memuat..." /> : "Masuk"}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => navigate(ROUTES.register)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Daftar
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} FlowForge. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
