import React, { useState, useEffect, useMemo } from 'react';
import {
  NeuModal,
  NeuButton,
  NeuTextarea,
} from '../ui/NeumorphicPrimitives';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  CalendarClock,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { Appointment, DoctorProfile, DoctorSchedule } from '../../types';
import {
  DEMO_TODAY,
  STANDARD_CLINIC_SLOTS,
  formatReadableDate,
  computeDoctorAvailabilityForDate,
} from '../../services/mockData';

export const PrivacyPolicyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <NeuModal
    isOpen={isOpen}
    onClose={onClose}
    title="TeleHealth Privacy Policy & Clinical Data Protection"
    subtitle="Effective October 2026 · Healthcare Data Governance"
    maxWidth="max-w-2xl"
    footer={
      <NeuButton variant="primary" onClick={onClose}>
        Close & Return
      </NeuButton>
    }
  >
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#172B4D]">
      <div className="neu-inset rounded-xl p-3.5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#3478F6] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Least-Privilege Medical Data Access</div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Personal medical information (allergies, medications, conditions, and consultation notes) is restricted to authorized attending clinicians and the authenticated patient. Public availability calendars never expose patient names or reasons for visits.
          </p>
        </div>
      </div>

      <h3 className="font-bold text-sm pt-2">1. Information Collected</h3>
      <p className="text-[#64748B]">
        We collect only essential clinical intake data required to provide safe outpatient and telehealth consultations: full legal name, date of birth, sex, verified contact details, known drug or environmental allergies, active medications, and chief complaint.
      </p>

      <h3 className="font-bold text-sm pt-2">2. Server-Side Authorization & Database Security</h3>
      <p className="text-[#64748B]">
        In production integration with the Django TeleHealth backend and Neon PostgreSQL database, all read/write operations are validated against server-side session permissions and CSRF safeguards. No API keys, OAuth client secrets, or sensitive medical records are stored in browser local storage or URLs.
      </p>

      <h3 className="font-bold text-sm pt-2">3. Google Identity Verification</h3>
      <p className="text-[#64748B]">
        When signing in with Google, the system uses your verified email address to link your existing patient record and prevent duplicate medical chart creation.
      </p>
    </div>
  </NeuModal>
);

export const TermsConditionsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <NeuModal
    isOpen={isOpen}
    onClose={onClose}
    title="Terms & Conditions of Clinical Scheduling"
    subtitle="Outpatient & TeleHealth Consultation Agreement"
    maxWidth="max-w-2xl"
    footer={
      <NeuButton variant="primary" onClick={onClose}>
        Close & Return
      </NeuButton>
    }
  >
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#172B4D]">
      <div className="neu-inset rounded-xl p-3.5 flex items-start gap-3">
        <FileText className="w-5 h-5 text-[#3478F6] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">1-Hour Exclusive Slot Allocation</div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Standard clinic hours operate from 7:00 AM–11:00 AM and 1:00 PM–5:00 PM. Each appointment reserves an exclusive 60-minute window with your selected physician.
          </p>
        </div>
      </div>

      <h3 className="font-bold text-sm pt-2">1. Cancellation & Rescheduling Policy</h3>
      <p className="text-[#64748B]">
        Patients may cancel or request rescheduling up to 24 hours prior to the scheduled start time so the slot can be released to other patients waiting for care.
      </p>

      <h3 className="font-bold text-sm pt-2">2. Non-Emergency Scope</h3>
      <p className="text-[#64748B]">
        This scheduling system and optional symptom assessment tool are designed for non-emergency consultations. If you are experiencing acute chest pain, severe shortness of breath, or a medical emergency, call emergency services immediately.
      </p>

      <h3 className="font-bold text-sm pt-2">3. Accuracy of Patient Intake</h3>
      <p className="text-[#64748B]">
        You agree to provide accurate allergy and medication history prior to your consultation to ensure safe clinical prescribing.
      </p>
    </div>
  </NeuModal>
);

export const GoogleSignInResultModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  scenario: 'verified-patient' | 'new-onboarding' | 'cancelled' | 'conflict';
  onProceed: (scenario: 'verified-patient' | 'new-onboarding') => void;
}> = ({ isOpen, onClose, scenario, onProceed }) => {
  return (
    <NeuModal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Identity Provider Flow (Integration Boundary)"
      subtitle="Transparent OAuth 2.0 Verification & Profile Linking"
      footer={
        <>
          <NeuButton onClick={onClose}>Close</NeuButton>
          {(scenario === 'verified-patient' || scenario === 'new-onboarding') && (
            <NeuButton variant="primary" onClick={() => onProceed(scenario)}>
              Continue with Verified Demo Session
            </NeuButton>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="neu-inset rounded-xl p-3.5 text-xs text-[#64748B]">
          <strong className="text-[#172B4D] block mb-1">Production OAuth Boundary Notice:</strong>
          Live Google OAuth requires your Django backend <code className="font-mono-tabular">/api/v1/auth/google/verify/</code> endpoint to validate the ID token server-side. This prototype never pretends live Google servers were contacted without configuration; below is the interactive verification state simulator.
        </div>

        {scenario === 'verified-patient' && (
          <div className="neu-raised-sm rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#16865C] font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Email Matched Existing Patient Profile</span>
            </div>
            <p className="text-xs text-[#64748B]">
              Identity email <strong className="text-[#172B4D]">elena.rodriguez.demo@example.org</strong> matched patient record <strong className="text-[#172B4D]">PAT-101</strong>. Preventing duplicate profile creation and prefilling saved medical intake.
            </p>
          </div>
        )}

        {scenario === 'new-onboarding' && (
          <div className="neu-raised-sm rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#3478F6] font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Google Email — Profile Onboarding Required</span>
            </div>
            <p className="text-xs text-[#64748B]">
              Your Google account is authenticated, but you need to complete or link your required patient profile fields (Date of Birth, Sex, Contact Number, Allergies) before booking.
            </p>
          </div>
        )}

        {scenario === 'cancelled' && (
          <div className="neu-raised-sm rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#C68117] font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Google Sign-In Cancelled by User</span>
            </div>
            <p className="text-xs text-[#64748B]">
              The authentication window was closed before completion. No session was created and no tokens were stored. You may try again or sign in with credentials.
            </p>
          </div>
        )}

        {scenario === 'conflict' && (
          <div className="neu-raised-sm rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#C63D4D] font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>Account-Linking Conflict Detected</span>
            </div>
            <p className="text-xs text-[#64748B]">
              An unverified clinic chart already exists with this phone number under a different email address. To avoid duplicate patient profiles, please verify ownership via clinic administration or sign in with your primary email.
            </p>
          </div>
        )}
      </div>
    </NeuModal>
  );
};

export const CancelAppointmentModal: React.FC<{
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmCancel: (appointmentId: string, reason: string) => void;
}> = ({ appointment, onClose, onConfirmCancel }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!appointment) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a brief cancellation reason for the clinical record.');
      return;
    }
    onConfirmCancel(appointment.id, reason.trim());
    setReason('');
    setError('');
  };

  return (
    <NeuModal
      isOpen={!!appointment}
      onClose={onClose}
      title={`Cancel Appointment ${appointment.referenceNumber}`}
      subtitle={`${appointment.doctorName} · ${formatReadableDate(appointment.date)} (${appointment.timeLabel})`}
      footer={
        <>
          <NeuButton onClick={onClose}>Keep Appointment</NeuButton>
          <NeuButton variant="danger" onClick={handleSubmit}>
            Confirm Cancellation
          </NeuButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="neu-inset rounded-xl p-3.5 text-xs text-[#64748B] space-y-1">
          <div className="font-bold text-[#172B4D]">Clinic Cancellation Policy</div>
          <p>
            Cancelling this appointment immediately releases the 1-hour slot ({appointment.timeLabel}) back to the doctor’s availability calendar and notifies Dr. {appointment.doctorName.replace('Dr. ', '')}. Cancellations should be submitted at least 24 hours in advance.
          </p>
        </div>

        <NeuTextarea
          label="Reason for Cancellation"
          required
          rows={3}
          placeholder="e.g., Schedule conflict, symptoms resolved, or need different date..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          error={error}
        />
      </div>
    </NeuModal>
  );
};

export const RejectAppointmentModal: React.FC<{
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmReject: (appointmentId: string, reason: string) => void;
}> = ({ appointment, onClose, onConfirmReject }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!appointment) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('A clear clinical or scheduling reason is required when rejecting a patient request.');
      return;
    }
    onConfirmReject(appointment.id, reason.trim());
    setReason('');
    setError('');
  };

  return (
    <NeuModal
      isOpen={!!appointment}
      onClose={onClose}
      title={`Reject Booking Request ${appointment.referenceNumber}`}
      subtitle={`Patient: ${appointment.patientName} · ${formatReadableDate(appointment.date)}`}
      footer={
        <>
          <NeuButton onClick={onClose}>Back</NeuButton>
          <NeuButton variant="danger" onClick={handleSubmit}>
            Confirm Rejection & Notify Patient
          </NeuButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-[#64748B]">
          Rejecting this pending request releases the 1-hour slot and sends an in-app notification to the patient with your guidance.
        </p>
        <NeuTextarea
          label="Reason for Rejection / Clinical Guidance"
          required
          rows={3}
          placeholder="e.g., Requested service requires prior diagnostic lab work; please book Laboratory Service first."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          error={error}
        />
      </div>
    </NeuModal>
  );
};

export const RescheduleAppointmentModal: React.FC<{
  appointment: Appointment | null;
  doctors: DoctorProfile[];
  schedules: Record<string, DoctorSchedule>;
  appointments: Appointment[];
  onClose: () => void;
  onConfirmReschedule: (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newLabel: string,
    reason: string
  ) => void;
}> = ({
  appointment,
  doctors,
  schedules,
  appointments,
  onClose,
  onConfirmReschedule,
}) => {
  const [newDate, setNewDate] = useState(appointment?.date || '2026-10-08');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment) {
      setNewDate(appointment.date >= DEMO_TODAY ? appointment.date : '2026-10-08');
      setNewSlotStart('');
      setReason('');
      setError('');
    }
  }, [appointment]);

  // Exclude the current appointment itself so its existing slot is visible properly,
  // while all other booked/pending appointments and blocks on that date are enforced
  const otherAppointments = useMemo(
    () => (appointment ? appointments.filter((a) => a.id !== appointment.id) : appointments),
    [appointments, appointment]
  );

  const dayAvailability = useMemo(() => {
    if (!appointment) return null;
    return computeDoctorAvailabilityForDate(
      appointment.doctorId,
      newDate,
      doctors,
      schedules,
      otherAppointments
    );
  }, [appointment, newDate, doctors, schedules, otherAppointments]);

  const availableSlots = useMemo(() => {
    if (!dayAvailability) return [];
    return dayAvailability.slots.filter(
      (s) =>
        s.status === 'Available' &&
        !(newDate === appointment?.date && s.startTime === appointment?.startTime)
    );
  }, [dayAvailability, newDate, appointment]);

  // Auto-select first available slot when date changes
  useEffect(() => {
    if (availableSlots.length > 0) {
      const stillValid = availableSlots.some((s) => s.startTime === newSlotStart);
      if (!stillValid) {
        setNewSlotStart(availableSlots[0].startTime);
      }
    } else {
      setNewSlotStart('');
    }
  }, [availableSlots, newSlotStart]);

  if (!appointment) return null;

  const handleJumpToNextAvailableDay = () => {
    const startObj = new Date(`${newDate}T12:00:00`);
    for (let i = 1; i <= 21; i++) {
      const next = new Date(startObj);
      next.setDate(startObj.getDate() + i);
      const iso = next.toISOString().slice(0, 10);
      const avail = computeDoctorAvailabilityForDate(
        appointment.doctorId,
        iso,
        doctors,
        schedules,
        otherAppointments
      );
      const openSlots = avail.slots.filter(
        (s) =>
          s.status === 'Available' &&
          !(iso === appointment.date && s.startTime === appointment.startTime)
      );
      if (avail.dayStatus === 'Available' && openSlots.length > 0) {
        setNewDate(iso);
        setNewSlotStart(openSlots[0].startTime);
        setError('');
        return;
      }
    }
  };

  const handleSubmit = () => {
    if (newDate < DEMO_TODAY) {
      setError('Cannot reschedule to a past date.');
      return;
    }
    if (!newSlotStart) {
      setError('Please select an available 1-hour time slot, or choose another date.');
      return;
    }
    const chosenSlot = dayAvailability?.slots.find((s) => s.startTime === newSlotStart);
    if (!chosenSlot || chosenSlot.status !== 'Available') {
      setError('Selected time slot is no longer available on this date.');
      return;
    }
    if (newDate === appointment.date && newSlotStart === appointment.startTime) {
      setError('Please choose a different time slot or date than the current schedule.');
      return;
    }
    if (!reason.trim()) {
      setError('Please state the reason for rescheduling.');
      return;
    }
    const slotObj =
      STANDARD_CLINIC_SLOTS.find((s) => s.startTime === newSlotStart) || STANDARD_CLINIC_SLOTS[0];
    onConfirmReschedule(
      appointment.id,
      newDate,
      slotObj.startTime,
      slotObj.endTime,
      slotObj.label,
      reason.trim()
    );
    setReason('');
    setError('');
  };

  return (
    <NeuModal
      isOpen={!!appointment}
      onClose={onClose}
      title={`Reschedule Appointment ${appointment.referenceNumber}`}
      subtitle={`Current: ${formatReadableDate(appointment.date)} at ${appointment.timeLabel} · ${appointment.doctorName}`}
      maxWidth="max-w-xl"
      footer={
        <>
          <NeuButton onClick={onClose}>Cancel</NeuButton>
          <NeuButton
            variant="primary"
            disabled={!newSlotStart}
            icon={<CalendarClock className="w-4 h-4" />}
            onClick={handleSubmit}
          >
            Save Rescheduled Slot
          </NeuButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="resched-date" className="text-xs font-semibold text-[#172B4D]">
              1. Select New Preferred Date *
            </label>
            <input
              id="resched-date"
              type="date"
              min={DEMO_TODAY}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setError('');
              }}
              className="neu-inset rounded-xl px-3.5 py-2.5 text-sm text-[#172B4D]"
            />
          </div>
          <NeuButton size="sm" onClick={handleJumpToNextAvailableDay}>
            Jump to Next Available Date →
          </NeuButton>
        </div>

        {/* Real-time Slot Availability Grid for Selected Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#172B4D]">
              2. Select Available 1-Hour Slot ({formatReadableDate(newDate)})
            </span>
            <span className="font-mono-tabular text-[#64748B]">
              {availableSlots.length} Open Slot(s)
            </span>
          </div>

          {dayAvailability && dayAvailability.dayStatus !== 'Available' && availableSlots.length === 0 ? (
            <div className="neu-inset rounded-xl p-4 text-xs space-y-2 border border-[#C68117]/30">
              <div className="font-bold text-[#C68117]">
                No Available Slots on {formatReadableDate(newDate)} ({dayAvailability.dayStatus})
              </div>
              <p className="text-[#64748B]">
                All 1-hour slots on this date are either already booked, on physician leave, or outside clinic working days.
              </p>
              <NeuButton size="sm" variant="primary" onClick={handleJumpToNextAvailableDay}>
                Find Next Available Working Day
              </NeuButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {dayAvailability?.slots.map((slot) => {
                const isCurrentSlot =
                  newDate === appointment.date && slot.startTime === appointment.startTime;
                const isSelectable = slot.status === 'Available' && !isCurrentSlot;
                const isSelected = newSlotStart === slot.startTime && isSelectable;

                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => {
                      setNewSlotStart(slot.startTime);
                      if (error) setError('');
                    }}
                    className={`rounded-xl px-3 py-2.5 text-left text-xs transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#3478F6] text-white font-bold shadow-sm cursor-pointer'
                        : isSelectable
                        ? 'neu-raised-sm text-[#172B4D] hover:text-[#3478F6] cursor-pointer'
                        : 'neu-inset-sm text-[#64748B] opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-mono-tabular font-semibold">{slot.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isCurrentSlot
                          ? 'text-[#3478F6]'
                          : slot.status === 'Available'
                          ? 'text-[#16865C]'
                          : 'text-[#C63D4D]'
                      }`}
                    >
                      {isCurrentSlot
                        ? 'Current Slot'
                        : slot.status === 'Available'
                        ? 'Available'
                        : slot.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <NeuTextarea
          label="3. Reason for Rescheduling"
          required
          rows={2}
          placeholder="Explain why the appointment time is being adjusted..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          error={error}
        />
      </div>
    </NeuModal>
  );
};
