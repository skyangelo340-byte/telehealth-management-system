import React, { useState, useEffect } from 'react';
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
  Pill,
  Printer,
  Download,
  Eye,
  Clock,
  Activity,
  Code2,
  Copy,
  Mail,
  Languages,
  QrCode,
} from 'lucide-react';
import {
  connectOfficialOtpSender,
  getOfficialOtpSenderStatus,
} from '../../services/googleAuth';
import { useLanguage } from '../../context/LanguageContext';
import { PrescriptionPdfModal } from '../../components/ui/PrescriptionPdfModal';
import { GOOGLE_COLAB_NOTEBOOK_PYTHON } from '../../services/symptomTriageService';
import {
  buildResetaPdfDocument,
  buildResetaRegistryPdfDocument,
  triggerPdfPrint,
} from '../../utils/prescriptionPdf';
import {
  PatientProfile,
  DoctorProfile,
  Department,
  AppointmentType,
  Appointment,
  DoctorSchedule,
  DoctorScheduleBlock,
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
  NeuModal,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';

interface AdminPortalPagesProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  patients: PatientProfile[];
  onUpdatePatient: (updated: PatientProfile) => void;
  doctors: DoctorProfile[];
  onUpdateDoctor: (updated: DoctorProfile) => void;
  onDeactivateDoctor: (doctorId: string, reason: string, cancelPendingAppointments: boolean) => { cancelledCount: number };
  onDeleteDoctor: (doctorId: string) => { success: boolean; error?: string };
  onCreateDoctor: (newDoc: DoctorProfile, password: string) => { success: boolean; error?: string };
  departments: Department[];
  onCreateDepartment: (dept: Department) => void;
  appointmentTypes: AppointmentType[];
  onCreateAppointmentType: (aptType: AppointmentType) => void;
  appointments: Appointment[];
  schedules: Record<string, DoctorSchedule>;
  onApproveScheduleBlock: (doctorId: string, blockId: string) => void;
  onRejectScheduleBlock: (doctorId: string, blockId: string, reason?: string) => void;
  onConfirmAppointment: (id: string) => void;
  onConfirmPayment?: (id: string) => void;
  onRejectPayment?: (id: string, reason: string) => void;
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
  onDeactivateDoctor,
  onDeleteDoctor,
  onCreateDoctor,
  departments,
  onCreateDepartment,
  appointmentTypes,
  onCreateAppointmentType,
  appointments,
  schedules,
  onApproveScheduleBlock,
  onRejectScheduleBlock,
  onConfirmAppointment,
  onConfirmPayment,
  onRejectPayment,
  onOpenCancelModal,
  onOpenRescheduleModal,
  auditLogs,
  systemSettings,
  onUpdateSystemSettings,
}) => {
  const { language, setLanguage, isTagalog } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(patients[0] || null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(doctors[0] || null);

  // Payment Verification Modal State
  const [expandedReceiptModalApt, setExpandedReceiptModalApt] = useState<Appointment | null>(null);
  const [rejectPaymentModalApt, setRejectPaymentModalApt] = useState<Appointment | null>(null);
  const [paymentRejectionReasonInput, setPaymentRejectionReasonInput] = useState('');

  // Clinic QR Setup State
  const [qrAccountName, setQrAccountName] = useState(systemSettings.clinicQrAccountName || 'TeleHealth Medical Center');
  const [qrAccountNumber, setQrAccountNumber] = useState(systemSettings.clinicQrAccountNumber || '0917-888-9999');
  const [qrBankName, setQrBankName] = useState(systemSettings.clinicQrBankName || 'GCash / Maya / Bank QR Ph');
  const [qrFeePhp, setQrFeePhp] = useState(systemSettings.consultationFeePhp || 10);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(systemSettings.clinicQrCodeUrl || '/assets/aistudio/image_3826cde4.png');
  const [qrFileError, setQrFileError] = useState<string | null>(null);
  const adminQrFileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (systemSettings) {
      setQrAccountName(systemSettings.clinicQrAccountName || 'TeleHealth Medical Center');
      setQrAccountNumber(systemSettings.clinicQrAccountNumber || '0917-888-9999');
      setQrBankName(systemSettings.clinicQrBankName || 'GCash / Maya / Bank QR Ph');
      setQrFeePhp(systemSettings.consultationFeePhp || 10);
      setQrCodeDataUrl(systemSettings.clinicQrCodeUrl || '/assets/aistudio/image_3826cde4.png');
    }
  }, [systemSettings]);

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
  const [resignReason, setResignReason] = useState('Resigned from clinic practice');
  const [cancelFutureAptsOnResign, setCancelFutureAptsOnResign] = useState(true);
  const [deleteDocError, setDeleteDocError] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [adminPreviewRxApt, setAdminPreviewRxApt] = useState<Appointment | null>(null);
  const [viewedLeaveItem, setViewedLeaveItem] = useState<{
    block: DoctorScheduleBlock;
    doctor?: DoctorProfile;
    displayTypeLabel: string;
  } | null>(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [colabModalOpen, setColabModalOpen] = useState(false);
  const [copiedColab, setCopiedColab] = useState(false);
  const [otpSenderConnected, setOtpSenderConnected] = useState(false);
  const [otpSenderUpdatedAt, setOtpSenderUpdatedAt] = useState<string | undefined>(undefined);
  const [isConnectingOtpSender, setIsConnectingOtpSender] = useState(false);

  useEffect(() => {
    getOfficialOtpSenderStatus().then((st) => {
      setOtpSenderConnected(st.connected);
      setOtpSenderUpdatedAt(st.updatedAt);
    });
  }, []);

  const handleConnectOtpSender = async () => {
    setIsConnectingOtpSender(true);
    try {
      const res = await connectOfficialOtpSender();
      setOtpSenderConnected(res.connected);
      setOtpSenderUpdatedAt(new Date().toISOString());
      triggerToast(`Official OTP Sender (${res.email}) linked! Patients can now receive OTP emails automatically.`);
    } catch (err: any) {
      triggerToast(err?.message || 'Could not connect official OTP sender.');
    } finally {
      setIsConnectingOtpSender(false);
    }
  };

  const handleCopyColabScript = () => {
    navigator.clipboard.writeText(GOOGLE_COLAB_NOTEBOOK_PYTHON);
    setCopiedColab(true);
    setTimeout(() => setCopiedColab(false), 2500);
  };

  const handleDownloadColabIpynb = () => {
    const ipynbContent = {
      nbformat: 4,
      nbformat_minor: 0,
      metadata: {
        colab: {
          provenance: [],
          name: 'TeleHealth_Random_Forest_Gemini_Triage.ipynb',
        },
        kernelspec: {
          name: 'python3',
          display_name: 'Python 3',
        },
      },
      cells: [
        {
          cell_type: 'markdown',
          metadata: {},
          source: [
            '# TeleHealth Symptom Assessment — Random Forest (100 Trees) + Gemini NLP Pipeline\n',
            'Run the code cell below in Google Colab to train, evaluate, and export the 100-Tree Random Forest clinical department classifier.',
          ],
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: GOOGLE_COLAB_NOTEBOOK_PYTHON.split('\n').map((line) => `${line}\n`),
        },
      ],
    };
    const blob = new Blob([JSON.stringify(ipynbContent, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TeleHealth_Random_Forest_Triage.ipynb';
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(''), 3500);
  };

  // Flatten all doctor schedule blocks (Leave, Blocked Date / Absent, Slot Block) for Admin governance
  const allDoctorBlocks = Object.values(schedules).flatMap((sched) => {
    const docObj = doctors.find((d) => d.id === sched.doctorId);
    return (sched.blocks || []).map((block) => ({
      block,
      doctor: docObj,
    }));
  });
  const pendingDoctorBlocks = allDoctorBlocks.filter(
    (item) => item.block.status === 'Pending Approval'
  );

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
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
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
      const doctorAppointments = appointments.filter((a) => a.doctorId === selectedDoctor.id);
      const upcomingDoctorAppointments = doctorAppointments.filter(
        (a) =>
          (a.status === 'Pending' ||
            a.status === 'Confirmed' ||
            a.status === 'Reschedule Requested' ||
            a.status === 'Rescheduled') &&
          a.date >= DEMO_TODAY
      );
      const hasAnyAppointments = doctorAppointments.length > 0;
      const isDeactivated =
        selectedDoctor.status === 'Resigned' || selectedDoctor.status === 'Inactive';

      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#172B4D]">
                Configure Physician: {selectedDoctor.fullName}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                {selectedDoctor.email} · {selectedDoctor.licenseNumber}
              </p>
            </div>
            <NeuButton
              onClick={() => {
                setDeleteDocError('');
                setConfirmDeleteOpen(false);
                onNavigate('doctor-management');
              }}
            >
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
                  { value: 'Active', label: 'Active (Accepting Bookings & Login Enabled)' },
                  { value: 'On Leave', label: 'On Leave (Temporarily Unavailable)' },
                  { value: 'Inactive', label: 'Inactive (Deactivated — Login Blocked)' },
                  { value: 'Resigned', label: 'Resigned (Offboarded — Login Blocked & Archived)' },
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

          {/* RECOMMENDED BEST PRACTICE: SOFT DEACTIVATION / RESIGNATION OFFBOARDING */}
          <NeuCard className="space-y-4 border border-[#C87A14]/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#C87A14] uppercase tracking-wider">
                  Recommended Clinical Offboarding (Soft Deactivation)
                </div>
                <h2 className="text-base font-bold text-[#172B4D] mt-0.5">
                  Resign / Deactivate Physician Account
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Preserves historical patient records and audit logs while immediately blocking login access, hiding the physician from new patient bookings, and optionally cancelling upcoming appointments ({upcomingDoctorAppointments.length} active upcoming).
                </p>
              </div>
              <StatusIndicator status={selectedDoctor.status} />
            </div>

            {!isDeactivated ? (
              <div className="space-y-3 pt-2 border-t border-black/5">
                <NeuInput
                  label="Offboarding / Resignation Reason"
                  value={resignReason}
                  onChange={(e) => setResignReason(e.target.value)}
                  placeholder="e.g., Resigned from clinic practice / End of fellowship"
                />

                <div className="neu-inset-sm rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#172B4D]">
                      Auto-cancel & notify {upcomingDoctorAppointments.length} upcoming patient appointment(s)
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Automatically releases future slots and sends an in-app notification to affected patients to rebook with another specialist.
                    </div>
                  </div>
                  <NeuToggle
                    checked={cancelFutureAptsOnResign}
                    onChange={setCancelFutureAptsOnResign}
                    label="Auto-cancel upcoming appointments"
                  />
                </div>

                <div className="flex justify-end">
                  <NeuButton
                    variant="danger"
                    onClick={() => {
                      const res = onDeactivateDoctor(
                        selectedDoctor.id,
                        resignReason.trim() || 'Resigned from clinic practice',
                        cancelFutureAptsOnResign
                      );
                      triggerToast(
                        `${selectedDoctor.fullName} marked as Resigned (Login disabled${
                          res.cancelledCount > 0
                            ? `, ${res.cancelledCount} upcoming appointment(s) cancelled & notified`
                            : ''
                        }).`
                      );
                      onNavigate('doctor-management');
                    }}
                  >
                    Mark as Resigned & Deactivate Access
                  </NeuButton>
                </div>
              </div>
            ) : (
              <div className="neu-inset rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#172B4D]">
                    This physician account is currently {selectedDoctor.status}.
                  </div>
                  <div className="text-[#64748B]">
                    Login access is blocked and the physician is hidden from new patient bookings. Historical records ({doctorAppointments.length} total appointment record(s)) remain intact.
                  </div>
                </div>
                <NeuButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const reactivated: DoctorProfile = {
                      ...selectedDoctor,
                      status: 'Active',
                    };
                    onUpdateDoctor(reactivated);
                    setSelectedDoctor(reactivated);
                    triggerToast(`${selectedDoctor.fullName} reactivated to Active roster.`);
                  }}
                >
                  Reactivate Physician Account
                </NeuButton>
              </div>
            )}
          </NeuCard>

          {/* PERMANENT REMOVE / HARD DELETE (ONLY FOR MISTAKEN / ZERO-HISTORY ACCOUNTS) */}
          <NeuCard className="space-y-3 border border-[#D63649]/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#D63649] uppercase tracking-wider">
                  Permanent Account Removal
                </div>
                <h2 className="text-base font-bold text-[#172B4D] mt-0.5">
                  Delete Physician Account from System
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  {hasAnyAppointments
                    ? `Protected Clinical Record: ${selectedDoctor.fullName} has ${doctorAppointments.length} linked appointment record(s). Hard deletion is disabled to protect patient medical history — use "Mark as Resigned & Deactivate Access" above instead.`
                    : 'This physician has 0 linked appointments. You can permanently delete this account and its login credentials if it was created by mistake.'}
                </p>
              </div>
            </div>

            {deleteDocError && (
              <p className="text-xs font-semibold text-[#D63649]">{deleteDocError}</p>
            )}

            {!confirmDeleteOpen ? (
              <div className="flex justify-end">
                <NeuButton
                  variant="danger"
                  disabled={hasAnyAppointments}
                  onClick={() => {
                    setDeleteDocError('');
                    setConfirmDeleteOpen(true);
                  }}
                >
                  {hasAnyAppointments
                    ? `Cannot Delete (${doctorAppointments.length} Linked Record(s))`
                    : 'Permanently Delete Physician Account'}
                </NeuButton>
              </div>
            ) : (
              <div className="neu-inset rounded-xl p-4 space-y-3 border border-[#D63649]/30">
                <div className="text-xs font-bold text-[#D63649]">
                  Confirm Permanent Deletion of {selectedDoctor.fullName} ({selectedDoctor.email})?
                </div>
                <p className="text-xs text-[#64748B]">
                  This will permanently remove the doctor profile, schedule configuration, and user login credentials from the database.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <NeuButton size="sm" onClick={() => setConfirmDeleteOpen(false)}>
                    Cancel
                  </NeuButton>
                  <NeuButton
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      const res = onDeleteDoctor(selectedDoctor.id);
                      if (!res.success) {
                        setDeleteDocError(res.error || 'Unable to delete doctor account.');
                        setConfirmDeleteOpen(false);
                        return;
                      }
                      setConfirmDeleteOpen(false);
                      triggerToast(
                        `Physician account ${selectedDoctor.fullName} (${selectedDoctor.email}) permanently deleted.`
                      );
                      onNavigate('doctor-management');
                    }}
                  >
                    Yes, Permanently Delete
                  </NeuButton>
                </div>
              </div>
            )}
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
                    {doc.specialty} · {doc.email} · Days: {doc.workingDays.join(', ')}
                  </div>
                  {doc.deactivationReason && (doc.status === 'Resigned' || doc.status === 'Inactive') && (
                    <div className="text-[11px] font-medium text-[#D63649]">
                      Offboarded: {doc.deactivationReason}
                    </div>
                  )}
                </div>
                <NeuButton
                  size="sm"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setDeleteDocError('');
                    setConfirmDeleteOpen(false);
                    onNavigate('admin-doctor-details');
                  }}
                >
                  Configure / Offboard
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
                const normalizedEmail = newDocEmail.trim().toLowerCase();
                if (!normalizedEmail || !normalizedEmail.includes('@')) {
                  setNewDocError('Please enter a valid physician email address.');
                  return;
                }
                if (normalizedEmail === 'admintelehealth@gmail.com') {
                  setNewDocError(
                    'This email is reserved for the System Administrator. Please use a separate email for the physician.'
                  );
                  return;
                }
                const existsInPatients = patients.some(
                  (p) => p.email.trim().toLowerCase() === normalizedEmail
                );
                if (existsInPatients) {
                  setNewDocError(
                    'This email is already registered as a Patient account. Please use a separate email address for the Physician account.'
                  );
                  return;
                }
                const existsInDoctors = doctors.some(
                  (d) => d.email.trim().toLowerCase() === normalizedEmail
                );
                if (existsInDoctors) {
                  setNewDocError(
                    'A physician with this email address is already registered in the roster.'
                  );
                  return;
                }
                if (!newDocPassword.trim() || newDocPassword.trim().length < 6) {
                  setNewDocError('Please enter an account password (at least 6 characters).');
                  return;
                }
                const dept = departments.find((d) => d.id === newDocDeptId);
                const result = onCreateDoctor(
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
                if (!result.success) {
                  setNewDocError(result.error || 'Unable to create physician account.');
                  return;
                }
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

  // SCREEN: ADMIN PRESCRIPTIONS (RESETA / E-RX)
  if (currentScreen === 'admin-receipts') {
    const filteredPrescriptions = appointments.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        a.referenceNumber.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q)
      );
    });

    const previewDoctor = adminPreviewRxApt
      ? doctors.find((d) => d.id === adminPreviewRxApt.doctorId) || null
      : null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Clinic e-Prescriptions Registry (Reseta / ℞)
            </h1>
            <p className="text-xs text-[#64748B]">
              Master clinical log of issued patient prescriptions (e-Rx) and medication orders across departments.
            </p>
          </div>
        </div>

        <PrescriptionPdfModal
          open={Boolean(adminPreviewRxApt)}
          onClose={() => setAdminPreviewRxApt(null)}
          appointment={adminPreviewRxApt}
          doctor={previewDoctor}
        />

        <NeuCard>
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search prescription by Rx # (TH-2026-...), patient, or prescribing physician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search clinic prescriptions"
              className="neu-inset w-full rounded-xl pl-10 pr-4 py-2 text-sm text-[#172B4D]"
            />
          </div>
        </NeuCard>

        <NeuCard className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#64748B]">
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-3">Prescribing Physician</th>
                <th className="py-3 px-3">Consultation Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Reseta PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPrescriptions.map((apt) => (
                <tr key={apt.id} className="hover:bg-white/30">
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#172B4D]">{apt.patientName}</div>
                    <div className="text-[#C63D4D] text-[11px]">
                      Allergies: {apt.knownAllergiesSnapshot || 'None'}
                    </div>
                  </td>
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
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <NeuButton
                      size="sm"
                      variant="primary"
                      icon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => {
                        const docProfile =
                          doctors.find((d) => d.id === apt.doctorId) || null;
                        const pdf = buildResetaPdfDocument({
                          appointment: apt,
                          doctor: docProfile,
                        });
                        pdf.save(`Reseta-RX-${apt.referenceNumber}.pdf`);
                      }}
                    >
                      PDF
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

  // SCREEN: PHYSICIAN LEAVE, ABSENCE & SLOT BLOCK APPROVALS (DEDICATED ADMIN TAB)
  if (currentScreen === 'physician-leave-approvals') {
    const filteredBlocks = allDoctorBlocks.filter(({ block, doctor: docItem }) => {
      const matchSt = statusFilter === 'ALL' || block.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        (docItem?.fullName || '').toLowerCase().includes(q) ||
        (docItem?.departmentName || '').toLowerCase().includes(q) ||
        block.type.toLowerCase().includes(q) ||
        block.reason.toLowerCase().includes(q) ||
        block.startDate.toLowerCase().includes(q);
      return matchSt && matchQ;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Physician Leave, Absence &amp; Slot Block Requests
            </h1>
            <p className="text-xs text-[#64748B]">
              Doctors cannot unilaterally block slots or take leave without Admin approval. Approving a request immediately blocks the affected date(s) or 1-hour slot on the Patient Booking Calendar.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="neu-inset-sm px-3.5 py-2 rounded-xl font-semibold text-[#C87A14]">
              Pending Approval:{' '}
              <strong className="font-mono-tabular">{pendingDoctorBlocks.length}</strong>
            </span>
          </div>
        </div>

        {adminToast && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center justify-between">
            <span>{adminToast}</span>
            <button type="button" onClick={() => setAdminToast('')} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        <NeuCard className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search by physician name, department, leave type, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search physician leave requests"
              className="neu-inset w-full rounded-xl pl-10 pr-4 py-2 text-sm text-[#172B4D]"
            />
          </div>
          <select
            aria-label="Filter leave requests by approval status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neu-inset rounded-xl px-3.5 py-2 text-xs font-semibold text-[#172B4D] bg-[#E9EEF3]"
          >
            <option value="ALL">All Statuses ({allDoctorBlocks.length})</option>
            <option value="Pending Approval">Pending Approval ({pendingDoctorBlocks.length})</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </NeuCard>

        <NeuCard className="space-y-4 border border-[#3478F6]/20">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/10">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Physician Leave, Absence &amp; Schedule Block Queue ({filteredBlocks.length})
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Review requests submitted by attending physicians. Approved items immediately block patient booking slots.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="neu-inset-sm px-2.5 py-1 rounded-lg font-semibold text-[#16865C]">
                Approved:{' '}
                <strong className="font-mono-tabular">
                  {allDoctorBlocks.filter((i) => i.block.status === 'Approved').length}
                </strong>
              </span>
              <span className="neu-inset-sm px-2.5 py-1 rounded-lg font-semibold text-[#C87A14]">
                Pending:{' '}
                <strong className="font-mono-tabular">{pendingDoctorBlocks.length}</strong>
              </span>
            </div>
          </div>

          {filteredBlocks.length === 0 ? (
            <div className="neu-inset rounded-xl p-8 text-center text-xs text-[#64748B]">
              No physician leave, absence, or slot block requests match your current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-[#64748B]">
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Physician &amp; Dept</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Date(s) / Slot</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Reason</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Approval Status</th>
                    <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">Admin Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {filteredBlocks.map(({ block, doctor: docItem }) => {
                    const isWorkingDaysUpdate =
                      block.type === 'Break Override' &&
                      block.reason.toLowerCase().includes('working days');
                    const displayTypeLabel = isWorkingDaysUpdate
                      ? 'Weekly Working Days Update'
                      : block.type === 'Blocked Date'
                        ? 'Full-Day Absent / Blocked Date'
                        : block.type;

                    return (
                      <tr key={block.id} className="hover:bg-white/35 transition-colors align-middle">
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-[#172B4D] text-xs">
                            {docItem?.fullName || block.doctorId}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {docItem?.departmentName || 'Clinical Department'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3.5 font-mono-tabular whitespace-nowrap">
                          <div className="font-bold text-[#3478F6]">
                            {formatReadableDate(block.startDate)}
                            {block.endDate && block.endDate !== block.startDate
                              ? ` → ${formatReadableDate(block.endDate)}`
                              : ''}
                          </div>
                          {block.slotStartTime ? (
                            <div className="text-[#16865C] font-semibold text-[11px] mt-0.5">
                              Slot: {block.slotStartTime}
                              {block.slotEndTime ? ` – ${block.slotEndTime}` : ''}
                            </div>
                          ) : isWorkingDaysUpdate ? (
                            <div className="text-[#64748B] text-[11px] mt-0.5">
                              Recurring Weekly Roster
                            </div>
                          ) : (
                            <div className="text-[#64748B] text-[11px] mt-0.5">Full Day</div>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <NeuButton
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() =>
                              setViewedLeaveItem({
                                block,
                                doctor: docItem,
                                displayTypeLabel,
                              })
                            }
                          >
                            View
                          </NeuButton>
                        </td>

                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <StatusIndicator status={block.status} />
                        </td>

                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            {block.status === 'Pending Approval' ? (
                              <>
                                <NeuButton
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    onApproveScheduleBlock(block.doctorId, block.id);
                                    triggerToast(
                                      `Approved ${docItem?.fullName || 'Doctor'}'s ${displayTypeLabel} (${block.startDate}). Calendar slots updated.`
                                    );
                                  }}
                                >
                                  Approve
                                </NeuButton>
                                <NeuButton
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    onRejectScheduleBlock(
                                      block.doctorId,
                                      block.id,
                                      'Declined by Admin — clinic coverage required for this schedule.'
                                    );
                                    triggerToast(
                                      `Declined ${docItem?.fullName || 'Doctor'}'s ${displayTypeLabel} request.`
                                    );
                                  }}
                                >
                                  Decline
                                </NeuButton>
                              </>
                            ) : block.status === 'Approved' ? (
                              <NeuButton
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  onRejectScheduleBlock(
                                    block.doctorId,
                                    block.id,
                                    'Revoked by Admin — slot reopened for patient bookings.'
                                  );
                                  triggerToast(
                                    `Revoked ${docItem?.fullName || 'Doctor'}'s ${displayTypeLabel}. Slots reopened.`
                                  );
                                }}
                              >
                                Revoke Approval
                              </NeuButton>
                            ) : (
                              <NeuButton
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  onApproveScheduleBlock(block.doctorId, block.id);
                                  triggerToast(
                                    `Re-approved ${docItem?.fullName || 'Doctor'}'s ${displayTypeLabel}.`
                                  );
                                }}
                              >
                                Approve Now
                              </NeuButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuCard>

        <NeuModal
          open={Boolean(viewedLeaveItem)}
          onClose={() => setViewedLeaveItem(null)}
          title="Physician Leave / Schedule Request Details"
        >
          {viewedLeaveItem && (
            <div className="space-y-4 text-xs">
              <div className="neu-inset rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[#172B4D]">
                    {viewedLeaveItem.doctor?.fullName || viewedLeaveItem.block.doctorId}
                  </div>
                  <div className="text-[#64748B]">
                    {viewedLeaveItem.doctor?.departmentName || 'Clinical Department'}
                  </div>
                </div>
                <StatusIndicator status={viewedLeaveItem.block.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="neu-inset rounded-xl p-3">
                  <div className="text-[11px] text-[#64748B]">Request Type</div>
                  <div className="font-bold text-[#172B4D] mt-0.5">
                    {viewedLeaveItem.displayTypeLabel}
                  </div>
                </div>
                <div className="neu-inset rounded-xl p-3 font-mono-tabular">
                  <div className="text-[11px] text-[#64748B] font-sans">Date(s) / Slot</div>
                  <div className="font-bold text-[#3478F6] mt-0.5">
                    {formatReadableDate(viewedLeaveItem.block.startDate)}
                    {viewedLeaveItem.block.endDate &&
                    viewedLeaveItem.block.endDate !== viewedLeaveItem.block.startDate
                      ? ` → ${formatReadableDate(viewedLeaveItem.block.endDate)}`
                      : ''}
                  </div>
                  {viewedLeaveItem.block.slotStartTime && (
                    <div className="text-[#16865C] font-semibold text-[11px]">
                      Slot: {viewedLeaveItem.block.slotStartTime}
                      {viewedLeaveItem.block.slotEndTime
                        ? ` – ${viewedLeaveItem.block.slotEndTime}`
                        : ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="neu-inset rounded-xl p-4 space-y-2 border border-[#3478F6]/20">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#3478F6]">
                    Request Type &amp; Reason
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg neu-raised-sm font-bold text-[#172B4D] text-[11px]">
                    {viewedLeaveItem.displayTypeLabel}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#172B4D] leading-relaxed pt-1">
                  {viewedLeaveItem.block.reason}
                </div>
                {viewedLeaveItem.block.rejectionReason && (
                  <div className="pt-2 mt-2 border-t border-black/10 text-[#D63649] font-medium">
                    Admin Note: {viewedLeaveItem.block.rejectionReason}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {viewedLeaveItem.block.status === 'Pending Approval' && (
                  <>
                    <NeuButton
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onApproveScheduleBlock(
                          viewedLeaveItem.block.doctorId,
                          viewedLeaveItem.block.id
                        );
                        triggerToast(
                          `Approved ${viewedLeaveItem.doctor?.fullName || 'Doctor'}'s ${viewedLeaveItem.displayTypeLabel}.`
                        );
                        setViewedLeaveItem(null);
                      }}
                    >
                      Approve
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        onRejectScheduleBlock(
                          viewedLeaveItem.block.doctorId,
                          viewedLeaveItem.block.id,
                          'Declined by Admin — clinic coverage required for this schedule.'
                        );
                        triggerToast(
                          `Declined ${viewedLeaveItem.doctor?.fullName || 'Doctor'}'s ${viewedLeaveItem.displayTypeLabel} request.`
                        );
                        setViewedLeaveItem(null);
                      }}
                    >
                      Decline
                    </NeuButton>
                  </>
                )}
                <NeuButton size="sm" onClick={() => setViewedLeaveItem(null)}>
                  Close
                </NeuButton>
              </div>
            </div>
          )}
        </NeuModal>
      </div>
    );
  }

  // SCREEN 32 & 33: APPOINTMENT MANAGEMENT & CALENDAR SCHEDULING MANAGEMENT
  if (
    currentScreen === 'appointment-management' ||
    currentScreen === 'calendar-scheduling-management'
  ) {
    const pendingReceiptSubmissions = appointments.filter(
      (a) => a.paymentStatus === 'Payment Pending Verification'
    );

    const filteredApts = appointments.filter((a) => {
      const matchSt =
        statusFilter === 'ALL' ||
        a.status === statusFilter ||
        a.paymentStatus === statusFilter;
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">
              Master Appointments &amp; Scheduling Governance
            </h1>
            <p className="text-xs text-[#64748B]">
              Monitor, confirm, reschedule, or cancel clinic appointments across all departments.
            </p>
          </div>
          {pendingReceiptSubmissions.length > 0 && (
            <div className="neu-raised rounded-xl px-3.5 py-1.5 bg-[#3478F6]/10 border border-[#3478F6]/30 text-xs font-bold text-[#3478F6] flex items-center gap-2">
              <span>💳 {pendingReceiptSubmissions.length} Payment Receipt(s) Pending Admin Verification</span>
            </div>
          )}
        </div>

        {adminToast && (
          <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center justify-between">
            <span>{adminToast}</span>
            <button type="button" onClick={() => setAdminToast('')} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* PENDING PAYMENT VERIFICATION PANEL (Admin Actions) */}
        {pendingReceiptSubmissions.length > 0 && (
          <NeuCard className="space-y-4 border-2 border-[#3478F6]/30 bg-[#3478F6]/5">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#3478F6]">
                  Action Required · Payment Verification Queue
                </div>
                <h2 className="text-base font-bold text-[#172B4D]">
                  Pending Payment Receipt Submissions ({pendingReceiptSubmissions.length})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Verify patient transfer screenshot, reference number, and amount before confirming appointment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReceiptSubmissions.map((apt) => (
                <div key={apt.id} className="neu-raised rounded-2xl p-4 bg-white/70 dark:bg-slate-900/70 border border-black/10 space-y-3">
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <div className="font-mono-tabular font-bold text-[#3478F6] text-sm">
                        {apt.referenceNumber}
                      </div>
                      <div className="font-bold text-[#172B4D] mt-0.5">{apt.patientName}</div>
                      <div className="text-[11px] text-[#64748B]">{apt.patientEmail} · {apt.patientContact}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₱{apt.paymentAmountPhp || 10}.00 PHP
                      </div>
                      <div className="text-[10px] font-mono text-[#64748B]">
                        Submitted: {apt.paymentSubmittedAt ? new Date(apt.paymentSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#64748B] pt-2 border-t border-black/5 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-[#64748B]">Physician & Dept</div>
                      <div className="font-semibold text-[#172B4D]">{apt.doctorName}</div>
                      <div className="text-[10px] text-[#64748B]">{apt.departmentName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748B]">Requested Slot</div>
                      <div className="font-semibold text-[#172B4D]">{formatReadableDate(apt.date)}</div>
                      <div className="text-[10px] font-semibold text-[#16865C]">{apt.timeLabel}</div>
                    </div>
                  </div>

                  {/* Receipt Thumbnail */}
                  {apt.paymentReceiptUrl ? (
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-[#172B4D] mb-1">Receipt Screenshot:</div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedReceiptModalApt(apt)}
                          className="w-24 h-24 rounded-xl overflow-hidden border border-black/10 bg-black/5 hover:opacity-90 cursor-pointer shrink-0"
                        >
                          <img
                            src={apt.paymentReceiptUrl}
                            alt="Receipt Screenshot"
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="space-y-1 text-xs">
                          <NeuButton
                            size="sm"
                            onClick={() => setExpandedReceiptModalApt(apt)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect Receipt
                          </NeuButton>
                          <div className="text-[10px] text-[#64748B]">Click to zoom full screenshot</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 font-medium">No receipt image attached</div>
                  )}

                  <div className="pt-3 border-t border-black/5 flex items-center justify-end gap-2">
                    <NeuButton
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRejectPaymentModalApt(apt);
                        setPaymentRejectionReasonInput('Receipt screenshot unreadable or incomplete. Please resubmit a clear screenshot.');
                      }}
                    >
                      Reject / Request New Receipt
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onConfirmPayment?.(apt.id);
                        triggerToast(`Verified payment for ${apt.referenceNumber} (${apt.patientName}). Status set to PAID & CONFIRMED.`);
                      }}
                    >
                      ✓ Confirm Payment
                    </NeuButton>
                  </div>
                </div>
              ))}
            </div>
          </NeuCard>
        )}

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
            <option value="Payment Pending Verification">Payment Pending Verification ({pendingReceiptSubmissions.length})</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Reschedule Requested">Reschedule Requested</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </NeuCard>

        <NeuCard className="overflow-x-auto border border-[#3478F6]/20">
          <table className="w-full min-w-[720px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[#64748B]">
                <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Ref #</th>
                <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Patient</th>
                <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Physician &amp; Dept</th>
                <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Date &amp; 1-Hour Slot</th>
                <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Status &amp; Notes</th>
                <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredApts.map((apt) => (
                <tr key={apt.id} className="hover:bg-white/35 transition-colors align-middle">
                  <td className="py-3.5 px-3.5 font-mono-tabular font-bold text-[#3478F6] whitespace-nowrap">
                    {apt.referenceNumber}
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-[#172B4D] whitespace-nowrap">
                    {apt.patientName}
                  </td>
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <div className="font-bold text-[#172B4D]">{apt.doctorName}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">{apt.departmentName}</div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono-tabular whitespace-nowrap">
                    <div className="font-bold text-[#172B4D]">{formatReadableDate(apt.date)}</div>
                    <div className="text-[#16865C] font-semibold text-[11px] mt-0.5">{apt.timeLabel}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <StatusIndicator status={apt.status} />
                    {apt.cancellationReason && (
                      <div className="text-[11px] text-[#C63D4D] mt-1 max-w-[220px] leading-snug">
                        Reason: {apt.cancellationReason}
                      </div>
                    )}
                    {apt.rejectionReason && (
                      <div className="text-[11px] text-[#C63D4D] mt-1 max-w-[220px] leading-snug">
                        Reason: {apt.rejectionReason}
                      </div>
                    )}
                    {apt.rescheduleReason && (
                      <div className="text-[11px] text-[#C68117] mt-1 max-w-[220px] leading-snug">
                        Reschedule: {apt.rescheduleReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>

        {/* Expanded Receipt Modal */}
        <NeuModal
          isOpen={!!expandedReceiptModalApt}
          onClose={() => setExpandedReceiptModalApt(null)}
          title={`Payment Receipt Screenshot — ${expandedReceiptModalApt?.referenceNumber || ''}`}
          subtitle={`Patient: ${expandedReceiptModalApt?.patientName || ''} · Amount: ₱${expandedReceiptModalApt?.paymentAmountPhp || 10}.00 PHP`}
        >
          {expandedReceiptModalApt && (
            <div className="space-y-4">
              <div className="max-h-[60vh] overflow-auto rounded-2xl border border-black/10 bg-black/5 p-2 flex items-center justify-center">
                {expandedReceiptModalApt.paymentReceiptUrl ? (
                  <img
                    src={expandedReceiptModalApt.paymentReceiptUrl}
                    alt="Full Payment Receipt"
                    className="max-w-full h-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className="p-6 text-xs font-semibold text-rose-600">No receipt image attached</div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-black/5">
                <NeuButton size="sm" onClick={() => setExpandedReceiptModalApt(null)}>
                  Close
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    const apt = expandedReceiptModalApt;
                    setExpandedReceiptModalApt(null);
                    setRejectPaymentModalApt(apt);
                    setPaymentRejectionReasonInput('Receipt screenshot unreadable or incomplete. Please resubmit a clear screenshot.');
                  }}
                >
                  Reject / Request New Receipt
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const apt = expandedReceiptModalApt;
                    if (apt) {
                      onConfirmPayment?.(apt.id);
                      setAdminToast(`Verified payment for ${apt.referenceNumber} (${apt.patientName}). Status set to PAID & CONFIRMED.`);
                    }
                    setExpandedReceiptModalApt(null);
                  }}
                >
                  ✓ Confirm Payment &amp; Approve Appointment
                </NeuButton>
              </div>
            </div>
          )}
        </NeuModal>

        {/* Reject Payment Modal */}
        <NeuModal
          isOpen={!!rejectPaymentModalApt}
          onClose={() => setRejectPaymentModalApt(null)}
          title={`Reject Payment Receipt — ${rejectPaymentModalApt?.referenceNumber || ''}`}
          subtitle="The appointment will remain unconfirmed until the patient resubmits a valid payment receipt screenshot."
        >
          {rejectPaymentModalApt && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Rejection Reason / Instruction for Patient:
                </label>
                <textarea
                  value={paymentRejectionReasonInput}
                  onChange={(e) => setPaymentRejectionReasonInput(e.target.value)}
                  rows={3}
                  className="neu-inset w-full rounded-xl p-3 text-xs text-[#172B4D] bg-[#E9EEF3]"
                  placeholder="Explain why the receipt was rejected (e.g., blurred screenshot, incorrect amount, missing reference)..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <NeuButton size="sm" onClick={() => setRejectPaymentModalApt(null)}>
                  Cancel
                </NeuButton>
                <NeuButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (rejectPaymentModalApt) {
                      onRejectPayment?.(
                        rejectPaymentModalApt.id,
                        paymentRejectionReasonInput.trim() || 'Receipt screenshot unreadable or invalid.'
                      );
                      setAdminToast(`Rejected payment receipt for ${rejectPaymentModalApt.referenceNumber}. Patient notified to resubmit.`);
                    }
                    setRejectPaymentModalApt(null);
                  }}
                >
                  Reject Receipt &amp; Notify Patient
                </NeuButton>
              </div>
            </div>
          )}
        </NeuModal>
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

        {/* Language & Localization Settings: English & Tagalog */}
        <NeuCard className="w-full space-y-4 border border-[#3478F6]/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#3478F6] flex items-center gap-1.5">
                <Languages className="w-4 h-4" />
                <span>System Language & Localization Settings</span>
              </div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Language Preference / Pagpili ng Wika (English / Tagalog)
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isTagalog ? 'bg-[#16865C]/15 text-[#16865C]' : 'bg-[#3478F6]/15 text-[#3478F6]'
              }`}
            >
              {isTagalog ? '✓ Naka-Tagalog' : '✓ English Active'}
            </span>
          </div>

          <p className="text-xs text-[#64748B]">
            Piliin ang nais mong wika para sa buong system. Kapag pinili ang <strong className="text-[#172B4D]">Tagalog</strong>, lahat ng pangungusap, botones, at abiso ay magiging Tagalog; kapag <strong className="text-[#172B4D]">English</strong>, magiging English ang lahat.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                !isTagalog
                  ? 'border-[#3478F6] bg-[#3478F6]/5 ring-2 ring-[#3478F6]/20'
                  : 'neu-inset-sm border-black/5 hover:bg-black/[0.02]'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-[#172B4D] flex items-center gap-2">
                  <span>English</span>
                  {!isTagalog && (
                    <span className="text-[10px] bg-[#3478F6] text-white px-2 py-0.5 rounded-full font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  Default professional healthcare and clinical terminology in English.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('tl')}
              className={`p-4 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                isTagalog
                  ? 'border-[#16865C] bg-[#16865C]/5 ring-2 ring-[#16865C]/20'
                  : 'neu-inset-sm border-black/5 hover:bg-black/[0.02]'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-[#172B4D] flex items-center gap-2">
                  <span>Tagalog (Filipino)</span>
                  {isTagalog && (
                    <span className="text-[10px] bg-[#16865C] text-white px-2 py-0.5 rounded-full font-bold">
                      Pinili
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  Lahat ng pangungusap, iskedyul, mga abiso, at botones ay isasalin sa Tagalog.
                </div>
              </div>
            </button>
          </div>
        </NeuCard>

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

        {/* Clinic Receiving QR Code & Payment Setup */}
        <NeuCard className="w-full space-y-4 border border-[#3478F6]/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div>
              <div className="text-xs font-bold text-[#3478F6] flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Clinic Receiving Payment QR Code &amp; Consultation Fee Configuration</span>
              </div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Clinic QR Code &amp; Account Details Setup
              </h2>
              <p className="text-xs text-[#64748B]">
                Upload your clinic's official receiving QR code (GCash, Maya, or QR Ph) and account credentials shown to patients during appointment booking step 6.
              </p>
            </div>
            {systemSettings.clinicQrCodeUrl ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#16865C]/15 text-[#16865C]">
                ✓ Clinic Receiving QR Code Configured
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                ⚠️ Setup Required (Booking Paused)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <NeuInput
                label="Consultation Fee (PHP)"
                type="number"
                value={qrFeePhp}
                onChange={(e) => setQrFeePhp(Number(e.target.value) || 0)}
              />
              <NeuInput
                label="Account / Beneficiary Name"
                value={qrAccountName}
                onChange={(e) => setQrAccountName(e.target.value)}
                placeholder="e.g., TeleHealth Medical Center Inc."
              />
              <NeuInput
                label="Mobile / Account Number"
                value={qrAccountNumber}
                onChange={(e) => setQrAccountNumber(e.target.value)}
                placeholder="e.g., 0917-888-9999"
              />
              <NeuInput
                label="Bank / Payment App Label"
                value={qrBankName}
                onChange={(e) => setQrBankName(e.target.value)}
                placeholder="e.g., GCash / Maya / QR Ph"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#172B4D]">
                Clinic Receiving QR Code Image (PNG / JPEG / WebP, &lt; 5MB)
              </label>

              {/* Hidden File Input using Ref */}
              <input
                ref={adminQrFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
                  if (!validTypes.includes(file.type)) {
                    setQrFileError('Invalid file format. Please select PNG, JPEG, or WebP. / Hindi suportado ang format.');
                    e.target.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setQrFileError('File size exceeds 5 MB maximum limit. / Ang laki ng file ay lumampas sa 5 MB.');
                    e.target.value = '';
                    return;
                  }
                  setQrFileError(null);
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const res = evt.target?.result as string;
                    if (res) setQrCodeDataUrl(res);
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />

              <div className="neu-inset rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 bg-[#E9EEF3]">
                {qrCodeDataUrl ? (
                  <div className="relative group">
                    <img
                      src={qrCodeDataUrl}
                      alt="Clinic QR Preview"
                      className="w-48 h-48 object-contain rounded-xl border border-black/10 bg-white p-2 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setQrCodeDataUrl('')}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 text-xs shadow hover:bg-rose-700 cursor-pointer"
                      title="Clear QR Code"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="py-6 px-4 border-2 border-dashed border-black/15 rounded-xl w-full flex flex-col items-center justify-center">
                    <QrCode className="w-10 h-10 text-[#64748B] mb-2" />
                    <div className="text-xs font-bold text-[#172B4D]">No Receiving QR Image Uploaded</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Patients cannot submit payment receipts until a valid QR code is uploaded.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <NeuButton
                    size="sm"
                    variant="primary"
                    type="button"
                    onClick={() => adminQrFileInputRef.current?.click()}
                  >
                    {qrCodeDataUrl ? 'Replace QR Code Image / Palitan' : 'Select & Upload QR Code Image / Pumili ng QR'}
                  </NeuButton>
                  {qrCodeDataUrl !== '/assets/aistudio/codex-clipboard-fa1914df-6c66-414b-940a-cca4e3f9efe0_c435cfc5.png' && (
                    <NeuButton
                      size="sm"
                      type="button"
                      onClick={() => {
                        setQrCodeDataUrl('/assets/aistudio/codex-clipboard-fa1914df-6c66-414b-940a-cca4e3f9efe0_c435cfc5.png');
                        if (adminQrFileInputRef.current) adminQrFileInputRef.current.value = '';
                      }}
                    >
                      Reset to Default QR / I-reset sa Default
                    </NeuButton>
                  )}
                </div>
                {qrFileError && <div className="text-xs font-semibold text-rose-600">{qrFileError}</div>}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-black/5 flex justify-end">
            <NeuButton
              variant="primary"
              onClick={() => {
                onUpdateSystemSettings({
                  ...systemSettings,
                  clinicQrAccountName: qrAccountName,
                  clinicQrAccountNumber: qrAccountNumber,
                  clinicQrBankName: qrBankName,
                  consultationFeePhp: Number(qrFeePhp) || 10,
                  clinicQrCodeUrl: qrCodeDataUrl,
                });
                setAdminToast('Saved clinic receiving payment QR code and consultation fee settings successfully.');
              }}
            >
              💾 Save Clinic QR Code &amp; Fee Settings
            </NeuButton>
          </div>
        </NeuCard>

        {/* Official OTP Sender Gmail Connection (telehealthotp@gmail.com) */}
        <NeuCard className="w-full space-y-4 border border-[#3478F6]/25">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#3478F6] flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Official Password Reset OTP Dispatcher</span>
              </div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Sender Account: telehealthotp@gmail.com
              </h2>
              <p className="text-xs text-[#64748B]">
                Connect <strong className="text-[#172B4D]">telehealthotp@gmail.com</strong> once here so all patient password reset OTPs are sent automatically from <strong>telehealthotp@gmail.com</strong> without asking patients to sign in.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusIndicator status={otpSenderConnected ? 'Confirmed' : 'Pending'} />
              <NeuButton
                size="sm"
                variant="primary"
                loading={isConnectingOtpSender}
                icon={<Mail className="w-3.5 h-3.5" />}
                onClick={handleConnectOtpSender}
              >
                {otpSenderConnected
                  ? 'Refresh telehealthotp@gmail.com Token'
                  : 'Connect telehealthotp@gmail.com Sender'}
              </NeuButton>
            </div>
          </div>
        </NeuCard>

        {/* AI Assistant — Google Colab Random Forest + Gemini Training Pipeline (Admin Only) */}
        <NeuCard className="w-full space-y-4 border border-[#3478F6]/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div>
              <div className="text-xs font-bold text-[#3478F6] flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>Admin Developer Console · AI Symptom Triage Model</span>
              </div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Google Colab Training Script (`.ipynb` / Python Random Forest + Gemini NLP)
              </h2>
              <p className="text-xs text-[#64748B]">
                Hidden from public/patient views. Use this script in Google Colab to demonstrate the 100-Tree Random Forest Classifier and feature importance pipeline.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NeuButton
                size="sm"
                onClick={handleCopyColabScript}
                icon={<Copy className="w-3.5 h-3.5" />}
              >
                {copiedColab ? 'Copied Python Code!' : 'Copy Python Script'}
              </NeuButton>
              <NeuButton
                size="sm"
                variant="primary"
                onClick={handleDownloadColabIpynb}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Download `.ipynb` for Google Colab
              </NeuButton>
            </div>
          </div>

          <pre className="neu-inset rounded-xl p-4 font-mono-tabular text-[11px] text-[#172B4D] overflow-x-auto max-h-[340px]">
            {GOOGLE_COLAB_NOTEBOOK_PYTHON}
          </pre>
        </NeuCard>
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

  const pieSlices = [
    {
      id: 'slice-patients',
      label: 'TOTAL PATIENTS',
      sublabel: 'Registered clinical patient accounts with verified demographic records',
      value: patients.length,
      displayValue: `${patients.length}`,
      gradStart: '#F45C9B',
      gradEnd: '#C8377B',
      solidColor: '#D94386',
      outerRadius: 278,
      startAngle: -45,
      endAngle: 25,
      targetScreen: 'patient-management' as ScreenId,
      icon: <Users className="w-6 h-6 text-white stroke-[2.2]" />,
    },
    {
      id: 'slice-doctors',
      label: 'TOTAL DOCTORS',
      sublabel: 'Active attending physicians across clinic departments and rosters',
      value: doctors.length,
      displayValue: `${doctors.length}`,
      gradStart: '#FF9E2C',
      gradEnd: '#F25C19',
      solidColor: '#F67821',
      outerRadius: 252,
      startAngle: 25,
      endAngle: 85,
      targetScreen: 'doctor-management' as ScreenId,
      icon: <Stethoscope className="w-6 h-6 text-white stroke-[2.2]" />,
    },
    {
      id: 'slice-confirmed',
      label: 'CONFIRMED',
      sublabel: 'Verified upcoming 60-minute patient consultation bookings',
      value: confirmedCount,
      displayValue: `${confirmedCount}`,
      gradStart: '#FFD43B',
      gradEnd: '#F5A614',
      solidColor: '#F5B81E',
      outerRadius: 274,
      startAngle: 85,
      endAngle: 155,
      targetScreen: 'appointment-management' as ScreenId,
      icon: <CheckCircle2 className="w-6 h-6 text-white stroke-[2.2]" />,
    },
    {
      id: 'slice-today',
      label: 'TODAY’S VISITS',
      sublabel: `Scheduled clinic consultations for ${formatReadableDate(DEMO_TODAY)}`,
      value: todayCount,
      displayValue: `${todayCount}`,
      gradStart: '#22C7B8',
      gradEnd: '#0D9488',
      solidColor: '#14B8A6',
      outerRadius: 258,
      startAngle: 155,
      endAngle: 215,
      targetScreen: 'appointment-management' as ScreenId,
      icon: <Calendar className="w-6 h-6 text-white stroke-[2.2]" />,
    },
    {
      id: 'slice-pending',
      label: 'PENDING REQUESTS',
      sublabel: 'Patient slot requests awaiting physician or admin confirmation',
      value: pendingCount,
      displayValue: `${pendingCount}`,
      gradStart: '#8B6EF6',
      gradEnd: '#5B3FD9',
      solidColor: '#6D52E8',
      outerRadius: 242,
      startAngle: 215,
      endAngle: 268,
      targetScreen: 'appointment-management' as ScreenId,
      icon: <Clock className="w-6 h-6 text-white stroke-[2.2]" />,
    },
    {
      id: 'slice-completed',
      label: 'COMPLETED / CANCELED',
      sublabel: `${completedCount} Completed consultations · ${cancelledCount} Canceled slots`,
      value: completedCount + cancelledCount,
      displayValue: `${completedCount}/${cancelledCount}`,
      gradStart: '#38BDF8',
      gradEnd: '#2563EB',
      solidColor: '#2E86F5',
      outerRadius: 256,
      startAngle: 268,
      endAngle: 315,
      targetScreen: 'appointment-management' as ScreenId,
      icon: <Activity className="w-6 h-6 text-white stroke-[2.2]" />,
    },
  ];

  const totalPieSum = pieSlices.reduce((sum, item) => sum + item.value, 0);
  const cx = 310;
  const cy = 310;
  const innerRadius = 96;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const buildAnnularSectorPath = (
    centerX: number,
    centerY: number,
    rInner: number,
    rOuter: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startOuter = polarToCartesian(centerX, centerY, rOuter, endAngle);
    const endOuter = polarToCartesian(centerX, centerY, rOuter, startAngle);
    const startInner = polarToCartesian(centerX, centerY, rInner, endAngle);
    const endInner = polarToCartesian(centerX, centerY, rInner, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      startOuter.x,
      startOuter.y,
      'A',
      rOuter,
      rOuter,
      0,
      largeArcFlag,
      0,
      endOuter.x,
      endOuter.y,
      'L',
      endInner.x,
      endInner.y,
      'A',
      rInner,
      rInner,
      0,
      largeArcFlag,
      1,
      startInner.x,
      startInner.y,
      'Z',
    ].join(' ');
  };

  const activeSlice = hoveredPieIndex !== null ? pieSlices[hoveredPieIndex] : null;

  const handlePieSliceClick = (slice: (typeof pieSlices)[0]) => {
    if (slice.id === 'slice-confirmed') {
      setStatusFilter('Confirmed');
      setSearchQuery('');
    } else if (slice.id === 'slice-pending') {
      setStatusFilter('Pending');
      setSearchQuery('');
    } else if (slice.id === 'slice-today') {
      setStatusFilter('ALL');
      setSearchQuery(DEMO_TODAY);
    } else if (slice.id === 'slice-completed') {
      setStatusFilter('Completed');
      setSearchQuery('');
    } else {
      setStatusFilter('ALL');
      setSearchQuery('');
    }
    onNavigate(slice.targetScreen);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-[#3478F6]">
            Clinic Operations & Governance Console · Least-Privilege Mode
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D]">
            Administration Dashboard
          </h1>
          <p className="text-xs text-[#64748B]">
            Monitor clinic capacity, patient accounts, physician rosters, and scheduling integrity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <NeuButton
            size="sm"
            onClick={() => onNavigate('use-case-diagram')}
            icon={<ShieldCheck className="w-4 h-4 text-[#3478F6]" />}
          >
            Use Case Diagram
          </NeuButton>
          <NeuButton
            size="sm"
            onClick={() => setColabModalOpen(true)}
            icon={<Code2 className="w-4 h-4 text-[#3478F6]" />}
          >
            AI Triage Colab Script (`.ipynb`)
          </NeuButton>
        </div>
      </div>

      <NeuModal
        isOpen={colabModalOpen}
        onClose={() => setColabModalOpen(false)}
        title="Admin Only: Google Colab Random Forest + Gemini Training Pipeline"
        subtitle="Hidden from patients — 100-Tree Random Forest Classifier synced with the AI Assistant Symptom Triage"
        footer={
          <>
            <NeuButton size="sm" onClick={handleCopyColabScript} icon={<Copy className="w-3.5 h-3.5" />}>
              {copiedColab ? 'Copied!' : 'Copy Python Code'}
            </NeuButton>
            <NeuButton
              size="sm"
              variant="primary"
              onClick={handleDownloadColabIpynb}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Download `.ipynb` File
            </NeuButton>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#64748B]">
          <p className="text-[#172B4D] font-medium">
            Maaari mong i-download ang <strong>.ipynb notebook</strong> o kopyahin ang Python script sa ibaba at patakbuhin sa <strong>Google Colab</strong>:
          </p>
          <pre className="neu-inset rounded-xl p-3.5 font-mono-tabular text-[11px] text-[#172B4D] overflow-x-auto max-h-[300px]">
            {GOOGLE_COLAB_NOTEBOOK_PYTHON}
          </pre>
        </div>
      </NeuModal>

      {/* Combined Radial Pie Infographic Card */}
      <NeuCard className="p-4 sm:p-5 space-y-3 !bg-[#1E293B]/75 backdrop-blur-xl border border-white/25 shadow-[0_12px_36px_rgba(15,23,42,0.32),inset_0_1px_1px_rgba(255,255,255,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/15">
          <div>
            <h2 className="text-base font-bold text-white">
              Clinic Operations Pie Infographic
            </h2>
            <p className="text-[11px] text-slate-300">
              Click any sector on the radial infographic to open its corresponding clinical management view with matching active filters.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-xl px-3.5 py-1.5 text-right bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <div className="text-[10px] text-slate-300 font-semibold">Total Tracked Records</div>
              <div className="text-base font-extrabold font-mono-tabular text-white">
                {totalPieSum}
              </div>
            </div>
          </div>
        </div>

        {/* Radial Variable-Radius Pie Infographic */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[440px] aspect-square mx-auto select-none">
            <svg
              viewBox="0 0 620 620"
              className="w-full h-full drop-shadow-xl overflow-visible"
              aria-label="Clinic Operations Radial Pie Infographic"
            >
              <defs>
                {pieSlices.map((slice) => (
                  <linearGradient
                    key={`grad-${slice.id}`}
                    id={`grad-${slice.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={slice.gradStart} />
                    <stop offset="100%" stopColor={slice.gradEnd} />
                  </linearGradient>
                ))}
                <filter id="pie-sector-shadow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.18" />
                </filter>
                <filter id="center-hub-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.24" />
                </filter>
              </defs>

              {/* Sectors */}
              {pieSlices.map((slice, idx) => {
                const isHovered = hoveredPieIndex === idx;
                const rOut = isHovered ? slice.outerRadius + 10 : slice.outerRadius;
                const pathData = buildAnnularSectorPath(
                  cx,
                  cy,
                  innerRadius - 8,
                  rOut,
                  slice.startAngle,
                  slice.endAngle
                );

                // Inner dark ring overlay path for depth
                const innerShadowBandPath = buildAnnularSectorPath(
                  cx,
                  cy,
                  innerRadius - 8,
                  innerRadius + 14,
                  slice.startAngle,
                  slice.endAngle
                );

                return (
                  <g
                    key={slice.id}
                    onMouseEnter={() => setHoveredPieIndex(idx)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                    onClick={() => handlePieSliceClick(slice)}
                    className="cursor-pointer transition-transform duration-200"
                  >
                    <path
                      d={pathData}
                      fill={`url(#grad-${slice.id})`}
                      filter="url(#pie-sector-shadow)"
                      className="transition-all duration-200"
                    />
                    <path
                      d={innerShadowBandPath}
                      fill="#0F172A"
                      fillOpacity="0.22"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}

              {/* Center White 3D Circle Hub */}
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius - 4}
                fill="#E2E8F0"
                filter="url(#center-hub-shadow)"
                pointerEvents="none"
              />
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius - 12}
                fill="#FFFFFF"
                pointerEvents="none"
              />
            </svg>

            {/* HTML Overlay for crisp Typography, Icons & Counts inside each Wedge (No Percentages) */}
            {pieSlices.map((slice, idx) => {
              const midAngle = (slice.startAngle + slice.endAngle) / 2;
              const contentRadius = (innerRadius + 14 + slice.outerRadius) / 2 + 6;
              const pos = polarToCartesian(cx, cy, contentRadius, midAngle);
              const leftPct = (pos.x / 620) * 100;
              const topPct = (pos.y / 620) * 100;

              return (
                <button
                  key={`overlay-${slice.id}`}
                  type="button"
                  onMouseEnter={() => setHoveredPieIndex(idx)}
                  onMouseLeave={() => setHoveredPieIndex(null)}
                  onClick={() => handlePieSliceClick(slice)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-[112px] sm:w-[126px] text-white text-center flex flex-col items-center justify-center p-0.5 cursor-pointer focus:outline-none group"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {slice.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-lg sm:text-xl font-extrabold font-mono-tabular leading-none drop-shadow-sm">
                        {slice.displayValue}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] sm:text-[10px] font-extrabold tracking-wide uppercase leading-tight drop-shadow-sm">
                    {slice.label}
                  </div>
                  <p className="hidden sm:block text-[8px] text-white/90 leading-snug line-clamp-2 mt-0.5">
                    {slice.sublabel}
                  </p>
                </button>
              );
            })}

            {/* Center Hub Label Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[110px] h-[110px] rounded-full flex flex-col items-center justify-center text-center px-2">
                {activeSlice ? (
                  <>
                    <span
                      className="text-[9px] font-extrabold uppercase tracking-wider line-clamp-1"
                      style={{ color: activeSlice.solidColor }}
                    >
                      {activeSlice.label}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono-tabular text-[#172B4D] leading-tight mt-0.5">
                      {activeSlice.displayValue}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#1E293B] leading-none">
                      CLINIC
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-medium tracking-[0.14em] uppercase text-[#64748B] mt-0.5">
                      INFOGRAPHIC
                    </span>
                    <span className="text-[11px] font-mono-tabular font-bold text-[#3478F6] mt-1">
                      Total: {totalPieSum}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </NeuCard>

      {adminToast && (
        <div className="neu-raised rounded-xl p-3.5 text-xs font-semibold text-[#16865C] flex items-center justify-between">
          <span>{adminToast}</span>
          <button type="button" onClick={() => setAdminToast('')} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
