import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils/routes";
import { useAuthStore } from "@/store/authStore";
import { ConfirmationModal } from "@/components/confirmationModal";
import { MenuIcon, XIcon, LogOutIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { navItems } from "@/data/sidebar";

export const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    setIsMobileMenuOpen(false);
    navigate(ROUTES.login);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header - Visible only on mobile, acts as header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 shadow-sm">
        <Logo size="sm" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? (
            <XIcon className="w-6 h-6 text-gray-600" />
          ) : (
            <MenuIcon className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:h-screen lg:bg-white lg:border-r lg:border-gray-100 lg:flex-col lg:px-4 lg:py-6 lg:gap-1">
        {/* Logo */}
        <div className="flex items-center justify-center px-2 mb-7">
          <Logo size="md" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems
            .filter((item) => item.label !== "Logout")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to!}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-800 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Logout Button - Always at bottom */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors w-full"
          >
            <LogOutIcon size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 mt-16">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu */}
          <aside className="relative w-72 h-[calc(100vh-4rem)] bg-white overflow-y-auto flex flex-col">
            <nav className="flex flex-col gap-1 p-4">
              {navItems
                .filter((item) => item.label !== "Logout")
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to!}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-800 hover:bg-gray-100"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </nav>

            {/* Logout Button - Always at bottom */}
            <div className="mt-auto p-4 border-t border-gray-200">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors w-full"
              >
                <LogOutIcon size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Logout Modal */}
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
