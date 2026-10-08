import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  ScreenId,
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
} from './types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_APPOINTMENT_TYPES,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_SCHEDULES,
  INITIAL_APPOINTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  DEMO_TODAY,
  computeDoctorAvailabilityForDate,
  formatReadableDate,
} from './services/mockData';
import {
  simulateNetworkDelay,
  validateSlotCanBeBooked,
  generateAppointmentReference,
} from './services/api';
import { initAuth, logoutGoogle } from './services/googleAuth';
import {
  seedInitialFirestoreData,
  subscribeToCollection,
  saveUserToDb,
  savePatientToDb,
  saveDoctorToDb,
  deleteDoctorFromDb,
  saveScheduleToDb,
  saveAppointmentToDb,
  saveDepartmentToDb,
  saveAppointmentTypeToDb,
  saveNotificationToDb,
  saveAuditLogToDb,
  saveSystemSettingsToDb,
} from './services/firestoreService';
import { AppShell } from './components/layout/AppShell';
import { PublicPages } from './pages/public/PublicPages';
import {
  PatientBookingFlow,
  BookingDraftState,
} from './pages/patient/PatientBookingFlow';
import { PatientPortalPages } from './pages/patient/PatientPortalPages';
import { DoctorPortalPages } from './pages/doctor/DoctorPortalPages';
import { AdminPortalPages } from './pages/admin/AdminPortalPages';
import {
  PrivacyPolicyModal,
  TermsConditionsModal,
  GoogleSignInResultModal,
  CancelAppointmentModal,
  RejectAppointmentModal,
  RescheduleAppointmentModal,
} from './components/modals/SystemDialogs';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('guest');
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [pendingBookingIntent, setPendingBookingIntent] = useState(false);

  // Domain state stores synced with Firestore
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    INITIAL_APPOINTMENT_TYPES
  );
  const [doctors, setDoctors] = useState<DoctorProfile[]>(INITIAL_DOCTORS);
  const [patients, setPatients] = useState<PatientProfile[]>(INITIAL_PATIENTS);
  const [schedules, setSchedules] = useState<Record<string, DoctorSchedule>>(() => {
    try {
      const saved = localStorage.getItem('telehealth_schedules_cache_v1');
      if (saved) {
        return { ...INITIAL_SCHEDULES, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SCHEDULES;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>(INITIAL_ASSESSMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettingsConfig>(
    INITIAL_SYSTEM_SETTINGS
  );

  useEffect(() => {
    const unsubscribeAuth = initAuth();
    seedInitialFirestoreData();

    const unsubUsers = subscribeToCollection<User>('users', (dbUsers) => {
      if (dbUsers.length > 0) setUsers(dbUsers);
    });
    const unsubPatients = subscribeToCollection<PatientProfile>('patients', (dbPatients) => {
      setPatients(dbPatients);
    });
    const unsubDoctors = subscribeToCollection<DoctorProfile>('doctors', (dbDoctors) => {
      if (dbDoctors.length > 0) setDoctors(dbDoctors);
    });
    const unsubSchedules = subscribeToCollection<DoctorSchedule>('schedules', (dbSchedules) => {
      if (dbSchedules.length > 0) {
        const map: Record<string, DoctorSchedule> = {};
        dbSchedules.forEach((s) => {
          map[s.doctorId] = s;
        });
        setSchedules((prev) => {
          const next = { ...prev, ...map };
          try {
            localStorage.setItem('telehealth_schedules_cache_v1', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    });
    const unsubAppointments = subscribeToCollection<Appointment>('appointments', (dbApts) => {
      const sorted = [...dbApts].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      setAppointments(sorted);
    });
    const unsubDepts = subscribeToCollection<Department>('departments', (dbDepts) => {
      if (dbDepts.length > 0) setDepartments(dbDepts);
    });
    const unsubTypes = subscribeToCollection<AppointmentType>('appointmentTypes', (dbTypes) => {
      if (dbTypes.length > 0) setAppointmentTypes(dbTypes);
    });
    const unsubNotifs = subscribeToCollection<NotificationItem>('notifications', (dbNotifs) => {
      const sorted = [...dbNotifs].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      setNotifications(sorted);
    });
    const unsubLogs = subscribeToCollection<AuditLogEntry>('auditLogs', (dbLogs) => {
      if (dbLogs.length > 0) {
        setAuditLogs(dbLogs);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubPatients();
      unsubDoctors();
      unsubSchedules();
      unsubAppointments();
      unsubDepts();
      unsubTypes();
      unsubNotifs();
      unsubLogs();
    };
  }, []);

  const fallbackPatient: PatientProfile = {
    id: loggedInUser?.patientId || 'pat-current',
    userId: loggedInUser?.id || 'usr-current',
    fullName: loggedInUser?.fullName || '',
    dateOfBirth: '1995-01-01',
    sex: 'Prefer not to disclose',
    contactNumber: '',
    email: loggedInUser?.email || '',
    knownAllergies: 'None reported',
    currentMedications: 'None reported',
    existingMedicalConditions: 'None reported',
    previousMedicalHistory: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    profileCompletionPercent: 75,
    updatedAt: new Date().toISOString(),
  };

  // Active authenticated patient & doctor records matched to loggedInUser
  const activePatient =
    patients.find(
      (p) =>
        (loggedInUser?.patientId && p.id === loggedInUser.patientId) ||
        (loggedInUser?.id && p.userId === loggedInUser.id) ||
        (loggedInUser?.email && p.email.toLowerCase() === loggedInUser.email.toLowerCase())
    ) || fallbackPatient;

  const activeDoctor =
    doctors.find(
      (d) =>
        (loggedInUser?.doctorId && d.id === loggedInUser.doctorId) ||
        (loggedInUser?.id && d.userId === loggedInUser.id) ||
        (loggedInUser?.email && d.email.toLowerCase() === loggedInUser.email.toLowerCase())
    ) || doctors[0];

  const currentUser: User | null = loggedInUser
    ? {
        ...loggedInUser,
        patientId: loggedInUser.patientId || (currentRole === 'patient' ? activePatient.id : undefined),
        doctorId: loggedInUser.doctorId || (currentRole === 'doctor' ? activeDoctor?.id : undefined),
      }
    : null;

  // Booking form draft state (preserved across backward/forward navigation)
  const [bookingDraft, setBookingDraft] = useState<BookingDraftState>({
    fullName: activePatient.fullName,
    dateOfBirth: activePatient.dateOfBirth,
    sex: activePatient.sex,
    contactNumber: activePatient.contactNumber,
    email: activePatient.email,
    knownAllergies: activePatient.knownAllergies,
    currentMedications: activePatient.currentMedications,
    existingMedicalConditions: activePatient.existingMedicalConditions,
    previousMedicalHistory: activePatient.previousMedicalHistory || '',
    emergencyContactName: activePatient.emergencyContactName || '',
    emergencyContactPhone: activePatient.emergencyContactPhone || '',
    departmentId: 'dept-cardio',
    doctorId: 'doc-201',
    appointmentTypeId: 'type-general-consult',
    consultationMode: 'Online Appointment',
    date: DEMO_TODAY,
    startTime: '08:00',
    endTime: '09:00',
    timeLabel: '8:00 AM – 9:00 AM',
    reasonForVisit: '',
    agreedToTerms: false,
  });

  const [lastBookedAppointment, setLastBookedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    appointments[0] || null
  );

  // Global modal states
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [googleModalScenario, setGoogleModalScenario] = useState<
    'verified-patient' | 'new-onboarding' | 'cancelled' | 'conflict' | null
  >(null);
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [rejectModalApt, setRejectModalApt] = useState<Appointment | null>(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);

  const appendAuditLog = (
    actorName: string,
    actorRole: UserRole,
    action: string,
    targetType: AuditLogEntry['targetType'],
    targetReference: string,
    details: string
  ) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: '2026-10-06 Just Now PT',
      actorName,
      actorRole,
      action,
      targetType,
      targetReference,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev]);
    saveAuditLogToDb(entry);
  };

  // Handle Guest clicking "Book an Appointment"
  const handleGuestBookClick = () => {
    if (currentRole === 'guest') {
      setPendingBookingIntent(true);
      setCurrentScreen('sign-in');
    } else {
      setCurrentScreen('book-appointment');
    }
  };

  const routeAuthenticatedUser = (user: User, matchedPatient?: PatientProfile) => {
    setLoggedInUser(user);
    setCurrentRole(user.role);

    if (user.role === 'patient') {
      const pat =
        matchedPatient ||
        patients.find(
          (p) =>
            p.id === user.patientId ||
            p.userId === user.id ||
            p.email.toLowerCase() === user.email.toLowerCase()
        );
      if (pat) {
        setBookingDraft((prev) => ({
          ...prev,
          fullName: pat.fullName,
          dateOfBirth: pat.dateOfBirth,
          sex: pat.sex,
          contactNumber: pat.contactNumber,
          email: pat.email,
          knownAllergies: pat.knownAllergies,
          currentMedications: pat.currentMedications,
          existingMedicalConditions: pat.existingMedicalConditions,
          previousMedicalHistory: pat.previousMedicalHistory || '',
          emergencyContactName: pat.emergencyContactName || '',
          emergencyContactPhone: pat.emergencyContactPhone || '',
        }));
      } else {
        setBookingDraft((prev) => ({
          ...prev,
          fullName: user.fullName,
          email: user.email,
        }));
      }

      if (pendingBookingIntent) {
        setPendingBookingIntent(false);
        setCurrentScreen('book-appointment');
      } else {
        setCurrentScreen('patient-dashboard');
      }
    } else if (user.role === 'doctor') {
      setCurrentScreen('doctor-dashboard');
    } else if (user.role === 'admin') {
      setCurrentScreen('admin-dashboard');
    }
  };

  const handleAuthenticateCredentials = (
    emailInput: string,
    passwordInput: string
  ): { success: boolean; error?: string } => {
    const normalizedEmail = emailInput.trim().toLowerCase();

    // Check explicit Admin account credential
    if (normalizedEmail === 'admintelehealth@gmail.com') {
      const adminRecord = users.find(
        (u) => u.email.toLowerCase() === 'admintelehealth@gmail.com'
      );
      const expectedPass = adminRecord?.password || 'admin123';
      if (passwordInput !== expectedPass) {
        return { success: false, error: 'Incorrect password for Administrator account.' };
      }
      const adminUser: User = adminRecord || {
        id: 'usr-admin-main',
        email: 'admintelehealth@gmail.com',
        password: expectedPass,
        fullName: 'TeleHealth Administrator',
        role: 'admin',
        googleVerified: true,
        profileLinked: true,
        lastLogin: new Date().toISOString(),
      };
      routeAuthenticatedUser(adminUser);
      return { success: true };
    }

    // Look up in users collection
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (!matchedUser) {
      return {
        success: false,
        error: 'Account not found. Please check your email or click Create Account.',
      };
    }

    if (matchedUser.password && matchedUser.password !== passwordInput) {
      return {
        success: false,
        error: 'Invalid password. Please try again or use Forgot Password.',
      };
    }

    if (matchedUser.role === 'doctor') {
      const linkedDoc = doctors.find(
        (d) =>
          d.id === matchedUser.doctorId ||
          d.userId === matchedUser.id ||
          d.email.trim().toLowerCase() === normalizedEmail
      );
      if (linkedDoc && (linkedDoc.status === 'Inactive' || linkedDoc.status === 'Resigned')) {
        return {
          success: false,
          error: `Your physician account is currently ${linkedDoc.status} and cannot sign in. Please contact the clinic administrator.`,
        };
      }
    }

    const updatedUser: User = {
      ...matchedUser,
      lastLogin: new Date().toISOString(),
    };
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveUserToDb(updatedUser);
    routeAuthenticatedUser(updatedUser);
    return { success: true };
  };

  const handleRegisterPatientAccount = (
    fullName: string,
    emailInput: string,
    phone: string,
    passwordInput: string
  ): { success: boolean; error?: string } => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (normalizedEmail === 'admintelehealth@gmail.com') {
      return {
        success: false,
        error: 'This email is reserved for the System Administrator. Please use a different email.',
      };
    }
    const existingDoctor = doctors.find((d) => d.email.trim().toLowerCase() === normalizedEmail);
    if (existingDoctor) {
      return {
        success: false,
        error: 'This email is already registered as a Physician account. Please use a different email for a Patient account.',
      };
    }
    const existingUser = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
    const existingPatient = patients.find((p) => p.email.trim().toLowerCase() === normalizedEmail);
    if (existingUser || existingPatient) {
      return {
        success: false,
        error: `An account with this email already exists (${existingUser?.role || 'patient'} account). Please sign in instead or use a different email.`,
      };
    }

    const ts = Date.now();
    const userId = `usr-pat-${ts}`;
    const patientId = `pat-${ts}`;

    const newUser: User = {
      id: userId,
      email: emailInput.trim(),
      password: passwordInput,
      fullName: fullName.trim(),
      role: 'patient',
      googleVerified: false,
      profileLinked: true,
      lastLogin: new Date().toISOString(),
      patientId,
    };

    const newPatient: PatientProfile = {
      id: patientId,
      userId,
      fullName: fullName.trim(),
      dateOfBirth: '1995-01-01',
      sex: 'Prefer not to disclose',
      contactNumber: phone.trim(),
      email: emailInput.trim(),
      knownAllergies: 'None reported',
      currentMedications: 'None reported',
      existingMedicalConditions: 'None reported',
      previousMedicalHistory: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      profileCompletionPercent: 80,
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setPatients((prev) => [...prev, newPatient]);
    saveUserToDb(newUser);
    savePatientToDb(newPatient);
    appendAuditLog(
      newPatient.fullName,
      'patient',
      'Registered Patient Account',
      'Patient',
      newPatient.id.toUpperCase(),
      `Created patient account (${newPatient.email}).`
    );

    routeAuthenticatedUser(newUser, newPatient);
    return { success: true };
  };

  const handleGoogleLoginSuccess = (
    emailInput: string,
    displayName: string
  ): { success: boolean; error?: string } => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (
      normalizedEmail === 'admintelehealth@gmail.com' ||
      normalizedEmail === 'telehealthotp@gmail.com'
    ) {
      const adminUser: User =
        users.find((u) => u.email.toLowerCase() === 'admintelehealth@gmail.com') || {
          id: 'usr-admin-main',
          email: normalizedEmail,
          fullName: 'TeleHealth Administrator',
          role: 'admin',
          googleVerified: true,
          profileLinked: true,
          lastLogin: new Date().toISOString(),
        };
      routeAuthenticatedUser(adminUser);
      return { success: true };
    }

    // Check if email belongs to an active Doctor profile first
    const matchedDoctorProfile = doctors.find(
      (d) => d.email.trim().toLowerCase() === normalizedEmail
    );
    const existingDocUser = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.role === 'doctor'
    );
    if (existingDocUser || matchedDoctorProfile) {
      if (
        matchedDoctorProfile &&
        (matchedDoctorProfile.status === 'Inactive' || matchedDoctorProfile.status === 'Resigned')
      ) {
        return {
          success: false,
          error: `Your physician account (${matchedDoctorProfile.email}) is marked as ${matchedDoctorProfile.status} and login access has been deactivated.`,
        };
      }
      const resolvedDocUser: User = existingDocUser || {
        id: matchedDoctorProfile!.userId || `usr-doc-${Date.now()}`,
        email: matchedDoctorProfile!.email,
        fullName: matchedDoctorProfile!.fullName,
        role: 'doctor',
        googleVerified: true,
        profileLinked: true,
        lastLogin: new Date().toISOString(),
        doctorId: matchedDoctorProfile!.id,
      };
      routeAuthenticatedUser(resolvedDocUser);
      return { success: true };
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      routeAuthenticatedUser(existingUser);
      return { success: true };
    }

    // Auto-create patient account on first Google sign-in
    const ts = Date.now();
    const userId = `usr-pat-${ts}`;
    const patientId = `pat-${ts}`;
    const newUser: User = {
      id: userId,
      email: emailInput.trim(),
      fullName: displayName.trim() || 'Patient',
      role: 'patient',
      googleVerified: true,
      profileLinked: true,
      lastLogin: new Date().toISOString(),
      patientId,
    };
    const newPatient: PatientProfile = {
      id: patientId,
      userId,
      fullName: displayName.trim() || 'Patient',
      dateOfBirth: '1995-01-01',
      sex: 'Prefer not to disclose',
      contactNumber: '',
      email: emailInput.trim(),
      knownAllergies: 'None reported',
      currentMedications: 'None reported',
      existingMedicalConditions: 'None reported',
      previousMedicalHistory: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      profileCompletionPercent: 75,
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setPatients((prev) => [...prev, newPatient]);
    saveUserToDb(newUser);
    savePatientToDb(newPatient);
    routeAuthenticatedUser(newUser, newPatient);
    return { success: true };
  };

  const handleResetUserPassword = (emailInput: string, newPassword: string) => {
    const normalized = emailInput.trim().toLowerCase();
    const target = users.find((u) => u.email.toLowerCase() === normalized);
    if (target) {
      const updated: User = { ...target, password: newPassword };
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      saveUserToDb(updated);
    }
  };

  const handleSwitchDemoRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'patient') setCurrentScreen('patient-dashboard');
    if (role === 'doctor') setCurrentScreen('doctor-dashboard');
    if (role === 'admin') setCurrentScreen('admin-dashboard');
    if (role === 'guest') setCurrentScreen('landing');
  };

  // Transaction-safe Booking Submission
  const handleSubmitBooking = async (): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: string;
  }> => {
    await simulateNetworkDelay(300);

    const currentAvail = computeDoctorAvailabilityForDate(
      bookingDraft.doctorId,
      bookingDraft.date,
      doctors,
      schedules,
      appointments
    );
    const check = validateSlotCanBeBooked(currentAvail, bookingDraft.startTime);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    const doc = doctors.find((d) => d.id === bookingDraft.doctorId) || doctors[0];
    const dept = departments.find((d) => d.id === bookingDraft.departmentId) || departments[0];
    const aptType =
      appointmentTypes.find((t) => t.id === bookingDraft.appointmentTypeId) ||
      appointmentTypes[0];

    const refNum = generateAppointmentReference(appointments);
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      referenceNumber: refNum,
      patientId: activePatient.id,
      patientName: bookingDraft.fullName,
      patientEmail: bookingDraft.email,
      patientContact: bookingDraft.contactNumber,
      patientDob: bookingDraft.dateOfBirth,
      patientSex: bookingDraft.sex,
      doctorId: doc.id,
      doctorName: doc.fullName,
      departmentId: dept.id,
      departmentName: dept.name,
      appointmentTypeId: aptType.id,
      appointmentTypeName: aptType.name,
      consultationMode: bookingDraft.consultationMode || 'Online Appointment',
      date: bookingDraft.date,
      startTime: bookingDraft.startTime,
      endTime: bookingDraft.endTime,
      timeLabel: bookingDraft.timeLabel,
      reasonForVisit: bookingDraft.reasonForVisit,
      knownAllergiesSnapshot: bookingDraft.knownAllergies || 'None reported',
      currentMedicationsSnapshot: bookingDraft.currentMedications || 'None reported',
      existingConditionsSnapshot: bookingDraft.existingMedicalConditions || 'None reported',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoData: true,
    };

    setAppointments((prev) => [newApt, ...prev]);
    saveAppointmentToDb(newApt);
    setLastBookedAppointment(newApt);
    setSelectedAppointment(newApt);

    const patNotif: NotificationItem = {
      id: `notif-${Date.now()}-pat`,
      recipientRole: 'patient',
      recipientId: activePatient.id,
      type: 'New Appointment Request',
      title: `Booking Request Submitted — ${refNum}`,
      message: `Your ${aptType.name} request with ${doc.fullName} on ${formatReadableDate(newApt.date)} (${newApt.timeLabel}) is pending confirmation.`,
      appointmentId: newApt.id,
      appointmentRef: refNum,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const docNotif: NotificationItem = {
      id: `notif-${Date.now()}-doc`,
      recipientRole: 'doctor',
      recipientId: doc.id,
      type: 'New Appointment Request',
      title: `New Pending Request — ${refNum}`,
      message: `${bookingDraft.fullName} requested ${newApt.timeLabel} on ${formatReadableDate(newApt.date)}.`,
      appointmentId: newApt.id,
      appointmentRef: refNum,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Notify Patient & Doctor
    setNotifications((prev) => [patNotif, docNotif, ...prev]);
    saveNotificationToDb(patNotif);
    saveNotificationToDb(docNotif);

    appendAuditLog(
      bookingDraft.fullName,
      'patient',
      'Submitted Appointment Request',
      'Appointment',
      refNum,
      `Reserved 1-hour slot ${newApt.timeLabel} on ${newApt.date} with ${doc.fullName}.`
    );

    return { success: true, appointment: newApt };
  };

  // Appointment Status Handlers
  const handleConfirmAppointment = (aptId: string, meetLinkOverride?: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;

    const isOnline = (target.consultationMode || 'Online Appointment') === 'Online Appointment';
    const resolvedMeetLink = isOnline
      ? (meetLinkOverride?.trim() ||
          target.googleMeetLink ||
          `https://meet.google.com/thc-${target.referenceNumber.slice(-4).toLowerCase()}-med`)
      : undefined;

    const updatedApt: Appointment = {
      ...target,
      status: 'Confirmed',
      googleMeetLink: resolvedMeetLink ?? target.googleMeetLink,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipientRole: 'patient',
      recipientId: target.patientId,
      type: 'Appointment Confirmation',
      title: `Appointment Confirmed — ${target.referenceNumber}`,
      message: isOnline
        ? `${target.doctorName} confirmed your Online Appointment for ${formatReadableDate(target.date)} at ${target.timeLabel}. Google Meet Link: ${resolvedMeetLink}`
        : `${target.doctorName} confirmed your Walk-In ${target.appointmentTypeName} for ${formatReadableDate(target.date)} at ${target.timeLabel}.`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDb(notif);

    appendAuditLog(
      currentUser?.fullName || 'Clinician',
      currentRole,
      'Confirmed Appointment',
      'Appointment',
      target.referenceNumber,
      isOnline
        ? `Confirmed ${target.timeLabel} on ${target.date} and dispatched Google Meet link (${resolvedMeetLink}).`
        : `Confirmed Walk-In slot ${target.timeLabel} on ${target.date}.`
    );
  };

  const handleSaveMeetLink = (aptId: string, meetLink: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;
    const cleanLink = meetLink.trim();

    const updatedApt: Appointment = {
      ...target,
      googleMeetLink: cleanLink,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    if (cleanLink) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}-meet`,
        recipientRole: 'patient',
        recipientId: target.patientId,
        type: 'Appointment Confirmation',
        title: `Google Meet Link Sent — ${target.referenceNumber}`,
        message: `${target.doctorName} sent the Google Meet link for your Online Appointment on ${formatReadableDate(target.date)} (${target.timeLabel}): ${cleanLink}`,
        appointmentId: target.id,
        appointmentRef: target.referenceNumber,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToDb(notif);
    }
  };

  const handleRejectAppointment = (aptId: string, reason: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;

    const updatedApt: Appointment = {
      ...target,
      status: 'Rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipientRole: 'patient',
      recipientId: target.patientId,
      type: 'Appointment Rejection',
      title: `Booking Request Update — ${target.referenceNumber}`,
      message: `Your request for ${formatReadableDate(target.date)} could not be confirmed: ${reason}`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDb(notif);

    appendAuditLog(
      currentUser?.fullName || 'Doctor',
      currentRole,
      'Rejected Appointment Request',
      'Appointment',
      target.referenceNumber,
      `Reason: ${reason}`
    );
    setRejectModalApt(null);
  };

  const handleCancelAppointment = (aptId: string, reason: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;

    const updatedApt: Appointment = {
      ...target,
      status: 'Cancelled',
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipientRole: currentRole === 'patient' ? 'doctor' : 'patient',
      recipientId: currentRole === 'patient' ? target.doctorId : target.patientId,
      type: 'Appointment Cancellation',
      title: `Appointment Cancelled — ${target.referenceNumber}`,
      message: `Slot ${target.timeLabel} on ${formatReadableDate(target.date)} was cancelled and released. Reason: ${reason}`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDb(notif);

    appendAuditLog(
      currentUser?.fullName || 'User',
      currentRole,
      'Cancelled Appointment',
      'Appointment',
      target.referenceNumber,
      `Released 1-hour slot ${target.timeLabel} on ${target.date}. Reason: ${reason}`
    );
    setCancelModalApt(null);
  };

  const handleRescheduleAppointment = (
    aptId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newLabel: string,
    reason: string
  ) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;

    const nextStatus = currentRole === 'patient' ? 'Reschedule Requested' : 'Rescheduled';

    const updatedApt: Appointment = {
      ...target,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      timeLabel: newLabel,
      status: nextStatus,
      rescheduleReason: reason,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipientRole: currentRole === 'patient' ? 'doctor' : 'patient',
      recipientId: currentRole === 'patient' ? target.doctorId : target.patientId,
      type: 'Appointment Rescheduling',
      title: `${nextStatus} — ${target.referenceNumber}`,
      message: `Updated to ${formatReadableDate(newDate)} (${newLabel}). Reason: ${reason}`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDb(notif);

    appendAuditLog(
      currentUser?.fullName || 'User',
      currentRole,
      nextStatus,
      'Appointment',
      target.referenceNumber,
      `Moved to ${newDate} (${newLabel}). Reason: ${reason}`
    );
    setRescheduleModalApt(null);
  };

  const handleCompleteAppointment = (
    aptId: string,
    summary: string,
    internalNotes: string
  ) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;

    const cleanPrescription = summary.trim();
    if (!cleanPrescription) {
      return;
    }

    const updatedApt: Appointment = {
      ...target,
      status: 'Completed',
      consultationSummary: cleanPrescription,
      doctorInternalNotes: internalNotes,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-rx`,
      recipientRole: 'patient',
      recipientId: target.patientId,
      type: 'Appointment Confirmation',
      title: `Consultation Completed & Reseta Issued — RX-${target.referenceNumber}`,
      message: `${activeDoctor.fullName} completed your consultation and issued your official medical prescription (Reseta): "${cleanPrescription}". You can view and download the PDF in Prescriptions (Rx).`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToDb(notif);

    appendAuditLog(
      activeDoctor.fullName,
      'doctor',
      'Completed Consultation & Issued Reseta',
      'Appointment',
      target.referenceNumber,
      `Issued e-Rx prescription (RX-${target.referenceNumber}) and marked consultation Completed.`
    );
  };

  const handleSaveInternalNotes = (aptId: string, notes: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;
    const updatedApt: Appointment = { ...target, doctorInternalNotes: notes };
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);
  };

  // Consultation Overrun / Queue Delay Handler (when an earlier patient exceeds scheduled time)
  const formatMinutesToTime12h = (time24: string, addMins: number): string => {
    const [hStr, mStr] = (time24 || '08:00').split(':');
    const totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10) + addMins;
    const h24 = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleReportConsultationDelay = (
    currentAptId: string,
    delayMinutes: number,
    customReason?: string
  ): { affectedCount: number; affectedNames: string[] } => {
    const currentApt = appointments.find((a) => a.id === currentAptId);
    if (!currentApt) return { affectedCount: 0, affectedNames: [] };

    const reasonText =
      customReason?.trim() ||
      `Ang naunang pasyente ni ${currentApt.doctorName} ay nag-extend ng konsultasyon (+${delayMinutes} mins).`;

    // Find all upcoming appointments for the same doctor on the same date that start at or after the current appointment
    // If none found after this slot on the same date, apply to the target appointment itself if it's upcoming, or all other active appointments on that date
    let affectedList = appointments.filter(
      (a) =>
        a.id !== currentApt.id &&
        a.doctorId === currentApt.doctorId &&
        a.date === currentApt.date &&
        (a.status === 'Confirmed' || a.status === 'Rescheduled' || a.status === 'Pending') &&
        a.startTime >= currentApt.startTime
    );

    // If the doctor clicked "Notify Delay" directly on the waiting patient's own card, or if there's only 1 appointment on that date
    if (affectedList.length === 0) {
      affectedList = [currentApt];
    }

    const affectedIds = new Set(affectedList.map((a) => a.id));
    const nowIso = new Date().toISOString();
    const newNotifications: NotificationItem[] = [];

    setAppointments((prev) =>
      prev.map((a) => {
        if (!affectedIds.has(a.id)) return a;
        const estStart = formatMinutesToTime12h(a.startTime, delayMinutes);
        const updated: Appointment = {
          ...a,
          delayMinutes,
          estimatedStartTime: estStart,
          delayReason: reasonText,
          delayNotifiedAt: nowIso,
          updatedAt: nowIso,
        };
        saveAppointmentToDb(updated);
        if (selectedAppointment?.id === a.id) {
          setSelectedAppointment(updated);
        }
        return updated;
      })
    );

    affectedList.forEach((affectedApt, idx) => {
      const estStart = formatMinutesToTime12h(affectedApt.startTime, delayMinutes);
      const patNotif: NotificationItem = {
        id: `notif-delay-${Date.now()}-${idx}`,
        recipientRole: 'patient',
        recipientId: affectedApt.patientId,
        type: 'Consultation Queue Delay',
        title: `Queue Delay Notice (+${delayMinutes} mins) — ${affectedApt.referenceNumber}`,
        message: `Paumanhin po: Ang naunang pasyente ni ${affectedApt.doctorName} ay lumagpas sa oras (+${delayMinutes} minuto). Ang iyong ${affectedApt.timeLabel} appointment sa ${formatReadableDate(
          affectedApt.date
        )} ay tinatayang magsisimula nang ${estStart}. Maaari kang maghintay sa Priority Queue o mag-Free Reschedule.`,
        appointmentId: affectedApt.id,
        appointmentRef: affectedApt.referenceNumber,
        read: false,
        createdAt: nowIso,
      };
      newNotifications.push(patNotif);
      saveNotificationToDb(patNotif);
    });

    setNotifications((prev) => [...newNotifications, ...prev]);

    appendAuditLog(
      currentUser?.fullName || currentApt.doctorName,
      currentRole,
      `Reported Consultation Overrun (+${delayMinutes}m)`,
      'Appointment',
      currentApt.referenceNumber,
      `Notified ${affectedList.length} queued patient(s) (${affectedList
        .map((a) => a.patientName)
        .join(', ')}) of +${delayMinutes} min delay.`
    );

    return {
      affectedCount: affectedList.length,
      affectedNames: affectedList.map((a) => `${a.patientName} (Est. ${formatMinutesToTime12h(a.startTime, delayMinutes)})`),
    };
  };

  const handleAcknowledgeDelayWait = (aptId: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const updated: Appointment = {
      ...target,
      patientDelayDecision: 'waiting',
      updatedAt: nowIso,
    };
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updated : a)));
    saveAppointmentToDb(updated);
    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updated);
    }

    const docNotif: NotificationItem = {
      id: `notif-wait-${Date.now()}`,
      recipientRole: 'doctor',
      recipientId: target.doctorId,
      type: 'Consultation Queue Delay',
      title: `Patient Waiting in Priority Queue — ${target.referenceNumber}`,
      message: `${target.patientName} acknowledged the +${target.delayMinutes}m delay and confirmed they are waiting in the Priority Queue for their ${target.estimatedStartTime || target.timeLabel} consultation.`,
      appointmentId: target.id,
      appointmentRef: target.referenceNumber,
      read: false,
      createdAt: nowIso,
    };
    setNotifications((prev) => [docNotif, ...prev]);
    saveNotificationToDb(docNotif);
  };

  // Render active screen inside AppShell
  const renderScreenContent = () => {
    if (currentRole === 'guest') {
      return (
        <PublicPages
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onBookAppointmentClick={handleGuestBookClick}
          onAuthenticateCredentials={handleAuthenticateCredentials}
          onGoogleLoginSuccess={handleGoogleLoginSuccess}
          onRegisterPatientAccount={handleRegisterPatientAccount}
          onResetUserPassword={handleResetUserPassword}
          onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
          onOpenTermsModal={() => setTermsModalOpen(true)}
          departments={departments}
          appointmentTypes={appointmentTypes}
          doctors={doctors}
          pendingBookingIntent={pendingBookingIntent}
        />
      );
    }

    if (currentRole === 'patient') {
      if (
        currentScreen === 'book-appointment' ||
        currentScreen === 'doctor-availability' ||
        currentScreen === 'appointment-review' ||
        currentScreen === 'booking-confirmation'
      ) {
        return (
          <PatientBookingFlow
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            patientProfile={activePatient}
            departments={departments}
            appointmentTypes={appointmentTypes}
            doctors={doctors}
            schedules={schedules}
            appointments={appointments}
            draft={bookingDraft}
            setDraft={setBookingDraft}
            onSubmitBooking={handleSubmitBooking}
            lastBookedAppointment={lastBookedAppointment}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
            onOpenTermsModal={() => setTermsModalOpen(true)}
            onViewAppointmentDetails={(apt) => {
              setSelectedAppointment(apt);
              setCurrentScreen('patient-appointment-details');
            }}
          />
        );
      }

      return (
        <PatientPortalPages
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          patientProfile={activePatient}
          onUpdateProfile={(updated) => {
            setPatients((prev) => {
              const exists = prev.some((p) => p.id === updated.id);
              return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated];
            });
            savePatientToDb(updated);
            setBookingDraft((prev) => ({
              ...prev,
              fullName: updated.fullName,
              dateOfBirth: updated.dateOfBirth,
              sex: updated.sex,
              contactNumber: updated.contactNumber,
              email: updated.email,
              knownAllergies: updated.knownAllergies,
              currentMedications: updated.currentMedications,
              existingMedicalConditions: updated.existingMedicalConditions,
            }));
          }}
          appointments={appointments}
          selectedAppointment={selectedAppointment}
          onSelectAppointment={setSelectedAppointment}
          onOpenCancelModal={(apt) => setCancelModalApt(apt)}
          onOpenRescheduleModal={(apt) => setRescheduleModalApt(apt)}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            const target = notifications.find((n) => n.id === id);
            if (target) saveNotificationToDb({ ...target, read: true });
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
          }}
          onMarkAllNotificationsRead={() => {
            notifications.forEach((n) => {
              if (
                n.recipientRole === 'patient' &&
                (n.recipientId === activePatient.id || n.recipientId === activePatient.userId) &&
                !n.read
              ) {
                saveNotificationToDb({ ...n, read: true });
              }
            });
            setNotifications((prev) =>
              prev.map((n) =>
                n.recipientRole === 'patient' &&
                (n.recipientId === activePatient.id || n.recipientId === activePatient.userId)
                  ? { ...n, read: true }
                  : n
              )
            );
          }}
          assessments={assessments}
          onAddAssessmentSummary={(s) => setAssessments((prev) => [s, ...prev])}
          onAcknowledgeDelayWait={handleAcknowledgeDelayWait}
        />
      );
    }

    if (currentRole === 'doctor') {
      return (
        <DoctorPortalPages
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          doctor={activeDoctor}
          allDoctors={doctors}
          onUpdateDoctorProfile={(updated) => {
            setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            saveDoctorToDb(updated);
          }}
          schedule={schedules[activeDoctor.id]}
          allSchedules={schedules}
          onUpdateDoctorSchedule={(updatedSched, submittedBlock) => {
            setSchedules((prev) => {
              const next = { ...prev, [activeDoctor.id]: updatedSched };
              try {
                localStorage.setItem('telehealth_schedules_cache_v1', JSON.stringify(next));
              } catch {
                // ignore
              }
              return next;
            });
            saveScheduleToDb(updatedSched);

            if (submittedBlock) {
              const adminNotif: NotificationItem = {
                id: `notif-${Date.now()}-blk`,
                recipientRole: 'admin',
                recipientId: 'usr-admin-main',
                type: 'Doctor Schedule Change',
                title: `Pending Admin Approval: ${submittedBlock.type} — ${activeDoctor.fullName}`,
                message: `${activeDoctor.fullName} requested a ${submittedBlock.type} for ${submittedBlock.startDate}${
                  submittedBlock.endDate !== submittedBlock.startDate
                    ? ` to ${submittedBlock.endDate}`
                    : ''
                }${submittedBlock.slotStartTime ? ` (${submittedBlock.slotStartTime})` : ''}. Reason: ${submittedBlock.reason}`,
                read: false,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => [adminNotif, ...prev]);
              saveNotificationToDb(adminNotif);

              appendAuditLog(
                activeDoctor.fullName,
                'doctor',
                `Requested ${submittedBlock.type} (Pending Admin Approval)`,
                'Schedule',
                submittedBlock.id,
                `${submittedBlock.type} on ${submittedBlock.startDate}${
                  submittedBlock.endDate !== submittedBlock.startDate
                    ? ` to ${submittedBlock.endDate}`
                    : ''
                }${submittedBlock.slotStartTime ? ` (${submittedBlock.slotStartTime})` : ''}. Reason: ${submittedBlock.reason}`
              );
            }
          }}
          appointments={appointments}
          selectedAppointment={selectedAppointment}
          onSelectAppointment={setSelectedAppointment}
          onConfirmAppointment={handleConfirmAppointment}
          onOpenRejectModal={(apt) => setRejectModalApt(apt)}
          onOpenRescheduleModal={(apt) => setRescheduleModalApt(apt)}
          onOpenCancelModal={(apt) => setCancelModalApt(apt)}
          onCompleteAppointment={handleCompleteAppointment}
          onSaveInternalNotes={handleSaveInternalNotes}
          onSaveMeetLink={handleSaveMeetLink}
          onReportConsultationDelay={handleReportConsultationDelay}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            const target = notifications.find((n) => n.id === id);
            if (target) saveNotificationToDb({ ...target, read: true });
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
          }}
          onMarkAllNotificationsRead={() => {
            notifications.forEach((n) => {
              if (
                n.recipientRole === 'doctor' &&
                (n.recipientId === activeDoctor.id || n.recipientId === activeDoctor.userId) &&
                !n.read
              ) {
                saveNotificationToDb({ ...n, read: true });
              }
            });
            setNotifications((prev) =>
              prev.map((n) =>
                n.recipientRole === 'doctor' &&
                (n.recipientId === activeDoctor.id || n.recipientId === activeDoctor.userId)
                  ? { ...n, read: true }
                  : n
              )
            );
          }}
          assessments={assessments}
        />
      );
    }

    // Admin role
    return (
      <AdminPortalPages
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        patients={patients}
        onUpdatePatient={(updated) => {
          setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          savePatientToDb(updated);
        }}
        doctors={doctors}
        onUpdateDoctor={(updated) => {
          setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          saveDoctorToDb(updated);
        }}
        onDeactivateDoctor={(doctorId, reason, cancelPendingAppointments) => {
          const targetDoc = doctors.find((d) => d.id === doctorId);
          if (!targetDoc) return { cancelledCount: 0 };

          const updatedDoc: DoctorProfile = {
            ...targetDoc,
            status: 'Resigned',
            deactivatedAt: new Date().toISOString(),
            deactivationReason: reason,
          };
          setDoctors((prev) => prev.map((d) => (d.id === doctorId ? updatedDoc : d)));
          saveDoctorToDb(updatedDoc);

          let cancelledCount = 0;
          if (cancelPendingAppointments) {
            const upcomingToCancel = appointments.filter(
              (a) =>
                a.doctorId === doctorId &&
                (a.status === 'Pending' ||
                  a.status === 'Confirmed' ||
                  a.status === 'Reschedule Requested' ||
                  a.status === 'Rescheduled') &&
                a.date >= DEMO_TODAY
            );
            cancelledCount = upcomingToCancel.length;

            if (upcomingToCancel.length > 0) {
              const cancelMap = new Set(upcomingToCancel.map((a) => a.id));
              const newNotifs: NotificationItem[] = [];

              setAppointments((prev) =>
                prev.map((a) => {
                  if (!cancelMap.has(a.id)) return a;
                  const cancelledApt: Appointment = {
                    ...a,
                    status: 'Cancelled',
                    cancellationReason: `Physician offboarded (${reason}). Please book a new slot with another available specialist.`,
                    updatedAt: new Date().toISOString(),
                  };
                  saveAppointmentToDb(cancelledApt);
                  return cancelledApt;
                })
              );

              upcomingToCancel.forEach((apt, idx) => {
                const patNotif: NotificationItem = {
                  id: `notif-${Date.now()}-${idx}`,
                  recipientRole: 'patient',
                  recipientId: apt.patientId,
                  type: 'Appointment Cancellation',
                  title: `Physician Roster Update — ${apt.referenceNumber}`,
                  message: `Your appointment with ${targetDoc.fullName} on ${formatReadableDate(apt.date)} (${apt.timeLabel}) has been cancelled because the physician is no longer active on the clinic roster (${reason}). Please book a new appointment with another specialist.`,
                  appointmentId: apt.id,
                  appointmentRef: apt.referenceNumber,
                  read: false,
                  createdAt: new Date().toISOString(),
                };
                newNotifs.push(patNotif);
                saveNotificationToDb(patNotif);
              });

              setNotifications((prev) => [...newNotifs, ...prev]);
            }
          }

          appendAuditLog(
            currentUser?.fullName || 'Admin',
            'admin',
            'Offboarded / Deactivated Physician',
            'Doctor',
            targetDoc.licenseNumber,
            `Marked ${targetDoc.fullName} (${targetDoc.email}) as Resigned. Reason: ${reason}. Auto-cancelled ${cancelledCount} upcoming appointment(s).`
          );

          return { cancelledCount };
        }}
        onDeleteDoctor={(doctorId) => {
          const targetDoc = doctors.find((d) => d.id === doctorId);
          if (!targetDoc) {
            return { success: false, error: 'Physician record not found.' };
          }
          const linkedAppointments = appointments.filter((a) => a.doctorId === doctorId);
          if (linkedAppointments.length > 0) {
            return {
              success: false,
              error: `Cannot permanently delete ${targetDoc.fullName} because ${linkedAppointments.length} appointment record(s) exist in clinical history. Please use "Mark as Resigned & Deactivate Access" instead.`,
            };
          }

          const linkedUser = users.find(
            (u) =>
              u.id === targetDoc.userId ||
              u.doctorId === targetDoc.id ||
              (u.role === 'doctor' &&
                u.email.trim().toLowerCase() === targetDoc.email.trim().toLowerCase())
          );

          setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
          setSchedules((prev) => {
            const next = { ...prev };
            delete next[doctorId];
            return next;
          });
          if (linkedUser) {
            setUsers((prev) => prev.filter((u) => u.id !== linkedUser.id));
          }

          deleteDoctorFromDb(doctorId, linkedUser?.id);

          appendAuditLog(
            currentUser?.fullName || 'Admin',
            'admin',
            'Permanently Deleted Physician Account',
            'Doctor',
            targetDoc.licenseNumber,
            `Removed unused physician account ${targetDoc.fullName} (${targetDoc.email}) with 0 appointment records.`
          );

          return { success: true };
        }}
        onCreateDoctor={(newDoc, password) => {
          const normalizedEmail = newDoc.email.trim().toLowerCase();
          if (normalizedEmail === 'admintelehealth@gmail.com') {
            return {
              success: false,
              error: 'This email is reserved for the System Administrator.',
            };
          }
          const conflictUser = users.find(
            (u) => u.email.trim().toLowerCase() === normalizedEmail
          );
          const conflictPatient = patients.find(
            (p) => p.email.trim().toLowerCase() === normalizedEmail
          );
          const conflictDoctor = doctors.find(
            (d) => d.email.trim().toLowerCase() === normalizedEmail
          );
          if (conflictPatient || conflictUser?.role === 'patient') {
            return {
              success: false,
              error:
                'Hindi pwedeng gamitin ang email na ito dahil naka-register na ito bilang Patient account. Gumamit ng hiwalay na email para sa Doctor account.',
            };
          }
          if (conflictDoctor || conflictUser) {
            return {
              success: false,
              error: 'This email address is already registered to another account.',
            };
          }

          const newDocSchedule: DoctorSchedule = {
            doctorId: newDoc.id,
            timezone: systemSettings.timezone,
            workingDays: newDoc.workingDays,
            morningStart: '07:00',
            morningEnd: '11:00',
            lunchBreakStart: '11:00',
            lunchBreakEnd: '13:00',
            afternoonStart: '13:00',
            afternoonEnd: '17:00',
            maxSlotsPerDay: 8,
            blocks: [],
          };
          const newDocUser: User = {
            id: newDoc.userId,
            email: newDoc.email,
            password: password || 'doctor123',
            fullName: newDoc.fullName,
            role: 'doctor',
            googleVerified: false,
            profileLinked: true,
            lastLogin: new Date().toISOString(),
            doctorId: newDoc.id,
          };

          setDoctors((prev) => [...prev, newDoc]);
          setUsers((prev) => [...prev, newDocUser]);
          setSchedules((prev) => ({ ...prev, [newDoc.id]: newDocSchedule }));

          saveDoctorToDb(newDoc);
          saveUserToDb(newDocUser);
          saveScheduleToDb(newDocSchedule);
          appendAuditLog(
            currentUser?.fullName || 'Admin',
            'admin',
            'Onboarded Physician Account',
            'Doctor',
            newDoc.licenseNumber,
            `Created physician account (${newDoc.email}) and added ${newDoc.fullName} to ${newDoc.departmentName}.`
          );
          return { success: true };
        }}
        departments={departments}
        onCreateDepartment={(dept) => {
          setDepartments((prev) => [...prev, dept]);
          saveDepartmentToDb(dept);
        }}
        appointmentTypes={appointmentTypes}
        onCreateAppointmentType={(t) => {
          setAppointmentTypes((prev) => [...prev, t]);
          saveAppointmentTypeToDb(t);
        }}
        appointments={appointments}
        schedules={schedules}
        onApproveScheduleBlock={(doctorId, blockId) => {
          const docSched = schedules[doctorId];
          const docProfile = doctors.find((d) => d.id === doctorId);
          if (!docSched || !docProfile) return;
          const targetBlock = docSched.blocks.find((b) => b.id === blockId);
          if (!targetBlock) return;

          const updatedBlocks = docSched.blocks.map((b) => {
            if (b.id !== blockId) return b;
            const { rejectionReason: _removed, ...rest } = b;
            return { ...rest, status: 'Approved' as const };
          });

          const isWorkingDaysRequest =
            targetBlock.type === 'Break Override' &&
            docSched.pendingWorkingDays &&
            docSched.pendingWorkingDays.length > 0;

          const nextWorkingDays = isWorkingDaysRequest
            ? docSched.pendingWorkingDays!
            : docSched.workingDays;

          const updatedSched: DoctorSchedule = {
            ...docSched,
            workingDays: nextWorkingDays,
            pendingWorkingDays: isWorkingDaysRequest ? undefined : docSched.pendingWorkingDays,
            workingDaysApprovalStatus: isWorkingDaysRequest
              ? 'Approved'
              : docSched.workingDaysApprovalStatus,
            blocks: updatedBlocks,
          };

          setSchedules((prev) => {
            const next = { ...prev, [doctorId]: updatedSched };
            try {
              localStorage.setItem('telehealth_schedules_cache_v1', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
          saveScheduleToDb(updatedSched);

          if (isWorkingDaysRequest) {
            const updatedDocProfile: DoctorProfile = {
              ...docProfile,
              workingDays: nextWorkingDays,
            };
            setDoctors((prev) => prev.map((d) => (d.id === doctorId ? updatedDocProfile : d)));
            saveDoctorToDb(updatedDocProfile);
          }

          const docNotif: NotificationItem = {
            id: `notif-${Date.now()}-blk-app`,
            recipientRole: 'doctor',
            recipientId: doctorId,
            type: 'Doctor Schedule Change',
            title: `Approved by Admin: ${targetBlock.type} (${targetBlock.startDate})`,
            message: `Administrator approved your ${targetBlock.type} request for ${targetBlock.startDate}${
              targetBlock.endDate !== targetBlock.startDate ? ` to ${targetBlock.endDate}` : ''
            }${targetBlock.slotStartTime ? ` (${targetBlock.slotStartTime})` : ''}. Patient booking slots are now officially blocked.`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications((prev) => [docNotif, ...prev]);
          saveNotificationToDb(docNotif);

          appendAuditLog(
            currentUser?.fullName || 'Admin',
            'admin',
            `Approved Physician ${targetBlock.type}`,
            'Schedule',
            targetBlock.id,
            `Approved ${docProfile.fullName}'s ${targetBlock.type} (${targetBlock.startDate}${
              targetBlock.endDate !== targetBlock.startDate ? ` to ${targetBlock.endDate}` : ''
            }${targetBlock.slotStartTime ? ` · ${targetBlock.slotStartTime}` : ''}) — Reason: ${targetBlock.reason}`
          );
        }}
        onRejectScheduleBlock={(doctorId, blockId, rejectionReason) => {
          const docSched = schedules[doctorId];
          const docProfile = doctors.find((d) => d.id === doctorId);
          if (!docSched || !docProfile) return;
          const targetBlock = docSched.blocks.find((b) => b.id === blockId);
          if (!targetBlock) return;

          const cleanReason =
            rejectionReason?.trim() || 'Declined by Clinic Administrator due to roster coverage requirements.';

          const isWorkingDaysRequest =
            targetBlock.type === 'Break Override' &&
            docSched.pendingWorkingDays &&
            docSched.pendingWorkingDays.length > 0;

          const updatedBlocks = docSched.blocks.map((b) =>
            b.id === blockId
              ? { ...b, status: 'Rejected' as const, rejectionReason: cleanReason }
              : b
          );
          const updatedSched: DoctorSchedule = {
            ...docSched,
            pendingWorkingDays: isWorkingDaysRequest ? undefined : docSched.pendingWorkingDays,
            workingDaysApprovalStatus: isWorkingDaysRequest
              ? 'Rejected'
              : docSched.workingDaysApprovalStatus,
            workingDaysRejectionReason: isWorkingDaysRequest
              ? cleanReason
              : docSched.workingDaysRejectionReason,
            blocks: updatedBlocks,
          };

          setSchedules((prev) => {
            const next = { ...prev, [doctorId]: updatedSched };
            try {
              localStorage.setItem('telehealth_schedules_cache_v1', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
          saveScheduleToDb(updatedSched);

          const docNotif: NotificationItem = {
            id: `notif-${Date.now()}-blk-rej`,
            recipientRole: 'doctor',
            recipientId: doctorId,
            type: 'Doctor Schedule Change',
            title: `Declined by Admin: ${targetBlock.type} (${targetBlock.startDate})`,
            message: `Administrator declined your ${targetBlock.type} request for ${targetBlock.startDate}${
              targetBlock.slotStartTime ? ` (${targetBlock.slotStartTime})` : ''
            }. Reason: ${cleanReason}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications((prev) => [docNotif, ...prev]);
          saveNotificationToDb(docNotif);

          appendAuditLog(
            currentUser?.fullName || 'Admin',
            'admin',
            `Rejected Physician ${targetBlock.type}`,
            'Schedule',
            targetBlock.id,
            `Declined ${docProfile.fullName}'s ${targetBlock.type} (${targetBlock.startDate}). Reason: ${cleanReason}`
          );
        }}
        onConfirmAppointment={handleConfirmAppointment}
        onOpenCancelModal={(apt) => setCancelModalApt(apt)}
        onOpenRescheduleModal={(apt) => setRescheduleModalApt(apt)}
        auditLogs={auditLogs}
        systemSettings={systemSettings}
        onUpdateSystemSettings={(updated) => {
          setSystemSettings(updated);
          saveSystemSettingsToDb(updated);
        }}
      />
    );
  };

  return (
    <>
      <AppShell
        currentRole={currentRole}
        currentUser={currentUser}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onSwitchDemoRole={handleSwitchDemoRole}
        onSignOut={() => {
          logoutGoogle().catch(() => {});
          setLoggedInUser(null);
          setCurrentRole('guest');
          setCurrentScreen('landing');
        }}
        onBookAppointmentClick={handleGuestBookClick}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          const target = notifications.find((n) => n.id === id);
          if (target) saveNotificationToDb({ ...target, read: true });
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
      >
        {renderScreenContent()}
      </AppShell>

      {/* Reusable Global Modals & Policy Dialogs */}
      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
      <TermsConditionsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />
      <GoogleSignInResultModal
        isOpen={!!googleModalScenario}
        onClose={() => setGoogleModalScenario(null)}
        scenario={googleModalScenario || 'verified-patient'}
        onProceed={() => {
          setGoogleModalScenario(null);
        }}
      />
      <CancelAppointmentModal
        appointment={cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        onConfirmCancel={handleCancelAppointment}
      />
      <RejectAppointmentModal
        appointment={rejectModalApt}
        onClose={() => setRejectModalApt(null)}
        onConfirmReject={handleRejectAppointment}
      />
      <RescheduleAppointmentModal
        appointment={rescheduleModalApt}
        doctors={doctors}
        schedules={schedules}
        appointments={appointments}
        onClose={() => setRescheduleModalApt(null)}
        onConfirmReschedule={handleRescheduleAppointment}
      />
    </>
  );
}
