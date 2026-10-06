import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './googleAuth';
import {
  User,
  PatientProfile,
  DoctorProfile,
  Department,
  AppointmentType,
  Appointment,
  DoctorSchedule,
  NotificationItem,
  AuditLogEntry,
  SystemSettingsConfig,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOCTORS,
  INITIAL_DEPARTMENTS,
  INITIAL_APPOINTMENT_TYPES,
  INITIAL_SCHEDULES,
  INITIAL_SYSTEM_SETTINGS,
} from './mockData';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned as T;
}

export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const existingUsers = usersSnap.docs.map((d) => d.data() as User);
    const hasAdmin = existingUsers.some(
      (u) => u.email.toLowerCase() === 'admintelehealth@gmail.com'
    );

    if (!hasAdmin) {
      const batch = writeBatch(db);
      for (const u of INITIAL_USERS) {
        batch.set(doc(db, 'users', u.id), stripUndefined(u));
      }
      await batch.commit();
    }

    const docsSnap = await getDocs(collection(db, 'doctors'));
    if (docsSnap.empty) {
      const batch = writeBatch(db);
      for (const d of INITIAL_DOCTORS) {
        batch.set(doc(db, 'doctors', d.id), stripUndefined(d));
      }
      for (const sKey of Object.keys(INITIAL_SCHEDULES)) {
        const sched = INITIAL_SCHEDULES[sKey];
        batch.set(doc(db, 'schedules', sched.doctorId), stripUndefined(sched));
      }
      for (const dept of INITIAL_DEPARTMENTS) {
        batch.set(doc(db, 'departments', dept.id), stripUndefined(dept));
      }
      for (const t of INITIAL_APPOINTMENT_TYPES) {
        batch.set(doc(db, 'appointmentTypes', t.id), stripUndefined(t));
      }
      batch.set(doc(db, 'settings', 'main'), stripUndefined(INITIAL_SYSTEM_SETTINGS));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedInitialFirestoreData');
  }
}

export async function saveUserToDb(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), stripUndefined(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function savePatientToDb(patient: PatientProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'patients', patient.id), stripUndefined(patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `patients/${patient.id}`);
  }
}

export async function saveDoctorToDb(doctor: DoctorProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'doctors', doctor.id), stripUndefined(doctor));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `doctors/${doctor.id}`);
  }
}

export async function saveScheduleToDb(schedule: DoctorSchedule): Promise<void> {
  try {
    await setDoc(doc(db, 'schedules', schedule.doctorId), stripUndefined(schedule));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `schedules/${schedule.doctorId}`);
  }
}

export async function saveAppointmentToDb(appointment: Appointment): Promise<void> {
  try {
    await setDoc(doc(db, 'appointments', appointment.id), stripUndefined(appointment));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `appointments/${appointment.id}`);
  }
}

export async function saveDepartmentToDb(dept: Department): Promise<void> {
  try {
    await setDoc(doc(db, 'departments', dept.id), stripUndefined(dept));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `departments/${dept.id}`);
  }
}

export async function saveAppointmentTypeToDb(aptType: AppointmentType): Promise<void> {
  try {
    await setDoc(doc(db, 'appointmentTypes', aptType.id), stripUndefined(aptType));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `appointmentTypes/${aptType.id}`);
  }
}

export async function saveNotificationToDb(notif: NotificationItem): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notif.id), stripUndefined(notif));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notif.id}`);
  }
}

export async function saveAuditLogToDb(log: AuditLogEntry): Promise<void> {
  try {
    await setDoc(doc(db, 'auditLogs', log.id), stripUndefined(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `auditLogs/${log.id}`);
  }
}

export async function saveSystemSettingsToDb(settings: SystemSettingsConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'main'), stripUndefined(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/main');
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void
): () => void {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as T);
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}
