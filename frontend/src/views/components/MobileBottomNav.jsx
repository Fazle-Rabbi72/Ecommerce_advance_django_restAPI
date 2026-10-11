import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Package, ShoppingBag, User } from 'lucide-react';
import { CartContext } from '../plugin/Context';
import UserData from '../plugin/UserData';
import { useAuthStore } from '../../store/auth';

/**
 * Mobile Bottom Navigation Bar (Visible only on <768px screens)
 * Provides 1-tap thumb access to the 5 most critical sections:
 * Home, Search, Orders, Cart (with badge), and Account/Dashboard.
 */
export const MobileBottomNav = () => {
    const location = useLocation();
    const [cartCount] = useContext(CartContext) || [0];
    const userData = UserData();
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    // Determine target link for account tab
    let accountHref = '/login';
    let accountLabel = 'Login';
    if (isLoggedIn) {
        if (userData?.is_superuser) {
            accountHref = '/admin-dashboard';
            accountLabel = 'Admin';
        } else if (userData?.is_vendor) {
            accountHref = '/vendor/dashboard';
            accountLabel = 'Vendor';
        } else {
            accountHref = '/customer/account';
            accountLabel = 'Account';
        }
    }

    const navItems = [
        {
            to: '/',
            label: 'Home',
            icon: Home,
            isActive: location.pathname === '/',
        },
        {
            to: '/search',
            label: 'Search',
            icon: Search,
            isActive: location.pathname === '/search',
        },
        {
            to: isLoggedIn ? '/customer/orders' : '/login',
            label: 'Orders',
            icon: Package,
            isActive: location.pathname.startsWith('/customer/orders'),
        },
        {
            to: '/cart',
            label: 'Cart',
            icon: ShoppingBag,
            badge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : null,
            isActive: location.pathname === '/cart',
        },
        {
            to: accountHref,
            label: accountLabel,
            icon: User,
            isActive:
                location.pathname.startsWith('/customer/account') ||
                location.pathname.startsWith('/vendor') ||
                location.pathname.startsWith('/admin') ||
                location.pathname === '/login',
        },
    ];

    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1 px-2"
        >
            <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            aria-label={item.label}
                            aria-current={item.isActive ? 'page' : undefined}
                            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] py-1 px-1 rounded-xl transition-all relative ${
                                item.isActive
                                    ? 'text-indigo-600 font-semibold'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon
                                    className={`w-5 h-5 transition-transform ${
                                        item.isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                                    }`}
                                />
                                {item.badge && (
                                    <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-[60px]">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
