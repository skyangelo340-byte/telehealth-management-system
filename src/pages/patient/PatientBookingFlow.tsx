import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  HelpCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  PatientProfile,
  Department,
  AppointmentType,
  DoctorProfile,
  DoctorSchedule,
  Appointment,
  ScreenId,
} from '../../types';
import {
  DEMO_TODAY,
  calculateAgeFromDob,
  computeDoctorAvailabilityForDate,
  formatReadableDate,
} from '../../services/mockData';
import { validateSlotCanBeBooked } from '../../services/api';
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSelect,
  NeuTextarea,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';
import { DoctorAvailabilityCalendar } from '../../components/calendar/DoctorAvailabilityCalendar';

export interface BookingDraftState {
  fullName: string;
  dateOfBirth: string;
  sex: PatientProfile['sex'];
  contactNumber: string;
  email: string;
  knownAllergies: string;
  currentMedications: string;
  existingMedicalConditions: string;
  previousMedicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  departmentId: string;
  doctorId: string;
  appointmentTypeId: string;
  consultationMode?: 'Online Appointment' | 'Walk-In';
  date: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  reasonForVisit: string;
  agreedToTerms: boolean;
}

interface PatientBookingFlowProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  patientProfile: PatientProfile;
  departments: Department[];
  appointmentTypes: AppointmentType[];
  doctors: DoctorProfile[];
  schedules: Record<string, DoctorSchedule>;
  appointments: Appointment[];
  draft: BookingDraftState;
  setDraft: React.Dispatch<React.SetStateAction<BookingDraftState>>;
  onSubmitBooking: () => Promise<{ success: boolean; appointment?: Appointment; error?: string }>;
  lastBookedAppointment: Appointment | null;
  onOpenPrivacyModal: () => void;
  onOpenTermsModal: () => void;
  onViewAppointmentDetails: (apt: Appointment) => void;
}

export const PatientBookingFlow: React.FC<PatientBookingFlowProps> = ({
  currentScreen,
  onNavigate,
  departments,
  appointmentTypes,
  doctors,
  schedules,
  appointments,
  draft,
  setDraft,
  onSubmitBooking,
  lastBookedAppointment,
  onOpenPrivacyModal,
  onOpenTermsModal,
  onViewAppointmentDetails,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [hoveredDeptId, setHoveredDeptId] = useState<string | null>(null);
  const deptDropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setDeptDropdownOpen(false);
        setHoveredDeptId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DEPARTMENT_CLINICAL_GUIDE: Record<
    string,
    {
      titleTagalog: string;
      meaning: string;
      commonSymptoms: string[];
      leadDoctor: string;
    }
  > = {
    'dept-cardio': {
      titleTagalog: 'Sakit sa Puso, Presyon ng Dugo (High Blood), at Ugat',
      meaning:
        'Para sa mga pasyenteng may nararamdaman sa puso, mataas na blood pressure (hypertension), mabilis na tibok ng puso, o paninikip ng dibdib.',
      commonSymptoms: [
        'Mataas na BP / High Blood Pressure',
        'Paninikip o kirot sa dibdib (Chest pain)',
        'Mabilis o hindi normal na tibok ng puso (Palpitations)',
        'Madaling hingalin o pagkahilo sa umaga',
      ],
      leadDoctor: 'Dr. Marcus Vance (Senior Cardiologist)',
    },
    'dept-general': {
      titleTagalog: 'Pangkalahatang Sakit ng Katawan, Lagnat, Ubo, at Primary Care',
      meaning:
        'Para sa pangkalahatang check-up ng matatanda, lagnat, trangkaso, ubo, sakit ng ulo, diabetes, pananakit ng tiyan, o kung hindi ka pa sigurado kung anong espesyalista ang kailangan.',
      commonSymptoms: [
        'Lagnat, trangkaso, ubo, at sipon',
        'Sakit ng ulo, hilo, o panghihina ng katawan',
        'Sakit ng tiyan, sikmura, o hyperacidity',
        'Diabetes, cholesterol, at annual physical check-up',
      ],
      leadDoctor: 'Dr. Hannah Lin (Internal Medicine Physician)',
    },
    'dept-dental': {
      titleTagalog: 'Sakit ng Ngipin, Gilagid, at Bibig (Dentista)',
      meaning:
        'Para sa lahat ng problema sa ngipin, bagang, gilagid, pangingilo, pamamaga ng panga, linis ng ngipin (oral prophylaxis), o pasta.',
      commonSymptoms: [
        'Masakit o bulok na ngipin / bagang (Toothache / Cavity)',
        'Nangingilo kapag umiinom ng malamig o mainit',
        'Namamaga o dumudugong gilagid (Gum bleeding)',
        'Dental cleaning, pasta, o konsultasyon sa bunot',
      ],
      leadDoctor: 'Dr. Julian Thorne (Doctor of Dental Surgery)',
    },
    'dept-derma': {
      titleTagalog: 'Sakit sa Balat, Pantal, Allergy sa Balat, at Mukha (Dermatologist)',
      meaning:
        'Para sa mga problema sa balat, anit, at kuko gaya ng makating pantal, rashes, eczema, tigyawat (acne), fungal infection, o skin allergy.',
      commonSymptoms: [
        'Makating pantal o pamumula ng balat (Skin rash / Hives)',
        'Eczema, psoriasis, o sobrang panunuyo ng balat',
        'Matinding tigyawat (Acne breakout) o peklat sa balat',
        'Buni, alipunga, o impeksyon sa balat at kuko',
      ],
      leadDoctor: 'Dr. Amara Okafor (Consultant Dermatologist)',
    },
    'dept-lab': {
      titleTagalog: 'Laboratory Blood Test, Urinalysis, ECG, at Diagnostic Workup',
      meaning:
        'Para sa mga pasyenteng kukuha ng blood test (CBC, Fasting Blood Sugar, Lipid Profile), urinalysis, ECG, o magpapabasa ng resulta ng laboratoryo.',
      commonSymptoms: [
        'Routine Blood Chemistry (FBS, Cholesterol, Uric Acid)',
        'Complete Blood Count (CBC) at Urinalysis',
        '12-Lead ECG at Pre-Employment / Annual Lab Workup',
        'Pagpapabasa at interpretasyon ng Lab Results',
      ],
      leadDoctor: 'Dr. Hannah Lin (Diagnostic & Lab Services)',
    },
  };

  const calculatedAge = useMemo(() => calculateAgeFromDob(draft.dateOfBirth), [draft.dateOfBirth]);

  const availableDoctorsForDepartment = useMemo(() => {
    const activeRoster = doctors.filter((d) => d.status !== 'Inactive' && d.status !== 'Resigned');
    if (!draft.departmentId) return activeRoster;
    return activeRoster.filter((d) => d.departmentId === draft.departmentId);
  }, [doctors, draft.departmentId]);

  const availableTypesForDepartment = useMemo(() => {
    return appointmentTypes.filter(
      (t) =>
        t.active &&
        (t.departmentIds.length === 0 || !draft.departmentId || t.departmentIds.includes(draft.departmentId))
    );
  }, [appointmentTypes, draft.departmentId]);

  const selectedDepartment = departments.find((d) => d.id === draft.departmentId);
  const selectedDoctor = doctors.find((d) => d.id === draft.doctorId);
  const selectedType = appointmentTypes.find((t) => t.id === draft.appointmentTypeId);

  const handleSelectNextAvailableDoctor = () => {
    const candidates = availableDoctorsForDepartment.filter((d) => d.status === 'Active');
    if (candidates.length === 0) return;

    // Find earliest open slot on or after selected date
    const checkDate = draft.date >= DEMO_TODAY ? draft.date : '2026-10-07';
    for (const doc of candidates) {
      const avail = computeDoctorAvailabilityForDate(doc.id, checkDate, doctors, schedules, appointments);
      const firstOpen = avail.slots.find((s) => s.status === 'Available');
      if (firstOpen) {
        setDraft((prev) => ({
          ...prev,
          doctorId: doc.id,
          departmentId: doc.departmentId,
          date: checkDate,
          startTime: firstOpen.startTime,
          endTime: firstOpen.endTime,
          timeLabel: firstOpen.label,
        }));
        setConflictBanner(null);
        return;
      }
    }
  };

  const validateBookingForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!draft.fullName.trim()) {
      nextErrors.fullName = 'Full Name is required.';
    }
    if (!draft.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of Birth is required.';
    } else if (draft.dateOfBirth > DEMO_TODAY) {
      nextErrors.dateOfBirth = 'Future birth dates are not valid.';
    } else if (calculatedAge !== null && (calculatedAge < 0 || calculatedAge > 125)) {
      nextErrors.dateOfBirth = 'Please enter a valid Date of Birth.';
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
    if (!draft.contactNumber.trim() || !phoneRegex.test(draft.contactNumber.trim())) {
      nextErrors.contactNumber = 'Enter a valid contact number (e.g., +1 (415) 555-0194).';
    }

    if (!draft.email.trim() || !draft.email.includes('@')) {
      nextErrors.email = 'Valid email address is required.';
    }

    if (!draft.departmentId) {
      nextErrors.departmentId = 'Please choose a medical department.';
    }
    if (!draft.doctorId) {
      nextErrors.doctorId = 'Please select a preferred doctor.';
    }
    if (!draft.appointmentTypeId) {
      nextErrors.appointmentTypeId = 'Please select an appointment service type.';
    }
    if (!draft.date || draft.date < DEMO_TODAY) {
      nextErrors.date = 'Please choose a valid current or future date.';
    }
    if (!draft.startTime) {
      nextErrors.startTime = 'Please choose an available 1-hour time slot on the calendar.';
    } else if (draft.doctorId && draft.date) {
      const currentAvail = computeDoctorAvailabilityForDate(
        draft.doctorId,
        draft.date,
        doctors,
        schedules,
        appointments
      );
      const slotCheck = validateSlotCanBeBooked(currentAvail, draft.startTime);
      if (!slotCheck.valid) {
        nextErrors.startTime = slotCheck.error || 'Selected time slot is not available.';
      }
    }

    if (!draft.reasonForVisit.trim() || draft.reasonForVisit.trim().length < 8) {
      nextErrors.reasonForVisit = 'Please describe your reason for visit / chief complaint (at least 8 characters).';
    }

    if (!draft.agreedToTerms) {
      nextErrors.agreedToTerms = 'You must agree to the Terms and Privacy Policy before proceeding.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep1 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!draft.fullName.trim()) {
      nextErrors.fullName = 'Full Name is required.';
    }
    if (!draft.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of Birth is required.';
    } else if (draft.dateOfBirth > DEMO_TODAY) {
      nextErrors.dateOfBirth = 'Future birth dates are not valid.';
    } else if (calculatedAge !== null && (calculatedAge < 0 || calculatedAge > 125)) {
      nextErrors.dateOfBirth = 'Please enter a valid Date of Birth.';
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
    if (!draft.contactNumber.trim() || !phoneRegex.test(draft.contactNumber.trim())) {
      nextErrors.contactNumber = 'Enter a valid contact number (e.g., +1 (415) 555-0194).';
    }

    if (!draft.email.trim() || !draft.email.includes('@')) {
      nextErrors.email = 'Valid email address is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!draft.departmentId) {
      nextErrors.departmentId = 'Please choose a medical department.';
    }
    if (!draft.doctorId) {
      nextErrors.doctorId = 'Please select a preferred doctor.';
    }
    if (!draft.appointmentTypeId) {
      nextErrors.appointmentTypeId = 'Please select an appointment service type.';
    }
    if (!draft.reasonForVisit.trim() || draft.reasonForVisit.trim().length < 8) {
      nextErrors.reasonForVisit = 'Please describe your reason for visit / chief complaint (at least 8 characters).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!draft.date || draft.date < DEMO_TODAY) {
      nextErrors.date = 'Please choose a valid current or future date on the calendar.';
    } else if (draft.doctorId) {
      const currentAvail = computeDoctorAvailabilityForDate(
        draft.doctorId,
        draft.date,
        doctors,
        schedules,
        appointments
      );
      if (
        currentAvail.dayStatus === 'Past' ||
        currentAvail.dayStatus === 'Doctor Unavailable' ||
        currentAvail.dayStatus === 'Blocked / Leave'
      ) {
        nextErrors.date = `Selected date (${draft.date}) is ${currentAvail.dayStatus}. Please select an open working day.`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextFormStep = () => {
    if (formStep === 1) {
      if (validateStep1()) {
        setFormStep(2);
      }
    } else if (formStep === 2) {
      setFormStep(3);
    } else if (formStep === 3) {
      if (validateStep3()) {
        setFormStep(4);
      }
    } else if (formStep === 4) {
      if (validateStep4()) {
        setFormStep(5);
      }
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictBanner(null);
    if (validateBookingForm()) {
      onNavigate('appointment-review');
    } else if (errors.fullName || errors.dateOfBirth || errors.contactNumber || errors.email) {
      setFormStep(1);
    } else if (errors.departmentId || errors.doctorId || errors.appointmentTypeId || errors.reasonForVisit) {
      setFormStep(3);
    } else if (errors.date) {
      setFormStep(4);
    }
  };

  const handleFinalConfirmBooking = async () => {
    setIsSubmitting(true);
    setConflictBanner(null);
    const result = await onSubmitBooking();
    setIsSubmitting(false);

    if (!result.success) {
      setConflictBanner(
        result.error ||
          'Slot conflict detected: This 1-hour slot was just reserved or blocked. Please select another available slot.'
      );
      onNavigate('book-appointment');
    } else {
      onNavigate('booking-confirmation');
    }
  };

  // SCREEN 10: APPOINTMENT REVIEW
  if (currentScreen === 'appointment-review') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#3478F6]">Step 9–11 of 12 · Pre-Submission Verification</div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Review Appointment Summary</h1>
            <p className="text-xs text-[#64748B]">
              Verify your clinical intake details and 1-hour slot reservation before submitting to the server.
            </p>
          </div>
          <NeuButton
            onClick={() => onNavigate('book-appointment')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Edit Information
          </NeuButton>
        </div>

        <NeuCard size="lg" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-black/5">
            <div>
              <div className="text-xs text-[#64748B]">Patient Name</div>
              <div className="text-sm font-bold text-[#172B4D]">{draft.fullName}</div>
              <div className="text-xs text-[#64748B] mt-0.5">
                DOB: <span className="font-mono-tabular">{draft.dateOfBirth}</span> ({calculatedAge ?? '—'} yrs) · {draft.sex}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#64748B]">Verified Contact & Email</div>
              <div className="text-sm font-bold text-[#172B4D] font-mono-tabular">{draft.contactNumber}</div>
              <div className="text-xs text-[#64748B] mt-0.5">{draft.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-black/5">
            <div>
              <div className="text-xs text-[#64748B]">Department & Attending Physician</div>
              <div className="text-sm font-bold text-[#172B4D]">{selectedDoctor?.fullName}</div>
              <div className="text-xs text-[#3478F6] font-semibold mt-0.5">{selectedDepartment?.name}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B]">Reserved 1-Hour Slot</div>
              <div className="text-sm font-bold text-[#172B4D]">{formatReadableDate(draft.date)}</div>
              <div className="text-xs font-mono-tabular font-semibold text-[#16865C] mt-0.5">
                {draft.timeLabel} (Exclusive 60-Min Window)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-black/5">
            <div>
              <div className="text-xs text-[#64748B]">Appointment Service Type</div>
              <div className="text-sm font-bold text-[#172B4D]">{selectedType?.name}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B]">Consultation Mode</div>
              <div className="text-sm font-bold text-[#3478F6]">
                {draft.consultationMode || 'Online Appointment'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#64748B]">Applicable Initial Booking Status</div>
              <div className="mt-1">
                <StatusIndicator status="Pending" />
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="pb-4 border-b border-black/5">
              <span className="font-semibold text-[#64748B] block">Reason for Visit / Chief Complaint</span>
              <p className="mt-1 text-sm font-medium text-[#172B4D]">{draft.reasonForVisit}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-semibold text-[#64748B] block">Known Allergies</span>
                <span className="mt-0.5 block font-bold text-[#172B4D]">{draft.knownAllergies || 'None reported'}</span>
              </div>
              <div>
                <span className="font-semibold text-[#64748B] block">Current Medications</span>
                <span className="mt-0.5 block font-bold text-[#172B4D]">{draft.currentMedications || 'None reported'}</span>
              </div>
              <div>
                <span className="font-semibold text-[#64748B] block">Existing Conditions</span>
                <span className="mt-0.5 block font-bold text-[#172B4D]">{draft.existingMedicalConditions || 'None reported'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
            <NeuButton onClick={() => onNavigate('book-appointment')}>
              ← Back to Form & Calendar
            </NeuButton>
            <NeuButton
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onClick={handleFinalConfirmBooking}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Booking Request
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 11: BOOKING CONFIRMATION
  if (currentScreen === 'booking-confirmation') {
    const apt = lastBookedAppointment;
    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <NeuCard size="lg" className="text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl neu-raised mx-auto flex items-center justify-center text-[#16865C]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#16865C]">Step 12 of 12 · Booking Operation Verified</div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Appointment Request Submitted</h1>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Your 1-hour slot has been reserved in the demonstration sandbox and assigned reference number{' '}
              <strong className="font-mono-tabular text-[#172B4D]">{apt?.referenceNumber || 'TH-2026-8501'}</strong>.
            </p>
          </div>

          {apt && (
            <div className="neu-inset rounded-2xl p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#64748B]">Reference Number</div>
                <div className="text-sm font-bold font-mono-tabular text-[#3478F6]">{apt.referenceNumber}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Current Status</div>
                <div className="mt-0.5">
                  <StatusIndicator status={apt.status} />
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Doctor & Department</div>
                <div className="font-bold text-[#172B4D]">{apt.doctorName}</div>
                <div className="text-[#64748B]">{apt.departmentName}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Scheduled Date & 1-Hour Slot</div>
                <div className="font-bold text-[#172B4D]">{formatReadableDate(apt.date)}</div>
                <div className="font-mono-tabular font-semibold text-[#16865C]">{apt.timeLabel}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Appointment Mode</div>
                <div className="font-bold text-[#3478F6]">{apt.consultationMode || 'Online Appointment'}</div>
              </div>
              <div>
                <div className="text-[#64748B]">Consultation Type</div>
                <div className="font-bold text-[#172B4D]">{apt.appointmentTypeName}</div>
              </div>
              {(apt.consultationMode || 'Online Appointment') === 'Online Appointment' && (
                <div className="sm:col-span-2 pt-2 border-t border-black/5">
                  <div className="text-[#64748B]">Online Video Consultation (Google Meet)</div>
                  <div className="text-[#172B4D] font-medium mt-0.5">
                    Your Google Meet room link will be sent to your notifications and Appointment Details page as soon as {apt.doctorName} confirms your request.
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="neu-raised-sm rounded-xl p-4 text-left text-xs text-[#64748B] space-y-1">
            <div className="font-bold text-[#172B4D]">Next Steps & Preparation</div>
            <p>
              1. Your attending doctor will review and confirm the request. You will receive an in-app notification in your Notification Center.
            </p>
            <p>
              2. {selectedType?.preparationInstructions || 'Please arrive or connect 10 minutes before your scheduled 1-hour slot.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {apt && (
              <NeuButton onClick={() => onViewAppointmentDetails(apt)}>
                View Appointment Details
              </NeuButton>
            )}
            <NeuButton variant="primary" onClick={() => onNavigate('my-appointments')}>
              Go to My Appointments
            </NeuButton>
            <NeuButton onClick={() => onNavigate('patient-dashboard')}>
              Return to Dashboard
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 9: STANDALONE DOCTOR AVAILABILITY PAGE
  if (currentScreen === 'doctor-availability') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Real-Time Doctor Availability Calendar</h1>
            <p className="text-xs text-[#64748B]">
              Inspect 1-hour morning (7 AM–11 AM) and afternoon (1 PM–5 PM) slots across departments before booking.
            </p>
          </div>
          <NeuButton
            variant="primary"
            onClick={() => onNavigate('book-appointment')}
            icon={<Calendar className="w-4 h-4" />}
          >
            Continue to 50/50 Booking Form
          </NeuButton>
        </div>

        <DoctorAvailabilityCalendar
          departments={departments}
          doctors={doctors.filter((d) => d.status !== 'Inactive' && d.status !== 'Resigned')}
          schedules={schedules}
          appointments={appointments}
          selectedDepartmentId={draft.departmentId}
          onSelectDepartment={(deptId) => {
            const firstDoc = doctors.find(
              (d) => d.status !== 'Inactive' && d.status !== 'Resigned' && (!deptId || d.departmentId === deptId)
            );
            setDraft((prev) => ({
              ...prev,
              departmentId: deptId,
              doctorId: firstDoc ? firstDoc.id : prev.doctorId,
              startTime: '',
              endTime: '',
              timeLabel: '',
            }));
          }}
          selectedDoctorId={draft.doctorId}
          onSelectDoctor={(docId) => {
            const doc = doctors.find((d) => d.id === docId);
            setDraft((prev) => ({
              ...prev,
              doctorId: docId,
              departmentId: doc ? doc.departmentId : prev.departmentId,
              startTime: '',
              endTime: '',
              timeLabel: '',
            }));
          }}
          selectedDate={draft.date}
          onSelectDate={(dateStr) =>
            setDraft((prev) => ({ ...prev, date: dateStr, startTime: '', endTime: '', timeLabel: '' }))
          }
          selectedSlotStart={draft.startTime}
          onSelectSlot={(startTime, endTime, timeLabel) =>
            setDraft((prev) => ({ ...prev, startTime, endTime, timeLabel }))
          }
          showFilters={true}
        />
      </div>
    );
  }

  // SCREEN 8: COMPLETE APPOINTMENT BOOKING PAGE (UNIFIED 5-STEP STEPPER)
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#3478F6]">
            Authenticated Patient Booking Workflow · Saved Profile Prefilled
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Book a Clinical Appointment</h1>
          <p className="text-xs text-[#64748B]">
            Follow the 5-step wizard to complete your patient intake, choose a date on the calendar, and select your 1-hour time slot.
          </p>
        </div>
      </div>

      {conflictBanner && (
        <div className="neu-raised rounded-2xl p-4 border border-[#C63D4D]/30 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-[#C63D4D]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Scheduling Conflict Prevented</div>
              <p className="mt-0.5 text-[#172B4D]">{conflictBanner}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConflictBanner(null)}
            className="text-xs font-bold text-[#64748B] hover:text-[#172B4D]"
          >
            ✕
          </button>
        </div>
      )}

      {/* UNIFIED 5-STEP STEPPER FORM */}
      <form
        onSubmit={handleProceedToReview}
        noValidate
        className="space-y-6"
      >
        <div className="space-y-6">
          <NeuCard className="space-y-5">
            {/* Interactive 5-Step Stepper Tabs */}
            <div className="space-y-3 pb-4 border-b border-black/5">
              <div className="neu-inset p-1.5 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { step: 1 as const, label: '1. Personal Info' },
                  { step: 2 as const, label: '2. Medical History' },
                  { step: 3 as const, label: '3. Visit Details' },
                  { step: 4 as const, label: '4. Calendar Date' },
                  { step: 5 as const, label: '5. Select Time' },
                ].map((item) => {
                  const isActive = formStep === item.step;
                  const isCompleted = formStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        if (item.step === 1) {
                          setFormStep(1);
                        } else if (item.step === 2 && validateStep1()) {
                          setFormStep(2);
                        } else if (item.step === 3 && validateStep1()) {
                          setFormStep(3);
                        } else if (item.step === 4 && validateStep1() && validateStep3()) {
                          setFormStep(4);
                        } else if (item.step === 5 && validateStep1() && validateStep3() && validateStep4()) {
                          setFormStep(5);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'neu-btn-primary text-white'
                          : isCompleted
                            ? 'text-[#16865C] hover:bg-white/40'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  {formStep === 1 && 'Verify your personal and contact information.'}
                  {formStep === 2 && 'Provide allergies, active medications, and medical background.'}
                  {formStep === 3 && 'Choose department, attending doctor, service type, and chief complaint.'}
                  {formStep === 4 && 'Pick an available date on the doctor availability calendar.'}
                  {formStep === 5 && 'Select a 1-hour appointment time slot and confirm your booking.'}
                </span>
                <span className="font-mono-tabular font-semibold text-[#3478F6] shrink-0">
                  Step {formStep} of 5
                </span>
              </div>
            </div>

            {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
            {formStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#3478F6]" />
                    <span>Personal & Contact Information</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-[#16865C]">Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NeuInput
                    label="Full Name"
                    required
                    value={draft.fullName}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    error={errors.fullName}
                  />

                  <NeuInput
                    label="Date of Birth"
                    type="date"
                    required
                    max={DEMO_TODAY}
                    value={draft.dateOfBirth}
                    onChange={(e) => setDraft((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    error={errors.dateOfBirth}
                    rightElement={
                      calculatedAge !== null && calculatedAge >= 0 ? (
                        <span className="text-[11px] font-mono-tabular font-semibold text-[#3478F6]">
                          Calculated Age: {calculatedAge} yrs
                        </span>
                      ) : null
                    }
                  />

                  <NeuSelect
                    label="Sex (Clinic Policy Options)"
                    required
                    value={draft.sex}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, sex: e.target.value as PatientProfile['sex'] }))
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
                    type="tel"
                    required
                    placeholder="+1 (415) 555-0194"
                    value={draft.contactNumber}
                    onChange={(e) => setDraft((p) => ({ ...p, contactNumber: e.target.value }))}
                    error={errors.contactNumber}
                  />
                </div>

                <NeuInput
                  label="Verified Email Address"
                  type="email"
                  required
                  value={draft.email}
                  onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                  error={errors.email}
                  helperText="Prefilled from your verified authentication identity."
                />

                <div className="flex items-center justify-end pt-3 border-t border-black/5">
                  <NeuButton
                    type="button"
                    variant="primary"
                    onClick={handleNextFormStep}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Medical History
                  </NeuButton>
                </div>
              </div>
            )}

            {/* STEP 2: MEDICAL BACKGROUND & SAFETY */}
            {formStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#172B4D]">
                    Clinical Safety & Medical Background
                  </h2>
                  <span className="text-[11px] text-[#64748B]">Saved Profile Prefilled</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NeuInput
                    label="Known Allergies"
                    placeholder="e.g., Penicillin, Latex, or NKDA"
                    value={draft.knownAllergies}
                    onChange={(e) => setDraft((p) => ({ ...p, knownAllergies: e.target.value }))}
                  />
                  <NeuInput
                    label="Current Medications"
                    placeholder="e.g., Lisinopril 10mg daily"
                    value={draft.currentMedications}
                    onChange={(e) => setDraft((p) => ({ ...p, currentMedications: e.target.value }))}
                  />
                </div>

                <NeuInput
                  label="Existing Medical Conditions"
                  placeholder="e.g., Stage 1 Hypertension, Asthma"
                  value={draft.existingMedicalConditions}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, existingMedicalConditions: e.target.value }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NeuInput
                    label="Previous Medical History (Optional)"
                    placeholder="Past surgeries or hospitalizations"
                    value={draft.previousMedicalHistory}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, previousMedicalHistory: e.target.value }))
                    }
                  />
                  <NeuInput
                    label="Emergency Contact (Optional)"
                    placeholder="Name & phone number"
                    value={draft.emergencyContactName}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, emergencyContactName: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5">
                  <NeuButton
                    type="button"
                    onClick={() => setFormStep(1)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </NeuButton>
                  <NeuButton
                    type="button"
                    variant="primary"
                    onClick={handleNextFormStep}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Visit Details
                  </NeuButton>
                </div>
              </div>
            )}

            {/* STEP 3: APPOINTMENT DETAILS & CHIEF COMPLAINT */}
            {formStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[#172B4D]">
                    Appointment Details & Chief Complaint
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Select your medical department, preferred physician, service type, and reason for visit.
                  </p>
                </div>

                {/* Online Appointment or Walk-In Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B4D] block">
                    Appointment Mode <span className="text-[#C63D4D]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Online Appointment', 'Walk-In'] as const).map((mode) => {
                      const activeMode = draft.consultationMode || 'Online Appointment';
                      const isSelected = activeMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, consultationMode: mode }))}
                          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'neu-btn-primary text-white'
                              : 'neu-btn text-[#172B4D]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                          <span>{mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative flex flex-col gap-1.5" ref={deptDropdownRef}>
                    <label
                      htmlFor="select-medical-department"
                      className="text-xs font-semibold text-[#101B45] px-1"
                    >
                      Medical Department <span className="text-[#D63649]">*</span>
                    </label>

                    <button
                      type="button"
                      id="select-medical-department"
                      onClick={() => {
                        setDeptDropdownOpen((prev) => !prev);
                        setHoveredDeptId(null);
                      }}
                      className={`neu-inset rounded-[18px] px-4 py-3 text-sm text-left text-[#101B45] focus:outline-none flex items-center justify-between cursor-pointer ${
                        errors.departmentId ? 'ring-2 ring-[#D63649]' : ''
                      }`}
                    >
                      <span className={selectedDepartment ? 'text-[#101B45] font-medium' : 'text-[#68789D]'}>
                        {selectedDepartment ? selectedDepartment.name : 'Select a Department...'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#68789D] transition-transform duration-200 ${
                          deptDropdownOpen ? 'rotate-180 text-[#3478F6]' : ''
                        }`}
                      />
                    </button>

                    {errors.departmentId && (
                      <p className="text-xs text-[#D63649] font-medium flex items-center gap-1 px-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.departmentId}</span>
                      </p>
                    )}

                    {/* Custom Dropdown List + Right-Side Floating Hover Card on Option Hover */}
                    {deptDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl bg-[#EEF2F7] border border-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.18)] py-1.5"
                        onMouseLeave={() => setHoveredDeptId(null)}
                      >
                        <div
                          onClick={() => {
                            setDraft((p) => ({
                              ...p,
                              departmentId: '',
                              doctorId: '',
                              startTime: '',
                              endTime: '',
                              timeLabel: '',
                            }));
                            setDeptDropdownOpen(false);
                            setHoveredDeptId(null);
                          }}
                          onMouseEnter={() => setHoveredDeptId(null)}
                          className="px-4 py-2 text-xs text-[#64748B] hover:bg-black/5 cursor-pointer"
                        >
                          Select a Department...
                        </div>

                        {departments.map((dept) => {
                          const isSelected = draft.departmentId === dept.id;
                          const isHovered = hoveredDeptId === dept.id;
                          return (
                            <div
                              key={dept.id}
                              onMouseEnter={() => setHoveredDeptId(dept.id)}
                              onClick={() => {
                                const firstDoc = doctors.find(
                                  (d) =>
                                    d.departmentId === dept.id &&
                                    d.status !== 'Inactive' &&
                                    d.status !== 'Resigned'
                                );
                                setDraft((p) => ({
                                  ...p,
                                  departmentId: dept.id,
                                  doctorId: firstDoc ? firstDoc.id : '',
                                  startTime: '',
                                  endTime: '',
                                  timeLabel: '',
                                }));
                                setDeptDropdownOpen(false);
                                setHoveredDeptId(null);
                              }}
                              className={`relative px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                                isHovered
                                  ? 'bg-[#3478F6] text-white font-semibold'
                                  : isSelected
                                    ? 'bg-[#3478F6]/12 text-[#1D4ED8] font-semibold'
                                    : 'text-[#101B45] hover:bg-[#3478F6]/10'
                              }`}
                            >
                              <span>{dept.name}</span>
                              <span
                                className={`text-[10px] font-bold ${
                                  isHovered ? 'text-white/90' : 'text-[#64748B]'
                                }`}
                              >
                                {dept.code} →
                              </span>

                              {/* Floating Pop-Up Card on the Right Side when Hovering This Option */}
                              {isHovered &&
                                (() => {
                                  const guide = DEPARTMENT_CLINICAL_GUIDE[dept.id] || {
                                    titleTagalog: dept.name,
                                    meaning: dept.description,
                                    commonSymptoms: [
                                      'Outpatient clinical evaluation',
                                      'Specialist consultation & follow-up',
                                    ],
                                    leadDoctor: dept.headDoctorName,
                                  };
                                  return (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="pointer-events-none absolute left-full top-0 ml-3 w-[320px] sm:w-[350px] z-[60] rounded-2xl p-4 bg-white text-[#172B4D] border border-[#3478F6]/40 shadow-[0_20px_48px_rgba(15,23,42,0.28)] space-y-2.5 text-xs font-normal"
                                    >
                                      <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2">
                                        <div className="flex items-center gap-1.5 text-[#3478F6] font-extrabold">
                                          <Stethoscope className="w-4 h-4 shrink-0" />
                                          <span>
                                            {dept.name} ({dept.code})
                                          </span>
                                        </div>
                                      </div>

                                      <div className="p-2.5 rounded-xl bg-[#3478F6]/10 border border-[#3478F6]/20">
                                        <div className="text-[10px] font-extrabold text-[#1D4ED8] uppercase tracking-wide">
                                          Para Saan ang Department na Ito:
                                        </div>
                                        <div className="text-xs font-bold text-[#172B4D] mt-0.5">
                                          {guide.titleTagalog}
                                        </div>
                                        <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">
                                          {guide.meaning}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="text-[10px] font-extrabold text-[#16865C] uppercase tracking-wide mb-1">
                                          Mga Sakit / Sintomas na Ginagamot Dito:
                                        </div>
                                        <ul className="space-y-0.5 pl-4 list-disc text-[#172B4D] font-medium text-[11px]">
                                          {guide.commonSymptoms.map((sym, i) => (
                                            <li key={i}>{sym}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="pt-1.5 border-t border-black/10 flex items-center justify-between text-[11px] text-[#64748B]">
                                        <span>
                                          Doctor:{' '}
                                          <strong className="text-[#172B4D]">{guide.leadDoctor}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <NeuSelect
                    label="Preferred Doctor"
                    required
                    value={draft.doctorId}
                    onChange={(e) => {
                      const docId = e.target.value;
                      const doc = doctors.find((d) => d.id === docId);
                      setDraft((p) => ({
                        ...p,
                        doctorId: docId,
                        departmentId: doc ? doc.departmentId : p.departmentId,
                        startTime: '',
                        endTime: '',
                        timeLabel: '',
                      }));
                    }}
                    error={errors.doctorId}
                    options={[
                      { value: '', label: 'Select a Physician...' },
                      ...availableDoctorsForDepartment.map((doc) => ({
                        value: doc.id,
                        label: `${doc.fullName} — ${doc.specialty} (${doc.status})`,
                      })),
                    ]}
                  />
                </div>

                {/* Selectable Appointment Type Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#172B4D] block">
                    Appointment Type / Clinical Service <span className="text-[#C63D4D]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableTypesForDepartment.map((type) => {
                      const isSelected = draft.appointmentTypeId === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDraft((p) => ({ ...p, appointmentTypeId: type.id }))}
                          className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'neu-btn-primary text-white'
                              : 'neu-btn text-[#172B4D]'
                          }`}
                        >
                          <div className="text-xs font-bold">{type.name}</div>
                          <div
                            className={`text-[11px] mt-0.5 line-clamp-1 ${
                              isSelected ? 'text-white/85' : 'text-[#64748B]'
                            }`}
                          >
                            {type.durationMinutes} mins · {type.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.appointmentTypeId && (
                    <p className="text-xs text-[#C63D4D] font-semibold">{errors.appointmentTypeId}</p>
                  )}
                </div>

                {/* Reason for Visit */}
                <NeuTextarea
                  label="Reason for Visit / Chief Complaint"
                  required
                  rows={3}
                  placeholder="Describe your symptoms, onset, or specific clinical goals for this 1-hour consultation..."
                  value={draft.reasonForVisit}
                  onChange={(e) => setDraft((p) => ({ ...p, reasonForVisit: e.target.value }))}
                  error={errors.reasonForVisit}
                />

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5">
                  <NeuButton
                    type="button"
                    onClick={() => setFormStep(2)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </NeuButton>
                  <NeuButton
                    type="button"
                    variant="primary"
                    onClick={handleNextFormStep}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Choose Calendar Date
                  </NeuButton>
                </div>
              </div>
            )}

            {/* STEP 4: CALENDAR DATE SELECTION */}
            {formStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3478F6]" />
                    <span>Step 4: Select Appointment Date on Calendar</span>
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Choose an available working day for {selectedDoctor?.fullName || 'your selected physician'}.
                  </p>
                </div>

                <DoctorAvailabilityCalendar
                  departments={departments}
                  doctors={doctors}
                  schedules={schedules}
                  appointments={appointments}
                  selectedDepartmentId={draft.departmentId}
                  onSelectDepartment={(deptId) => {
                    const firstDoc = doctors.find((d) => !deptId || d.departmentId === deptId);
                    setDraft((prev) => ({
                      ...prev,
                      departmentId: deptId,
                      doctorId: firstDoc ? firstDoc.id : prev.doctorId,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }));
                  }}
                  selectedDoctorId={draft.doctorId}
                  onSelectDoctor={(docId) => {
                    const doc = doctors.find((d) => d.id === docId);
                    setDraft((prev) => ({
                      ...prev,
                      doctorId: docId,
                      departmentId: doc ? doc.departmentId : prev.departmentId,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }));
                  }}
                  selectedDate={draft.date}
                  onSelectDate={(dateStr) => {
                    if (dateStr < DEMO_TODAY) {
                      setErrors((prev) => ({
                        ...prev,
                        date: 'Hindi pwedeng mag-book sa nakaraang petsa (Past Date). Pumili ng kasalukuyan o susunod na araw.',
                      }));
                      return;
                    }
                    setDraft((prev) => ({
                      ...prev,
                      date: dateStr,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }));
                    setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  selectedSlotStart={draft.startTime}
                  onSelectSlot={(startTime, endTime, timeLabel) => {
                    setDraft((prev) => ({ ...prev, startTime, endTime, timeLabel }));
                    setErrors((prev) => ({ ...prev, startTime: '' }));
                  }}
                  showFilters={false}
                  displaySection="calendar"
                />

                {errors.date && (
                  <p className="text-xs text-[#C63D4D] font-semibold">{errors.date}</p>
                )}

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5">
                  <NeuButton
                    type="button"
                    onClick={() => setFormStep(3)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </NeuButton>
                  <NeuButton
                    type="button"
                    variant="primary"
                    onClick={handleNextFormStep}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Select Time Slot
                  </NeuButton>
                </div>
              </div>
            )}

            {/* STEP 5: TIME SLOT SELECTION & TERMS CONFIRMATION */}
            {formStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#3478F6]" />
                    <span>Step 5: Select Time Slot & Confirm Agreement</span>
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Choose your preferred 1-hour clinic slot on {formatReadableDate(draft.date)} and review the terms to proceed.
                  </p>
                </div>

                <DoctorAvailabilityCalendar
                  departments={departments}
                  doctors={doctors}
                  schedules={schedules}
                  appointments={appointments}
                  selectedDepartmentId={draft.departmentId}
                  onSelectDepartment={(deptId) => {
                    const firstDoc = doctors.find((d) => !deptId || d.departmentId === deptId);
                    setDraft((prev) => ({
                      ...prev,
                      departmentId: deptId,
                      doctorId: firstDoc ? firstDoc.id : prev.doctorId,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }));
                  }}
                  selectedDoctorId={draft.doctorId}
                  onSelectDoctor={(docId) => {
                    const doc = doctors.find((d) => d.id === docId);
                    setDraft((prev) => ({
                      ...prev,
                      doctorId: docId,
                      departmentId: doc ? doc.departmentId : prev.departmentId,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }));
                  }}
                  selectedDate={draft.date}
                  onSelectDate={(dateStr) =>
                    setDraft((prev) => ({
                      ...prev,
                      date: dateStr,
                      startTime: '',
                      endTime: '',
                      timeLabel: '',
                    }))
                  }
                  selectedSlotStart={draft.startTime}
                  onSelectSlot={(startTime, endTime, timeLabel) => {
                    setDraft((prev) => ({ ...prev, startTime, endTime, timeLabel }));
                    setErrors((prev) => ({ ...prev, startTime: '' }));
                  }}
                  showFilters={false}
                  displaySection="slots"
                />

                {/* Live Mini Summary & Mandatory Unchecked Agreement Checkbox */}
                <div className="neu-inset rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172B4D]">Selected Date & 1-Hour Slot:</span>
                    <span className="font-mono-tabular font-semibold text-[#3478F6]">
                      {draft.date ? formatReadableDate(draft.date) : 'No date'} ·{' '}
                      {draft.timeLabel || 'Select a time slot above'}
                    </span>
                  </div>
                  {errors.startTime && (
                    <p className="text-xs text-[#C63D4D] font-semibold">{errors.startTime}</p>
                  )}

                  <label className="flex items-start gap-2.5 text-xs text-[#172B4D] cursor-pointer pt-2 border-t border-black/5">
                    <input
                      type="checkbox"
                      checked={draft.agreedToTerms}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, agreedToTerms: e.target.checked }))
                      }
                      className="mt-0.5 w-4 h-4 accent-[#3478F6]"
                    />
                    <span>
                      I have reviewed my appointment details and agree to the{' '}
                      <button
                        type="button"
                        onClick={onOpenTermsModal}
                        className="text-[#3478F6] font-semibold underline cursor-pointer"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={onOpenPrivacyModal}
                        className="text-[#3478F6] font-semibold underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      . <span className="text-[#C63D4D]">*</span>
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-xs text-[#C63D4D] font-semibold">{errors.agreedToTerms}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-black/5">
                  <NeuButton
                    type="button"
                    onClick={() => setFormStep(4)}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Calendar
                  </NeuButton>
                  <NeuButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review Appointment Summary
                  </NeuButton>
                </div>
              </div>
            )}
          </NeuCard>
        </div>
      </form>
    </div>
  );
};
