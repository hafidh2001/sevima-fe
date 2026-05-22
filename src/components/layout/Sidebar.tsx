import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/utils/routes";
import { useAuthStore } from "@/store/authStore";
import { ConfirmationModal } from "@/components/confirmationModal";
import { LogOutIcon, MenuIcon, WorkflowIcon } from "lucide-react";

const menuItems = [
  { label: "Workflows", route: ROUTES.workflowList, icon: WorkflowIcon },
];

export const Sidebar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate(ROUTES.login);
  };

  const isActive = (route: string) => location.pathname === route;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:h-screen lg:bg-white lg:border-r lg:border-gray-100 lg:flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-6">
          <div className="w-32 h-8 bg-gray-200 rounded flex justify-center items-center">LOGO</div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.route)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4">
          <div className="border-t border-gray-200" />
        </div>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOutIcon size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <ConfirmationModal
        isShown={showLogoutModal}
        toggle={(open) => setShowLogoutModal(open ?? !showLogoutModal)}
        title="Keluar"
        description="Apakah Anda yakin ingin keluar dari aplikasi?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText="Keluar"
        cancelText="Batal"
        confirmVariant="destructive"
        cancelVariant="outline"
      />
    </>
  );
};
