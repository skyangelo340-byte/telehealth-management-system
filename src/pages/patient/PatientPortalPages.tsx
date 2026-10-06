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
} from 'lucide-react';
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
    () => notifications.filter((n) => n.recipientRole === 'patient'),
    [notifications]
  );

  // My Appointments filter state
  const [aptSearch, setAptSearch] = useState('');
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('ALL');

  // Profile form state
  const [profileForm, setProfileForm] = useState<PatientProfile>(patientProfile);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Optional TeleHealth Assessment conversational state
  const [chatMessages, setChatMessages] = useState<AssessmentMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Welcome to the Optional TeleHealth Pre-Consultation Symptom Intake. Describe your current non-emergency symptoms or select a prompt below so we can help organize an intake summary for your physician.',
      timestamp: '08:30 AM',
      followUpOptions: [
        'Mild morning headache & blood pressure check',
        'Seasonal skin rash / eczema flare-up',
        'Lower molar sensitivity to cold drinks',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
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

                    <div className="text-xs text-[#64748B] font-mono-tabular">
                      {formatReadableDate(apt.date)} · {apt.timeLabel}
                    </div>

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
              {currentScreen === 'medical-information'
                ? 'Medical Information & Clinical History'
                : 'Patient Profile & Personal Information'}
            </h1>
            <p className="text-xs text-[#64748B]">
              Protected by server-side authorization. Changes saved here automatically prefill future appointment bookings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NeuButton
              size="sm"
              variant={currentScreen === 'patient-profile' ? 'primary' : 'default'}
              onClick={() => onNavigate('patient-profile')}
            >
              Personal & Contact
            </NeuButton>
            <NeuButton
              size="sm"
              variant={currentScreen === 'medical-information' ? 'primary' : 'default'}
              onClick={() => onNavigate('medical-information')}
            >
              Medical Information
            </NeuButton>
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
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
              />
              <NeuInput
                label="Date of Birth"
                type="date"
                required
                max={DEMO_TODAY}
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
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
                value={profileForm.sex}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, sex: e.target.value as PatientProfile['sex'] }))
                }
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
                value={profileForm.contactNumber}
                onChange={(e) => setProfileForm((p) => ({ ...p, contactNumber: e.target.value }))}
              />
              <NeuInput
                label="Verified Email Address"
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              />
              <NeuInput
                label="Emergency Contact Name & Phone"
                value={profileForm.emergencyContactName || ''}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, emergencyContactName: e.target.value }))
                }
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
                value={profileForm.knownAllergies}
                onChange={(e) => setProfileForm((p) => ({ ...p, knownAllergies: e.target.value }))}
              />
              <NeuTextarea
                label="Current Medications"
                rows={2}
                value={profileForm.currentMedications}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, currentMedications: e.target.value }))
                }
              />
              <NeuTextarea
                label="Existing Medical Conditions"
                rows={2}
                value={profileForm.existingMedicalConditions}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, existingMedicalConditions: e.target.value }))
                }
              />
              <NeuTextarea
                label="Previous Medical History"
                rows={2}
                value={profileForm.previousMedicalHistory || ''}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, previousMedicalHistory: e.target.value }))
                }
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
          {myNotifications.map((n) => (
            <NeuCard
              key={n.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.read ? 'border-l-4 border-l-[#3478F6]' : 'opacity-80'
              }`}
            >
              <div className="space-y-1">
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
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.appointmentId && (
                  <NeuButton
                    size="sm"
                    onClick={() => {
                      onMarkNotificationRead(n.id);
                      const targetApt = appointments.find((a) => a.id === n.appointmentId);
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
          ))}
        </div>
      </div>
    );
  }

  // OPTIONAL TELEHEALTH ASSESSMENT INTERFACE (SECTION 15)
  if (currentScreen === 'telehealth-assessment') {
    const handleSendMessage = (textToSend: string) => {
      if (!textToSend.trim()) return;
      const userMsg: AssessmentMessage = {
        id: `m-${Date.now()}`,
        sender: 'user',
        text: textToSend.trim(),
        timestamp: 'Just now',
      };

      const lower = textToSend.toLowerCase();
      let replyText =
        'Thank you for sharing those details. Based on your description, a non-urgent 60-minute General Consultation is appropriate. Would you like to generate a structured intake summary and proceed to Book Appointment?';
      let dept = 'Internal & General Medicine';
      let severity: AssessmentSummary['severityLevel'] = 'Routine';

      if (lower.includes('chest') || lower.includes('shortness of breath') || lower.includes('severe')) {
        replyText =
          'URGENT CARE GUIDANCE: Symptoms involving chest pressure or acute shortness of breath require immediate in-person emergency evaluation. Do not wait for a scheduled outpatient telehealth slot.';
        dept = 'Cardiology & Vascular Care';
        severity = 'Urgent Evaluation Advised';
      } else if (lower.includes('blood pressure') || lower.includes('headache')) {
        replyText =
          'Noted: Mild morning headache alongside home blood pressure tracking. We recommend scheduling a Follow-up Consultation with Cardiology & Vascular Care and bringing your 14-day BP log.';
        dept = 'Cardiology & Vascular Care';
        severity = 'Routine';
      }

      const assistantMsg: AssessmentMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: 'Just now',
      };

      setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
      setChatInput('');

      onAddAssessmentSummary({
        id: `asmt-${Date.now()}`,
        patientId: patientProfile.id,
        createdAt: new Date().toISOString(),
        chiefSymptoms: [textToSend.trim()],
        duration: 'Reported today',
        severityLevel: severity,
        recommendedDepartment: dept,
        recommendedAppointmentType: 'General Consultation',
        summaryText: replyText,
        sharedWithDoctor: shareAssessmentWithDoc,
      });
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#3478F6]">
              Optional Consultation Guidance · Non-Diagnostic Intake Assistant
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              TeleHealth Pre-Visit Symptom Assessment
            </h1>
            <p className="text-xs text-[#64748B]">
              This guidance tool helps organize your symptoms before booking. It is not a confirmed medical diagnosis.
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
          <NeuCard className="lg:col-span-7 flex flex-col justify-between min-h-[420px] space-y-4">
            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'neu-btn-primary text-white ml-8'
                      : 'neu-inset text-[#172B4D] mr-6'
                  }`}
                >
                  <div className="font-bold mb-1">
                    {m.sender === 'user' ? patientProfile.fullName : 'Clinical Intake Guide'} ·{' '}
                    <span className="font-normal opacity-75">{m.timestamp}</span>
                  </div>
                  <p>{m.text}</p>
                  {m.followUpOptions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.followUpOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSendMessage(opt)}
                          className="neu-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#3478F6] cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
                placeholder="Describe your symptoms, duration, or questions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Symptom description input"
                className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs text-[#172B4D]"
              />
              <NeuButton type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                Send
              </NeuButton>
            </form>
          </NeuCard>

          <div className="lg:col-span-5 space-y-4">
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
                </div>
              </div>

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
