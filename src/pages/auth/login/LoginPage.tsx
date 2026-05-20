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
import { LockIcon, UserIcon } from "lucide-react";

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
      username: "",
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Masuk
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Silakan masukkan kredensial Anda untuk mengakses akun
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Field */}
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Username"
                placeholder="Masukkan username"
                startIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
                errorMessage={errors.username?.message}
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
              />
            )}
          />

          {/* Remember Me */}
          <div className="flex items-center">
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
          <Button type="submit" disabled={isLoading} className="w-full py-3">
            {isLoading ? "Memuat..." : "Masuk"}
          </Button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-xs sm:text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Boilerplate. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
