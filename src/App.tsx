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
  const [schedules, setSchedules] = useState<Record<string, DoctorSchedule>>(INITIAL_SCHEDULES);
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
        setSchedules((prev) => ({ ...prev, ...map }));
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
        p.id === loggedInUser?.patientId ||
        p.userId === loggedInUser?.id ||
        (loggedInUser?.email && p.email.toLowerCase() === loggedInUser.email.toLowerCase())
    ) ||
    patients[0] ||
    fallbackPatient;

  const activeDoctor =
    doctors.find(
      (d) =>
        d.id === loggedInUser?.doctorId ||
        d.userId === loggedInUser?.id ||
        (loggedInUser?.email && d.email.toLowerCase() === loggedInUser.email.toLowerCase())
    ) || doctors[0];

  const currentUser = loggedInUser;

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
    date: '2026-10-07',
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
    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists || normalizedEmail === 'admintelehealth@gmail.com') {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
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

  const handleGoogleLoginSuccess = (emailInput: string, displayName: string) => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (normalizedEmail === 'admintelehealth@gmail.com') {
      const adminUser: User =
        users.find((u) => u.email.toLowerCase() === normalizedEmail) || {
          id: 'usr-admin-main',
          email: 'admintelehealth@gmail.com',
          fullName: 'TeleHealth Administrator',
          role: 'admin',
          googleVerified: true,
          profileLinked: true,
          lastLogin: new Date().toISOString(),
        };
      routeAuthenticatedUser(adminUser);
      return;
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      routeAuthenticatedUser(existingUser);
      return;
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

    const updatedApt: Appointment = {
      ...target,
      status: 'Completed',
      consultationSummary: summary,
      doctorInternalNotes: internalNotes,
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);

    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(updatedApt);
    }

    appendAuditLog(
      activeDoctor.fullName,
      'doctor',
      'Completed Consultation',
      'Appointment',
      target.referenceNumber,
      'Logged post-consultation clinical summary.'
    );
  };

  const handleSaveInternalNotes = (aptId: string, notes: string) => {
    const target = appointments.find((a) => a.id === aptId);
    if (!target) return;
    const updatedApt: Appointment = { ...target, doctorInternalNotes: notes };
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updatedApt : a)));
    saveAppointmentToDb(updatedApt);
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
          onMarkAllNotificationsRead={() =>
            setNotifications((prev) =>
              prev.map((n) => (n.recipientRole === 'patient' ? { ...n, read: true } : n))
            )
          }
          assessments={assessments}
          onAddAssessmentSummary={(s) => setAssessments((prev) => [s, ...prev])}
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
          onUpdateDoctorSchedule={(updatedSched) => {
            setSchedules((prev) => ({ ...prev, [activeDoctor.id]: updatedSched }));
            saveScheduleToDb(updatedSched);
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
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            const target = notifications.find((n) => n.id === id);
            if (target) saveNotificationToDb({ ...target, read: true });
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
          }}
          onMarkAllNotificationsRead={() =>
            setNotifications((prev) =>
              prev.map((n) => (n.recipientRole === 'doctor' ? { ...n, read: true } : n))
            )
          }
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
        onCreateDoctor={(newDoc, password) => {
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
