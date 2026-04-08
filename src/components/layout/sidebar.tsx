"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { Home as HomeIcon } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <HomeIcon className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-semibold text-gray-900">Hemmet</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.permission || hasPermission(userRoles, item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
