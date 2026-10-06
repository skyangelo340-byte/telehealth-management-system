import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  CalendarClock,
  FileText,
  PlusCircle,
  Ban,
  ShieldAlert,
  Video,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  DoctorProfile,
  DoctorSchedule,
  DoctorScheduleBlock,
  Appointment,
  NotificationItem,
  AssessmentSummary,
  ScreenId,
} from '../../types';
import {
  DEMO_TODAY,
  STANDARD_CLINIC_SLOTS,
  formatReadableDate,
  computeDoctorAvailabilityForDate,
} from '../../services/mockData';
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSelect,
  NeuTextarea,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';

interface DoctorPortalPagesProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  doctor: DoctorProfile;
  allDoctors: DoctorProfile[];
  onUpdateDoctorProfile: (updated: DoctorProfile) => void;
  schedule: DoctorSchedule;
  allSchedules: Record<string, DoctorSchedule>;
  onUpdateDoctorSchedule: (updated: DoctorSchedule) => void;
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  onSelectAppointment: (apt: Appointment) => void;
  onConfirmAppointment: (id: string, meetLinkOverride?: string) => void;
  onOpenRejectModal: (apt: Appointment) => void;
  onOpenRescheduleModal: (apt: Appointment) => void;
  onOpenCancelModal: (apt: Appointment) => void;
  onCompleteAppointment: (id: string, summary: string, internalNotes: string) => void;
  onSaveInternalNotes: (id: string, notes: string) => void;
  onSaveMeetLink: (id: string, meetLink: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  assessments: AssessmentSummary[];
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DoctorPortalPages: React.FC<DoctorPortalPagesProps> = ({
  currentScreen,
  onNavigate,
  doctor,
  allDoctors,
  onUpdateDoctorProfile,
  schedule,
  allSchedules,
  onUpdateDoctorSchedule,
  appointments,
  selectedAppointment,
  onSelectAppointment,
  onConfirmAppointment,
  onOpenRejectModal,
  onOpenRescheduleModal,
  onOpenCancelModal,
  onCompleteAppointment,
  onSaveInternalNotes,
  onSaveMeetLink,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  assessments,
}) => {
  const doctorAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === doctor.id),
    [appointments, doctor.id]
  );

  const todayAppointments = useMemo(
    () => doctorAppointments.filter((a) => a.date === DEMO_TODAY),
    [doctorAppointments]
  );

  const pendingRequests = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'Pending' || a.status === 'Reschedule Requested'),
    [doctorAppointments]
  );

  const confirmedAppointments = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled'),
    [doctorAppointments]
  );

  const completedConsultations = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'Completed'),
    [doctorAppointments]
  );

  const cancelledOrRejected = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'Cancelled' || a.status === 'Rejected'),
    [doctorAppointments]
  );

  const doctorNotifications = useMemo(
    () => notifications.filter((n) => n.recipientRole === 'doctor'),
    [notifications]
  );

  // Calendar state
  const [calDate, setCalDate] = useState(DEMO_TODAY);
  const [calStatusFilter, setCalStatusFilter] = useState('ALL');
  const [calView, setCalView] = useState<'day' | 'week' | 'month'>('day');

  // Appointment detail notes state
  const [internalNotesDraft, setInternalNotesDraft] = useState('');
  const [completionSummaryDraft, setCompletionSummaryDraft] = useState('');
  const [meetLinkDraft, setMeetLinkDraft] = useState('');
  const [notesFeedback, setNotesFeedback] = useState('');

  // Schedule & Block state
  const [blockType, setBlockType] = useState<DoctorScheduleBlock['type']>('Blocked Date');
  const [blockStartDate, setBlockStartDate] = useState('2026-10-07');
  const [blockEndDate, setBlockEndDate] = useState('2026-10-07');
  const [blockSlotStart, setBlockSlotStart] = useState('09:00');
  const [blockReason, setBlockReason] = useState('');
  const [conflictAppointments, setConflictAppointments] = useState<Appointment[]>([]);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState('');

  // Doctor profile edit state
  const [docProfileForm, setDocProfileForm] = useState<DoctorProfile>(doctor);

  // SCREEN 19: DOCTOR CALENDAR
  if (currentScreen === 'doctor-calendar') {
    const dayAvail = computeDoctorAvailabilityForDate(
      doctor.id,
      calDate,
      allDoctors,
      allSchedules,
      appointments
    );

    const dayApts = doctorAppointments.filter(
      (a) =>
        a.date === calDate &&
        (calStatusFilter === 'ALL' || a.status === calStatusFilter)
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Physician Clinical Calendar</h1>
            <p className="text-xs text-[#64748B]">
              Clear distinction between working hours, booked slots, midday break (11 AM–1 PM), and blocked periods.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NeuButton size="sm" onClick={() => setCalDate(DEMO_TODAY)}>
              Today (Oct 6)
            </NeuButton>
            <NeuButton
              size="sm"
              variant="primary"
              onClick={() => onNavigate('schedule-availability')}
            >
              Manage Schedule & Leave
            </NeuButton>
          </div>
        </div>

        <NeuCard className="flex flex-wrap items-center justify-between gap-4 border-2 border-[#3478F6]/35 bg-[#3478F6]/[0.06] ring-1 ring-[#3478F6]/20">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="doc-cal-date" className="text-xs font-bold text-[#3478F6] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#3478F6]" />
              <span>Selected Date:</span>
            </label>
            <input
              id="doc-cal-date"
              type="date"
              value={calDate}
              onChange={(e) => setCalDate(e.target.value)}
              className="neu-inset rounded-xl px-3 py-2 text-xs font-mono-tabular font-semibold text-[#172B4D] border border-[#3478F6]/25"
            />
            <select
              aria-label="Filter calendar by appointment status"
              value={calStatusFilter}
              onChange={(e) => setCalStatusFilter(e.target.value)}
              className="neu-inset rounded-xl px-3 py-2 text-xs font-semibold text-[#172B4D] bg-[#E9EEF3] border border-[#3478F6]/25"
            >
              <option value="ALL">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending Requests</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="neu-inset p-1 rounded-xl flex items-center gap-1 border border-[#3478F6]/20">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCalView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize cursor-pointer ${
                  calView === v ? 'bg-[#3478F6] text-white' : 'text-[#64748B]'
                }`}
              >
                {v} View
              </button>
            ))}
          </div>
        </NeuCard>

        <NeuCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Hourly Roster for {formatReadableDate(calDate)}
              </h2>
              <p className="text-xs text-[#64748B]">
                Day Status: <strong className="text-[#172B4D]">{dayAvail.dayStatus}</strong> · Click any booked slot to open the patient record.
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-[#64748B]">
              {dayApts.length} Appointment(s) on this date
            </span>
          </div>

          <div className="space-y-2">
            {dayAvail.slots.map((slot, index) => {
              const matchedApt = dayApts.find((a) => a.startTime === slot.startTime);
              const isConfirmed =
                matchedApt?.status === 'Confirmed' || matchedApt?.status === 'Rescheduled';
              const showLunchDivider = index === 4;

              return (
                <React.Fragment key={slot.startTime}>
                  {showLunchDivider && (
                    <div className="py-2 text-center text-[11px] font-mono-tabular font-semibold text-[#64748B] tracking-wide">
                      11:00 AM – 1:00 PM · Lunch Break
                    </div>
                  )}

                  <div
                    className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-all ${
                      matchedApt
                        ? 'neu-raised border-l-4 border-l-[#3478F6]'
                        : 'neu-inset-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-34 shrink-0 font-mono-tabular text-xs font-bold text-[#172B4D]">
                        {slot.label}
                      </div>
                      <div className="h-4 w-px bg-black/10 shrink-0 hidden sm:block" />
                      {matchedApt ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#172B4D] truncate">
                              {matchedApt.patientName}
                            </span>
                            <span className="text-[11px] font-mono-tabular font-semibold text-[#3478F6] shrink-0">
                              {matchedApt.referenceNumber}
                            </span>
                          </div>
                          <div className="text-xs text-[#64748B] truncate">
                            {matchedApt.appointmentTypeName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-[#64748B]">
                          Available
                        </span>
                      )}
                    </div>

                    {matchedApt ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <NeuButton
                          size="sm"
                          variant={isConfirmed ? 'primary' : 'secondary'}
                          onClick={() => {
                            onSelectAppointment(matchedApt);
                            setInternalNotesDraft(matchedApt.doctorInternalNotes || '');
                            setCompletionSummaryDraft(matchedApt.consultationSummary || '');
                            setMeetLinkDraft(matchedApt.googleMeetLink || '');
                            onNavigate('doctor-appointment-details');
                          }}
                        >
                          Open Record
                        </NeuButton>
                        {matchedApt.status === 'Pending' && (
                          <NeuButton
                            size="sm"
                            variant="primary"
                            onClick={() => onConfirmAppointment(matchedApt.id)}
                          >
                            Confirm
                          </NeuButton>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-end shrink-0 pr-1"
                        title="Available time slot"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-[#16865C] ring-4 ring-[#16865C]/20 inline-block"
                          aria-label="Available"
                        />
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 20 & 21: DOCTOR APPOINTMENT DETAILS & REQUEST REVIEW
  if (
    currentScreen === 'doctor-appointment-details' ||
    currentScreen === 'appointment-request-review'
  ) {
    const apt = selectedAppointment || pendingRequests[0] || doctorAppointments[0];
    if (!apt) {
      return (
        <NeuCard className="text-center py-10 space-y-3">
          <div className="text-sm font-bold">No Appointment Selected</div>
          <NeuButton onClick={() => onNavigate('doctor-dashboard')}>
            Return to Doctor Dashboard
          </NeuButton>
        </NeuCard>
      );
    }

    const patientAssessments = assessments.filter(
      (asmt) => asmt.patientId === apt.patientId && asmt.sharedWithDoctor
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono-tabular font-semibold text-[#3478F6]">
              Authorized Clinical Chart · {apt.referenceNumber}
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              {currentScreen === 'appointment-request-review'
                ? 'Pending Appointment Request Review'
                : 'Patient Consultation & Appointment Details'}
            </h1>
          </div>
          <NeuButton onClick={() => onNavigate('doctor-dashboard')}>
            ← Back to Doctor Dashboard
          </NeuButton>
        </div>

        {notesFeedback && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notesFeedback}</span>
          </div>
        )}

        <NeuCard size="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/5">
            <div>
              <div className="text-xs text-[#64748B]">Patient Identity</div>
              <div className="text-lg font-bold text-[#172B4D]">{apt.patientName}</div>
              <div className="text-xs text-[#64748B] font-mono-tabular">
                DOB: {apt.patientDob} · Sex: {apt.patientSex} · {apt.patientContact}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#64748B] mb-1">Booking Status</div>
              <StatusIndicator status={apt.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">Scheduled Date</div>
              <div className="text-sm font-bold text-[#172B4D] mt-0.5">
                {formatReadableDate(apt.date)}
              </div>
            </div>
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">1-Hour Consultation Slot</div>
              <div className="text-sm font-bold font-mono-tabular text-[#16865C] mt-0.5">
                {apt.timeLabel}
              </div>
            </div>
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">Department & Type</div>
              <div className="text-sm font-bold text-[#172B4D] mt-0.5">
                {apt.appointmentTypeName}
              </div>
            </div>
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">Appointment Mode</div>
              <div className="text-sm font-bold text-[#3478F6] mt-0.5">
                {apt.consultationMode || 'Online Appointment'}
              </div>
            </div>
          </div>

          {/* Authorized Patient Medical Snapshot */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-[#172B4D]">Chief Complaint / Reason for Visit</div>
            <div className="neu-inset rounded-xl p-3.5 text-[#172B4D]">{apt.reasonForVisit}</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="neu-inset rounded-xl p-3.5">
                <div className="font-bold text-[#C63D4D]">Known Allergies</div>
                <div className="text-[#172B4D] mt-1">{apt.knownAllergiesSnapshot}</div>
              </div>
              <div className="neu-inset rounded-xl p-3.5">
                <div className="font-bold text-[#172B4D]">Current Medications</div>
                <div className="text-[#64748B] mt-1">{apt.currentMedicationsSnapshot}</div>
              </div>
              <div className="neu-inset rounded-xl p-3.5">
                <div className="font-bold text-[#172B4D]">Existing Conditions</div>
                <div className="text-[#64748B] mt-1">{apt.existingConditionsSnapshot}</div>
              </div>
            </div>

            {patientAssessments.length > 0 && (
              <div className="neu-inset rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-[#3478F6]">
                  Patient-Authorized Symptom Assessment Summary
                </div>
                <p className="text-[#172B4D]">{patientAssessments[0].summaryText}</p>
              </div>
            )}

            {apt.cancellationReason && (
              <div className="neu-inset rounded-xl p-3.5 border border-[#C63D4D]/30 space-y-1">
                <div className="font-bold text-[#C63D4D]">Cancellation Reason</div>
                <p className="text-[#C63D4D] font-medium">{apt.cancellationReason}</p>
              </div>
            )}

            {apt.rejectionReason && (
              <div className="neu-inset rounded-xl p-3.5 border border-[#C63D4D]/30 space-y-1">
                <div className="font-bold text-[#C63D4D]">Rejection Reason</div>
                <p className="text-[#C63D4D] font-medium">{apt.rejectionReason}</p>
              </div>
            )}

            {apt.rescheduleReason && (
              <div className="neu-inset rounded-xl p-3.5 border border-[#C68117]/30 space-y-1">
                <div className="font-bold text-[#C68117]">Reschedule Reason</div>
                <p className="text-[#172B4D] font-medium">{apt.rescheduleReason}</p>
              </div>
            )}
          </div>

          {/* Online Appointment — Google Meet Link Dispatch Section */}
          {(apt.consultationMode || 'Online Appointment') === 'Online Appointment' && (
            <div className="neu-inset rounded-2xl p-4 space-y-3 border border-[#3478F6]/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#3478F6]" />
                  <div>
                    <div className="text-xs font-bold text-[#172B4D]">
                      Online Consultation — Google Meet Link
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Provide or generate a Google Meet link for this consultation. Confirming the request automatically sends this link to the patient.
                    </p>
                  </div>
                </div>
                {apt.googleMeetLink && (
                  <span className="text-[11px] font-mono-tabular font-semibold text-[#16865C]">
                    Link Active
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetLinkDraft || apt.googleMeetLink || ''}
                  onChange={(e) => setMeetLinkDraft(e.target.value)}
                  aria-label="Google Meet Link"
                  className="neu-inset-sm flex-1 rounded-xl px-3.5 py-2 text-xs font-mono-tabular text-[#172B4D]"
                />
                <NeuButton
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5 text-[#3478F6]" />}
                  onClick={() => {
                    const code = `thc-${apt.referenceNumber.slice(-4).toLowerCase()}-${Math.random()
                      .toString(36)
                      .substring(2, 5)}`;
                    const generated = `https://meet.google.com/${code}`;
                    setMeetLinkDraft(generated);
                  }}
                >
                  Generate Meet Link
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const linkToSave =
                      meetLinkDraft.trim() ||
                      apt.googleMeetLink ||
                      `https://meet.google.com/thc-${apt.referenceNumber.slice(-4).toLowerCase()}-med`;
                    setMeetLinkDraft(linkToSave);
                    onSaveMeetLink(apt.id, linkToSave);
                    setNotesFeedback(
                      `Google Meet link (${linkToSave}) saved and sent to ${apt.patientName}.`
                    );
                  }}
                >
                  Save & Send Link
                </NeuButton>
              </div>

              {(meetLinkDraft || apt.googleMeetLink) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="font-mono-tabular text-[#3478F6] truncate">
                    {meetLinkDraft || apt.googleMeetLink}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(meetLinkDraft || apt.googleMeetLink || '');
                        setNotesFeedback('Google Meet link copied to clipboard.');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#172B4D] cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <a
                      href={meetLinkDraft || apt.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16865C] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Google Meet Room
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Doctor Internal Notes & Consultation Completion */}
          <div className="pt-4 border-t border-black/5 space-y-4">
            <NeuTextarea
              label="Physician Internal Clinical Notes (Restricted to Attending Doctor)"
              rows={2}
              placeholder="Enter private clinical observations or pre-visit preparation notes..."
              value={internalNotesDraft || apt.doctorInternalNotes || ''}
              onChange={(e) => setInternalNotesDraft(e.target.value)}
            />

            <NeuTextarea
              label="Post-Consultation Summary (Shared with Patient upon Completion)"
              rows={2}
              placeholder="Document assessment outcome, treatment plan, and follow-up guidance..."
              value={completionSummaryDraft || apt.consultationSummary || ''}
              onChange={(e) => setCompletionSummaryDraft(e.target.value)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <NeuButton
                size="sm"
                onClick={() => {
                  onSaveInternalNotes(apt.id, internalNotesDraft || apt.doctorInternalNotes || '');
                  setNotesFeedback('Internal physician notes saved to clinical record.');
                }}
              >
                Save Internal Notes
              </NeuButton>

              <div className="flex flex-wrap items-center gap-2.5">
                {(apt.status === 'Pending' || apt.status === 'Reschedule Requested') && (
                  <>
                    <NeuButton
                      variant="primary"
                      onClick={() => {
                        onConfirmAppointment(apt.id, meetLinkDraft || apt.googleMeetLink);
                        setNotesFeedback(
                          (apt.consultationMode || 'Online Appointment') === 'Online Appointment'
                            ? 'Appointment confirmed and Google Meet link sent to patient.'
                            : 'Walk-In appointment confirmed and patient notified.'
                        );
                      }}
                    >
                      Confirm & Send Meet Link
                    </NeuButton>
                    <NeuButton variant="danger" onClick={() => onOpenRejectModal(apt)}>
                      Reject Request
                    </NeuButton>
                  </>
                )}

                {(apt.status === 'Confirmed' || apt.status === 'Rescheduled') && (
                  <>
                    <NeuButton
                      variant="primary"
                      onClick={() => {
                        onCompleteAppointment(
                          apt.id,
                          completionSummaryDraft ||
                            'Consultation completed. Continue prescribed regimen and schedule routine follow-up.',
                          internalNotesDraft || apt.doctorInternalNotes || ''
                        );
                        setNotesFeedback('Appointment marked Completed and summary shared with patient.');
                      }}
                    >
                      Mark Consultation Completed
                    </NeuButton>
                    <NeuButton onClick={() => onOpenRescheduleModal(apt)}>
                      Reschedule
                    </NeuButton>
                    <NeuButton variant="danger" onClick={() => onOpenCancelModal(apt)}>
                      Cancel
                    </NeuButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREENS 22, 23, 24: SCHEDULE & AVAILABILITY / WORKING HOURS & BREAKS / BLOCKED DATES & LEAVE
  if (
    currentScreen === 'schedule-availability' ||
    currentScreen === 'working-hours-breaks' ||
    currentScreen === 'blocked-dates-leave'
  ) {
    const toggleWorkingDay = (day: string) => {
      const exists = schedule.workingDays.includes(day);
      const nextDays = exists
        ? schedule.workingDays.filter((d) => d !== day)
        : [...schedule.workingDays, day];
      onUpdateDoctorSchedule({ ...schedule, workingDays: nextDays });
      onUpdateDoctorProfile({ ...doctor, workingDays: nextDays });
      setScheduleSavedMsg(`Updated working days to: ${nextDays.join(', ')}`);
    };

    const handleAttemptAddBlock = (e: React.FormEvent) => {
      e.preventDefault();
      // Conflict check against confirmed/pending appointments!
      const overlapping = doctorAppointments.filter(
        (a) =>
          (a.status === 'Confirmed' || a.status === 'Pending') &&
          a.date >= blockStartDate &&
          a.date <= blockEndDate &&
          (blockType !== 'Slot Block' || a.startTime === blockSlotStart)
      );

      if (overlapping.length > 0) {
        setConflictAppointments(overlapping);
        return;
      }

      const newBlock: DoctorScheduleBlock = {
        id: `blk-${Date.now()}`,
        doctorId: doctor.id,
        type: blockType,
        startDate: blockStartDate,
        endDate: blockEndDate,
        slotStartTime: blockType === 'Slot Block' ? blockSlotStart : undefined,
        reason: blockReason || 'Physician Schedule Block',
        status: 'Approved',
        createdAt: new Date().toISOString(),
      };

      onUpdateDoctorSchedule({
        ...schedule,
        blocks: [newBlock, ...schedule.blocks],
      });
      setConflictAppointments([]);
      setBlockReason('');
      setScheduleSavedMsg('Schedule block saved. Availability calendar updated immediately.');
    };

    const handleForceResolveConflictAndBlock = () => {
      // Trigger rescheduling workflow for conflicting appointments before adding block
      conflictAppointments.forEach((apt) => {
        onOpenRescheduleModal(apt);
      });
      setConflictAppointments([]);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Physician Schedule, Working Hours & Leave Management
            </h1>
            <p className="text-xs text-[#64748B]">
              Configure working days, morning/afternoon session boundaries, and leave blocks. Changes never silently invalidate confirmed bookings.
            </p>
          </div>
        </div>

        {scheduleSavedMsg && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center justify-between">
            <span>{scheduleSavedMsg}</span>
            <button type="button" onClick={() => setScheduleSavedMsg('')}>✕</button>
          </div>
        )}

        {/* Conflict Resolution Safeguard Banner */}
        {conflictAppointments.length > 0 && (
          <NeuCard className="border border-[#C68117]/40 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-[#C68117]">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-[#172B4D]">
                  Explicit Conflict Resolution Required ({conflictAppointments.length} Confirmed Booking Affected)
                </div>
                <p className="text-[#64748B] mt-0.5">
                  Clinic policy prevents schedule changes from silently invalidating existing patient appointments. Review and reschedule the affected appointment(s) below before blocking this period:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {conflictAppointments.map((cApt) => (
                <div
                  key={cApt.id}
                  className="neu-inset rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <strong className="font-mono-tabular text-[#3478F6]">{cApt.referenceNumber}</strong> ·{' '}
                    <strong className="text-[#172B4D]">{cApt.patientName}</strong> ·{' '}
                    {formatReadableDate(cApt.date)} ({cApt.timeLabel})
                  </div>
                  <NeuButton size="sm" variant="primary" onClick={handleForceResolveConflictAndBlock}>
                    Reschedule Conflicting Appointment First
                  </NeuButton>
                </div>
              ))}
            </div>
          </NeuCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Working Days & Hours Config */}
          <NeuCard className="lg:col-span-6 space-y-5">
            <h2 className="text-base font-bold text-[#172B4D] border-b border-black/5 pb-2">
              1. Weekly Working Days & Standard Clinic Sessions
            </h2>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#172B4D]">Active Clinic Working Days</div>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const active = schedule.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        active ? 'neu-btn-primary text-white' : 'neu-btn text-[#64748B]'
                      }`}
                    >
                      {day} {active ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="neu-inset rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-[#172B4D]">Morning Session (4 Slots)</div>
                <div className="font-mono-tabular text-[#3478F6] font-semibold">
                  07:00 AM – 11:00 AM
                </div>
                <div className="text-[#64748B]">4 × 60-minute consultations</div>
              </div>
              <div className="neu-inset rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-[#172B4D]">Afternoon Session (4 Slots)</div>
                <div className="font-mono-tabular text-[#3478F6] font-semibold">
                  01:00 PM – 05:00 PM
                </div>
                <div className="text-[#64748B]">4 × 60-minute consultations</div>
              </div>
            </div>

            <div className="neu-inset rounded-xl p-3.5 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-[#172B4D]">Configured Midday Break</div>
                <div className="text-[#64748B]">Protected lunch & clinical charting window</div>
              </div>
              <span className="font-mono-tabular font-bold text-[#16865C]">11:00 AM – 1:00 PM</span>
            </div>
          </NeuCard>

          {/* Block Dates / Leave Form */}
          <NeuCard className="lg:col-span-6 space-y-4">
            <h2 className="text-base font-bold text-[#172B4D] border-b border-black/5 pb-2">
              2. Block Individual Slots, Dates, or Submit Leave
            </h2>

            <form onSubmit={handleAttemptAddBlock} className="space-y-4">
              <NeuSelect
                label="Block / Leave Category"
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as DoctorScheduleBlock['type'])}
                options={[
                  { value: 'Blocked Date', label: 'Full-Day Blocked Date' },
                  { value: 'Slot Block', label: 'Block Single 1-Hour Slot' },
                  { value: 'Leave', label: 'Multi-Day Approved Leave' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NeuInput
                  label="Start Date"
                  type="date"
                  min={DEMO_TODAY}
                  value={blockStartDate}
                  onChange={(e) => {
                    setBlockStartDate(e.target.value);
                    setBlockEndDate(e.target.value);
                  }}
                />
                <NeuInput
                  label="End Date"
                  type="date"
                  min={blockStartDate}
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                />
              </div>

              {blockType === 'Slot Block' && (
                <NeuSelect
                  label="Target 1-Hour Slot"
                  value={blockSlotStart}
                  onChange={(e) => setBlockSlotStart(e.target.value)}
                  options={STANDARD_CLINIC_SLOTS.map((s) => ({
                    value: s.startTime,
                    label: s.label,
                  }))}
                />
              )}

              <NeuInput
                label="Reason for Schedule Block / Leave"
                required
                placeholder="e.g., Inpatient rounds, Medical conference, Personal leave"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#64748B]">
                  Tip: Try blocking Oct 7, 2026 to test the confirmed booking conflict safeguard.
                </span>
                <NeuButton type="submit" variant="primary" size="sm">
                  Apply Schedule Block
                </NeuButton>
              </div>
            </form>

            {/* Existing Blocks List */}
            <div className="pt-3 border-t border-black/5 space-y-2">
              <div className="text-xs font-bold text-[#172B4D]">
                Configured Leave & Blocked Periods ({schedule.blocks.length})
              </div>
              {schedule.blocks.map((b) => (
                <div
                  key={b.id}
                  className="neu-inset rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#172B4D]">{b.type}</span> ·{' '}
                    <span className="font-mono-tabular">{b.startDate}</span>
                    {b.slotStartTime ? ` (${b.slotStartTime})` : ''} — {b.reason}
                  </div>
                  <StatusIndicator status={b.status} />
                </div>
              ))}
            </div>
          </NeuCard>
        </div>
      </div>
    );
  }

  // SCREEN 25: DOCTOR PROFILE
  if (currentScreen === 'doctor-profile') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#172B4D]">Physician Profile & Credentials</h1>
        <NeuCard className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NeuInput
              label="Full Name & Credentials"
              value={docProfileForm.fullName}
              onChange={(e) => setDocProfileForm((p) => ({ ...p, fullName: e.target.value }))}
            />
            <NeuInput
              label="Clinical Title"
              value={docProfileForm.title}
              onChange={(e) => setDocProfileForm((p) => ({ ...p, title: e.target.value }))}
            />
            <NeuInput
              label="Medical License Number"
              value={docProfileForm.licenseNumber}
              disabled
            />
            <NeuInput
              label="Specialty"
              value={docProfileForm.specialty}
              onChange={(e) => setDocProfileForm((p) => ({ ...p, specialty: e.target.value }))}
            />
          </div>
          <NeuTextarea
            label="Clinical Biography"
            rows={3}
            value={docProfileForm.bio}
            onChange={(e) => setDocProfileForm((p) => ({ ...p, bio: e.target.value }))}
          />
          <div className="flex justify-end">
            <NeuButton
              variant="primary"
              onClick={() => onUpdateDoctorProfile(docProfileForm)}
            >
              Save Physician Profile
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 26: DOCTOR NOTIFICATION CENTER
  if (currentScreen === 'doctor-notifications') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Physician Notification Center</h1>
            <p className="text-xs text-[#64748B]">
              Alerts for new patient requests, reschedules, and daily roster reminders.
            </p>
          </div>
          <NeuButton size="sm" onClick={onMarkAllNotificationsRead}>
            Mark All Read
          </NeuButton>
        </div>

        <div className="space-y-3">
          {doctorNotifications.map((n) => (
            <NeuCard key={n.id} className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-[#3478F6] font-semibold">{n.type}</div>
                <div className="text-sm font-bold text-[#172B4D]">{n.title}</div>
                <p className="text-xs text-[#64748B]">{n.message}</p>
              </div>
              {n.appointmentId && (
                <NeuButton
                  size="sm"
                  onClick={() => {
                    onMarkNotificationRead(n.id);
                    const apt = appointments.find((a) => a.id === n.appointmentId);
                    if (apt) {
                      onSelectAppointment(apt);
                      onNavigate('doctor-appointment-details');
                    }
                  }}
                >
                  Review
                </NeuButton>
              )}
            </NeuCard>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT SCREEN 18: DOCTOR DASHBOARD
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#3478F6]">
            Attending Clinician Console · {doctor.departmentName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
            Welcome, {doctor.fullName}
          </h1>
          <p className="text-xs text-[#64748B]">
            {doctor.title} · License: <span className="font-mono-tabular">{doctor.licenseNumber}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <NeuButton onClick={() => onNavigate('doctor-calendar')}>
            Open Full Calendar
          </NeuButton>
          <NeuButton variant="primary" onClick={() => onNavigate('schedule-availability')}>
            Schedule & Availability
          </NeuButton>
        </div>
      </div>

      {/* Key Metrics Row (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Today’s Appointments</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#172B4D]">
            {todayAppointments.length}
          </div>
          <div className="text-[11px] text-[#3478F6] font-medium">Oct 6, 2026</div>
        </NeuCard>

        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Pending Requests</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#C68117]">
            {pendingRequests.length}
          </div>
          <div className="text-[11px] text-[#64748B]">Awaiting action</div>
        </NeuCard>

        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Confirmed Slots</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#16865C]">
            {confirmedAppointments.length}
          </div>
          <div className="text-[11px] text-[#64748B]">Upcoming roster</div>
        </NeuCard>

        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Completed Visits</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#172B4D]">
            {completedConsultations.length}
          </div>
          <div className="text-[11px] text-[#64748B]">Summaries logged</div>
        </NeuCard>

        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Cancelled / Rejected</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#C63D4D]">
            {cancelledOrRejected.length}
          </div>
          <div className="text-[11px] text-[#64748B]">Slots released</div>
        </NeuCard>
      </div>

      {/* Pending Requests Requiring Action + Upcoming Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-[#172B4D]">
            Pending Appointment Requests ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <NeuCard className="text-center py-8 text-xs text-[#64748B]">
              All pending patient requests have been reviewed.
            </NeuCard>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <NeuCard key={req.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-tabular font-bold text-[#3478F6]">
                      {req.referenceNumber} · {formatReadableDate(req.date)} ({req.timeLabel}) ·{' '}
                      {req.consultationMode || 'Online Appointment'}
                    </span>
                    <StatusIndicator status={req.status} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#172B4D]">{req.patientName}</div>
                    <p className="text-xs text-[#64748B] mt-0.5">{req.reasonForVisit}</p>
                    {req.rescheduleReason && (
                      <p className="text-xs text-[#C68117] font-semibold mt-1">
                        Reschedule Reason: {req.rescheduleReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
                    <NeuButton
                      size="sm"
                      variant="primary"
                      onClick={() => onConfirmAppointment(req.id)}
                    >
                      {(req.consultationMode || 'Online Appointment') === 'Online Appointment'
                        ? 'Confirm & Send Meet Link'
                        : 'Confirm Slot'}
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      variant="danger"
                      onClick={() => onOpenRejectModal(req)}
                    >
                      Reject with Reason
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      onClick={() => {
                        onSelectAppointment(req);
                        setInternalNotesDraft(req.doctorInternalNotes || '');
                        setCompletionSummaryDraft(req.consultationSummary || '');
                        setMeetLinkDraft(req.googleMeetLink || '');
                        onNavigate('appointment-request-review');
                      }}
                    >
                      Inspect Intake
                    </NeuButton>
                  </div>
                </NeuCard>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-[#172B4D]">
            Confirmed & Upcoming Consultations ({doctorAppointments.length})
          </h2>
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1.5">
            {doctorAppointments.map((apt) => {
              const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Rescheduled';
              return (
                <NeuCard
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <span className="font-mono-tabular font-bold text-[#3478F6]">
                        {apt.referenceNumber}
                      </span>
                      <span>·</span>
                      <span>{apt.appointmentTypeName}</span>
                      <span>·</span>
                      <span className="text-[#3478F6] font-semibold">
                        {apt.consultationMode || 'Online Appointment'}
                      </span>
                      <span>·</span>
                      <StatusIndicator status={apt.status} />
                    </div>
                    <div className="text-sm font-bold text-[#172B4D]">{apt.patientName}</div>
                    <div className="text-xs font-mono-tabular text-[#64748B]">
                      {formatReadableDate(apt.date)} · {apt.timeLabel}
                    </div>
                    {apt.rescheduleReason && (
                      <div className="text-xs text-[#C68117] font-medium">
                        Reschedule Reason: {apt.rescheduleReason}
                      </div>
                    )}
                    {apt.cancellationReason && (
                      <div className="text-xs text-[#C63D4D] font-medium">
                        Cancelled Reason: {apt.cancellationReason}
                      </div>
                    )}
                  </div>
                  <NeuButton
                    size="sm"
                    variant={isConfirmed ? 'primary' : 'secondary'}
                    onClick={() => {
                      onSelectAppointment(apt);
                      setInternalNotesDraft(apt.doctorInternalNotes || '');
                      setCompletionSummaryDraft(apt.consultationSummary || '');
                      setMeetLinkDraft(apt.googleMeetLink || '');
                      onNavigate('doctor-appointment-details');
                    }}
                  >
                    Open Record
                  </NeuButton>
                </NeuCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
