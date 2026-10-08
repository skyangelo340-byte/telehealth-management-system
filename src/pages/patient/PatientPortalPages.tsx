import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  User,
  FileHeart,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  CalendarClock,
  MessageSquareHeart,
  Send,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Video,
  Copy,
  ExternalLink,
  Pill,
  Printer,
  Download,
  MoreVertical,
  Image as ImageIcon,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Loader2,
  Code2,
  Activity,
} from 'lucide-react';
import { PrescriptionPdfModal } from '../../components/ui/PrescriptionPdfModal';
import {
  analyzeSymptomConversation,
  GOOGLE_COLAB_NOTEBOOK_PYTHON,
} from '../../services/symptomTriageService';
import {
  buildResetaPdfDocument,
  triggerPdfPrint,
  downloadResetaAsImage,
  triggerDomPrintReseta,
} from '../../utils/prescriptionPdf';
import {
  PatientProfile,
  Appointment,
  NotificationItem,
  AssessmentSummary,
  AssessmentMessage,
  ScreenId,
} from '../../types';
import {
  DEMO_TODAY,
  calculateAgeFromDob,
  formatReadableDate,
} from '../../services/mockData';
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSelect,
  NeuTextarea,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';

interface PatientPortalPagesProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  patientProfile: PatientProfile;
  onUpdateProfile: (updated: PatientProfile) => void;
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  onSelectAppointment: (apt: Appointment) => void;
  onOpenCancelModal: (apt: Appointment) => void;
  onOpenRescheduleModal: (apt: Appointment) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  assessments: AssessmentSummary[];
  onAddAssessmentSummary: (summary: AssessmentSummary) => void;
  onAcknowledgeDelayWait?: (aptId: string) => void;
}

export const PatientPortalPages: React.FC<PatientPortalPagesProps> = ({
  currentScreen,
  onNavigate,
  patientProfile,
  onUpdateProfile,
  appointments,
  selectedAppointment,
  onSelectAppointment,
  onOpenCancelModal,
  onOpenRescheduleModal,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  assessments,
  onAddAssessmentSummary,
  onAcknowledgeDelayWait,
}) => {
  // Filter appointments for this patient
  const myAppointments = useMemo(
    () => appointments.filter((a) => a.patientId === patientProfile.id),
    [appointments, patientProfile.id]
  );

  const upcomingAppointments = useMemo(
    () =>
      myAppointments
        .filter(
          (a) =>
            a.date >= DEMO_TODAY &&
            a.status !== 'Cancelled' &&
            a.status !== 'Rejected' &&
            a.status !== 'Completed'
        )
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    [myAppointments]
  );

  const nextAppointment = upcomingAppointments[0] || null;

  const myNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.recipientRole === 'patient' &&
          (n.recipientId === patientProfile.id || n.recipientId === patientProfile.userId)
      ),
    [notifications, patientProfile.id, patientProfile.userId]
  );

  // My Appointments filter state
  const [aptSearch, setAptSearch] = useState('');
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('ALL');

  // Profile form state
  const [profileForm, setProfileForm] = useState<PatientProfile>(patientProfile);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [rxPdfModalOpen, setRxPdfModalOpen] = useState(false);
  const [rxActionMenuOpen, setRxActionMenuOpen] = useState(false);
  const [rxHeaderMenuOpen, setRxHeaderMenuOpen] = useState(false);
  const [patientRxFilter, setPatientRxFilter] = useState<'ALL' | 'ISSUED' | 'PENDING'>('ALL');

  // Optional TeleHealth Assessment conversational state
  const [chatMessages, setChatMessages] = useState<AssessmentMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Maligayang pagdating sa TeleHealth Pre-Consultation Symptom Assessment. Ibahagi ang iyong nararamdamang sintomas, ilang araw na ito, at gaano kalala. Tandaan: Mga tanong na may kinalaman sa kalusugan at panggagamot lamang ang sinasagot ng AI Assistant na ito.',
      timestamp: 'Just now',
      followUpOptions: [
        'Masakit ang ulo sa umaga at 150/95 ang BP ko',
        'May makating pantal / rash sa braso nang 3 araw',
        'Nangingilo at sumasakit ang bagang kapag umiinom ng malamig',
        'May lagnat at ubo na 2 araw na',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzingChat, setIsAnalyzingChat] = useState(false);
  const [shareAssessmentWithDoc, setShareAssessmentWithDoc] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profileForm,
      updatedAt: new Date().toISOString(),
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3500);
  };

  // SCREEN 12B: PATIENT PRESCRIPTIONS (RESETA / E-RX)
  if (currentScreen === 'patient-receipts') {
    const activeRxApt =
      (selectedAppointment && selectedAppointment.patientId === patientProfile.id
        ? selectedAppointment
        : null) || myAppointments[0] || null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Medical Prescriptions (Reseta / e-Rx)
            </h1>
            <p className="text-xs text-[#64748B]">
              Official physician-issued medical prescriptions, dosage instructions, and clinical treatment orders.
            </p>
          </div>
        </div>

        <PrescriptionPdfModal
          open={rxPdfModalOpen}
          onClose={() => setRxPdfModalOpen(false)}
          appointment={activeRxApt}
        />

        {myAppointments.length === 0 ? (
          <NeuCard className="text-center py-12 space-y-3">
            <Pill className="w-8 h-8 text-[#64748B] mx-auto" />
            <div className="text-base font-bold text-[#172B4D]">No Medical Prescriptions Yet</div>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Your attending physician’s digital reseta (e-Rx) and medication instructions will appear here after your consultation.
            </p>
            <NeuButton variant="primary" onClick={() => onNavigate('book-appointment')}>
              Book an Appointment
            </NeuButton>
          </NeuCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (CSS Selector 1): Patient Prescription Filter & Selector List */}
            <div className="lg:col-span-4 space-y-3">
              <NeuCard size="sm" className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#172B4D]">My Prescriptions (e-Rx)</span>
                  <span className="font-mono-tabular font-semibold text-[#3478F6]">
                    {myAppointments.length} Total
                  </span>
                </div>
                <div className="neu-inset p-1 rounded-xl grid grid-cols-3 gap-1 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPatientRxFilter('ALL')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      patientRxFilter === 'ALL'
                        ? 'bg-[#3478F6] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientRxFilter('ISSUED')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      patientRxFilter === 'ISSUED'
                        ? 'bg-[#16865C] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    Issued ℞
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientRxFilter('PENDING')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      patientRxFilter === 'PENDING'
                        ? 'bg-[#C68117] text-white'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    Awaiting
                  </button>
                </div>
              </NeuCard>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1.5">
                {myAppointments
                  .filter((apt) => {
                    const hasRx = Boolean(apt.consultationSummary && apt.consultationSummary.trim());
                    if (patientRxFilter === 'ISSUED') return hasRx;
                    if (patientRxFilter === 'PENDING') return !hasRx;
                    return true;
                  })
                  .map((apt) => {
                    const isSelected = activeRxApt?.id === apt.id;
                    const hasRx = Boolean(apt.consultationSummary && apt.consultationSummary.trim());
                    return (
                      <NeuCard
                        key={apt.id}
                        size="sm"
                        onClick={() => onSelectAppointment(apt)}
                        className={`cursor-pointer transition-all space-y-1.5 ${
                          isSelected
                            ? 'border-2 border-[#3478F6] bg-white/45'
                            : 'hover:bg-white/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono-tabular font-bold text-[#3478F6]">
                            RX-{apt.referenceNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              hasRx
                                ? 'bg-[#16865C]/15 text-[#16865C]'
                                : 'bg-[#C68117]/15 text-[#C68117]'
                            }`}
                          >
                            {hasRx ? '✓ Ready to Print' : '• Awaiting Doctor'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#172B4D]">{apt.doctorName}</div>
                        <div className="text-xs text-[#64748B]">{apt.departmentName}</div>
                        <div className="text-xs font-mono-tabular text-[#16865C] font-semibold">
                          {formatReadableDate(apt.date)} · {apt.timeLabel}
                        </div>
                      </NeuCard>
                    );
                  })}
              </div>
            </div>

            {/* RIGHT COLUMN (CSS Selector 2): Designed Clinical Reseta Document Sheet */}
            <div className="lg:col-span-8">
              {activeRxApt && (
                <NeuCard size="lg" className="space-y-5 border border-[#3478F6]/20">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl neu-btn-primary flex items-center justify-center text-2xl font-serif font-extrabold italic shrink-0">
                        ℞
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#3478F6]">
                          TeleHealth Medical Center · Official Medical Prescription (Reseta)
                        </div>
                        <h2 className="text-xl font-extrabold text-[#172B4D] font-mono-tabular mt-0.5">
                          RX-{activeRxApt.referenceNumber}
                        </h2>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Consultation Date: {formatReadableDate(activeRxApt.date)} ({activeRxApt.timeLabel})
                        </p>
                      </div>
                    </div>
                    <StatusIndicator status={activeRxApt.status} />
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Patient Information
                        </div>
                        <div className="text-sm font-extrabold text-[#172B4D]">
                          {activeRxApt.patientName}
                        </div>
                        <div className="text-[#64748B] font-mono-tabular">
                          DOB: {activeRxApt.patientDob} · Sex: {activeRxApt.patientSex}
                        </div>
                        <div className="text-[#C63D4D] font-bold">
                          Allergies: {activeRxApt.knownAllergiesSnapshot || 'None reported'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Prescribing Physician
                        </div>
                        <div className="text-sm font-extrabold text-[#172B4D]">
                          {activeRxApt.doctorName}
                        </div>
                        <div className="text-[#3478F6] font-semibold">
                          {activeRxApt.departmentName} · {activeRxApt.appointmentTypeName}
                        </div>
                        <div className="text-[#64748B] font-mono-tabular">
                          Consultation: {formatReadableDate(activeRxApt.date)} ({activeRxApt.timeLabel})
                        </div>
                      </div>
                    </div>

                    <div className="neu-inset rounded-2xl p-5 border border-[#3478F6]/25 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                        <span className="font-extrabold text-[#172B4D] flex items-center gap-2">
                          <span className="text-2xl font-serif italic text-[#3478F6]">℞</span>
                          <span>PRESCRIBED MEDICATIONS &amp; SIG. INSTRUCTIONS (RESETA)</span>
                        </span>
                        <span className="font-mono-tabular text-[11px] text-[#16865C] font-bold">
                          {activeRxApt.consultationSummary ? 'Verified Physician e-Rx' : 'Awaiting Doctor Issuance'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase text-[#3478F6]">
                            1. Active Medication Regimen on File:
                          </div>
                          <div className="text-sm font-bold text-[#172B4D] mt-1">
                            {activeRxApt.currentMedicationsSnapshot ||
                              'As directed by attending physician during consultation.'}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-black/5">
                          <div className="text-[11px] font-bold uppercase text-[#3478F6]">
                            2. Physician Prescription Orders &amp; Dosage Schedule (Sig.):
                          </div>
                          <div className="text-xs font-mono-tabular text-[#172B4D] mt-1.5 leading-relaxed whitespace-pre-line neu-raised-sm rounded-xl p-3.5">
                            {activeRxApt.consultationSummary ||
                              'Your attending physician has not finalized the post-consultation Reseta yet. Once the consultation is marked Completed, your full medication and dosage instructions will appear here.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
                                  downloadResetaAsImage({ appointment: activeRxApt });
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

  // SCREEN 12: MY APPOINTMENTS
  if (currentScreen === 'my-appointments') {
    const filteredList = myAppointments.filter((apt) => {
      const matchesStatus = aptStatusFilter === 'ALL' || apt.status === aptStatusFilter;
      const q = aptSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        apt.doctorName.toLowerCase().includes(q) ||
        apt.departmentName.toLowerCase().includes(q) ||
        apt.referenceNumber.toLowerCase().includes(q) ||
        apt.appointmentTypeName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">My Appointments</h1>
            <p className="text-xs text-[#64748B]">
              Review upcoming consultations, past clinical visits, and permitted status actions.
            </p>
          </div>
          <NeuButton
            variant="primary"
            onClick={() => onNavigate('book-appointment')}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Book New Appointment
          </NeuButton>
        </div>

        {/* Search & Status Filter Bar */}
        <NeuCard className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search by reference (TH-2026-...), doctor, or department..."
              value={aptSearch}
              onChange={(e) => setAptSearch(e.target.value)}
              aria-label="Search my appointments"
              className="neu-inset w-full rounded-xl pl-10 pr-4 py-2 text-sm text-[#172B4D]"
            />
          </div>

          <div className="neu-inset p-1 rounded-xl flex flex-wrap items-center gap-1">
            {['ALL', 'Confirmed', 'Pending', 'Reschedule Requested', 'Completed', 'Cancelled'].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAptStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    aptStatusFilter === st
                      ? 'bg-[#3478F6] text-white'
                      : 'text-[#64748B] hover:text-[#172B4D]'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st}
                </button>
              )
            )}
          </div>
        </NeuCard>

        {filteredList.length === 0 ? (
          <NeuCard className="text-center py-12 space-y-3">
            <Calendar className="w-8 h-8 text-[#64748B] mx-auto" />
            <div className="text-base font-bold text-[#172B4D]">No Matching Appointments Found</div>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              You don’t have any appointments matching the current filters. Reset filters or schedule a new 1-hour consultation.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <NeuButton
                onClick={() => {
                  setAptSearch('');
                  setAptStatusFilter('ALL');
                }}
              >
                Reset Filters
              </NeuButton>
              <NeuButton variant="primary" onClick={() => onNavigate('book-appointment')}>
                Book an Appointment
              </NeuButton>
            </div>
          </NeuCard>
        ) : (
          <div className="space-y-4">
            {filteredList.map((apt) => {
              const canModify =
                apt.status === 'Pending' ||
                apt.status === 'Confirmed' ||
                apt.status === 'Rescheduled';

              return (
                <NeuCard key={apt.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <span className="font-mono-tabular font-bold text-[#3478F6]">
                        {apt.referenceNumber}
                      </span>
                      <span>·</span>
                      <span>{apt.departmentName}</span>
                      <span>·</span>
                      <span>{apt.appointmentTypeName}</span>
                      <span>·</span>
                      <span className="text-[#3478F6] font-semibold">
                        {apt.consultationMode || 'Online Appointment'}
                      </span>
                      <span>·</span>
                      <StatusIndicator status={apt.status} />
                    </div>

                    <div className="text-base font-bold text-[#172B4D]">
                      {apt.doctorName}
                    </div>

                    <div className="text-xs text-[#64748B] font-mono-tabular flex flex-wrap items-center gap-2">
                      <span>
                        {formatReadableDate(apt.date)} · {apt.timeLabel}
                      </span>
                      {apt.delayMinutes ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#C68117]/15 text-[#C68117] font-bold">
                          ⏳ Queue Delay +{apt.delayMinutes}m · Est. Start: {apt.estimatedStartTime}
                        </span>
                      ) : null}
                      {apt.patientDelayDecision === 'waiting' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#16865C]/15 text-[#16865C] font-bold">
                          ✓ Priority Queue Confirmed
                        </span>
                      )}
                    </div>

                    {apt.delayMinutes ? (
                      <div className="p-3 rounded-xl bg-[#C68117]/10 border border-[#C68117]/30 space-y-2 text-xs mt-1">
                        <div className="font-bold text-[#9A5B08] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Paumanhin: Lumagpas sa oras ang naunang pasyente (+{apt.delayMinutes} mins). Bagong Estimated Start Time: {apt.estimatedStartTime}
                          </span>
                        </div>
                        {apt.delayReason && (
                          <p className="text-[11px] text-[#475569]">{apt.delayReason}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {apt.patientDelayDecision === 'waiting' ? (
                            <span className="text-[11px] font-bold text-[#16865C]">
                              ✓ Naka-confirm na maghihintay ka sa Priority Queue ({apt.estimatedStartTime})
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAcknowledgeDelayWait?.(apt.id)}
                              className="px-3 py-1 rounded-lg bg-[#16865C] text-white text-[11px] font-bold hover:opacity-90 cursor-pointer"
                            >
                              Stay in Priority Queue (Wait until {apt.estimatedStartTime})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenRescheduleModal(apt)}
                            className="px-3 py-1 rounded-lg bg-white text-[#3478F6] border border-[#3478F6]/30 text-[11px] font-bold hover:bg-[#3478F6]/10 cursor-pointer"
                          >
                            Free Priority Reschedule
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <p className="text-xs text-[#64748B] line-clamp-1">
                      Reason: <span className="text-[#172B4D]">{apt.reasonForVisit}</span>
                    </p>

                    {apt.cancellationReason && (
                      <p className="text-xs text-[#C63D4D] font-medium">
                        Cancelled Reason: {apt.cancellationReason}
                      </p>
                    )}

                    {apt.rejectionReason && (
                      <p className="text-xs text-[#C63D4D] font-medium">
                        Rejected Reason: {apt.rejectionReason}
                      </p>
                    )}

                    {apt.rescheduleReason && (
                      <p className="text-xs text-[#C68117] font-medium">
                        Reschedule Reason: {apt.rescheduleReason}
                      </p>
                    )}

                    {(apt.consultationMode || 'Online Appointment') === 'Online Appointment' &&
                      apt.googleMeetLink &&
                      (apt.status === 'Confirmed' || apt.status === 'Rescheduled') && (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                          <Video className="w-3.5 h-3.5 text-[#16865C]" />
                          <span className="font-semibold text-[#16865C]">Google Meet Ready:</span>
                          <a
                            href={apt.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono-tabular font-bold text-[#3478F6] hover:underline inline-flex items-center gap-1"
                          >
                            {apt.googleMeetLink}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {(apt.consultationMode || 'Online Appointment') === 'Online Appointment' &&
                      apt.googleMeetLink &&
                      (apt.status === 'Confirmed' || apt.status === 'Rescheduled') && (
                        <a
                          href={apt.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-btn-primary rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Google Meet
                        </a>
                      )}
                    <NeuButton
                      size="sm"
                      onClick={() => {
                        onSelectAppointment(apt);
                        onNavigate('patient-appointment-details');
                      }}
                    >
                      View Details
                    </NeuButton>
                    {canModify && (
                      <>
                        <NeuButton
                          size="sm"
                          onClick={() => onOpenRescheduleModal(apt)}
                          icon={<CalendarClock className="w-3.5 h-3.5 text-[#3478F6]" />}
                        >
                          Reschedule
                        </NeuButton>
                        <NeuButton
                          size="sm"
                          variant="danger"
                          onClick={() => onOpenCancelModal(apt)}
                        >
                          Cancel
                        </NeuButton>
                      </>
                    )}
                  </div>
                </NeuCard>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // SCREEN 13 & 14: APPOINTMENT DETAILS / RESCHEDULE VIEW
  if (currentScreen === 'patient-appointment-details' || currentScreen === 'reschedule-appointment') {
    const apt = selectedAppointment || myAppointments[0];
    if (!apt) {
      return (
        <NeuCard className="text-center py-10 space-y-3">
          <div className="text-sm font-bold">No Appointment Selected</div>
          <NeuButton onClick={() => onNavigate('my-appointments')}>Back to My Appointments</NeuButton>
        </NeuCard>
      );
    }

    const canModify =
      apt.status === 'Pending' || apt.status === 'Confirmed' || apt.status === 'Rescheduled';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono-tabular font-semibold text-[#3478F6]">
              Reference · {apt.referenceNumber}
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Appointment Record Details</h1>
          </div>
          <NeuButton onClick={() => onNavigate('my-appointments')}>← Back to My Appointments</NeuButton>
        </div>

        <NeuCard size="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/5">
            <div>
              <div className="text-xs text-[#64748B]">Attending Physician & Department</div>
              <div className="text-lg font-bold text-[#172B4D]">{apt.doctorName}</div>
              <div className="text-xs text-[#3478F6] font-semibold">{apt.departmentName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#64748B] mb-1">Current Workflow Status</div>
              <StatusIndicator status={apt.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">Appointment Date</div>
              <div className="text-sm font-bold text-[#172B4D] mt-0.5">
                {formatReadableDate(apt.date)}
              </div>
            </div>
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">1-Hour Time Slot</div>
              <div className="text-sm font-bold font-mono-tabular text-[#16865C] mt-0.5">
                {apt.timeLabel}
              </div>
              {apt.delayMinutes ? (
                <div className="text-[11px] font-bold text-[#C68117] mt-0.5">
                  Est. Start: {apt.estimatedStartTime} (+{apt.delayMinutes}m)
                </div>
              ) : null}
            </div>
            <div className="neu-inset rounded-xl p-3.5">
              <div className="text-[#64748B]">Consultation Type</div>
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

          {apt.delayMinutes ? (
            <div className="neu-inset rounded-2xl p-4 space-y-2.5 border border-[#C68117]/40 bg-[#C68117]/5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#9A5B08] font-extrabold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Consultation Queue Delay Notice (+{apt.delayMinutes} mins) — Bagong Estimated Start: {apt.estimatedStartTime}
                  </span>
                </div>
                {apt.patientDelayDecision === 'waiting' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#16865C]/15 text-[#16865C] font-bold text-[11px]">
                    ✓ Waiting in Priority Queue
                  </span>
                )}
              </div>
              <p className="text-[#475569]">
                {apt.delayReason ||
                  `Ang naunang pasyente ni ${apt.doctorName} ay lumagpas sa oras. Maaari kang manatili sa Priority Queue o mag-Free Reschedule.`}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {apt.patientDelayDecision !== 'waiting' && (
                  <NeuButton
                    size="sm"
                    variant="primary"
                    onClick={() => onAcknowledgeDelayWait?.(apt.id)}
                  >
                    Stay in Priority Queue (Wait until {apt.estimatedStartTime})
                  </NeuButton>
                )}
                <NeuButton size="sm" onClick={() => onOpenRescheduleModal(apt)}>
                  Free Priority Reschedule
                </NeuButton>
              </div>
            </div>
          ) : null}

          {/* Online Appointment — Google Meet Link Box */}
          {(apt.consultationMode || 'Online Appointment') === 'Online Appointment' && (
            <div className="neu-inset rounded-2xl p-4 space-y-2.5 border border-[#3478F6]/25 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#3478F6]" />
                  <span className="font-bold text-[#172B4D]">
                    Online Consultation — Google Meet Link
                  </span>
                </div>
                {apt.googleMeetLink &&
                (apt.status === 'Confirmed' || apt.status === 'Rescheduled') ? (
                  <span className="text-[11px] font-mono-tabular font-semibold text-[#16865C]">
                    Ready to Join
                  </span>
                ) : (
                  <span className="text-[11px] font-mono-tabular text-[#C68117] font-semibold">
                    Awaiting Physician Confirmation
                  </span>
                )}
              </div>

              {apt.googleMeetLink &&
              (apt.status === 'Confirmed' || apt.status === 'Rescheduled') ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <div className="text-[#64748B]">Meeting Room URL:</div>
                    <a
                      href={apt.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono-tabular font-bold text-[#3478F6] hover:underline break-all"
                    >
                      {apt.googleMeetLink}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <NeuButton
                      size="sm"
                      icon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => navigator.clipboard?.writeText(apt.googleMeetLink || '')}
                    >
                      Copy Link
                    </NeuButton>
                    <a
                      href={apt.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-btn-primary rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Google Meet
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-[#64748B]">
                  Your Google Meet consultation link will automatically appear here and be sent to your notifications once {apt.doctorName} confirms your appointment request.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-[#172B4D] mb-1">Reason for Visit / Chief Complaint</div>
              <div className="neu-inset rounded-xl p-3.5 text-[#172B4D]">{apt.reasonForVisit}</div>
            </div>

            {apt.consultationSummary && (
              <div>
                <div className="font-semibold text-[#16865C] mb-1">
                  Authorized Post-Consultation Summary
                </div>
                <div className="neu-inset rounded-xl p-3.5 text-[#172B4D]">
                  {apt.consultationSummary}
                </div>
              </div>
            )}

            {apt.rejectionReason && (
              <div>
                <div className="font-semibold text-[#C63D4D] mb-1">Rejection Reason</div>
                <div className="neu-inset rounded-xl p-3.5 text-[#C63D4D]">{apt.rejectionReason}</div>
              </div>
            )}

            {apt.cancellationReason && (
              <div>
                <div className="font-semibold text-[#C63D4D] mb-1">Cancellation Reason</div>
                <div className="neu-inset rounded-xl p-3.5 text-[#C63D4D]">
                  {apt.cancellationReason}
                </div>
              </div>
            )}

            {apt.rescheduleReason && (
              <div>
                <div className="font-semibold text-[#C68117] mb-1">Reschedule Reason</div>
                <div className="neu-inset rounded-xl p-3.5 text-[#172B4D] border border-[#C68117]/30">
                  {apt.rescheduleReason}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/5 text-xs text-[#64748B]">
            <div className="font-mono-tabular">
              Created: {new Date(apt.createdAt).toLocaleDateString()} · Updated:{' '}
              {new Date(apt.updatedAt).toLocaleDateString()}
            </div>
            {canModify && (
              <div className="flex items-center gap-2.5">
                <NeuButton
                  size="sm"
                  onClick={() => onOpenRescheduleModal(apt)}
                  icon={<CalendarClock className="w-3.5 h-3.5 text-[#3478F6]" />}
                >
                  Reschedule Slot
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="danger"
                  onClick={() => onOpenCancelModal(apt)}
                >
                  Cancel Appointment
                </NeuButton>
              </div>
            )}
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 15 & 16: PATIENT PROFILE & MEDICAL INFORMATION
  if (currentScreen === 'patient-profile' || currentScreen === 'medical-information') {
    const age = calculateAgeFromDob(profileForm.dateOfBirth);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Patient Profile &amp; Medical Information
            </h1>
            <p className="text-xs text-[#64748B]">
              Protected by server-side authorization. Changes saved here automatically prefill future appointment bookings.
            </p>
          </div>
        </div>

        {profileSavedToast && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Patient profile and medical intake updated in demonstration service.</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <NeuCard className="space-y-4">
            <h2 className="text-base font-bold text-[#172B4D] pb-2 border-b border-black/5">
              1. Personal & Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuInput
                label="Full Name"
                required
                placeholder="e.g., Juan Dela Cruz"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuInput
                label="Date of Birth"
                type="date"
                required
                max={DEMO_TODAY}
                placeholder="e.g., 1995-08-14"
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
                rightElement={
                  age !== null ? (
                    <span className="text-xs font-mono-tabular text-[#3478F6] font-semibold">
                      Age: {age} yrs
                    </span>
                  ) : null
                }
              />
              <NeuSelect
                label="Sex"
                placeholder="e.g., Select Sex (Female / Male)"
                value={profileForm.sex || ''}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, sex: e.target.value as PatientProfile['sex'] }))
                }
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
                options={[
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Intersex / Other', label: 'Intersex / Other' },
                  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
                ]}
              />
              <NeuInput
                label="Contact Number"
                required
                placeholder="e.g., +63 917 123 4567"
                value={profileForm.contactNumber}
                onChange={(e) => setProfileForm((p) => ({ ...p, contactNumber: e.target.value }))}
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuInput
                label="Verified Email Address"
                type="email"
                required
                placeholder="e.g., juan.delacruz@email.com"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuInput
                label="Emergency Contact Name & Phone"
                placeholder="e.g., Maria Dela Cruz — +63 918 765 4321"
                value={profileForm.emergencyContactName || ''}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, emergencyContactName: e.target.value }))
                }
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
            </div>
          </NeuCard>

          <NeuCard className="space-y-4">
            <h2 className="text-base font-bold text-[#172B4D] pb-2 border-b border-black/5">
              2. Allergies, Medications & Medical Conditions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuTextarea
                label="Known Allergies"
                rows={2}
                placeholder="e.g., Penicillin, Ibuprofen, Shellfish (or type 'None' if no known allergies)"
                value={profileForm.knownAllergies}
                onChange={(e) => setProfileForm((p) => ({ ...p, knownAllergies: e.target.value }))}
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuTextarea
                label="Current Medications"
                rows={2}
                placeholder="e.g., Amlodipine 5mg once daily, Metformin 500mg twice daily (or 'None')"
                value={profileForm.currentMedications}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, currentMedications: e.target.value }))
                }
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuTextarea
                label="Existing Medical Conditions"
                rows={2}
                placeholder="e.g., Mild Hypertension, Type 2 Diabetes, Bronchial Asthma (or 'None')"
                value={profileForm.existingMedicalConditions}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, existingMedicalConditions: e.target.value }))
                }
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
              <NeuTextarea
                label="Previous Medical History"
                rows={2}
                placeholder="e.g., Appendectomy (2019), Annual physical exam normal (2025)"
                value={profileForm.previousMedicalHistory || ''}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, previousMedicalHistory: e.target.value }))
                }
                className="!shadow-none focus:!shadow-none !bg-white/80 !border !border-slate-300/80 focus:!border-[#3478F6]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <NeuButton type="submit" variant="primary">
                Save Profile & Medical Information
              </NeuButton>
            </div>
          </NeuCard>
        </form>
      </div>
    );
  }

  // SCREEN 17: PATIENT NOTIFICATION CENTER
  if (currentScreen === 'patient-notifications') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Notification Center</h1>
            <p className="text-xs text-[#64748B]">
              In-app appointment updates, confirmations, and schedule reminders.
            </p>
          </div>
          <NeuButton size="sm" onClick={onMarkAllNotificationsRead}>
            Mark All as Read
          </NeuButton>
        </div>

        <div className="space-y-3">
          {myNotifications.map((n) => {
            const targetApt = n.appointmentId
              ? appointments.find((a) => a.id === n.appointmentId)
              : undefined;
            const isDelayNotif =
              n.type === 'Consultation Queue Delay' || Boolean(targetApt?.delayMinutes);

            return (
              <NeuCard
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !n.read ? 'border-l-4 border-l-[#3478F6]' : 'opacity-80'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="font-semibold text-[#3478F6]">{n.type}</span>
                    <span>·</span>
                    <span className="font-mono-tabular">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {!n.read && (
                      <span className="text-[#16865C] font-bold">· Unread</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-[#172B4D]">{n.title}</div>
                  <p className="text-xs text-[#64748B]">{n.message}</p>

                  {isDelayNotif && targetApt && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {targetApt.patientDelayDecision === 'waiting' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#16865C]/15 text-[#16865C] text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed: Waiting in Priority Queue ({targetApt.estimatedStartTime})
                        </span>
                      ) : (
                        <NeuButton
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            onAcknowledgeDelayWait?.(targetApt.id);
                          }}
                        >
                          Stay in Priority Queue (Wait until {targetApt.estimatedStartTime})
                        </NeuButton>
                      )}
                      <NeuButton
                        size="sm"
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          onOpenRescheduleModal(targetApt);
                        }}
                      >
                        Free Priority Reschedule
                      </NeuButton>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.appointmentId && (
                    <NeuButton
                      size="sm"
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (targetApt) {
                          onSelectAppointment(targetApt);
                          onNavigate('patient-appointment-details');
                        }
                      }}
                    >
                      Open Appointment
                    </NeuButton>
                  )}
                  {!n.read && (
                    <NeuButton size="sm" onClick={() => onMarkNotificationRead(n.id)}>
                      Mark Read
                    </NeuButton>
                  )}
                </div>
              </NeuCard>
            );
          })}
        </div>
      </div>
    );
  }

  // OPTIONAL TELEHEALTH ASSESSMENT INTERFACE (SECTION 15)
  if (currentScreen === 'telehealth-assessment') {
    const handleSendMessage = async (textToSend: string) => {
      if (!textToSend.trim() || isAnalyzingChat) return;
      const trimmed = textToSend.trim();
      const userMsg: AssessmentMessage = {
        id: `m-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: 'Just now',
      };

      const updatedHistory = [...chatMessages, userMsg];
      setChatMessages(updatedHistory);
      setChatInput('');
      setIsAnalyzingChat(true);

      try {
        const result = await analyzeSymptomConversation({
          messages: updatedHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          latestUserMessage: trimmed,
        });

        const assistantMsg: AssessmentMessage = {
          id: `m-${Date.now() + 1}`,
          sender: 'assistant',
          text: result.replyText,
          timestamp: 'Just now',
          followUpOptions: result.followUpOptions,
          clinicalReport: {
            isMedicalTopic: result.isMedicalTopic,
            hasEnoughInfo: result.hasEnoughInfo,
            chiefSymptoms: result.chiefSymptoms,
            recommendedActions: result.recommendedActions,
            risksIfIgnored: result.risksIfIgnored,
            firstAidSteps: result.firstAidSteps,
            doctorRecommendationReason: result.doctorRecommendationReason,
            randomForest: result.randomForest,
          },
        };

        setChatMessages((prev) => [...prev, assistantMsg]);

        if (result.isMedicalTopic && result.hasEnoughInfo) {
          onAddAssessmentSummary({
            id: `asmt-${Date.now()}`,
            patientId: patientProfile.id,
            createdAt: new Date().toISOString(),
            chiefSymptoms:
              result.chiefSymptoms.length > 0 ? result.chiefSymptoms : [trimmed],
            duration: 'Reported today',
            severityLevel: result.randomForest.urgencyLevel,
            recommendedDepartment: result.randomForest.predictedDepartmentName,
            recommendedAppointmentType: 'General Consultation',
            summaryText: result.replyText,
            sharedWithDoctor: shareAssessmentWithDoc,
          });
        }
      } finally {
        setIsAnalyzingChat(false);
      }
    };

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#3478F6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant · Pre-Consultation Medical Guidance</span>
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              TeleHealth Pre-Visit Symptom Assessment
            </h1>
            <p className="text-xs text-[#64748B]">
              Provides recommended actions, risks if ignored, first-aid (paunang lunas), and specialist doctor matching.
            </p>
          </div>
          <NeuButton
            variant="primary"
            onClick={() => onNavigate('book-appointment')}
            icon={<Calendar className="w-4 h-4" />}
          >
            Book Appointment Now
          </NeuButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <NeuCard className="lg:col-span-8 flex flex-col justify-between min-h-[480px] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#3478F6]/15 text-[#1D4ED8] font-bold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assistant</span>
                </span>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'neu-btn-primary text-white ml-8'
                      : 'neu-inset text-[#172B4D] mr-4'
                  }`}
                >
                  <div className="font-bold mb-1.5 flex items-center justify-between gap-2">
                    <span>
                      {m.sender === 'user'
                        ? patientProfile.fullName
                        : 'AI Assistant'}{' '}
                      · <span className="font-normal opacity-75">{m.timestamp}</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium">{m.text}</p>

                  {m.clinicalReport && !m.clinicalReport.isMedicalTopic && (
                    <div className="mt-3 p-3 rounded-xl bg-[#C63D4D]/10 border border-[#C63D4D]/30 text-xs text-[#C63D4D] font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Paalala: Ang AI Assistant na ito ay para lamang sa mga medikal na sintomas, paunang lunas, at konsultasyon sa doktor.
                      </span>
                    </div>
                  )}

                  {m.clinicalReport &&
                    m.clinicalReport.isMedicalTopic &&
                    m.clinicalReport.hasEnoughInfo && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-black/10 text-xs">
                        {m.clinicalReport.recommendedActions.length > 0 && (
                          <div className="p-3 rounded-xl bg-[#3478F6]/10 border border-[#3478F6]/25 space-y-1">
                            <div className="font-extrabold text-[#1D4ED8] flex items-center gap-1.5 uppercase tracking-wide">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>1. Rekomendadong Dapat Gawin</span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A]">
                              {m.clinicalReport.recommendedActions.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {m.clinicalReport.risksIfIgnored.length > 0 && (
                          <div className="p-3 rounded-xl bg-[#C63D4D]/10 border border-[#C63D4D]/25 space-y-1">
                            <div className="font-extrabold text-[#C63D4D] flex items-center gap-1.5 uppercase tracking-wide">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>2. Mga Mangyayari Kapag Pinabayaan</span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A]">
                              {m.clinicalReport.risksIfIgnored.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {m.clinicalReport.firstAidSteps.length > 0 && (
                          <div className="p-3 rounded-xl bg-[#16865C]/10 border border-[#16865C]/25 space-y-1">
                            <div className="font-extrabold text-[#16865C] flex items-center gap-1.5 uppercase tracking-wide">
                              <HeartPulse className="w-4 h-4 shrink-0" />
                              <span>3. Paunang Lunas Habang Hindi Pa Nakakapagpa-Checkup</span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A]">
                              {m.clinicalReport.firstAidSteps.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="p-3.5 rounded-xl bg-white/80 border border-[#3478F6]/30 space-y-2.5">
                          <div className="font-extrabold text-[#172B4D] flex items-center gap-1.5 uppercase tracking-wide">
                            <Stethoscope className="w-4 h-4 text-[#3478F6]" />
                            <span>4. Inirerekomendang Doktor at Departamento</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <div className="text-sm font-extrabold text-[#172B4D]">
                                {m.clinicalReport.randomForest.recommendedDoctorName}
                              </div>
                              <div className="text-xs font-bold text-[#3478F6]">
                                {m.clinicalReport.randomForest.predictedDepartmentName} ·{' '}
                                {m.clinicalReport.randomForest.recommendedDoctorTitle}
                              </div>
                              {m.clinicalReport.doctorRecommendationReason && (
                                <p className="text-xs text-[#475569] mt-1">
                                  {m.clinicalReport.doctorRecommendationReason}
                                </p>
                              )}
                            </div>
                            <NeuButton
                              size="sm"
                              variant="primary"
                              onClick={() => onNavigate('book-appointment')}
                              icon={<Calendar className="w-3.5 h-3.5" />}
                            >
                              Book with {m.clinicalReport.randomForest.recommendedDoctorName}
                            </NeuButton>
                          </div>
                        </div>
                      </div>
                    )}

                  {m.followUpOptions && m.followUpOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.followUpOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={isAnalyzingChat}
                          onClick={() => handleSendMessage(opt)}
                          className="neu-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#3478F6] cursor-pointer disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzingChat && (
                <div className="p-3.5 rounded-2xl neu-inset text-xs font-semibold text-[#172B4D] mr-8 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3478F6] shrink-0" />
                  <span>Sinusuri ng AI Assistant ang iyong sintomas...</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(chatInput);
              }}
              className="flex items-center gap-2 pt-3 border-t border-black/5"
            >
              <input
                type="text"
                disabled={isAnalyzingChat}
                placeholder="I-type ang iyong nararamdamang sintomas, ilang araw na, o tanong..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Symptom description input"
                className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs text-[#172B4D]"
              />
              <NeuButton
                type="submit"
                variant="primary"
                size="sm"
                loading={isAnalyzingChat}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </NeuButton>
            </form>
          </NeuCard>

          <div className="lg:col-span-4 space-y-4">
            <NeuCard className="space-y-3">
              <h2 className="text-sm font-bold text-[#172B4D]">
                Privacy & Doctor Sharing Permission
              </h2>
              <label className="flex items-start gap-2.5 text-xs text-[#64748B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareAssessmentWithDoc}
                  onChange={(e) => setShareAssessmentWithDoc(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#3478F6]"
                />
                <span>
                  Authorize my attending doctor to view this symptom intake summary alongside my appointment booking.
                </span>
              </label>
            </NeuCard>

            {assessments.map((asmt) => (
              <NeuCard key={asmt.id} className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3478F6]">{asmt.recommendedDepartment}</span>
                  <span className="font-semibold text-[#16865C]">{asmt.severityLevel}</span>
                </div>
                <div className="font-bold text-[#172B4D]">
                  Symptoms: {asmt.chiefSymptoms.join(', ')}
                </div>
                <p className="text-[#64748B]">{asmt.summaryText}</p>
              </NeuCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT SCREEN 7: PATIENT DASHBOARD
  return (
    <div className="space-y-6">
      {/* Welcome & Unified Profile Completion Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1 max-w-2xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
              Welcome back, {patientProfile.fullName}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage your upcoming consultations, view physician availability, and keep your medical record current.
            </p>
          </div>

          {/* Unified Profile Completion Bar */}
          <div className="neu-inset rounded-xl px-3.5 py-2.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-[#172B4D]">
              Patient Profile Completion:
            </span>
            <div className="flex-1 min-w-[120px] max-w-[200px] neu-inset-sm h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#16865C] rounded-full"
                style={{ width: `${patientProfile.profileCompletionPercent}%` }}
              />
            </div>
            <span className="font-mono-tabular font-bold text-[#16865C]">
              {patientProfile.profileCompletionPercent}%
            </span>
            <span className="text-[#64748B] hidden sm:inline">· Allergies & Medications Verified ·</span>
            <button
              type="button"
              onClick={() => onNavigate('patient-profile')}
              className="text-[#3478F6] font-semibold hover:underline cursor-pointer ml-auto sm:ml-0"
            >
              Manage Personal Info →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <NeuButton
            variant="primary"
            size="lg"
            onClick={() => onNavigate('book-appointment')}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Quick Book Appointment
          </NeuButton>
        </div>
      </div>

      {/* Next Appointment Hero Card */}
      <div>
        <NeuCard size="lg" className="flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3478F6]" />
              <h2 className="text-base font-bold text-[#172B4D]">Your Next Appointment</h2>
            </div>
            {nextAppointment && <StatusIndicator status={nextAppointment.status} />}
          </div>

          {nextAppointment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#64748B]">Attending Physician</div>
                  <div className="text-lg font-bold text-[#172B4D]">
                    {nextAppointment.doctorName}
                  </div>
                  <div className="text-xs text-[#3478F6] font-semibold">
                    {nextAppointment.departmentName} · {nextAppointment.appointmentTypeName}
                  </div>
                </div>
                <div className="neu-inset rounded-xl p-3">
                  <div className="text-xs text-[#64748B]">Date & 1-Hour Slot</div>
                  <div className="text-sm font-bold text-[#172B4D]">
                    {formatReadableDate(nextAppointment.date)}
                  </div>
                  <div className="text-xs font-mono-tabular font-semibold text-[#16865C]">
                    {nextAppointment.timeLabel}
                  </div>
                  {nextAppointment.delayMinutes ? (
                    <div className="text-[11px] font-mono-tabular font-extrabold text-[#C68117] mt-0.5">
                      ⏳ Delayed +{nextAppointment.delayMinutes}m → Est. Start: {nextAppointment.estimatedStartTime}
                    </div>
                  ) : null}
                </div>
              </div>

              {nextAppointment.delayMinutes ? (
                <div className="neu-inset rounded-2xl p-4 border border-[#C68117]/40 bg-[#C68117]/10 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-extrabold text-[#9A5B08] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        Live Queue Alert: Ang naunang pasyente ni {nextAppointment.doctorName} ay lumagpas sa oras (+{nextAppointment.delayMinutes} mins)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#9A5B08] font-mono-tabular font-extrabold text-[11px]">
                      New Est. Start: {nextAppointment.estimatedStartTime}
                    </span>
                  </div>
                  <p className="text-[#475569]">
                    {nextAppointment.delayReason ||
                      `Ang iyong ${nextAppointment.timeLabel} appointment ay tinatayang magsisimula nang ${nextAppointment.estimatedStartTime}. Nasa Priority Queue ka pa rin.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {nextAppointment.patientDelayDecision === 'waiting' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-[#16865C]/15 text-[#16865C] font-bold text-xs inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmed: Naghihintay sa Priority Queue ({nextAppointment.estimatedStartTime})
                      </span>
                    ) : (
                      <NeuButton
                        size="sm"
                        variant="primary"
                        onClick={() => onAcknowledgeDelayWait?.(nextAppointment.id)}
                      >
                        Stay in Priority Queue (Wait until {nextAppointment.estimatedStartTime})
                      </NeuButton>
                    )}
                    <NeuButton
                      size="sm"
                      onClick={() => onOpenRescheduleModal(nextAppointment)}
                    >
                      Free Priority Reschedule
                    </NeuButton>
                  </div>
                </div>
              ) : null}

              <div className="text-xs text-[#64748B]">
                Reference: <strong className="font-mono-tabular text-[#172B4D]">{nextAppointment.referenceNumber}</strong> · Mode: <strong className="text-[#3478F6]">{nextAppointment.consultationMode || 'Online Appointment'}</strong> · Reason: {nextAppointment.reasonForVisit}
              </div>

              {nextAppointment.rescheduleReason && (
                <div className="text-xs text-[#C68117] font-semibold">
                  Reschedule Reason: {nextAppointment.rescheduleReason}
                </div>
              )}

              {(nextAppointment.consultationMode || 'Online Appointment') === 'Online Appointment' && (
                <div className="neu-inset rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Video className="w-4 h-4 text-[#3478F6] shrink-0" />
                    {nextAppointment.googleMeetLink &&
                    (nextAppointment.status === 'Confirmed' ||
                      nextAppointment.status === 'Rescheduled') ? (
                      <div className="truncate">
                        <span className="font-semibold text-[#172B4D]">Google Meet Link: </span>
                        <a
                          href={nextAppointment.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono-tabular font-bold text-[#3478F6] hover:underline"
                        >
                          {nextAppointment.googleMeetLink}
                        </a>
                      </div>
                    ) : (
                      <span className="text-[#64748B]">
                        Google Meet link will be sent once the physician confirms your slot.
                      </span>
                    )}
                  </div>
                  {nextAppointment.googleMeetLink &&
                    (nextAppointment.status === 'Confirmed' ||
                      nextAppointment.status === 'Rescheduled') && (
                      <a
                        href={nextAppointment.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn-primary rounded-xl px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Google Meet
                      </a>
                    )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-black/5">
                <NeuButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onSelectAppointment(nextAppointment);
                    onNavigate('patient-appointment-details');
                  }}
                >
                  View Details
                </NeuButton>
                <NeuButton
                  size="sm"
                  onClick={() => onOpenRescheduleModal(nextAppointment)}
                >
                  Reschedule
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="danger"
                  onClick={() => onOpenCancelModal(nextAppointment)}
                >
                  Cancel Appointment
                </NeuButton>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm font-semibold text-[#172B4D]">
                You have no upcoming appointments scheduled.
              </p>
              <NeuButton variant="primary" onClick={() => onNavigate('book-appointment')}>
                Schedule Your First Consultation
              </NeuButton>
            </div>
          )}
        </NeuCard>
      </div>

      {/* Bottom Row: Upcoming List & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">
              Upcoming & Recent Appointments ({myAppointments.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('my-appointments')}
              className="text-xs text-[#3478F6] font-semibold hover:underline cursor-pointer"
            >
              View Full History →
            </button>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1.5">
            {myAppointments.map((apt) => (
              <NeuCard key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="font-mono-tabular font-bold text-[#3478F6]">
                      {apt.referenceNumber}
                    </span>
                    <span>·</span>
                    <span>{apt.appointmentTypeName}</span>
                    <span>·</span>
                    <StatusIndicator status={apt.status} />
                  </div>
                  <div className="text-sm font-bold text-[#172B4D]">
                    {apt.doctorName} — <span className="font-normal text-[#64748B]">{apt.departmentName}</span>
                  </div>
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
                  onClick={() => {
                    onSelectAppointment(apt);
                    onNavigate('patient-appointment-details');
                  }}
                >
                  Details
                </NeuButton>
              </NeuCard>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">Recent Notifications</h2>
            <button
              type="button"
              onClick={() => onNavigate('patient-notifications')}
              className="text-xs text-[#3478F6] font-semibold hover:underline cursor-pointer"
            >
              Open Notification Center →
            </button>
          </div>

          <div className="space-y-3">
            {myNotifications.slice(0, 3).map((n) => (
              <NeuCard key={n.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold text-[#3478F6]">{n.type}</span>
                  {!n.read && <span className="text-[#16865C] font-bold">New</span>}
                </div>
                <div className="text-xs font-bold text-[#172B4D]">{n.title}</div>
                <p className="text-xs text-[#64748B] line-clamp-2">{n.message}</p>
              </NeuCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
