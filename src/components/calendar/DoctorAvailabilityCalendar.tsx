import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Ban,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  Department,
  DoctorProfile,
  Appointment,
  DoctorSchedule,
} from '../../types';
import {
  DEMO_TODAY,
  CLINIC_TIMEZONE,
  computeDoctorAvailabilityForDate,
  formatReadableDate,
} from '../../services/mockData';
import { NeuButton } from '../ui/NeumorphicPrimitives';

interface DoctorAvailabilityCalendarProps {
  departments: Department[];
  doctors: DoctorProfile[];
  schedules: Record<string, DoctorSchedule>;
  appointments: Appointment[];
  selectedDepartmentId: string;
  onSelectDepartment: (deptId: string) => void;
  selectedDoctorId: string;
  onSelectDoctor: (docId: string) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  selectedSlotStart: string;
  onSelectSlot: (startTime: string, endTime: string, label: string) => void;
  isLoading?: boolean;
  showFilters?: boolean;
  compactHeader?: boolean;
  displaySection?: 'all' | 'calendar' | 'slots';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DoctorAvailabilityCalendar: React.FC<DoctorAvailabilityCalendarProps> = ({
  departments,
  doctors,
  schedules,
  appointments,
  selectedDepartmentId,
  onSelectDepartment,
  selectedDoctorId,
  onSelectDoctor,
  selectedDate,
  onSelectDate,
  selectedSlotStart,
  onSelectSlot,
  isLoading = false,
  showFilters = true,
  displaySection = 'all',
}) => {
  const [viewMode] = useState<'month' | 'week' | 'day'>('month');
  const todayParts = useMemo(() => DEMO_TODAY.split('-').map(Number), []);
  const [currentYear, setCurrentYear] = useState(todayParts[0] || 2026);
  const [currentMonth, setCurrentMonth] = useState((todayParts[1] || 10) - 1);

  const filteredDoctors = useMemo(() => {
    if (!selectedDepartmentId) return doctors;
    return doctors.filter((d) => d.departmentId === selectedDepartmentId);
  }, [doctors, selectedDepartmentId]);

  const activeDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) || filteredDoctors[0] || doctors[0],
    [doctors, filteredDoctors, selectedDoctorId]
  );

  // Generate days for current month grid
  const monthDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: Array<{ dateStr: string; dayNum: number } | null> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        dayNum: d,
      });
    }
    return cells;
  }, [currentYear, currentMonth]);

  // Week days around selectedDate
  const weekDays = useMemo(() => {
    const [y, m, d] = (selectedDate || DEMO_TODAY).split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const dayOfWeek = base.getDay();
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - dayOfWeek);

    const list: Array<{ dateStr: string; dayNum: number; weekday: string }> = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(startOfWeek);
      dt.setDate(startOfWeek.getDate() + i);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      list.push({
        dateStr: `${yy}-${mm}-${dd}`,
        dayNum: dt.getDate(),
        weekday: WEEKDAYS[dt.getDay()],
      });
    }
    return list;
  }, [selectedDate]);

  const selectedDayAvailability = useMemo(() => {
    if (!activeDoctor || !selectedDate) return null;
    return computeDoctorAvailabilityForDate(
      activeDoctor.id,
      selectedDate,
      doctors,
      schedules,
      appointments
    );
  }, [activeDoctor, selectedDate, doctors, schedules, appointments]);

  const isAtOrBeforeCurrentMonth =
    currentYear < todayParts[0] ||
    (currentYear === todayParts[0] && currentMonth <= todayParts[1] - 1);

  const handlePrev = () => {
    if (viewMode === 'month') {
      if (isAtOrBeforeCurrentMonth) return;
      if (currentMonth === 0) {
        setCurrentYear((y) => y - 1);
        setCurrentMonth(11);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      const [y, m, d] = (selectedDate || DEMO_TODAY).split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - (viewMode === 'week' ? 7 : 1));
      const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (nextStr >= DEMO_TODAY) {
        onSelectDate(nextStr);
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      if (currentMonth === 11) {
        setCurrentYear((y) => y + 1);
        setCurrentMonth(0);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else {
      const [y, m, d] = (selectedDate || DEMO_TODAY).split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + (viewMode === 'week' ? 7 : 1));
      const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      onSelectDate(nextStr);
    }
  };

  const handleJumpToday = () => {
    setCurrentYear(todayParts[0]);
    setCurrentMonth(todayParts[1] - 1);
    onSelectDate(DEMO_TODAY);
  };

  const morningSlots = selectedDayAvailability?.slots.filter((s) => s.period === 'Morning') || [];
  const afternoonSlots = selectedDayAvailability?.slots.filter((s) => s.period === 'Afternoon') || [];

  return (
    <div className="neu-raised rounded-[26px] p-5 sm:p-6 flex flex-col gap-5">
      {/* Header & Mode Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#2674FF]/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl neu-icon-orb flex items-center justify-center text-[#2674FF] shrink-0">
              <CalendarIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#101B45]">
                Doctor Availability & Time Slots
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Department & Doctor Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cal-dept-filter" className="text-xs font-semibold text-[#101B45] px-1">
              Filter by Department
            </label>
            <select
              id="cal-dept-filter"
              value={selectedDepartmentId}
              onChange={(e) => onSelectDepartment(e.target.value)}
              className="neu-inset rounded-[18px] px-4 py-2.5 text-xs sm:text-sm text-[#101B45]"
            >
              <option value="">All Clinical Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cal-doc-filter" className="text-xs font-semibold text-[#101B45] px-1">
              Attending Doctor
            </label>
            <select
              id="cal-doc-filter"
              value={activeDoctor?.id || ''}
              onChange={(e) => onSelectDoctor(e.target.value)}
              className="neu-inset rounded-[18px] px-4 py-2.5 text-xs sm:text-sm text-[#101B45]"
            >
              {filteredDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName} ({doc.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Doctor Schedule Info Bar */}
      {activeDoctor && (
        <div className="neu-inset rounded-[18px] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-[#101B45]">{activeDoctor.fullName}</span>
            <span className="mx-1.5 text-[#68789D]">·</span>
            <span className="text-[#68789D]">{activeDoctor.departmentName}</span>
          </div>
          <div className="text-[#68789D] font-mono-tabular">
            Working Days: <span className="text-[#2674FF] font-semibold">{activeDoctor.workingDays.join(', ')}</span>
          </div>
        </div>
      )}

      {displaySection !== 'slots' && (
        <>
          {/* Calendar Navigation Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={viewMode === 'month' && isAtOrBeforeCurrentMonth}
                aria-label="Previous period"
                className={`neu-btn w-9 h-9 rounded-full flex items-center justify-center text-[#101B45] ${
                  viewMode === 'month' && isAtOrBeforeCurrentMonth
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next period"
                className="neu-btn w-9 h-9 rounded-full flex items-center justify-center text-[#101B45] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm sm:text-base font-bold text-[#101B45] ml-1">
                {viewMode === 'month'
                  ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
                  : formatReadableDate(selectedDate)}
              </span>
            </div>

            <NeuButton size="sm" onClick={handleJumpToday}>
              Today
            </NeuButton>
          </div>

          {/* Calendar Matrix (Month or Week View) */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#3478F6]" />
              <p className="text-xs font-medium">Refreshing doctor availability from schedule service...</p>
            </div>
          ) : (
            <>
              {viewMode === 'month' && (
                <div>
                  <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-[11px] font-bold text-[#64748B] py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {monthDays.map((cell, idx) => {
                      if (!cell) {
                        return <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-xl" />;
                      }

                      const dayAvail = activeDoctor
                        ? computeDoctorAvailabilityForDate(
                            activeDoctor.id,
                            cell.dateStr,
                            doctors,
                            schedules,
                            appointments
                          )
                        : null;

                      const isPastDate = cell.dateStr < DEMO_TODAY;
                      const isSelected = selectedDate === cell.dateStr && !isPastDate;
                      const isToday = cell.dateStr === DEMO_TODAY;
                      const status = isPastDate ? 'Past' : dayAvail?.dayStatus || 'Doctor Unavailable';
                      const openSlotsCount = dayAvail?.slots.filter((s) => s.status === 'Available').length || 0;
                      const isDisabled =
                        isPastDate ||
                        status === 'Past' ||
                        status === 'Doctor Unavailable' ||
                        status === 'Blocked / Leave' ||
                        status === 'Fully Booked';

                      let cellClasses = 'neu-btn text-[#101B45] cursor-pointer';
                      let statusLabel = `${openSlotsCount} open`;

                      if (isSelected) {
                        cellClasses = 'neu-btn-primary text-white font-bold ring-2 ring-[#66C8FF]/50 cursor-pointer';
                      } else if (status === 'Past') {
                        cellClasses = 'neu-inset-sm text-[#68789D]/45 opacity-55 cursor-not-allowed pointer-events-none';
                        statusLabel = 'Past';
                      } else if (status === 'Blocked / Leave') {
                        cellClasses = 'neu-inset-sm text-[#D63649] opacity-75 cursor-not-allowed pointer-events-none';
                        statusLabel = 'Leave';
                      } else if (status === 'Doctor Unavailable') {
                        cellClasses = 'neu-inset-sm text-[#68789D]/60 opacity-70 cursor-not-allowed pointer-events-none';
                        statusLabel = 'Off';
                      } else if (status === 'Fully Booked') {
                        cellClasses = 'neu-inset-sm text-[#C87A14] opacity-80 cursor-not-allowed pointer-events-none';
                        statusLabel = 'Full';
                      }

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled && cell.dateStr >= DEMO_TODAY) {
                              onSelectDate(cell.dateStr);
                            }
                          }}
                          aria-label={`${cell.dateStr} — ${status} (${statusLabel})`}
                          className={`h-13 sm:h-14 rounded-[18px] p-1 flex flex-col items-center justify-center transition-all ${cellClasses}`}
                        >
                          <span className="text-xs sm:text-sm font-mono-tabular font-semibold leading-none">
                            {cell.dayNum}
                            {isToday && !isSelected && (
                              <span className="ml-0.5 text-[#2674FF] font-bold">•</span>
                            )}
                          </span>
                          <span
                            className={`text-[10px] mt-1 leading-none font-medium truncate max-w-full ${
                              isSelected
                                ? 'text-white/95'
                                : status === 'Available'
                                  ? 'text-[#12805C]'
                                  : ''
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'week' && (
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((item) => {
                    const dayAvail = activeDoctor
                      ? computeDoctorAvailabilityForDate(
                          activeDoctor.id,
                          item.dateStr,
                          doctors,
                          schedules,
                          appointments
                        )
                      : null;
                    const isSelected = selectedDate === item.dateStr;
                    const status = dayAvail?.dayStatus || 'Doctor Unavailable';
                    const openCount = dayAvail?.slots.filter((s) => s.status === 'Available').length || 0;
                    const isDisabled = status === 'Past' || status === 'Doctor Unavailable' || status === 'Blocked / Leave';

                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onSelectDate(item.dateStr)}
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'neu-btn-primary text-white'
                            : isDisabled
                              ? 'neu-inset-sm text-[#64748B]/50 cursor-not-allowed'
                              : 'neu-btn text-[#172B4D]'
                        }`}
                      >
                        <span className="text-[11px] font-semibold opacity-80">{item.weekday}</span>
                        <span className="text-sm font-bold font-mono-tabular">{item.dayNum}</span>
                        <span className="text-[10px]">
                          {status === 'Available' ? `${openCount} slots` : status === 'Past' ? 'Past' : 'Closed'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {viewMode === 'day' && (
                <div className="neu-inset rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#64748B]">Focused Day Schedule</div>
                    <div className="text-sm font-bold text-[#172B4D]">{formatReadableDate(selectedDate)}</div>
                  </div>
                  <div className="text-xs font-semibold text-[#16865C]">
                    {selectedDayAvailability?.dayStatus}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Legend explaining calendar statuses */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#64748B] pt-1 border-t border-black/5">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16865C]" /> Available
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#3478F6] inline-block" /> Selected
            </span>
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#C68117]" /> Booked / Full
            </span>
            <span className="inline-flex items-center gap-1">
              <Ban className="w-3.5 h-3.5 text-[#C63D4D]" /> Leave / Blocked
            </span>
          </div>
        </>
      )}

      {/* Selected Date One-Hour Time Slots Section */}
      {displaySection !== 'calendar' && (
        <div className={`${displaySection === 'all' ? 'pt-3 border-t border-black/5' : ''} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#3478F6]" />
                <span>1-Hour Clinic Slots for {formatReadableDate(selectedDate)}</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Displayed end times are exclusive slot boundaries. Max 8 standard slots per day.
              </p>
            </div>
            {selectedSlotStart && (
              <span className="text-xs font-semibold text-[#3478F6] font-mono-tabular">
                Selected: {selectedDayAvailability?.slots.find((s) => s.startTime === selectedSlotStart)?.label}
              </span>
            )}
          </div>

          {selectedDayAvailability?.dayStatus === 'Blocked / Leave' ||
          selectedDayAvailability?.dayStatus === 'Doctor Unavailable' ||
          selectedDayAvailability?.dayStatus === 'Past' ? (
            <div className="neu-inset rounded-xl p-5 text-center space-y-1.5">
              <ShieldAlert className="w-6 h-6 text-[#C68117] mx-auto" />
              <div className="text-sm font-bold text-[#172B4D]">
                No Bookable Slots on {formatReadableDate(selectedDate)}
              </div>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Status: <strong className="text-[#172B4D]">{selectedDayAvailability.dayStatus}</strong>. Please select an open working day (highlighted in green) on the calendar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Morning Slots: 7:00 AM - 11:00 AM */}
              <div>
                <div className="text-xs font-semibold text-[#68789D] mb-2">
                  Morning Session (7:00 AM – 11:00 AM)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {morningSlots.map((slot) => {
                    const isAvailable = slot.status === 'Available';
                    const isSelected = selectedSlotStart === slot.startTime && isAvailable;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelectSlot(slot.startTime, slot.endTime, slot.label)}
                        className={`px-4 py-3 rounded-[18px] text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'neu-btn-primary text-white font-semibold'
                            : isAvailable
                              ? 'neu-btn text-[#101B45] hover:border-[#2674FF]/40 cursor-pointer'
                              : 'neu-inset-sm text-[#68789D]/60 cursor-not-allowed opacity-75'
                        }`}
                      >
                        <span className="text-xs font-mono-tabular font-semibold">{slot.label}</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isSelected
                              ? 'text-white'
                              : isAvailable
                                ? 'text-[#12805C]'
                                : slot.status === 'Booked'
                                  ? 'text-[#C87A14]'
                                  : 'text-[#D63649]'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : slot.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Midday Break Indicator */}
              <div className="neu-inset-sm rounded-full px-4 py-2 text-center text-[11px] text-[#68789D] font-mono-tabular">
                11:00 AM – 1:00 PM · Scheduled Clinic Midday Break & Sanitization Window
              </div>

              {/* Afternoon Slots: 1:00 PM - 5:00 PM */}
              <div>
                <div className="text-xs font-semibold text-[#68789D] mb-2">
                  Afternoon Session (1:00 PM – 5:00 PM)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {afternoonSlots.map((slot) => {
                    const isAvailable = slot.status === 'Available';
                    const isSelected = selectedSlotStart === slot.startTime && isAvailable;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelectSlot(slot.startTime, slot.endTime, slot.label)}
                        className={`px-4 py-3 rounded-[18px] text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'neu-btn-primary text-white font-semibold'
                            : isAvailable
                              ? 'neu-btn text-[#101B45] hover:border-[#2674FF]/40 cursor-pointer'
                              : 'neu-inset-sm text-[#68789D]/60 cursor-not-allowed opacity-75'
                        }`}
                      >
                        <span className="text-xs font-mono-tabular font-semibold">{slot.label}</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isSelected
                              ? 'text-white'
                              : isAvailable
                                ? 'text-[#12805C]'
                                : slot.status === 'Booked'
                                  ? 'text-[#C87A14]'
                                  : 'text-[#D63649]'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : slot.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
