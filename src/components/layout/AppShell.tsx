import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  ClipboardList,
  User,
  FileHeart,
  Bell,
  Stethoscope,
  Clock,
  Ban,
  Users,
  Settings,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquareHeart,
  Building2,
} from 'lucide-react';
import {
  UserRole,
  ScreenId,
  User as UserType,
  NotificationItem,
} from '../../types';
import { NeuButton, NeuModal } from '../ui/NeumorphicPrimitives';

interface AppShellProps {
  currentRole: UserRole;
  currentUser: UserType | null;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onSwitchDemoRole: (role: UserRole) => void;
  onSignOut: () => void;
  onBookAppointmentClick: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  children: React.ReactNode;
}

interface SidebarNavItem {
  id: ScreenId;
  label: string;
  icon: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRole,
  currentUser,
  currentScreen,
  onNavigate,
  onSwitchDemoRole,
  onSignOut,
  onBookAppointmentClick,
  notifications,
  onMarkNotificationRead,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const roleNotifications = notifications.filter((n) => n.recipientRole === currentRole);
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  // PUBLIC / GUEST SHELL: Enforces the 3-Zone Top Bar Contract
  if (currentRole === 'guest') {
    return (
      <div className="min-h-screen flex flex-col bg-[#E9EEF3] text-[#172B4D]">
        {/* Top Bar Contract: Zone 1 (Single wordmark) — Zone 2 (4-5 clean text links) — Zone 3 (1-2 primary actions) */}
        <header className="sticky top-0 z-30 bg-[#E9EEF3]/95 backdrop-blur-xs border-b border-black/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => {
              onNavigate('landing');
              setTimeout(() => {
                const el = document.getElementById('overview');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 30);
            }}
            className="text-lg font-extrabold tracking-tight text-[#172B4D] font-display cursor-pointer whitespace-nowrap"
          >
            TeleHealth
          </button>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748B]" aria-label="Public navigation">
            <button
              type="button"
              onClick={() => {
                onNavigate('landing');
                setTimeout(() => {
                  const el = document.getElementById('overview');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 30);
              }}
              className="hover:text-[#172B4D] transition-colors cursor-pointer whitespace-nowrap"
            >
              Overview
            </button>
            <a
              href="#departments"
              onClick={(e) => {
                if (currentScreen !== 'landing') {
                  e.preventDefault();
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }
              }}
              className="hover:text-[#172B4D] transition-colors whitespace-nowrap"
            >
              Departments
            </a>
            <button
              type="button"
              onClick={() => onNavigate('telehealth-assessment')}
              className="hover:text-[#172B4D] transition-colors cursor-pointer whitespace-nowrap"
            >
              Symptom Assessment
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <NeuButton size="sm" onClick={() => onNavigate('sign-in')}>
              Sign In
            </NeuButton>
            <NeuButton variant="primary" size="sm" onClick={onBookAppointmentClick}>
              Book Appointment
            </NeuButton>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // AUTHENTICATED ROLE-BASED NAVIGATION ITEMS
  const getRoleNavItems = (): SidebarNavItem[] => {
    if (currentRole === 'patient') {
      return [
        { id: 'patient-dashboard', label: 'Patient Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'book-appointment', label: 'Book Appointment', icon: <CalendarPlus className="w-4 h-4" /> },
        { id: 'doctor-availability', label: 'Doctor Availability', icon: <Calendar className="w-4 h-4" /> },
        { id: 'my-appointments', label: 'My Appointments', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'patient-profile', label: 'Patient Profile', icon: <User className="w-4 h-4" /> },
        { id: 'medical-information', label: 'Medical Information', icon: <FileHeart className="w-4 h-4" /> },
        { id: 'patient-notifications', label: 'Notification Center', icon: <Bell className="w-4 h-4" /> },
      ];
    }

    if (currentRole === 'doctor') {
      return [
        { id: 'doctor-dashboard', label: 'Doctor Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'doctor-calendar', label: 'Physician Calendar', icon: <Calendar className="w-4 h-4" /> },
        { id: 'appointment-request-review', label: 'Request Reviews', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'schedule-availability', label: 'Schedule & Availability', icon: <Clock className="w-4 h-4" /> },
        { id: 'doctor-profile', label: 'Physician Profile', icon: <User className="w-4 h-4" /> },
        { id: 'doctor-notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      ];
    }

    // Admin
    return [
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'patient-management', label: 'Patient Management', icon: <Users className="w-4 h-4" /> },
      { id: 'doctor-management', label: 'Doctor Management', icon: <Stethoscope className="w-4 h-4" /> },
      { id: 'appointment-management', label: 'Appointments & Scheduling', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'departments-appointment-types', label: 'Depts & Visit Types', icon: <Building2 className="w-4 h-4" /> },
      { id: 'notification-system-settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
      { id: 'audit-log', label: 'Audit Log', icon: <ShieldCheck className="w-4 h-4" /> },
    ];
  };

  const navItems = getRoleNavItems();

  return (
    <div className="min-h-screen flex bg-[#E9EEF3] text-[#172B4D]">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto border-r border-black/5 bg-[#E9EEF3] transition-all shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } p-4`}
        aria-label="Role navigation sidebar"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => onNavigate(navItems[0].id)}
                className="text-lg font-extrabold tracking-tight text-[#172B4D] font-display cursor-pointer"
              >
                TeleHealth
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="neu-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#172B4D] cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'neu-btn-primary text-white'
                      : 'text-[#64748B] hover:text-[#172B4D] hover:bg-white/40'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="pt-4 border-t border-black/5 space-y-3">
          <button
            type="button"
            onClick={() => setSignOutConfirmOpen(true)}
            className="w-full neu-btn px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-[#C63D4D] cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-[#E9EEF3]/95 backdrop-blur-xs border-b border-black/5 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-[#172B4D]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs sm:text-sm font-semibold text-[#64748B] truncate">
              <span className="capitalize font-bold text-[#172B4D]">{currentRole} Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-[#3478F6] font-semibold">
                {navItems.find((i) => i.id === currentScreen)?.label || 'Clinical View'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Unread Count */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label={`Notifications (${unreadCount} unread)`}
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#172B4D] relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C63D4D] text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 neu-raised-lg rounded-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-[#172B4D]">
                      Notifications ({unreadCount} Unread)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        if (currentRole === 'patient') onNavigate('patient-notifications');
                        else if (currentRole === 'doctor') onNavigate('doctor-notifications');
                      }}
                      className="text-[11px] text-[#3478F6] font-semibold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {roleNotifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          setNotifDropdownOpen(false);
                          if (currentRole === 'patient') onNavigate('patient-notifications');
                          if (currentRole === 'doctor') onNavigate('doctor-notifications');
                        }}
                        className="neu-inset-sm rounded-xl p-2.5 text-xs cursor-pointer hover:bg-white/40"
                      >
                        <div className="font-bold text-[#172B4D]">{n.title}</div>
                        <p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="neu-inset rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-[#3478F6] text-white font-bold flex items-center justify-center shrink-0">
                {currentUser?.fullName.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="font-bold text-[#172B4D] truncate max-w-[140px]">
                  {currentUser?.fullName}
                </div>
                <div className="text-[10px] text-[#64748B] capitalize">{currentRole} Portal</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-[#172B4D]/40 backdrop-blur-xs flex">
            <div className="w-72 bg-[#E9EEF3] h-full p-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-[#172B4D]">TeleHealth</span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Close menu"
                    className="neu-btn w-8 h-8 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        currentScreen === item.id
                          ? 'neu-btn-primary text-white'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-3 pt-4 border-t border-black/5">
                <NeuButton
                  variant="danger"
                  className="w-full"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setSignOutConfirmOpen(true);
                  }}
                >
                  Sign Out
                </NeuButton>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <NeuModal
        isOpen={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title="Confirm Sign Out"
        subtitle="End current TeleHealth session"
        footer={
          <>
            <NeuButton onClick={() => setSignOutConfirmOpen(false)}>Cancel</NeuButton>
            <NeuButton
              variant="danger"
              onClick={() => {
                setSignOutConfirmOpen(false);
                onSignOut();
              }}
            >
              Sign Out to Public Landing
            </NeuButton>
          </>
        }
      >
        <p className="text-xs text-[#64748B]">
          Are you sure you want to sign out of your current session? Any unsaved form changes will be cleared.
        </p>
      </NeuModal>
    </div>
  );
};
