export type UserRole = 'guest' | 'patient' | 'doctor' | 'admin';

export type ScreenId =
  // PUBLIC
  | 'landing'
  | 'sign-in'
  | 'create-account'
  | 'forgot-password'
  | 'privacy-policy'
  | 'terms-conditions'
  // PATIENT
  | 'patient-dashboard'
  | 'book-appointment'
  | 'doctor-availability'
  | 'appointment-review'
  | 'booking-confirmation'
  | 'my-appointments'
  | 'patient-appointment-details'
  | 'reschedule-appointment'
  | 'patient-profile'
  | 'medical-information'
  | 'patient-notifications'
  | 'patient-receipts'
  | 'telehealth-assessment'
  // DOCTOR
  | 'doctor-dashboard'
  | 'doctor-calendar'
  | 'doctor-appointment-details'
  | 'appointment-request-review'
  | 'schedule-availability'
  | 'working-hours-breaks'
  | 'blocked-dates-leave'
  | 'doctor-profile'
  | 'doctor-notifications'
  | 'doctor-receipts'
  // ADMIN
  | 'admin-dashboard'
  | 'patient-management'
  | 'admin-patient-details'
  | 'doctor-management'
  | 'admin-doctor-details'
  | 'appointment-management'
  | 'physician-leave-approvals'
  | 'calendar-scheduling-management'
  | 'departments-appointment-types'
  | 'notification-system-settings'
  | 'audit-log'
  | 'admin-receipts';

export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Rejected'
  | 'Reschedule Requested'
  | 'Rescheduled'
  | 'Cancelled'
  | 'Completed';

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  googleVerified: boolean;
  profileLinked: boolean;
  lastLogin: string;
  patientId?: string;
  doctorId?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: 'Female' | 'Male' | 'Intersex / Other' | 'Prefer not to disclose';
  contactNumber: string;
  email: string;
  knownAllergies: string;
  currentMedications: string;
  existingMedicalConditions: string;
  previousMedicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profileCompletionPercent: number;
  updatedAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  title: string;
  departmentId: string;
  departmentName: string;
  specialty: string;
  licenseNumber: string;
  email: string;
  contactNumber: string;
  bio: string;
  consultationFeeLabel: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Resigned';
  deactivatedAt?: string;
  deactivationReason?: string;
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  morningHours: { start: string; end: string }; // '07:00' - '11:00'
  afternoonHours: { start: string; end: string }; // '13:00' - '17:00'
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headDoctorName: string;
  active: boolean;
  doctorCount: number;
}

export interface AppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  departmentIds: string[]; // empty = all departments
  description: string;
  preparationInstructions: string;
  active: boolean;
}

export interface TimeSlot {
  startTime: string; // e.g., '07:00'
  endTime: string;   // e.g., '08:00'
  label: string;     // e.g., '7:00 AM – 8:00 AM'
  period: 'Morning' | 'Afternoon';
  status: 'Available' | 'Booked' | 'Unavailable' | 'Break' | 'Blocked' | 'Past';
  appointmentId?: string;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string; // YYYY-MM-DD
  dayStatus: 'Available' | 'Fully Booked' | 'Doctor Unavailable' | 'Blocked / Leave' | 'Past';
  slots: TimeSlot[];
  isDemoData: boolean;
}

export interface DoctorScheduleBlock {
  id: string;
  doctorId: string;
  type: 'Leave' | 'Blocked Date' | 'Slot Block' | 'Break Override';
  startDate: string;
  endDate: string;
  slotStartTime?: string;
  slotEndTime?: string;
  reason: string;
  status: 'Approved' | 'Pending Approval' | 'Rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface DoctorSchedule {
  doctorId: string;
  timezone: string;
  workingDays: string[];
  pendingWorkingDays?: string[];
  workingDaysApprovalStatus?: 'Approved' | 'Pending Approval' | 'Rejected';
  workingDaysRejectionReason?: string;
  morningStart: string;
  morningEnd: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  maxSlotsPerDay: number;
  blocks: DoctorScheduleBlock[];
}

export interface Appointment {
  id: string;
  referenceNumber: string; // e.g. TH-2026-8492
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientContact: string;
  patientDob: string;
  patientSex: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  consultationMode?: 'Online Appointment' | 'Walk-In';
  googleMeetLink?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // '08:00'
  endTime: string;   // '09:00'
  timeLabel: string; // '8:00 AM – 9:00 AM'
  reasonForVisit: string;
  knownAllergiesSnapshot: string;
  currentMedicationsSnapshot: string;
  existingConditionsSnapshot: string;
  status: AppointmentStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  rescheduleReason?: string;
  doctorInternalNotes?: string;
  consultationSummary?: string;
  delayMinutes?: number;
  estimatedStartTime?: string;
  delayReason?: string;
  delayNotifiedAt?: string;
  patientDelayDecision?: 'waiting' | 'rescheduled';
  createdAt: string;
  updatedAt: string;
  isDemoData: boolean;
}

export type NotificationType =
  | 'New Appointment Request'
  | 'Appointment Confirmation'
  | 'Appointment Rejection'
  | 'Appointment Rescheduling'
  | 'Appointment Cancellation'
  | 'Upcoming Appointment Reminder'
  | 'Consultation Queue Delay'
  | 'Doctor Schedule Change'
  | 'Account & Profile';

export interface NotificationItem {
  id: string;
  recipientRole: UserRole;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  appointmentRef?: string;
  read: boolean;
  createdAt: string;
}

export interface RandomForestClientResult {
  predictedDepartmentId: string;
  predictedDepartmentName: string;
  recommendedDoctorId: string;
  recommendedDoctorName: string;
  recommendedDoctorTitle: string;
  recommendedDoctorSpecialty: string;
  confidencePercent: number;
  urgencyLevel: 'Routine' | 'Prompt Consultation Recommended' | 'Urgent Evaluation Advised';
  treeVotes: Record<string, number>;
  totalTrees: number;
  topFeatures: Array<{ feature: string; importance: number }>;
}

export interface AssessmentClinicalReport {
  isMedicalTopic: boolean;
  hasEnoughInfo: boolean;
  chiefSymptoms: string[];
  recommendedActions: string[];
  risksIfIgnored: string[];
  firstAidSteps: string[];
  doctorRecommendationReason: string;
  randomForest: RandomForestClientResult;
}

export interface AssessmentMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  followUpOptions?: string[];
  clinicalReport?: AssessmentClinicalReport;
}

export interface AssessmentSummary {
  id: string;
  patientId: string;
  createdAt: string;
  chiefSymptoms: string[];
  duration: string;
  severityLevel: 'Routine' | 'Prompt Consultation Recommended' | 'Urgent Evaluation Advised';
  recommendedDepartment: string;
  recommendedAppointmentType: string;
  summaryText: string;
  sharedWithDoctor: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'Appointment' | 'Patient' | 'Doctor' | 'Schedule' | 'System';
  targetReference: string;
  details: string;
}

export interface SystemSettingsConfig {
  clinicName: string;
  timezone: string;
  defaultSlotDurationMinutes: number;
  morningWindow: string;
  afternoonWindow: string;
  minCancellationNoticeHours: number;
  allowPatientReschedule: boolean;
  requireEmailVerification: boolean;
  inAppNotificationsEnabled: boolean;
  emailGatewayStatus: 'Not Configured (Demo Boundary)' | 'Connected';
  djangoBackendStatus: 'Demo Sandbox (Ready for REST Integration)' | 'Connected';
}
