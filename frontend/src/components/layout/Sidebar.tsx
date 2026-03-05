import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, ClipboardList, Calendar,
    Star, BarChart3, Settings, LogOut, Menu, X,
    BookOpen, Target, Award, ChevronRight, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
    student: [
        { label: 'Dashboard', to: '/student', icon: <LayoutDashboard size={18} /> },
        { label: 'Daily Tracker', to: '/student/tracker', icon: <ClipboardList size={18} /> },
        { label: 'My Projects', to: '/student/projects', icon: <Target size={18} /> },
        { label: 'Feedback', to: '/student/feedback', icon: <BookOpen size={18} /> },
        { label: 'Leaderboard', to: '/student/leaderboard', icon: <Award size={18} /> },
    ],
    facilitator: [
        { label: 'Dashboard', to: '/facilitator', icon: <LayoutDashboard size={18} /> },
        { label: 'Attendance', to: '/facilitator/attendance', icon: <Calendar size={18} /> },
        { label: 'Tracker Review', to: '/facilitator/trackers', icon: <ClipboardList size={18} /> },
        { label: 'Review Window', to: '/facilitator/review', icon: <Star size={18} /> },
        { label: 'Students', to: '/facilitator/students', icon: <Users size={18} /> },
    ],
    faculty: [
        { label: 'Review Dashboard', to: '/faculty', icon: <LayoutDashboard size={18} /> },
        { label: 'My Students', to: '/faculty/students', icon: <Users size={18} /> },
    ],
    executive: [
        { label: 'Executive Hub', to: '/executive', icon: <LayoutDashboard size={18} /> },
        { label: 'Cohort Analysis', to: '/executive/cohorts', icon: <BarChart3 size={18} /> },
        { label: 'Risk Flags', to: '/executive/risks', icon: <Zap size={18} /> },
        { label: 'All Students', to: '/executive/students', icon: <Users size={18} /> },
    ],
};

const ROLE_COLORS: Record<Role, string> = {
    student: 'from-primary-600 to-primary-700',
    facilitator: 'from-violet-600 to-violet-700',
    faculty: 'from-emerald-600 to-emerald-700',
    executive: 'from-orange-500 to-orange-600',
};

const ROLE_LABELS: Record<Role, string> = {
    student: 'Student',
    facilitator: 'Facilitator',
    faculty: 'Faculty / Mentor',
    executive: 'TYN Executive',
};

export function Sidebar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!currentUser) return null;

<<<<<<< HEAD
    const role = currentUser.role;
=======
    const role = currentUser.role as Role;
>>>>>>> e25b0f6 (hi)
    const navItems = NAV_ITEMS[role];
    const gradient = ROLE_COLORS[role];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className={clsx('px-6 py-5 bg-gradient-to-br', gradient)}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-none">YZone</h1>
                        <p className="text-white/70 text-xs mt-0.5">Cohort Platform</p>
                    </div>
                </div>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={clsx('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm flex-shrink-0', gradient)}>
                        {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                        <p className="text-xs text-muted">{ROLE_LABELS[role]}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
<<<<<<< HEAD
                {navItems.map(item => (
=======
                {navItems.map((item: NavItem) => (
>>>>>>> e25b0f6 (hi)
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to.split('/').length <= 2}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                            )
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-card-md border border-gray-200"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile drawer backdrop */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside className={clsx(
                'lg:hidden fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-2xl transition-transform duration-300',
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
                <SidebarContent />
            </aside>
        </>
    );
}
