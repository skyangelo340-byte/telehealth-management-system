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
  Pill,
  Printer,
  Download,
  Loader2,
  MoreVertical,
  Image as ImageIcon,
} from 'lucide-react';
import { PrescriptionPdfModal } from '../../components/ui/PrescriptionPdfModal';
import {
  buildResetaPdfDocument,
  triggerPdfPrint,
  downloadResetaAsImage,
  triggerDomPrintReseta,
} from '../../utils/prescriptionPdf';
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
  onUpdateDoctorSchedule: (updated: DoctorSchedule, submittedBlock?: DoctorScheduleBlock) => void;
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
  onReportConsultationDelay?: (
    currentAptId: string,
    delayMinutes: number,
    customReason?: string
  ) => { affectedCount: number; affectedNames: string[] };
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
  onReportConsultationDelay,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  assessments,
}) => {
  const [delayNoticeToast, setDelayNoticeToast] = useState<string>('');
  const [delayReasonDraft, setDelayReasonDraft] = useState<string>('');
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
    () =>
      notifications.filter(
        (n) =>
          n.recipientRole === 'doctor' &&
          (n.recipientId === doctor.id || n.recipientId === doctor.userId)
      ),
    [notifications, doctor.id, doctor.userId]
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
  const [notesError, setNotesError] = useState('');

  // Schedule & Block state
  const [workingDaysDraft, setWorkingDaysDraft] = useState<string[] | null>(null);
  const [blockType, setBlockType] = useState<DoctorScheduleBlock['type']>('Blocked Date');
  const [blockStartDate, setBlockStartDate] = useState('2026-10-07');
  const [blockEndDate, setBlockEndDate] = useState('2026-10-07');
  const [blockSlotStart, setBlockSlotStart] = useState('09:00');
  const [blockReason, setBlockReason] = useState('');
  const [conflictAppointments, setConflictAppointments] = useState<Appointment[]>([]);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState('');

  // Doctor profile edit state
  const [docProfileForm, setDocProfileForm] = useState<DoctorProfile>(doctor);
  const [rxPdfModalOpen, setRxPdfModalOpen] = useState(false);
  const [rxActionMenuOpen, setRxActionMenuOpen] = useState(false);
  const [rxHeaderMenuOpen, setRxHeaderMenuOpen] = useState(false);
  const [rxSearchQuery, setRxSearchQuery] = useState('');
  const [rxStatusFilter, setRxStatusFilter] = useState<'ALL' | 'NEEDS_RX' | 'ISSUED'>('ALL');
  const [rxMedName, setRxMedName] = useState('');
  const [rxMedDosage, setRxMedDosage] = useState('');
  const [rxMedQty, setRxMedQty] = useState('#30');
  const [rxMedSig, setRxMedSig] = useState('Take 1 tablet once daily');

  // SCREEN: DOCTOR PRESCRIPTIONS (RESETA / E-RX)
  if (currentScreen === 'doctor-receipts') {
    const filteredDoctorRxList = doctorAppointments.filter((apt) => {
      const hasRx = Boolean(apt.consultationSummary && apt.consultationSummary.trim());
      if (rxStatusFilter === 'NEEDS_RX' && (hasRx || apt.status === 'Cancelled' || apt.status === 'Rejected')) {
        return false;
      }
      if (rxStatusFilter === 'ISSUED' && !hasRx) {
        return false;
      }
      const q = rxSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.referenceNumber.toLowerCase().includes(q) ||
        apt.reasonForVisit.toLowerCase().includes(q)
      );
    });

    const activeRxApt =
      (selectedAppointment && selectedAppointment.doctorId === doctor.id
        ? selectedAppointment
        : null) ||
      filteredDoctorRxList[0] ||
      doctorAppointments[0] ||
      null;

    const currentRxValue =
      completionSummaryDraft !== ''
        ? completionSummaryDraft
        : activeRxApt?.consultationSummary || '';

    const handleAppendMedToRx = () => {
      if (!rxMedName.trim()) {
        setNotesError('Ilagay muna ang pangalan ng gamot (Medication Name) bago idagdag sa Reseta.');
        return;
      }
      setNotesError('');
      const lineItem = `• Rx: ${rxMedName.trim()} ${rxMedDosage.trim()} (${rxMedQty.trim() || '#30'}) — Sig: ${rxMedSig.trim() || 'As directed'}`;
      const nextText = currentRxValue.trim()
        ? `${currentRxValue.trim()}\n${lineItem}`
        : lineItem;
      setCompletionSummaryDraft(nextText);
      setRxMedName('');
      setRxMedDosage('');
    };

    const needsRxCount = doctorAppointments.filter(
      (a) =>
        (!a.consultationSummary || !a.consultationSummary.trim()) &&
        a.status !== 'Cancelled' &&
        a.status !== 'Rejected'
    ).length;
    const issuedRxCount = doctorAppointments.filter((a) =>
      Boolean(a.consultationSummary && a.consultationSummary.trim())
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Patient Prescriptions (Reseta / e-Rx)
            </h1>
            <p className="text-xs text-[#64748B]">
              Issue structured medical prescriptions (℞), dosage schedules, and printable A4 PDF resetas for {doctor.fullName}’s patients.
            </p>
          </div>
        </div>

        <PrescriptionPdfModal
          open={rxPdfModalOpen}
          onClose={() => setRxPdfModalOpen(false)}
          appointment={activeRxApt}
          doctor={doctor}
          customPrescriptionText={currentRxValue}
        />

        {notesFeedback && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notesFeedback}</span>
          </div>
        )}

        {doctorAppointments.length === 0 ? (
          <NeuCard className="text-center py-12 space-y-3">
            <Pill className="w-8 h-8 text-[#64748B] mx-auto" />
            <div className="text-base font-bold text-[#172B4D]">No Patient Prescriptions Found</div>
            <p className="text-xs text-[#64748B]">
              Patient consultations assigned to your roster will appear here for e-Rx issuance.
            </p>
          </NeuCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (CSS Selector 1): Searchable & Filterable Patient e-Rx Queue */}
            <div className="lg:col-span-4 space-y-3.5">
              <NeuCard size="sm" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172B4D]">
                    Patient e-Rx Queue
                  </span>
                  <span className="text-[11px] font-mono-tabular font-semibold text-[#3478F6]">
                    {filteredDoctorRxList.length} of {doctorAppointments.length}
                  </span>
                </div>

                <input
                  type="search"
                  placeholder="Search patient name or RX-TH-2026..."
                  value={rxSearchQuery}
                  onChange={(e) => setRxSearchQuery(e.target.value)}
                  aria-label="Search patient prescriptions"
                  className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-[#172B4D]"
                />

                <div className="neu-inset p-1 rounded-xl grid grid-cols-3 gap-1 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('ALL')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      rxStatusFilter === 'ALL'
                        ? 'bg-[#3478F6] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    All ({doctorAppointments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('NEEDS_RX')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      rxStatusFilter === 'NEEDS_RX'
                        ? 'bg-[#C68117] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    Needs ℞ ({needsRxCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxStatusFilter('ISSUED')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      rxStatusFilter === 'ISSUED'
                        ? 'bg-[#16865C] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    Issued ({issuedRxCount})
                  </button>
                </div>
              </NeuCard>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1.5">
                {filteredDoctorRxList.length === 0 ? (
                  <NeuCard size="sm" className="text-center py-8 text-xs text-[#64748B]">
                    No patient records match your current filter.
                  </NeuCard>
                ) : (
                  filteredDoctorRxList.map((apt) => {
                    const isSelected = activeRxApt?.id === apt.id;
                    const hasRx = Boolean(apt.consultationSummary && apt.consultationSummary.trim());
                    const hasAllergy =
                      apt.knownAllergiesSnapshot &&
                      apt.knownAllergiesSnapshot.toLowerCase() !== 'none' &&
                      apt.knownAllergiesSnapshot.toLowerCase() !== 'none reported';

                    return (
                      <NeuCard
                        key={apt.id}
                        size="sm"
                        onClick={() => {
                          onSelectAppointment(apt);
                          setCompletionSummaryDraft(apt.consultationSummary || '');
                          setInternalNotesDraft(apt.doctorInternalNotes || '');
                          setNotesError('');
                        }}
                        className={`cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'border-2 border-[#3478F6] bg-white/45'
                            : 'hover:bg-white/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-tabular font-bold text-black">
                            RX-{apt.referenceNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              hasRx
                                ? 'bg-[#16865C]/15 text-[#16865C]'
                                : 'bg-[#C68117]/15 text-[#C68117]'
                            }`}
                          >
                            {hasRx ? '✓ Reseta Issued' : '• Needs Reseta'}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-[#172B4D]">{apt.patientName}</div>
                          <div className="text-[11px] text-[#64748B] truncate">
                            {apt.reasonForVisit}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5">
                          <span className="font-mono-tabular text-black font-semibold">
                            {formatReadableDate(apt.date)} · {apt.startTime}
                          </span>
                          {hasAllergy ? (
                            <span className="text-[#C63D4D] font-bold">
                              ⚠ Allergy: {apt.knownAllergiesSnapshot}
                            </span>
                          ) : (
                            <StatusIndicator status={apt.status} />
                          )}
                        </div>
                      </NeuCard>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (CSS Selector 2): Interactive Clinical Prescription Pad & Quick Med Builder */}
            <div className="lg:col-span-8">
              {activeRxApt && (
                <NeuCard size="lg" className="space-y-5 border border-[#3478F6]/20">
                  {/* Clinical Prescription Sheet Top Header Banner (CSS Selector 1) */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl neu-btn-primary flex items-center justify-center text-2xl font-serif font-extrabold italic shrink-0">
                        ℞
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3478F6]">
                          TeleHealth Medical Center · Official Physician e-Reseta Pad
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          <h2 className="text-xl font-extrabold text-[#172B4D] font-mono-tabular tracking-tight">
                            RX-{activeRxApt.referenceNumber}
                          </h2>
                          <StatusIndicator status={activeRxApt.status} />
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Consultation Date: {formatReadableDate(activeRxApt.date)} ({activeRxApt.timeLabel})
                        </p>
                      </div>
                    </div>

                    <div className="neu-inset rounded-xl px-3.5 py-2.5 text-right text-xs">
                      <div className="font-bold text-[#172B4D]">{doctor.fullName}</div>
                      <div className="text-[#3478F6] font-semibold">
                        {doctor.departmentName}
                      </div>
                      <div className="text-[#64748B] font-mono-tabular text-[11px]">
                        PRC Lic #: {doctor.licenseNumber}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Patient Demographics & Allergy Safety Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Patient Name &amp; Demographics
                        </div>
                        <div className="text-sm font-extrabold text-[#172B4D]">
                          {activeRxApt.patientName}
                        </div>
                        <div className="text-[#64748B] font-mono-tabular">
                          DOB: {activeRxApt.patientDob} · Sex: {activeRxApt.patientSex}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Chief Complaint &amp; Current Meds
                        </div>
                        <div className="font-bold text-[#172B4D] truncate">
                          {activeRxApt.reasonForVisit}
                        </div>
                        <div className="text-[#16865C] font-semibold truncate">
                          On file: {activeRxApt.currentMedicationsSnapshot || 'None reported'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#C63D4D]">
                          Allergy Safety Check
                        </div>
                        <div className="text-xs font-extrabold text-[#C63D4D]">
                          {activeRxApt.knownAllergiesSnapshot || 'No Known Drug Allergies'}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono-tabular">
                          Mode: {activeRxApt.consultationMode || 'Online Appointment'}
                        </div>
                      </div>
                    </div>

                    {/* Live Official Reseta Pad Content */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="textarea-rx-pad"
                          className="text-xs font-extrabold text-[#172B4D] flex items-center gap-1.5"
                        >
                          <span className="text-lg font-serif italic text-[#3478F6]">℞</span>
                          <span>Official Prescription Orders &amp; Sig. Instructions (Required to Complete)</span>
                        </label>
                        {currentRxValue.trim() && (
                          <button
                            type="button"
                            onClick={() => setCompletionSummaryDraft('')}
                            className="text-[11px] font-semibold text-[#C63D4D] hover:underline cursor-pointer"
                          >
                            Clear Pad
                          </button>
                        )}
                      </div>

                      <textarea
                        id="textarea-rx-pad"
                        rows={5}
                        placeholder="Type full prescription orders here (e.g., • Rx: Losartan 50mg Tablet (#30) — Sig: Take 1 tablet once daily)..."
                        value={currentRxValue}
                        onChange={(e) => {
                          setCompletionSummaryDraft(e.target.value);
                          if (notesError) setNotesError('');
                        }}
                        className="neu-inset w-full rounded-xl border border-[#3478F6]/30 p-4 text-xs font-mono-tabular text-[#172B4D] leading-relaxed focus:outline-none focus:border-[#3478F6]"
                      />

                      {notesError && (
                        <div className="neu-inset rounded-xl p-3 text-xs font-semibold text-[#C63D4D] border border-[#C63D4D]/30 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{notesError}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Bar */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-black/10">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <NeuButton
                            size="sm"
                            aria-label="Prescription Download & Print Options"
                            title="More Options: Download (as Image) or Print (DOMPDF)"
                            onClick={() => setRxActionMenuOpen((prev) => !prev)}
                            className="px-3"
                          >
                            <MoreVertical className="w-4 h-4 text-[#172B4D]" />
                          </NeuButton>

                          {rxActionMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-56 neu-raised rounded-2xl p-2 z-30 border border-[#3478F6]/20 space-y-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setRxActionMenuOpen(false);
                                  downloadResetaAsImage({
                                    appointment: activeRxApt,
                                    doctor,
                                    customPrescriptionText: currentRxValue,
                                  });
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#172B4D] hover:bg-[#3478F6]/10 transition-colors cursor-pointer text-left"
                              >
                                <ImageIcon className="w-4 h-4 text-[#3478F6] shrink-0" />
                                <div>
                                  <div>Download (as Image)</div>
                                  <div className="text-[10px] font-normal text-[#64748B]">
                                    Save Reseta PNG image
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRxActionMenuOpen(false);
                                  const pdfDoc = buildResetaPdfDocument({
                                    appointment: activeRxApt,
                                    doctor,
                                    customPrescriptionText: currentRxValue,
                                  });
                                  pdfDoc.save(`Reseta-RX-${activeRxApt.referenceNumber}.pdf`);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#172B4D] hover:bg-[#3478F6]/10 transition-colors cursor-pointer text-left"
                              >
                                <Download className="w-4 h-4 text-[#16865C] shrink-0" />
                                <div>
                                  <div>Save as PDF</div>
                                  <div className="text-[10px] font-normal text-[#64748B]">
                                    Download official Reseta PDF
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                        <NeuButton
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            const rxText = currentRxValue.trim();

                            if (!rxText) {
                              setNotesFeedback('');
                              setNotesError(
                                'Hindi maaaring i-mark as Completed o mag-issue ng Reseta kung walang nakasulat na gamot at instructions (℞ Prescription Details).'
                              );
                              return;
                            }

                            setNotesError('');
                            onCompleteAppointment(
                              activeRxApt.id,
                              rxText,
                              internalNotesDraft || activeRxApt.doctorInternalNotes || ''
                            );
                            setNotesFeedback(
                              `Medical prescription (RX-${activeRxApt.referenceNumber}) saved, consultation marked Completed, and shared with ${activeRxApt.patientName}.`
                            );
                          }}
                        >
                          Issue Reseta &amp; Mark Completed
                        </NeuButton>
                      </div>
                    </div>
                  </div>
                </NeuCard>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

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
                      ) : null}
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

          {/* Consultation Overrun / Queue Delay Control (Notify Next Waiting Patient) */}
          {(apt.status === 'Confirmed' || apt.status === 'Rescheduled') && (
            <div className="neu-inset rounded-2xl p-4 space-y-3 border border-[#C68117]/35">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C68117]" />
                  <div>
                    <div className="text-xs font-bold text-[#172B4D]">
                      Consultation Overrun / Queue Delay Notification
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Kung lumagpas sa oras ang check-up na ito, pindutin ang +15m, +30m, o +45m para awtomatikong ma-notify ang susunod na pasyente sa pila at mabigyan sila ng bagong Estimated Start Time o Free Reschedule option.
                    </p>
                  </div>
                </div>
                {apt.delayMinutes ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#C68117]/15 text-[#C68117] text-[11px] font-extrabold font-mono-tabular">
                    Delayed +{apt.delayMinutes}m (Est. {apt.estimatedStartTime})
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Optional reason (hal. Extended clinical evaluation of previous patient)..."
                  value={delayReasonDraft}
                  onChange={(e) => setDelayReasonDraft(e.target.value)}
                  className="neu-inset-sm flex-1 rounded-xl px-3.5 py-2 text-xs text-[#172B4D]"
                />
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {[15, 30, 45].map((mins) => (
                    <NeuButton
                      key={mins}
                      size="sm"
                      onClick={() => {
                        if (!onReportConsultationDelay) return;
                        const res = onReportConsultationDelay(apt.id, mins, delayReasonDraft);
                        setNotesFeedback(
                          `Queue Delay (+${mins} mins) sent! Notified ${res.affectedCount} queued patient(s): ${res.affectedNames.join(', ')}.`
                        );
                        setDelayReasonDraft('');
                      }}
                    >
                      +{mins} mins Delay
                    </NeuButton>
                  ))}
                </div>
              </div>

              {apt.patientDelayDecision === 'waiting' && (
                <div className="text-xs font-semibold text-[#16865C] flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Nag-confirm na ang pasyente na maghihintay siya sa Priority Queue ({apt.estimatedStartTime}).
                  </span>
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

            <div className="space-y-2">
              <NeuTextarea
                label="℞ Official Medical Prescription / Reseta & Post-Consultation Instructions (Required Before Marking Completed)"
                rows={3}
                placeholder="Required: Enter prescribed medication(s), dosage, frequency (Sig.), and post-visit instructions (e.g., Rx: Amlodipine 5mg #30 — Take 1 tablet once daily)..."
                value={
                  completionSummaryDraft !== ''
                    ? completionSummaryDraft
                    : apt.consultationSummary || ''
                }
                onChange={(e) => {
                  setCompletionSummaryDraft(e.target.value);
                  if (notesError) setNotesError('');
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
                <span>
                  * Mandatory Clinical Rule: Hindi pwedeng i-mark as <strong>Completed</strong> ang appointment hangga’t walang inisyung Reseta (℞).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectAppointment(apt);
                    onNavigate('doctor-receipts');
                  }}
                  className="font-bold text-[#3478F6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Pill className="w-3.5 h-3.5" />
                  Open Full Reseta Pad (e-Rx)
                </button>
              </div>
            </div>

            {notesError && (
              <div className="neu-inset rounded-xl p-3.5 text-xs font-semibold text-[#C63D4D] border border-[#C63D4D]/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{notesError}</span>
              </div>
            )}

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
                        const rxText = (
                          completionSummaryDraft !== ''
                            ? completionSummaryDraft
                            : apt.consultationSummary || ''
                        ).trim();

                        if (!rxText) {
                          setNotesFeedback('');
                          setNotesError(
                            'Required: Maglagay muna ng Reseta (℞ Prescribed Medication, Dosage & Instructions) bago i-mark as Completed ang appointment.'
                          );
                          return;
                        }

                        setNotesError('');
                        onCompleteAppointment(
                          apt.id,
                          rxText,
                          internalNotesDraft || apt.doctorInternalNotes || ''
                        );
                        setNotesFeedback(
                          `Appointment marked Completed and official Reseta (RX-${apt.referenceNumber}) issued to ${apt.patientName}.`
                        );
                      }}
                    >
                      Issue Reseta &amp; Mark Completed
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
    const hasWorkingDaysDraftInitialized = workingDaysDraft !== null;
    const activeSelectableDays = hasWorkingDaysDraftInitialized
      ? workingDaysDraft
      : schedule.pendingWorkingDays && schedule.workingDaysApprovalStatus === 'Pending Approval'
        ? schedule.pendingWorkingDays
        : schedule.workingDays;

    const toggleWorkingDay = (day: string) => {
      const exists = activeSelectableDays.includes(day);
      const nextDays = exists
        ? activeSelectableDays.filter((d) => d !== day)
        : [...activeSelectableDays, day];
      setWorkingDaysDraft(nextDays);
    };

    const handleSubmitWorkingDaysForApproval = () => {
      const requestedDays = activeSelectableDays;
      const newScheduleBlock: DoctorScheduleBlock = {
        id: `blk-wd-${Date.now()}`,
        doctorId: doctor.id,
        type: 'Break Override',
        startDate: DEMO_TODAY,
        endDate: DEMO_TODAY,
        reason: `Requested Weekly Working Days Update: ${requestedDays.join(', ')} (Current: ${schedule.workingDays.join(', ')})`,
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
      };

      onUpdateDoctorSchedule(
        {
          ...schedule,
          pendingWorkingDays: requestedDays,
          workingDaysApprovalStatus: 'Pending Approval',
          blocks: [newScheduleBlock, ...schedule.blocks],
        },
        newScheduleBlock
      );
      setWorkingDaysDraft(null);
      setScheduleSavedMsg(
        `Your Weekly Working Days request (${requestedDays.join(', ')}) has been submitted to the Administrator for approval (Pending Approval).`
      );
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

      const selectedSlotDef =
        blockType === 'Slot Block'
          ? STANDARD_CLINIC_SLOTS.find((s) => s.startTime === blockSlotStart)
          : undefined;

      const newBlock: DoctorScheduleBlock = {
        id: `blk-${Date.now()}`,
        doctorId: doctor.id,
        type: blockType,
        startDate: blockStartDate,
        endDate: blockEndDate,
        slotStartTime: blockType === 'Slot Block' ? blockSlotStart : undefined,
        slotEndTime: blockType === 'Slot Block' ? selectedSlotDef?.endTime : undefined,
        reason: blockReason.trim() || 'Physician Leave / Absent Request',
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
      };

      onUpdateDoctorSchedule(
        {
          ...schedule,
          blocks: [newBlock, ...schedule.blocks],
        },
        newBlock
      );
      setConflictAppointments([]);
      setBlockReason('');
      setScheduleSavedMsg(
        `Your ${newBlock.type} request (${newBlock.startDate}${
          newBlock.endDate !== newBlock.startDate ? ` to ${newBlock.endDate}` : ''
        }${newBlock.slotStartTime ? ` · ${newBlock.slotStartTime}` : ''}) has been submitted to the Administrator for approval (Pending Approval). Slots will only be blocked once approved by Admin.`
      );
    };

    const handleCancelPendingBlock = (blockId: string) => {
      const targetBlock = schedule.blocks.find((b) => b.id === blockId);
      const nextBlocks = schedule.blocks.filter((b) => b.id !== blockId);
      const isWorkingDaysBlock = targetBlock?.type === 'Break Override';
      onUpdateDoctorSchedule({
        ...schedule,
        pendingWorkingDays: isWorkingDaysBlock ? undefined : schedule.pendingWorkingDays,
        workingDaysApprovalStatus: isWorkingDaysBlock
          ? 'Approved'
          : schedule.workingDaysApprovalStatus,
        blocks: nextBlocks,
      });
      setScheduleSavedMsg('Pending request withdrawn.');
    };

    const handleWithdrawPendingWorkingDays = () => {
      const nextBlocks = schedule.blocks.filter(
        (b) => !(b.type === 'Break Override' && b.status === 'Pending Approval')
      );
      onUpdateDoctorSchedule({
        ...schedule,
        pendingWorkingDays: undefined,
        workingDaysApprovalStatus: 'Approved',
        blocks: nextBlocks,
      });
      setWorkingDaysDraft(null);
      setScheduleSavedMsg('Pending Weekly Working Days update request withdrawn.');
    };

    const handleForceResolveConflictAndBlock = () => {
      // Trigger rescheduling workflow for conflicting appointments before adding block
      conflictAppointments.forEach((apt) => {
        onOpenRescheduleModal(apt);
      });
      setConflictAppointments([]);
    };

    const pendingBlocksCount = schedule.blocks.filter(
      (b) => b.status === 'Pending Approval'
    ).length;
    const approvedBlocksCount = schedule.blocks.filter(
      (b) => b.status === 'Approved'
    ).length;

    const isWorkingDaysCardLoading =
      schedule.workingDaysApprovalStatus === 'Pending Approval' &&
      schedule.pendingWorkingDays !== undefined;

    const pendingLeaveOrSlotBlocks = schedule.blocks.filter(
      (b) => b.status === 'Pending Approval' && b.type !== 'Break Override'
    );
    const isLeaveCardFlipped = pendingLeaveOrSlotBlocks.length > 0;
    const latestPendingLeaveBlock = pendingLeaveOrSlotBlocks[0];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Physician Schedule, Working Hours &amp; Leave / Absence Requests
            </h1>
            <p className="text-xs text-[#64748B]">
              Configure working days and submit leave, absence, or slot block requests. All leave, absent dates, and slot blocks require <strong>Admin Approval</strong> before taking effect on patient booking calendars.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="neu-inset-sm px-3 py-1.5 rounded-xl font-semibold text-[#C87A14]">
              Pending Admin Approval: <strong className="font-mono-tabular">{pendingBlocksCount}</strong>
            </span>
            <span className="neu-inset-sm px-3 py-1.5 rounded-xl font-semibold text-[#12805C]">
              Admin Approved: <strong className="font-mono-tabular">{approvedBlocksCount}</strong>
            </span>
          </div>
        </div>

        {scheduleSavedMsg && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center justify-between gap-3">
            <span>{scheduleSavedMsg}</span>
            <button type="button" onClick={() => setScheduleSavedMsg('')} className="cursor-pointer">
              ✕
            </button>
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
                  Clinic policy prevents leave or slot block requests from silently invalidating existing patient appointments. Review and reschedule the affected appointment(s) below before requesting this block:
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (CSS Selector 2): 3D Flip Card — Working Days & Hours Config */}
          <div className="lg:col-span-6 [perspective:1400px]">
            <div
              className={`grid transition-transform duration-700 [transform-style:preserve-3d] ${
                isWorkingDaysCardLoading ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* FRONT FACE: Working Days & Hours Form */}
              <NeuCard
                className={`[grid-area:1/1] [backface-visibility:hidden] space-y-5 border border-[#3478F6]/20 ${
                  isWorkingDaysCardLoading ? 'pointer-events-none select-none' : ''
                }`}
              >
                <div className="border-b border-black/10 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-[#172B4D]">
                      1. Weekly Working Days &amp; Standard Clinic Sessions
                    </h2>
                    <p className="text-[11px] text-[#64748B]">
                      Select your active clinic days and submit changes for Admin approval.
                    </p>
                  </div>
                  <span className="neu-inset-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#C87A14]">
                    Subject to Admin Review
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[#172B4D]">
                      Select Active Clinic Working Days
                    </div>
                    <span className="text-[11px] text-[#64748B]">
                      Current Approved:{' '}
                      <strong className="text-[#172B4D]">{schedule.workingDays.join(', ')}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {ALL_DAYS.map((day) => {
                      const isSelected = activeSelectableDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWorkingDay(day)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'neu-btn-primary text-white'
                              : 'neu-btn text-[#64748B]'
                          }`}
                        >
                          <span>{day}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
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
                    <div className="text-[#64748B]">Protected lunch &amp; clinical charting window</div>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#16865C]">
                    11:00 AM – 1:00 PM
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/10">
                  <span className="text-[11px] text-[#64748B]">
                    Status upon submission:{' '}
                    <strong className="text-[#C87A14]">Pending Approval</strong>
                  </span>
                  <NeuButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitWorkingDaysForApproval}
                  >
                    Submit Working Days for Approval
                  </NeuButton>
                </div>
              </NeuCard>

              {/* BACK FACE (Flipped): Waiting for Approval with Loading Animation Circle */}
              <NeuCard
                className={`[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center p-8 space-y-5 border-2 border-[#C87A14]/45 ${
                  !isWorkingDaysCardLoading ? 'pointer-events-none select-none' : ''
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-[#C87A14]/20 border-t-[#C87A14] animate-spin" />
                  <Clock className="w-7 h-7 text-[#C87A14] absolute" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#C87A14]/15 text-[#C87A14] text-[11px] font-extrabold uppercase tracking-wider">
                    1. Weekly Working Days Update
                  </span>
                  <h3 className="text-lg font-extrabold text-[#172B4D]">
                    Waiting for Approval
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Your requested weekly clinic schedule has been sent to the System Administrator for review and approval.
                  </p>
                </div>

                <div className="neu-inset rounded-2xl p-4 w-full max-w-md space-y-2 text-xs text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Requested Working Days:</span>
                    <span className="font-mono-tabular font-bold text-[#3478F6]">
                      {schedule.pendingWorkingDays?.join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/5 pt-2">
                    <span className="text-[#64748B]">Current Approved Days:</span>
                    <span className="font-mono-tabular font-semibold text-[#172B4D]">
                      {schedule.workingDays.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <NeuButton
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={handleWithdrawPendingWorkingDays}
                  >
                    Withdraw Request &amp; Edit
                  </NeuButton>
                </div>
              </NeuCard>
            </div>
          </div>

          {/* RIGHT COLUMN (CSS Selector 1): 3D Flip Card — Request Leave / Absent / Slot Block */}
          <div className="lg:col-span-6 [perspective:1400px]">
            <div
              className={`grid transition-transform duration-700 [transform-style:preserve-3d] ${
                isLeaveCardFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* FRONT FACE: Request Leave, Absent Date, or Slot Block Form */}
              <NeuCard
                className={`[grid-area:1/1] [backface-visibility:hidden] space-y-4 border border-[#3478F6]/20 ${
                  isLeaveCardFlipped ? 'pointer-events-none select-none' : ''
                }`}
              >
                <div className="border-b border-black/10 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-[#172B4D]">
                      2. Request Leave, Absent Date, or Slot Block
                    </h2>
                    <p className="text-[11px] text-[#64748B]">
                      Submit leave or slot block requests to the Admin Physician Leave queue.
                    </p>
                  </div>
                  <span className="neu-inset-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#C87A14]">
                    Subject to Admin Review
                  </span>
                </div>

                <form onSubmit={handleAttemptAddBlock} className="space-y-4">
                  <NeuSelect
                    label="Leave / Absence / Slot Block Category"
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as DoctorScheduleBlock['type'])}
                    options={[
                      {
                        value: 'Blocked Date',
                        label: 'Full-Day Absent / Blocked Date (Requires Admin Approval)',
                      },
                      {
                        value: 'Slot Block',
                        label: 'Block Single 1-Hour Slot (Requires Admin Approval)',
                      },
                      {
                        value: 'Leave',
                        label: 'Multi-Day Leave Request (Requires Admin Approval)',
                      },
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
                    label="Reason for Leave / Absence / Slot Block"
                    required
                    placeholder="e.g., Medical conference, Sick / Emergency absence, Inpatient rounds"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#64748B]">
                      Status upon submission:{' '}
                      <strong className="text-[#C87A14]">Pending Approval</strong>
                    </span>
                    <NeuButton type="submit" variant="primary" size="sm">
                      Submit Request for Admin Approval
                    </NeuButton>
                  </div>
                </form>

                {/* Existing Blocks & Leave Requests List */}
                <div className="pt-3 border-t border-black/5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172B4D]">
                      Submitted Leave, Absent &amp; Slot Block Requests ({schedule.blocks.length})
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Only Approved requests block patient slots
                    </span>
                  </div>
                  {schedule.blocks.length === 0 ? (
                    <div className="neu-inset rounded-xl p-4 text-center text-xs text-[#64748B]">
                      No leave, absence, or slot block requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {schedule.blocks.map((b) => (
                        <div
                          key={b.id}
                          className="neu-inset rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-[#172B4D]">
                                {b.type === 'Blocked Date'
                                  ? 'Full-Day Absent / Blocked Date'
                                  : b.type === 'Break Override'
                                    ? 'Weekly Working Days Update'
                                    : b.type}
                              </span>
                              <span>·</span>
                              <span className="font-mono-tabular font-semibold text-[#3478F6]">
                                {b.startDate}
                                {b.endDate && b.endDate !== b.startDate ? ` → ${b.endDate}` : ''}
                              </span>
                              {b.slotStartTime && (
                                <span className="font-mono-tabular text-[#16865C] font-semibold">
                                  ({b.slotStartTime})
                                </span>
                              )}
                            </div>
                            <div className="text-[#64748B]">Reason: {b.reason}</div>
                            {b.status === 'Pending Approval' && (
                              <div className="text-[11px] text-[#C87A14] font-medium">
                                Awaiting Admin approval — slots remain open until approved by Administrator.
                              </div>
                            )}
                            {b.status === 'Rejected' && b.rejectionReason && (
                              <div className="text-[11px] text-[#D63649] font-medium">
                                Declined by Admin: {b.rejectionReason}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusIndicator status={b.status} />
                            {b.status === 'Pending Approval' && (
                              <NeuButton
                                size="sm"
                                variant="danger"
                                onClick={() => handleCancelPendingBlock(b.id)}
                              >
                                Withdraw
                              </NeuButton>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </NeuCard>

              {/* BACK FACE (Flipped): Waiting for Approval with Loading Animation Circle */}
              <NeuCard
                className={`[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center p-8 space-y-5 border-2 border-[#C87A14]/45 ${
                  !isLeaveCardFlipped ? 'pointer-events-none select-none' : ''
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-[#C87A14]/20 border-t-[#C87A14] animate-spin" />
                  <CalendarClock className="w-7 h-7 text-[#C87A14] absolute" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#C87A14]/15 text-[#C87A14] text-[11px] font-extrabold uppercase tracking-wider">
                    2. Leave / Absence / Slot Block Request
                  </span>
                  <h3 className="text-lg font-extrabold text-[#172B4D]">
                    Waiting for Approval
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Your leave or slot block request has been submitted to the System Administrator and is currently awaiting review.
                  </p>
                </div>

                {latestPendingLeaveBlock && (
                  <div className="neu-inset rounded-2xl p-4 w-full max-w-md space-y-2 text-xs text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Request Type:</span>
                      <span className="font-bold text-[#172B4D]">
                        {latestPendingLeaveBlock.type === 'Blocked Date'
                          ? 'Full-Day Absent / Blocked Date'
                          : latestPendingLeaveBlock.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-black/5 pt-2">
                      <span className="text-[#64748B]">Target Date / Slot:</span>
                      <span className="font-mono-tabular font-bold text-[#3478F6]">
                        {latestPendingLeaveBlock.startDate}
                        {latestPendingLeaveBlock.endDate &&
                        latestPendingLeaveBlock.endDate !== latestPendingLeaveBlock.startDate
                          ? ` → ${latestPendingLeaveBlock.endDate}`
                          : ''}
                        {latestPendingLeaveBlock.slotStartTime
                          ? ` (${latestPendingLeaveBlock.slotStartTime})`
                          : ''}
                      </span>
                    </div>
                    <div className="border-t border-black/5 pt-2">
                      <span className="text-[#64748B] block">Submitted Reason:</span>
                      <span className="font-medium text-[#172B4D] mt-0.5 block">
                        {latestPendingLeaveBlock.reason}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  {latestPendingLeaveBlock && (
                    <NeuButton
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleCancelPendingBlock(latestPendingLeaveBlock.id)}
                    >
                      Withdraw Request
                    </NeuButton>
                  )}
                </div>
              </NeuCard>
            </div>
          </div>
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
              Alerts for new patient requests, reschedules, consultation overrun delay dispatch, and daily roster reminders.
            </p>
          </div>
          <NeuButton size="sm" onClick={onMarkAllNotificationsRead}>
            Mark All Read
          </NeuButton>
        </div>

        {delayNoticeToast && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] border border-[#16865C]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{delayNoticeToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setDelayNoticeToast('')}
              className="text-[11px] text-[#64748B] hover:text-[#172B4D] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Consultation Overrun / Queue Delay Notification Dispatcher */}
        {confirmedAppointments.length > 0 && onReportConsultationDelay && (
          <NeuCard className="space-y-3 border border-[#C68117]/30">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C68117]" />
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    Consultation Overrun / Queue Delay Notification Dispatcher
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    Sumobra sa oras ang check-up? Mag-send ng real-time Queue Delay Alert (+15m o +30m) sa susunod na pasyente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {confirmedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="neu-inset rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono-tabular font-bold text-[#3478F6]">
                        {apt.referenceNumber}
                      </span>
                      <span>·</span>
                      <span className="font-bold text-[#172B4D]">{apt.patientName}</span>
                    </div>
                    <div className="text-[11px] font-mono-tabular text-[#64748B] flex flex-wrap items-center gap-2">
                      <span>
                        {formatReadableDate(apt.date)} · {apt.timeLabel}
                      </span>
                      {apt.delayMinutes ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#C68117]/15 text-[#C68117] font-bold">
                          Delayed +{apt.delayMinutes}m · Est. Start: {apt.estimatedStartTime}
                        </span>
                      ) : null}
                      {apt.patientDelayDecision === 'waiting' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#16865C]/15 text-[#16865C] font-bold">
                          ✓ Patient Waiting in Queue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-[#C68117] flex items-center gap-1 mr-0.5">
                      <Clock className="w-3 h-3" />
                      Send Delay:
                    </span>
                    {[15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          const res = onReportConsultationDelay(apt.id, mins);
                          setDelayNoticeToast(
                            `Nagpadala ng +${mins} mins Queue Delay notification sa: ${res.affectedNames.join(', ')}`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#C68117]/15 hover:bg-[#C68117] text-[#C68117] hover:text-white text-[11px] font-extrabold transition-colors cursor-pointer"
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </NeuCard>
        )}

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
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#172B4D]">
              Confirmed & Upcoming Consultations ({doctorAppointments.length})
            </h2>
          </div>

          {delayNoticeToast && (
            <div className="neu-raised rounded-xl p-3 text-xs font-semibold text-[#16865C] border border-[#16865C]/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{delayNoticeToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setDelayNoticeToast('')}
                className="text-[11px] text-[#64748B] hover:text-[#172B4D] cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5">
            {doctorAppointments.map((apt) => {
              const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Rescheduled';
              return (
                <NeuCard
                  key={apt.id}
                  className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4"
                >
                  <div className="space-y-1 pr-2">
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
                    <div className="text-xs font-mono-tabular text-[#64748B] flex flex-wrap items-center gap-2">
                      <span>
                        {formatReadableDate(apt.date)} · {apt.timeLabel}
                      </span>
                      {apt.delayMinutes ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#C68117]/15 text-[#C68117] font-bold">
                          Delayed +{apt.delayMinutes}m · Est. Start: {apt.estimatedStartTime}
                        </span>
                      ) : null}
                      {apt.patientDelayDecision === 'waiting' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#16865C]/15 text-[#16865C] font-bold">
                          ✓ Patient Waiting in Queue
                        </span>
                      )}
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

                  <div className="flex flex-col items-end justify-center gap-2 shrink-0">
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
                  </div>
                </NeuCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
