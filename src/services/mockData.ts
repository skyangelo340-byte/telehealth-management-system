import {
  User,
  PatientProfile,
  DoctorProfile,
  Department,
  AppointmentType,
  Appointment,
  DoctorSchedule,
  NotificationItem,
  AssessmentSummary,
  AuditLogEntry,
  SystemSettingsConfig,
  TimeSlot,
  DoctorAvailability,
} from '../types';

export const CLINIC_TIMEZONE = 'America/Los_Angeles (PT)';
export const DEMO_TODAY = '2026-10-06';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-main',
    email: 'admintelehealth@gmail.com',
    password: 'admin123',
    fullName: 'TeleHealth Administrator',
    role: 'admin',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T06:50:00Z',
  },
  {
    id: 'usr-doc-1',
    email: 'dr.marcus.vance@telehealth.com',
    password: 'doctor123',
    fullName: 'Dr. Marcus Vance',
    role: 'doctor',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T07:05:00Z',
    doctorId: 'doc-201',
  },
  {
    id: 'usr-doc-2',
    email: 'dr.hannah.lin@telehealth.com',
    password: 'doctor123',
    fullName: 'Dr. Hannah Lin',
    role: 'doctor',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T07:05:00Z',
    doctorId: 'doc-202',
  },
  {
    id: 'usr-doc-3',
    email: 'dr.julian.thorne@telehealth.com',
    password: 'doctor123',
    fullName: 'Dr. Julian Thorne',
    role: 'doctor',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T07:05:00Z',
    doctorId: 'doc-203',
  },
  {
    id: 'usr-doc-4',
    email: 'dr.amara.okafor@telehealth.com',
    password: 'doctor123',
    fullName: 'Dr. Amara Okafor',
    role: 'doctor',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T07:05:00Z',
    doctorId: 'doc-204',
  },
  {
    id: 'usr-doc-5',
    email: 'dr.soren.lindqvist@telehealth.com',
    password: 'doctor123',
    fullName: 'Dr. Soren Lindqvist',
    role: 'doctor',
    googleVerified: true,
    profileLinked: true,
    lastLogin: '2026-10-06T07:05:00Z',
    doctorId: 'doc-205',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cardio',
    name: 'Cardiology & Vascular Care',
    code: 'CARD',
    description: 'Comprehensive cardiovascular evaluation, hypertension management, and preventive heart screenings.',
    headDoctorName: 'Dr. Marcus Vance',
    active: true,
    doctorCount: 2,
  },
  {
    id: 'dept-general',
    name: 'Internal & General Medicine',
    code: 'GENM',
    description: 'Primary care consultations, chronic disease management, annual physicals, and acute symptom triage.',
    headDoctorName: 'Dr. Hannah Lin',
    active: true,
    doctorCount: 2,
  },
  {
    id: 'dept-dental',
    name: 'Dental & Oral Health',
    code: 'DENT',
    description: 'Preventive dental examinations, oral diagnostics, restorative consultations, and periodontal care.',
    headDoctorName: 'Dr. Julian Thorne',
    active: true,
    doctorCount: 1,
  },
  {
    id: 'dept-derma',
    name: 'Dermatology & Skin Sciences',
    code: 'DERM',
    description: 'Clinical dermatology, rash and lesion diagnostics, eczema management, and teledermatology review.',
    headDoctorName: 'Dr. Amara Okafor',
    active: true,
    doctorCount: 1,
  },
  {
    id: 'dept-lab',
    name: 'Diagnostics & Laboratory Services',
    code: 'LABS',
    description: 'Blood panels, metabolic diagnostics, pre-procedure screening, and physician-guided lab result reviews.',
    headDoctorName: 'Dr. Hannah Lin',
    active: true,
    doctorCount: 1,
  },
];

export const INITIAL_APPOINTMENT_TYPES: AppointmentType[] = [
  {
    id: 'type-general-consult',
    name: 'General Consultation',
    durationMinutes: 60,
    departmentIds: [],
    description: 'Standard 60-minute clinical evaluation for new or ongoing health concerns.',
    preparationInstructions: 'Bring your current medication list and any recent blood pressure or temperature logs.',
    active: true,
  },
  {
    id: 'type-followup',
    name: 'Follow-up Consultation',
    durationMinutes: 60,
    departmentIds: [],
    description: 'Dedicated review of treatment progress, medication adjustments, or post-diagnostic results.',
    preparationInstructions: 'Have your previous consultation reference number and symptom notes available.',
    active: true,
  },
  {
    id: 'type-lab-service',
    name: 'Laboratory Service',
    durationMinutes: 60,
    departmentIds: ['dept-lab', 'dept-general', 'dept-cardio'],
    description: 'Diagnostic specimen collection and clinical pathology consultation.',
    preparationInstructions: 'Fast for 8–10 hours prior if lipid or fasting glucose panels are ordered. Water is permitted.',
    active: true,
  },
  {
    id: 'type-dental-consult',
    name: 'Dental Consultation',
    durationMinutes: 60,
    departmentIds: ['dept-dental'],
    description: 'Comprehensive oral examination, dental pain evaluation, and treatment planning.',
    preparationInstructions: 'Avoid eating 30 minutes prior and note any sensitivity to hot, cold, or pressure.',
    active: true,
  },
  {
    id: 'type-general-checkup',
    name: 'General Check-up',
    durationMinutes: 60,
    departmentIds: ['dept-general', 'dept-cardio'],
    description: 'Preventive wellness screening, vital baseline review, and lifestyle health planning.',
    preparationInstructions: 'Complete your medical history profile section at least 15 minutes before the session.',
    active: true,
  },
  {
    id: 'type-other-approved',
    name: 'Other Clinic-Approved Services',
    durationMinutes: 60,
    departmentIds: [],
    description: 'Specialized clinical clearance, second-opinion review, or multi-disciplinary coordination.',
    preparationInstructions: 'Specify the exact nature of the requested clearance in the Reason for Visit field.',
    active: true,
  },
];

export const INITIAL_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-201',
    userId: 'usr-doc-1',
    fullName: 'Dr. Marcus Vance',
    title: 'MD, FACC — Senior Cardiologist',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology & Vascular Care',
    specialty: 'Non-Invasive Cardiology & Hypertension',
    licenseNumber: 'CA-MED-884120',
    email: 'dr.marcus.vance@telehealth.com',
    contactNumber: '+1 (415) 890-2140',
    bio: '14 years of clinical experience in preventive cardiology, arrhythmia monitoring, and blood pressure optimization.',
    consultationFeeLabel: 'Covered by Clinic Plan / Standard Tier',
    status: 'Active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    morningHours: { start: '07:00', end: '11:00' },
    afternoonHours: { start: '13:00', end: '17:00' },
  },
  {
    id: 'doc-202',
    userId: 'usr-doc-2',
    fullName: 'Dr. Hannah Lin',
    title: 'MD, FACP — Lead Internal Medicine Physician',
    departmentId: 'dept-general',
    departmentName: 'Internal & General Medicine',
    specialty: 'Primary Care & Metabolic Health',
    licenseNumber: 'CA-MED-749312',
    email: 'dr.hannah.lin@telehealth.com',
    contactNumber: '+1 (415) 890-3318',
    bio: 'Board-certified internist focusing on evidence-based primary care, preventive diagnostics, and patient education.',
    consultationFeeLabel: 'Covered by Clinic Plan / Standard Tier',
    status: 'Active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    morningHours: { start: '07:00', end: '11:00' },
    afternoonHours: { start: '13:00', end: '17:00' },
  },
  {
    id: 'doc-203',
    userId: 'usr-doc-3',
    fullName: 'Dr. Julian Thorne',
    title: 'DDS — Clinical Director of Dentistry',
    departmentId: 'dept-dental',
    departmentName: 'Dental & Oral Health',
    specialty: 'Diagnostic & Restorative Dentistry',
    licenseNumber: 'CA-DEN-512098',
    email: 'dr.julian.thorne@telehealth.com',
    contactNumber: '+1 (415) 890-4402',
    bio: 'Specializes in minimally invasive dentistry, temporomandibular joint disorders, and preventive oral care.',
    consultationFeeLabel: 'Dental Care Schedule',
    status: 'Active',
    workingDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    morningHours: { start: '07:00', end: '11:00' },
    afternoonHours: { start: '13:00', end: '17:00' },
  },
  {
    id: 'doc-204',
    userId: 'usr-doc-4',
    fullName: 'Dr. Amara Okafor',
    title: 'MD, FAAD — Consultant Dermatologist',
    departmentId: 'dept-derma',
    departmentName: 'Dermatology & Skin Sciences',
    specialty: 'Medical & Inflammatory Dermatology',
    licenseNumber: 'CA-MED-903411',
    email: 'dr.amara.okafor@telehealth.com',
    contactNumber: '+1 (415) 890-5590',
    bio: 'Expert in atopic dermatitis, psoriasis, pigmentary disorders, and high-resolution teledermatology triage.',
    consultationFeeLabel: 'Specialist Consultation Tier',
    status: 'Active',
    workingDays: ['Mon', 'Wed', 'Thu', 'Fri'],
    morningHours: { start: '08:00', end: '11:00' },
    afternoonHours: { start: '13:00', end: '17:00' },
  },
  {
    id: 'doc-205',
    userId: 'usr-doc-5',
    fullName: 'Dr. Soren Lindqvist',
    title: 'MD — Vascular & Diagnostic Specialist',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology & Vascular Care',
    specialty: 'Echocardiography & Lipidology',
    licenseNumber: 'CA-MED-662104',
    email: 'dr.soren.lindqvist@telehealth.com',
    contactNumber: '+1 (415) 890-6122',
    bio: 'Focused on early cardiovascular risk stratification, familial hypercholesterolemia, and post-care continuity.',
    consultationFeeLabel: 'Covered by Clinic Plan / Standard Tier',
    status: 'On Leave',
    workingDays: ['Tue', 'Wed', 'Thu'],
    morningHours: { start: '07:00', end: '11:00' },
    afternoonHours: { start: '13:00', end: '16:00' },
  },
];

export const INITIAL_PATIENTS: PatientProfile[] = [];

export const INITIAL_SCHEDULES: Record<string, DoctorSchedule> = {
  'doc-201': {
    doctorId: 'doc-201',
    timezone: CLINIC_TIMEZONE,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    morningStart: '07:00',
    morningEnd: '11:00',
    lunchBreakStart: '11:00',
    lunchBreakEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    maxSlotsPerDay: 8,
    blocks: [
      {
        id: 'blk-1',
        doctorId: 'doc-201',
        type: 'Blocked Date',
        startDate: '2026-10-09',
        endDate: '2026-10-09',
        reason: 'Regional Cardiology Board Symposium',
        status: 'Approved',
        createdAt: '2026-09-20T10:00:00Z',
      },
      {
        id: 'blk-2',
        doctorId: 'doc-201',
        type: 'Slot Block',
        startDate: '2026-10-07',
        endDate: '2026-10-07',
        slotStartTime: '15:00',
        slotEndTime: '16:00',
        reason: 'Inpatient Telemetry Review',
        status: 'Approved',
        createdAt: '2026-10-01T12:00:00Z',
      },
    ],
  },
  'doc-202': {
    doctorId: 'doc-202',
    timezone: CLINIC_TIMEZONE,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    morningStart: '07:00',
    morningEnd: '11:00',
    lunchBreakStart: '11:00',
    lunchBreakEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    maxSlotsPerDay: 8,
    blocks: [
      {
        id: 'blk-3',
        doctorId: 'doc-202',
        type: 'Slot Block',
        startDate: '2026-10-08',
        endDate: '2026-10-08',
        slotStartTime: '09:00',
        slotEndTime: '10:00',
        reason: 'Clinical Quality Committee Briefing',
        status: 'Approved',
        createdAt: '2026-10-02T08:00:00Z',
      },
    ],
  },
  'doc-203': {
    doctorId: 'doc-203',
    timezone: CLINIC_TIMEZONE,
    workingDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    morningStart: '07:00',
    morningEnd: '11:00',
    lunchBreakStart: '11:00',
    lunchBreakEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    maxSlotsPerDay: 8,
    blocks: [],
  },
  'doc-204': {
    doctorId: 'doc-204',
    timezone: CLINIC_TIMEZONE,
    workingDays: ['Mon', 'Wed', 'Thu', 'Fri'],
    morningStart: '08:00',
    morningEnd: '11:00',
    lunchBreakStart: '11:00',
    lunchBreakEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    maxSlotsPerDay: 7,
    blocks: [],
  },
  'doc-205': {
    doctorId: 'doc-205',
    timezone: CLINIC_TIMEZONE,
    workingDays: ['Tue', 'Wed', 'Thu'],
    morningStart: '07:00',
    morningEnd: '11:00',
    lunchBreakStart: '11:00',
    lunchBreakEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '16:00',
    maxSlotsPerDay: 7,
    blocks: [
      {
        id: 'blk-4',
        doctorId: 'doc-205',
        type: 'Leave',
        startDate: '2026-10-05',
        endDate: '2026-10-16',
        reason: 'Approved Medical Sabbatical',
        status: 'Approved',
        createdAt: '2026-09-15T09:00:00Z',
      },
    ],
  },
};

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ASSESSMENTS: AssessmentSummary[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-init',
    timestamp: '2026-10-06 07:00:00 PT',
    actorName: 'TeleHealth Administrator',
    actorRole: 'admin',
    action: 'Initialized Production Database',
    targetType: 'System',
    targetReference: 'FIRESTORE-DB',
    details: 'Configured TeleHealth database with verified Admin account and Physician roster.',
  },
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettingsConfig = {
  clinicName: 'TeleHealth Medical Group — Main Outpatient Center',
  timezone: CLINIC_TIMEZONE,
  defaultSlotDurationMinutes: 60,
  morningWindow: '07:00 AM – 11:00 AM (4 x 1-Hour Slots)',
  afternoonWindow: '01:00 PM – 05:00 PM (4 x 1-Hour Slots)',
  minCancellationNoticeHours: 24,
  allowPatientReschedule: true,
  requireEmailVerification: true,
  inAppNotificationsEnabled: true,
  emailGatewayStatus: 'Connected (Gmail API)',
  djangoBackendStatus: 'Connected (Cloud Firestore Database)',
};

export const STANDARD_CLINIC_SLOTS: Array<{
  startTime: string;
  endTime: string;
  label: string;
  period: 'Morning' | 'Afternoon';
}> = [
  { startTime: '07:00', endTime: '08:00', label: '7:00 AM – 8:00 AM', period: 'Morning' },
  { startTime: '08:00', endTime: '09:00', label: '8:00 AM – 9:00 AM', period: 'Morning' },
  { startTime: '09:00', endTime: '10:00', label: '9:00 AM – 10:00 AM', period: 'Morning' },
  { startTime: '10:00', endTime: '11:00', label: '10:00 AM – 11:00 AM', period: 'Morning' },
  { startTime: '13:00', endTime: '14:00', label: '1:00 PM – 2:00 PM', period: 'Afternoon' },
  { startTime: '14:00', endTime: '15:00', label: '2:00 PM – 3:00 PM', period: 'Afternoon' },
  { startTime: '15:00', endTime: '16:00', label: '3:00 PM – 4:00 PM', period: 'Afternoon' },
  { startTime: '16:00', endTime: '17:00', label: '4:00 PM – 5:00 PM', period: 'Afternoon' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDayOfWeekShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return DAY_NAMES[dt.getDay()];
}

export function computeDoctorAvailabilityForDate(
  doctorId: string,
  dateStr: string,
  doctors: DoctorProfile[],
  schedules: Record<string, DoctorSchedule>,
  appointments: Appointment[]
): DoctorAvailability {
  const doctor = doctors.find((d) => d.id === doctorId);
  const schedule = schedules[doctorId];

  // Past date check relative to DEMO_TODAY (2026-10-06)
  if (dateStr < DEMO_TODAY) {
    return {
      doctorId,
      date: dateStr,
      dayStatus: 'Past',
      slots: STANDARD_CLINIC_SLOTS.map((s) => ({ ...s, status: 'Past' })),
      isDemoData: true,
    };
  }

  if (!doctor || !schedule) {
    return {
      doctorId,
      date: dateStr,
      dayStatus: 'Doctor Unavailable',
      slots: STANDARD_CLINIC_SLOTS.map((s) => ({ ...s, status: 'Unavailable' })),
      isDemoData: true,
    };
  }

  // Check if doctor is on full-day leave or blocked date
  const fullDayBlock = schedule.blocks.find(
    (b) =>
      (b.type === 'Leave' || b.type === 'Blocked Date') &&
      dateStr >= b.startDate &&
      dateStr <= b.endDate
  );

  if (fullDayBlock || doctor.status === 'On Leave' || doctor.status === 'Inactive') {
    return {
      doctorId,
      date: dateStr,
      dayStatus: 'Blocked / Leave',
      slots: STANDARD_CLINIC_SLOTS.map((s) => ({ ...s, status: 'Blocked' })),
      isDemoData: true,
    };
  }

  const dayShort = getDayOfWeekShort(dateStr);
  if (!schedule.workingDays.includes(dayShort)) {
    return {
      doctorId,
      date: dateStr,
      dayStatus: 'Doctor Unavailable',
      slots: STANDARD_CLINIC_SLOTS.map((s) => ({ ...s, status: 'Unavailable' })),
      isDemoData: true,
    };
  }

  // Active appointments for this doctor on this date (Pending, Confirmed, Reschedule Requested, Rescheduled occupy the slot)
  const activeStatuses = ['Pending', 'Confirmed', 'Reschedule Requested', 'Rescheduled'];
  const dayAppointments = appointments.filter(
    (a) => a.doctorId === doctorId && a.date === dateStr && activeStatuses.includes(a.status)
  );

  const slots: TimeSlot[] = STANDARD_CLINIC_SLOTS.map((slot) => {
    // Check working hours window
    const inMorning =
      slot.period === 'Morning' &&
      slot.startTime >= schedule.morningStart &&
      slot.endTime <= schedule.morningEnd;
    const inAfternoon =
      slot.period === 'Afternoon' &&
      slot.startTime >= schedule.afternoonStart &&
      slot.endTime <= schedule.afternoonEnd;

    if (!inMorning && !inAfternoon) {
      return { ...slot, status: 'Unavailable' };
    }

    // Check individual slot block
    const slotBlocked = schedule.blocks.find(
      (b) =>
        b.type === 'Slot Block' &&
        dateStr >= b.startDate &&
        dateStr <= b.endDate &&
        b.slotStartTime === slot.startTime
    );
    if (slotBlocked) {
      return { ...slot, status: 'Blocked' };
    }

    // Check booked appointments
    const bookedApt = dayAppointments.find((a) => a.startTime === slot.startTime);
    if (bookedApt) {
      return { ...slot, status: 'Booked', appointmentId: bookedApt.id };
    }

    return { ...slot, status: 'Available' };
  });

  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const dayStatus = availableCount === 0 ? 'Fully Booked' : 'Available';

  return {
    doctorId,
    date: dateStr,
    dayStatus,
    slots,
    isDemoData: true,
  };
}

export function calculateAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const parts = dob.split('-');
  if (parts.length !== 3) return null;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

  // Reference date: 2026-10-06
  const refYear = 2026;
  const refMonth = 10;
  const refDay = 6;

  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age -= 1;
  }
  return age >= 0 ? age : -1;
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
