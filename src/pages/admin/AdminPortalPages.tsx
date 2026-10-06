import React, { useState } from 'react';
import {
  Users,
  Stethoscope,
  Calendar,
  Settings,
  ShieldCheck,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  PatientProfile,
  DoctorProfile,
  Department,
  AppointmentType,
  Appointment,
  DoctorSchedule,
  AuditLogEntry,
  SystemSettingsConfig,
  ScreenId,
} from '../../types';
import {
  DEMO_TODAY,
  formatReadableDate,
} from '../../services/mockData';
import { DJANGO_API_CONTRACTS } from '../../services/api';
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuSelect,
  NeuToggle,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';

interface AdminPortalPagesProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  patients: PatientProfile[];
  onUpdatePatient: (updated: PatientProfile) => void;
  doctors: DoctorProfile[];
  onUpdateDoctor: (updated: DoctorProfile) => void;
  onCreateDoctor: (newDoc: DoctorProfile, password: string) => void;
  departments: Department[];
  onCreateDepartment: (dept: Department) => void;
  appointmentTypes: AppointmentType[];
  onCreateAppointmentType: (aptType: AppointmentType) => void;
  appointments: Appointment[];
  schedules: Record<string, DoctorSchedule>;
  onConfirmAppointment: (id: string) => void;
  onOpenCancelModal: (apt: Appointment) => void;
  onOpenRescheduleModal: (apt: Appointment) => void;
  auditLogs: AuditLogEntry[];
  systemSettings: SystemSettingsConfig;
  onUpdateSystemSettings: (updated: SystemSettingsConfig) => void;
}

export const AdminPortalPages: React.FC<AdminPortalPagesProps> = ({
  currentScreen,
  onNavigate,
  patients,
  onUpdatePatient,
  doctors,
  onUpdateDoctor,
  onCreateDoctor,
  departments,
  onCreateDepartment,
  appointmentTypes,
  onCreateAppointmentType,
  appointments,
  onConfirmAppointment,
  onOpenCancelModal,
  onOpenRescheduleModal,
  auditLogs,
  systemSettings,
  onUpdateSystemSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(patients[0] || null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(doctors[0] || null);

  // New department / appointment type state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [adminToast, setAdminToast] = useState('');

  // New doctor form state
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocDeptId, setNewDocDeptId] = useState(departments[0]?.id || 'dept-cardio');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [newDocError, setNewDocError] = useState('');

  const triggerToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(''), 3500);
  };

  // SCREEN 28 & 29: PATIENT MANAGEMENT & PATIENT DETAILS
  if (currentScreen === 'patient-management' || currentScreen === 'admin-patient-details') {
    const filteredPatients = patients.filter(
      (p) =>
        !searchQuery.trim() ||
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (currentScreen === 'admin-patient-details' && selectedPatient) {
      const patApts = appointments.filter((a) => a.patientId === selectedPatient.id);
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono-tabular text-[#3478F6] font-semibold">
                Administrative Record · {selectedPatient.id.toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold text-[#172B4D]">{selectedPatient.fullName}</h1>
            </div>
            <NeuButton onClick={() => onNavigate('patient-management')}>
              ← Back to Patient Directory
            </NeuButton>
          </div>

          <NeuCard className="space-y-4">
            <div className="neu-inset rounded-xl p-3.5 text-xs text-[#64748B] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#3478F6] shrink-0" />
              <span>
                <strong>Least-Privilege Governance:</strong> Administrative staff may manage demographic and contact details. Private physician consultation notes remain restricted to attending clinicians.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuInput
                label="Full Name"
                value={selectedPatient.fullName}
                onChange={(e) =>
                  setSelectedPatient({ ...selectedPatient, fullName: e.target.value })
                }
              />
              <NeuInput
                label="Date of Birth"
                type="date"
                value={selectedPatient.dateOfBirth}
                onChange={(e) =>
                  setSelectedPatient({ ...selectedPatient, dateOfBirth: e.target.value })
                }
              />
              <NeuInput
                label="Contact Number"
                value={selectedPatient.contactNumber}
                onChange={(e) =>
                  setSelectedPatient({ ...selectedPatient, contactNumber: e.target.value })
                }
              />
              <NeuInput
                label="Email Address"
                value={selectedPatient.email}
                onChange={(e) =>
                  setSelectedPatient({ ...selectedPatient, email: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end">
              <NeuButton
                variant="primary"
                onClick={() => {
                  onUpdatePatient(selectedPatient);
                  triggerToast('Patient administrative record updated.');
                }}
              >
                Save Permitted Changes
              </NeuButton>
            </div>
          </NeuCard>

          <NeuCard className="space-y-3">
            <h2 className="text-base font-bold text-[#172B4D]">
              Associated Appointments ({patApts.length})
            </h2>
            {patApts.map((a) => (
              <div
                key={a.id}
                className="neu-inset rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="font-mono-tabular text-[#3478F6]">{a.referenceNumber}</strong> ·{' '}
                  {a.doctorName} · {formatReadableDate(a.date)} ({a.timeLabel})
                </div>
                <StatusIndicator status={a.status} />
              </div>
            ))}
          </NeuCard>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Patient Account Management</h1>
            <p className="text-xs text-[#64748B]">
              Search patient records, verify contact details, and inspect appointment history under least-privilege rules.
            </p>
          </div>
        </div>

        <NeuCard>
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search patients by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search patients"
              className="neu-inset w-full rounded-xl pl-10 pr-4 py-2 text-sm text-[#172B4D]"
            />
          </div>
        </NeuCard>

        <NeuCard className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#64748B]">
                <th className="py-3 px-3">Patient ID</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">DOB / Sex</th>
                <th className="py-3 px-3">Contact & Email</th>
                <th className="py-3 px-3 text-right">Profile Completion</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPatients.map((pat) => (
                <tr key={pat.id} className="hover:bg-white/30">
                  <td className="py-3 px-3 font-mono-tabular font-bold text-[#3478F6]">
                    {pat.id.toUpperCase()}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#172B4D]">{pat.fullName}</td>
                  <td className="py-3 px-3 font-mono-tabular text-[#64748B]">
                    {pat.dateOfBirth} · {pat.sex}
                  </td>
                  <td className="py-3 px-3 text-[#64748B]">
                    <div>{pat.contactNumber}</div>
                    <div>{pat.email}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tabular font-bold text-[#16865C]">
                    {pat.profileCompletionPercent}%
                  </td>
                  <td className="py-3 px-3 text-right">
                    <NeuButton
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(pat);
                        onNavigate('admin-patient-details');
                      }}
                    >
                      Inspect / Edit
                    </NeuButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 30 & 31: DOCTOR MANAGEMENT & DOCTOR DETAILS
  if (currentScreen === 'doctor-management' || currentScreen === 'admin-doctor-details') {
    if (currentScreen === 'admin-doctor-details' && selectedDoctor) {
      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Configure Physician: {selectedDoctor.fullName}
            </h1>
            <NeuButton onClick={() => onNavigate('doctor-management')}>
              ← Back to Doctors
            </NeuButton>
          </div>

          <NeuCard className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeuInput
                label="Physician Name"
                value={selectedDoctor.fullName}
                onChange={(e) =>
                  setSelectedDoctor({ ...selectedDoctor, fullName: e.target.value })
                }
              />
              <NeuSelect
                label="Assigned Department"
                value={selectedDoctor.departmentId}
                onChange={(e) => {
                  const dept = departments.find((d) => d.id === e.target.value);
                  setSelectedDoctor({
                    ...selectedDoctor,
                    departmentId: e.target.value,
                    departmentName: dept ? dept.name : selectedDoctor.departmentName,
                  });
                }}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
              <NeuInput
                label="Clinical Specialty"
                value={selectedDoctor.specialty}
                onChange={(e) =>
                  setSelectedDoctor({ ...selectedDoctor, specialty: e.target.value })
                }
              />
              <NeuSelect
                label="Account Roster Status"
                value={selectedDoctor.status}
                onChange={(e) =>
                  setSelectedDoctor({
                    ...selectedDoctor,
                    status: e.target.value as DoctorProfile['status'],
                  })
                }
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'On Leave', label: 'On Leave' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            <div className="flex justify-end">
              <NeuButton
                variant="primary"
                onClick={() => {
                  onUpdateDoctor(selectedDoctor);
                  triggerToast('Doctor assignment and status updated.');
                  onNavigate('doctor-management');
                }}
              >
                Save Physician Configuration
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Doctor Roster & Department Assignment</h1>
          <p className="text-xs text-[#64748B]">
            Onboard clinicians, assign departments, and manage active/leave availability states.
          </p>
        </div>

        {adminToast && (
          <div className="neu-raised rounded-xl p-3 text-xs font-semibold text-[#16865C]">
            {adminToast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {doctors.map((doc) => (
              <NeuCard
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-tabular font-bold text-[#3478F6]">
                      {doc.licenseNumber}
                    </span>
                    <span>·</span>
                    <span className="text-[#64748B]">{doc.departmentName}</span>
                    <span>·</span>
                    <StatusIndicator status={doc.status} />
                  </div>
                  <div className="text-base font-bold text-[#172B4D]">{doc.fullName}</div>
                  <div className="text-xs text-[#64748B]">
                    {doc.specialty} · Days: {doc.workingDays.join(', ')}
                  </div>
                </div>
                <NeuButton
                  size="sm"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    onNavigate('admin-doctor-details');
                  }}
                >
                  Configure Doctor
                </NeuButton>
              </NeuCard>
            ))}
          </div>

          <NeuCard className="lg:col-span-4 space-y-4 h-fit">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Onboard New Physician & Create Account</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Creates the physician profile and login credentials simultaneously.
              </p>
            </div>
            <NeuInput
              label="Full Name (e.g., Dr. Elena Rostova)"
              required
              value={newDocName}
              onChange={(e) => {
                setNewDocName(e.target.value);
                if (newDocError) setNewDocError('');
              }}
            />
            <NeuSelect
              label="Department"
              value={newDocDeptId}
              onChange={(e) => setNewDocDeptId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <NeuInput
              label="Specialty"
              placeholder="e.g., Non-Invasive Cardiology"
              value={newDocSpecialty}
              onChange={(e) => setNewDocSpecialty(e.target.value)}
            />
            <div className="pt-2 border-t border-black/5 space-y-3">
              <div className="text-xs font-bold text-[#3478F6]">
                Physician Account Login Credentials
              </div>
              <NeuInput
                label="Physician Email Address"
                type="email"
                required
                placeholder="dr.rostova@telehealth.example.org"
                value={newDocEmail}
                onChange={(e) => {
                  setNewDocEmail(e.target.value);
                  if (newDocError) setNewDocError('');
                }}
              />
              <NeuInput
                label="Account Password"
                type="password"
                required
                placeholder="Enter temporary or initial password"
                value={newDocPassword}
                onChange={(e) => {
                  setNewDocPassword(e.target.value);
                  if (newDocError) setNewDocError('');
                }}
              />
            </div>

            {newDocError && (
              <p className="text-xs font-semibold text-[#C63D4D]">{newDocError}</p>
            )}

            <NeuButton
              variant="primary"
              className="w-full"
              onClick={() => {
                if (!newDocName.trim()) {
                  setNewDocError('Please enter the physician’s full name.');
                  return;
                }
                if (!newDocEmail.trim() || !newDocEmail.includes('@')) {
                  setNewDocError('Please enter a valid physician email address.');
                  return;
                }
                if (!newDocPassword.trim() || newDocPassword.trim().length < 6) {
                  setNewDocError('Please enter an account password (at least 6 characters).');
                  return;
                }
                const dept = departments.find((d) => d.id === newDocDeptId);
                onCreateDoctor(
                  {
                    id: `doc-${Date.now()}`,
                    userId: `usr-doc-${Date.now()}`,
                    fullName: newDocName.trim(),
                    title: 'MD — Attending Physician',
                    departmentId: newDocDeptId,
                    departmentName: dept?.name || 'Internal & General Medicine',
                    specialty: newDocSpecialty.trim() || 'General Practice',
                    licenseNumber: `CA-MED-${Math.floor(100000 + Math.random() * 900000)}`,
                    email: newDocEmail.trim(),
                    contactNumber: '+1 (415) 890-7000',
                    bio: 'Board-certified attending physician.',
                    consultationFeeLabel: 'Standard Clinic Tier',
                    status: 'Active',
                    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    morningHours: { start: '07:00', end: '11:00' },
                    afternoonHours: { start: '13:00', end: '17:00' },
                  },
                  newDocPassword.trim()
                );
                setNewDocName('');
                setNewDocSpecialty('');
                setNewDocEmail('');
                setNewDocPassword('');
                setNewDocError('');
                triggerToast(
                  `New physician profile and login account (${newDocEmail.trim()}) created.`
                );
              }}
            >
              Create Account & Add to Roster
            </NeuButton>
          </NeuCard>
        </div>
      </div>
    );
  }

  // SCREEN 32 & 33: APPOINTMENT MANAGEMENT & CALENDAR SCHEDULING MANAGEMENT
  if (
    currentScreen === 'appointment-management' ||
    currentScreen === 'calendar-scheduling-management'
  ) {
    const filteredApts = appointments.filter((a) => {
      const matchSt = statusFilter === 'ALL' || a.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        a.referenceNumber.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q);
      return matchSt && matchQ;
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">
            Master Appointments & Scheduling Governance
          </h1>
          <p className="text-xs text-[#64748B]">
            Search by reference, filter by status, and resolve scheduling conflicts across all departments.
          </p>
        </div>

        <NeuCard className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search by reference (TH-2026-...), patient, or physician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search all clinic appointments"
              className="neu-inset w-full rounded-xl pl-10 pr-4 py-2 text-sm text-[#172B4D]"
            />
          </div>
          <select
            aria-label="Filter appointments by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neu-inset rounded-xl px-3.5 py-2 text-xs font-semibold text-[#172B4D] bg-[#E9EEF3]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Reschedule Requested">Reschedule Requested</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </NeuCard>

        <NeuCard className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#64748B]">
                <th className="py-3 px-3">Ref #</th>
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-3">Physician & Dept</th>
                <th className="py-3 px-3">Date & 1-Hour Slot</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredApts.map((apt) => (
                <tr key={apt.id} className="hover:bg-white/30">
                  <td className="py-3 px-3 font-mono-tabular font-bold text-[#3478F6]">
                    {apt.referenceNumber}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#172B4D]">{apt.patientName}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#172B4D]">{apt.doctorName}</div>
                    <div className="text-[#64748B]">{apt.departmentName}</div>
                  </td>
                  <td className="py-3 px-3 font-mono-tabular">
                    <div>{formatReadableDate(apt.date)}</div>
                    <div className="text-[#16865C] font-semibold">{apt.timeLabel}</div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusIndicator status={apt.status} />
                    {apt.cancellationReason && (
                      <div className="text-[11px] text-[#C63D4D] mt-1 max-w-[200px]">
                        Reason: {apt.cancellationReason}
                      </div>
                    )}
                    {apt.rejectionReason && (
                      <div className="text-[11px] text-[#C63D4D] mt-1 max-w-[200px]">
                        Reason: {apt.rejectionReason}
                      </div>
                    )}
                    {apt.rescheduleReason && (
                      <div className="text-[11px] text-[#C68117] mt-1 max-w-[200px]">
                        Reschedule: {apt.rescheduleReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                    {apt.status === 'Pending' && (
                      <NeuButton
                        size="sm"
                        variant="primary"
                        onClick={() => onConfirmAppointment(apt.id)}
                      >
                        Confirm
                      </NeuButton>
                    )}
                    {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                      <>
                        <NeuButton size="sm" onClick={() => onOpenRescheduleModal(apt)}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>
      </div>
    );
  }

  // SCREEN 34: DEPARTMENTS & APPOINTMENT TYPES
  if (currentScreen === 'departments-appointment-types') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">
            Configurable Departments & Appointment Service Types
          </h1>
          <p className="text-xs text-[#64748B]">
            Add or update clinic departments and standardized 60-minute service types dynamically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NeuCard className="space-y-4">
            <h2 className="text-base font-bold text-[#172B4D]">
              Clinical Departments ({departments.length})
            </h2>
            <div className="divide-y divide-black/10">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono-tabular font-bold text-[#3478F6]">{d.code}</span> ·{' '}
                    <strong className="text-[#172B4D]">{d.name}</strong>
                  </div>
                  <StatusIndicator status="Active" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/5 space-y-3">
              <div className="text-xs font-bold text-[#172B4D]">Add New Department</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <NeuInput
                    label="Department Name"
                    placeholder="e.g., Orthopedics"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                  />
                </div>
                <NeuInput
                  label="Code"
                  placeholder="ORTH"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                />
              </div>
              <NeuButton
                size="sm"
                variant="primary"
                onClick={() => {
                  if (!newDeptName.trim()) return;
                  onCreateDepartment({
                    id: `dept-${Date.now()}`,
                    name: newDeptName.trim(),
                    code: (newDeptCode.trim() || 'CLIN').toUpperCase(),
                    description: 'Outpatient specialist consultations and diagnostic evaluations.',
                    headDoctorName: 'Dr. Marcus Vance',
                    active: true,
                    doctorCount: 1,
                  });
                  setNewDeptName('');
                  setNewDeptCode('');
                }}
              >
                Create Department
              </NeuButton>
            </div>
          </NeuCard>

          <NeuCard className="space-y-4">
            <h2 className="text-base font-bold text-[#172B4D]">
              Appointment Types ({appointmentTypes.length})
            </h2>
            <div className="divide-y divide-black/10">
              {appointmentTypes.map((t) => (
                <div
                  key={t.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-[#172B4D]">{t.name}</strong> ·{' '}
                    <span className="font-mono-tabular text-[#64748B]">
                      {t.durationMinutes} mins
                    </span>
                  </div>
                  <StatusIndicator status="Active" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/5 space-y-3">
              <NeuInput
                label="New 60-Minute Service Type Name"
                placeholder="e.g., Preventive Nutrition Consultation"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
              <NeuButton
                size="sm"
                variant="primary"
                onClick={() => {
                  if (!newTypeName.trim()) return;
                  onCreateAppointmentType({
                    id: `type-${Date.now()}`,
                    name: newTypeName.trim(),
                    durationMinutes: 60,
                    departmentIds: [],
                    description: 'Clinic-approved 60-minute consultation.',
                    preparationInstructions: 'Arrive 10 minutes early.',
                    active: true,
                  });
                  setNewTypeName('');
                }}
              >
                Add Appointment Type
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      </div>
    );
  }

  // SCREEN 35: NOTIFICATION & SYSTEM SETTINGS
  if (currentScreen === 'notification-system-settings') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">
            System Settings & Clinic Policies
          </h1>
          <p className="text-xs text-[#64748B]">
            Configure clinic hours, cancellation policies, and patient scheduling permissions.
          </p>
        </div>

        <div className="w-full">
          <NeuCard className="w-full space-y-4">
            <h2 className="text-base font-bold text-[#172B4D] border-b border-black/5 pb-2">
              Clinic Scheduling & Policy Parameters
            </h2>
            <NeuInput
              label="Clinic Facility Name"
              value={systemSettings.clinicName}
              onChange={(e) =>
                onUpdateSystemSettings({ ...systemSettings, clinicName: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-6 py-2 border-y border-black/5 text-xs">
              <div>
                <div className="text-[#64748B]">Morning Window</div>
                <div className="font-mono-tabular font-bold text-[#172B4D] mt-0.5">
                  {systemSettings.morningWindow}
                </div>
              </div>
              <div>
                <div className="text-[#64748B]">Afternoon Window</div>
                <div className="font-mono-tabular font-bold text-[#172B4D] mt-0.5">
                  {systemSettings.afternoonWindow}
                </div>
              </div>
            </div>

            <NeuToggle
              label="Allow Patient Self-Service Rescheduling"
              description="Permits patients to request slot adjustments up to 24 hours prior."
              checked={systemSettings.allowPatientReschedule}
              onChange={(val) =>
                onUpdateSystemSettings({ ...systemSettings, allowPatientReschedule: val })
              }
            />
            <NeuToggle
              label="Require Verified Email for Google Account Linking"
              description="Prevents duplicate patient profiles when authenticating via OAuth."
              checked={systemSettings.requireEmailVerification}
              onChange={(val) =>
                onUpdateSystemSettings({ ...systemSettings, requireEmailVerification: val })
              }
            />
          </NeuCard>
        </div>
      </div>
    );
  }

  // SCREEN 36: AUDIT LOG / ACTIVITY HISTORY
  if (currentScreen === 'audit-log') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">
            Clinical Operations Audit Log & Activity History
          </h1>
          <p className="text-xs text-[#64748B]">
            Immutable trail of appointment status transitions, schedule blocks, and profile updates.
          </p>
        </div>

        <NeuCard className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#64748B]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor & Role</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Target Ref</th>
                <th className="py-3 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-3 font-mono-tabular text-[#64748B]">{log.timestamp}</td>
                  <td className="py-3 px-3 font-bold text-[#172B4D]">
                    {log.actorName} <span className="font-normal text-[#64748B]">({log.actorRole})</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#3478F6]">{log.action}</td>
                  <td className="py-3 px-3 font-mono-tabular font-bold text-[#172B4D]">
                    {log.targetReference}
                  </td>
                  <td className="py-3 px-3 text-[#64748B]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>
      </div>
    );
  }

  // DEFAULT SCREEN 27: ADMINISTRATION DASHBOARD
  const todayCount = appointments.filter((a) => a.date === DEMO_TODAY).length;
  const pendingCount = appointments.filter((a) => a.status === 'Pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const cancelledCount = appointments.filter(
    (a) => a.status === 'Cancelled' || a.status === 'Rejected'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#3478F6]">
            Clinic Operations & Governance Console · Least-Privilege Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
            Administration Dashboard
          </h1>
          <p className="text-xs text-[#64748B]">
            Monitor clinic capacity, patient accounts, physician rosters, and scheduling integrity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <NeuButton onClick={() => onNavigate('appointment-management')}>
            Manage Appointments
          </NeuButton>
          <NeuButton variant="primary" onClick={() => onNavigate('doctor-management')}>
            Doctor Roster
          </NeuButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Total Patients</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#172B4D]">
            {patients.length}
          </div>
        </NeuCard>
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Total Doctors</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#3478F6]">
            {doctors.length}
          </div>
        </NeuCard>
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Today’s Visits</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#172B4D]">
            {todayCount}
          </div>
        </NeuCard>
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Pending Requests</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#C68117]">
            {pendingCount}
          </div>
        </NeuCard>
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Confirmed</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#16865C]">
            {confirmedCount}
          </div>
        </NeuCard>
        <NeuCard className="space-y-1">
          <div className="text-xs text-[#64748B]">Completed / Canceled</div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[#172B4D]">
            {completedCount} / {cancelledCount}
          </div>
        </NeuCard>
      </div>

      <div>
        <NeuCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#172B4D]">
              Recent System Activity & Audit Trail
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('audit-log')}
              className="text-xs text-[#3478F6] font-semibold hover:underline cursor-pointer"
            >
              View Full Audit Log →
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="neu-inset rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#172B4D]">{log.actorName}</span> ·{' '}
                  <span className="text-[#3478F6] font-semibold">{log.action}</span> (
                  <span className="font-mono-tabular">{log.targetReference}</span>)
                  <div className="text-[#64748B] mt-0.5">{log.details}</div>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#64748B] shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>
    </div>
  );
};
