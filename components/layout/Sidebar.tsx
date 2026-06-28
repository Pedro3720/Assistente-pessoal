"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Shield,
  Wallet,
  Dumbbell,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/senhas", label: "Senhas", icon: Shield },
  { href: "/financas", label: "Finanças", icon: Wallet },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="fixed top-5 left-5 z-50 md:hidden h-9 w-9 rounded-full border border-border bg-background flex items-center justify-center"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-56 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex flex-col",
          "md:translate-x-0 md:static md:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="px-6 h-[72px] flex items-center border-b border-sidebar-border">
          <span
            className="text-lg font-bold tracking-tight text-sidebar-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Assistente
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 font-normal"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all",
                    isActive
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/70"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/30">v1.0</p>
        </div>
      </aside>
    </>
  )
}
