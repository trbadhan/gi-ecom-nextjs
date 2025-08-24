"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { startProgress, stopProgress } from "@/lib/progress";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading, logout } = useAuth();

  function navClass(href: string) {
    const isActive = pathname === href;
    return `px-3 py-2 rounded-md ${
      isActive
        ? "bg-blue-100 text-blue-700 font-semibold"
        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
    }`;
  }

  async function handleLogout() {
  try {
    startProgress();
    await logout();  // clears token + admin
    // ❌ no router.replace("/login") here
  } finally {
    stopProgress();
  }
}

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-50">
        <div className="flex justify-between items-center px-6 py-3">
          <div className="font-bold text-lg">
            <Link href="/dashboard">🚗 Gari Admin</Link>
          </div>

          <nav className="flex items-center space-x-2">
            <Link href="/dashboard"><div className={navClass("/dashboard")}>Dashboard</div></Link>
            <Link href="/dashboard/users"><div className={navClass("/dashboard/users")}>Users</div></Link>
            <Link href="/dashboard/orders"><div className={navClass("/dashboard/orders")}>Orders</div></Link>

            {/* Catalog dropdown */}
            <div className="relative group">
              <div className="cursor-pointer px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-blue-600">
                Catalog ▾
              </div>
              <div className="absolute right-0 mt-0 w-40 bg-white border rounded shadow-md hidden group-hover:block">
                <Link href="/dashboard/categories"><div className={navClass("/dashboard/categories")}>Category</div></Link>
                <Link href="/dashboard/products"><div className={navClass("/dashboard/products")}>Product</div></Link>
              </div>
            </div>

            <Link href="/dashboard/tickets"><div className={navClass("/dashboard/tickets")}>Tickets</div></Link>
            <Link href="/dashboard/reports"><div className={navClass("/dashboard/reports")}>Reports</div></Link>
            <Link href="/dashboard/settings"><div className={navClass("/dashboard/settings")}>Settings</div></Link>

            {/* User dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded hover:bg-gray-100 flex items-center">
                {loading ? (
                  <span className="inline-block w-16 h-4 animate-pulse bg-gray-200 rounded"></span>
                ) : (
                  <span>{admin?.username || "Admin"}</span>
                )}
                <span className="ml-1">▾</span>
              </button>

              <div className="absolute right-0 top-full hidden group-hover:block bg-white shadow rounded w-40 z-50">
                <Link href="/dashboard/profile" className="block px-4 py-2 hover:bg-gray-100 text-left">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 hover:bg-gray-100 text-start text-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
