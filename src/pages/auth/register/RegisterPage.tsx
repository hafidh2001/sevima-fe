import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/authApi";
import { useMasterStore } from "@/store/masterStore";
import { ROUTES } from "@/utils/routes";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/fields/inputField";
import { PasswordField } from "@/components/fields/passwordField";
import { SingleSelect } from "@/components/fields/singleSelect";
import { registerSchema, RegisterFormData } from "@/validations/auth/register";
import { showToast } from "@/utils/toast";
import { Spinner } from "@/components/Spinner";
import { LockIcon, MailIcon, UserIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    tenantOptions,
    isLoadingTenantOptions,
    fetchTenantOptions,
  } = useMasterStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      tenantId: 0,
    },
  });

  useEffect(() => {
    fetchTenantOptions();
  }, [fetchTenantOptions]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
        tenantId: data.tenantId,
      });

      showToast(`Registrasi berhasil! User ID: ${response.userId}`, "success");
      navigate(ROUTES.login);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registrasi gagal";
      showToast(message, "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FlowForge
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Buat Akun Baru
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  startIcon={<UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  errorMessage={errors.name?.message}
                  autoComplete="name"
                />
              )}
            />

            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Email"
                  type="email"
                  placeholder="contoh@email.com"
                  startIcon={<MailIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  errorMessage={errors.email?.message}
                  autoComplete="email"
                />
              )}
            />

            {/* Tenant Select */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant
              </label>
              <Controller
                name="tenantId"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    {...field}
                    value={field.value ? tenantOptions.find((t) => t.value === field.value) : null}
                    onChange={(option) => field.onChange(option?.value ?? 0)}
                    options={tenantOptions}
                    placeholder={isLoadingTenantOptions ? "Memuat tenant..." : "Pilih tenant"}
                    isClearable={false}
                    isSearchable
                    errorMessage={errors.tenantId?.message}
                  />
                )}
              />
            </div>

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordField
                  {...field}
                  label="Password"
                  placeholder="Minimal 6 karakter"
                  startIcon={<LockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  errorMessage={errors.password?.message}
                  autoComplete="new-password"
                />
              )}
            />

            {/* Confirm Password Field */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <PasswordField
                  {...field}
                  label="Konfirmasi Password"
                  placeholder="Masukkan password lagi"
                  startIcon={<LockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  errorMessage={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
              )}
            />

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingTenantOptions}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 mt-6"
            >
              {isSubmitting ? (
                <Spinner text="Mendaftarkan..." />
              ) : (
                "Daftar"
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => navigate(ROUTES.login)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Masuk
              </button>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} FlowForge. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
