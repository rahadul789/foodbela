import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { sidebarLinks } from '@/constants/navigation'
import { X } from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-200 lg:sticky lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              FB
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">FoodBela</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.href}>
                {link.disabled ? (
                  <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    <span className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5">Soon</span>
                  </span>
                ) : (
                  <NavLink
                    to={link.href}
                    end={link.href === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      )
                    }
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            FoodBela Restaurant &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  )
}
