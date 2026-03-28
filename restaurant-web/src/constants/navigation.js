import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  List,
  Megaphone,
  ShoppingBag,
  Star,
  Settings,
  BarChart3
} from 'lucide-react'

export const sidebarLinks = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Restaurant', href: '/restaurant', icon: Store },
  { label: 'Categories', href: '/menu/categories', icon: List },
  { label: 'Menu Items', href: '/menu/items', icon: UtensilsCrossed },
  { label: 'Promotions', href: '/promotions', icon: Megaphone },
  { label: 'Orders', href: '/orders', icon: ShoppingBag, disabled: true },
  { label: 'Reviews', href: '/reviews', icon: Star, disabled: true },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, disabled: true },
  { label: 'Settings', href: '/settings', icon: Settings, disabled: true }
]
