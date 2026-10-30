import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Bell,
  ArrowLeft,
  CheckCircle2,
  Info,
  Download,
  QrCode,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { NeuCard, NeuButton } from '../../components/ui/NeumorphicPrimitives';
import { ScreenId } from '../../types';

interface UseCaseDiagramViewProps {
  onNavigate: (screen: ScreenId) => void;
  returnScreen?: ScreenId;
}

type ActorType = 'all' | 'patient' | 'doctor' | 'admin';

interface UseCaseItem {
  id: string;
  title: string;
  category: 'Access' | 'Intake & Booking' | 'Payment & Verification' | 'Consultation & Rx' | 'Administration';
  actors: ('patient' | 'doctor' | 'admin')[];
  description: string;
  notes?: string;
}

const USE_CASES: UseCaseItem[] = [
  // Access & Profile
  {
    id: 'uc-auth',
    title: 'Authenticate & Maintain Profile',
    category: 'Access',
    actors: ['patient', 'doctor', 'admin'],
    description: 'Sign in with credentials or Google Single Sign-On; maintain patient demographics, emergency contacts, or doctor specialty & license details.',
    notes: 'Least-privilege role segregation ensures patients cannot access internal clinical notes, while doctors access only assigned clinical records.',
  },
  {
    id: 'uc-triage',
    title: 'Pre-Consultation Symptom Assessment',
    category: 'Intake & Booking',
    actors: ['patient'],
    description: 'Enter symptoms to receive 100-Tree Random Forest classification and clinical department recommendation before booking.',
    notes: 'Includes explicit disclaimer that pre-made suggestions guide intake and do not replace licensed clinician diagnosis.',
  },
  // Intake & Booking
  {
    id: 'uc-availability',
    title: 'Inspect Real-Time Doctor Availability',
    category: 'Intake & Booking',
    actors: ['patient', 'doctor', 'admin'],
    description: 'View 1-hour morning (7:00–11:00 AM) and afternoon (1:00–5:00 PM) slots across all clinic departments.',
    notes: 'Automatically locks booked slots, approved leaves, and off-duty days to prevent double-booking.',
  },
  {
    id: 'uc-5step-booking',
    title: 'Complete 5-Step Appointment Booking',
    category: 'Intake & Booking',
    actors: ['patient'],
    description: 'Progress through Step 1 (Demographics), Step 2 (Medical Safety), Step 3 (Chief Complaint & Pre-Made Symptoms), Step 4 (Calendar Slot Selection), and Step 5 (Review & Mode Selection).',
    notes: 'Supports both Online Appointment (Google Meet) and Walk-In clinical consultation modes.',
  },
  // Payment & Verification
  {
    id: 'uc-qr-payment',
    title: 'Scan Receiving QR & Upload Receipt Screenshot',
    category: 'Payment & Verification',
    actors: ['patient'],
    description: 'Scan the clinic’s static receiving QR, transfer the configured fee (₱10.00), and upload a transaction receipt screenshot (PNG/JPEG/WebP, max 5 MB) with live preview.',
    notes: 'Appointment is saved strictly in "Payment Pending Verification" state. Uploading does NOT auto-confirm the slot.',
  },
  {
    id: 'uc-admin-verify-payment',
    title: 'Verify Payment Receipt & Confirm Appointment',
    category: 'Payment & Verification',
    actors: ['admin'],
    description: 'Admin inspects high-resolution receipt screenshot, verifies reference number and exact ₱10.00 fee, and performs one-click Confirm or Reject.',
    notes: 'Only authenticated admin approval changes payment to PAID and appointment to CONFIRMED. Rejection notifies patient to resubmit.',
  },
  {
    id: 'uc-resubmit-receipt',
    title: 'Resubmit Rejected Payment Receipt',
    category: 'Payment & Verification',
    actors: ['patient'],
    description: 'Patient reviews rejection reason provided by admin and uploads a replacement receipt screenshot directly in My Appointments.',
  },
  // Consultation & Clinical Care
  {
    id: 'uc-manage-requests',
    title: 'Review Assigned Booking Requests',
    category: 'Consultation & Rx',
    actors: ['doctor', 'admin'],
    description: 'Physicians review incoming appointment requests, patient chief complaints, and intake background before confirming.',
  },
  {
    id: 'uc-meet-consultation',
    title: 'Conduct Online Consultation (Google Meet)',
    category: 'Consultation & Rx',
    actors: ['patient', 'doctor'],
    description: 'Clinician dispatches encrypted Google Meet link to patient for real-time virtual outpatient consultation.',
  },
  {
    id: 'uc-queue-delay',
    title: 'Report Consultation Queue Delay & Notify Patients',
    category: 'Consultation & Rx',
    actors: ['doctor'],
    description: 'Doctor flags appointment overrun (+10m to +45m); in-app notifications immediately notify queued patients of estimated start time with option to wait or free reschedule.',
    notes: 'Ensures clinical transparency without silent delays or phantom rescheduling.',
  },
  {
    id: 'uc-issue-reseta',
    title: 'Issue Official Prescription (Reseta e-Rx PDF)',
    category: 'Consultation & Rx',
    actors: ['doctor'],
    description: 'Clinician enters structured prescription (drug, dosage, frequency, instructions, license/PTR) and completes consultation. System generates printable PDF.',
  },
  {
    id: 'uc-download-reseta',
    title: 'View & Download Prescriptions (Rx)',
    category: 'Consultation & Rx',
    actors: ['patient', 'doctor', 'admin'],
    description: 'Access permanent prescription records, clinical summaries, and downloadable PDF copies with doctor credentials.',
  },
  // Administration & Governance
  {
    id: 'uc-physician-roster',
    title: 'Manage Physician Roster & Deactivation',
    category: 'Administration',
    actors: ['admin'],
    description: 'Onboard new attending doctors with departments and working hours; manage physician resignation/deactivation with auto-cancellation safeguards.',
  },
  {
    id: 'uc-leave-governance',
    title: 'Submit & Approve Physician Leaves / Slot Blocks',
    category: 'Administration',
    actors: ['doctor', 'admin'],
    description: 'Doctors submit vacation/medical leave or slot blocks; Admin reviews and approves/rejects. System triggers schedule-change notifications to all affected patients.',
    notes: 'Preserves patient notice: no silent appointment cancellations.',
  },
  {
    id: 'uc-audit-log',
    title: 'Inspect Immutable Clinical Audit Log',
    category: 'Administration',
    actors: ['admin'],
    description: 'Review chronological audit trail of all booking, cancellation, payment verification, prescription issuance, and security events.',
  },
  {
    id: 'uc-qr-setup',
    title: 'Configure Clinic Receiving QR Asset',
    category: 'Administration',
    actors: ['admin'],
    description: 'Admin uploads and previews official receiving QR code image for GCash / Maya / InstaPay patient transfers.',
  },
  {
    id: 'uc-in-app-notifications',
    title: 'In-App Schedule Change & Status Notifications',
    category: 'Access',
    actors: ['patient', 'doctor', 'admin'],
    description: 'Central notification center delivering real-time alerts for booking confirmations, rejections, queue delays, and physician schedule alterations.',
  },
];

export const UseCaseDiagramView: React.FC<UseCaseDiagramViewProps> = ({
  onNavigate,
  returnScreen = 'landing',
}) => {
  const [selectedActor, setSelectedActor] = useState<ActorType>('all');
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseItem | null>(USE_CASES[3]);

  const filteredUseCases = USE_CASES.filter((uc) => {
    if (selectedActor === 'all') return true;
    return uc.actors.includes(selectedActor);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6 sm:py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate(returnScreen)}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3478F6] inline-flex items-center gap-1.5 mb-2 cursor-pointer hover:text-[#172B4D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Application</span>
          </button>
          <div className="text-xs font-bold uppercase tracking-wider text-[#3478F6]">
            System Architecture &amp; UML Specifications
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] dark:text-[#F1F5F9]">
            TeleHealth Management System — Use Case Diagram
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A7B4CC] mt-1 max-w-3xl">
            Formal architectural representation of all verified system actors (Patient, Attending Physician, Clinic Administrator) and their actual supported capabilities across clinical workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="neu-inset rounded-xl px-3.5 py-2 text-xs text-[#172B4D] dark:text-[#F1F5F9] font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16865C]" />
            <span>Verified Implementation Boundary</span>
          </div>
        </div>
      </div>

      {/* Actor Filter Selector */}
      <div className="neu-raised rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 bg-[#E9EEF3] dark:bg-[#10172A]">
        <div className="text-xs font-bold text-[#172B4D] dark:text-[#F1F5F9] px-2 flex items-center gap-2">
          <span>Filter by Actor:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Actors', icon: <Info className="w-3.5 h-3.5" />, color: 'text-[#172B4D]' },
              { id: 'patient', label: 'Patient Actor', icon: <User className="w-3.5 h-3.5" />, color: 'text-[#3478F6]' },
              { id: 'doctor', label: 'Physician / Doctor Actor', icon: <Stethoscope className="w-3.5 h-3.5" />, color: 'text-[#16865C]' },
              { id: 'admin', label: 'Clinic Admin Actor', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-[#8B5CF6]' },
            ] as const
          ).map((item) => {
            const isActive = selectedActor === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedActor(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'neu-btn-primary text-white shadow-sm'
                    : 'neu-btn text-[#64748B] dark:text-[#CBD5E1] hover:text-[#172B4D]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Architectural Diagram Map */}
      <NeuCard className="p-5 sm:p-6 space-y-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#172B4D] dark:text-[#F1F5F9] flex items-center gap-2">
              <span>Interactive UML Use Case Map</span>
              <span className="text-xs font-mono-tabular px-2 py-0.5 rounded-full bg-[#3478F6]/10 text-[#3478F6]">
                {filteredUseCases.length} Active Use Cases
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#A7B4CC]">
              Click any use case oval to view its clinical governance rules, data flow, and actor associations.
            </p>
          </div>
        </div>

        {/* 3 Actors Columns + Central System Boundary Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Patient Actor */}
          <div className={`lg:col-span-3 space-y-3 transition-opacity ${selectedActor !== 'all' && selectedActor !== 'patient' ? 'opacity-40' : 'opacity-100'}`}>
            <div className="neu-raised-sm rounded-2xl p-4 border-2 border-[#3478F6]/40 bg-[#3478F6]/5 text-center">
              <div className="w-12 h-12 rounded-full mx-auto bg-[#3478F6] text-white flex items-center justify-center shadow-md mb-2">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#172B4D] dark:text-white">Patient</h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Outpatient seeker, account holder &amp; appointment requester
              </p>
              <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 text-[10px] text-left space-y-1 font-medium text-[#475569] dark:text-[#CBD5E1]">
                <div>• Pre-consultation AI symptom triage</div>
                <div>• 5-step intake &amp; slot booking</div>
                <div>• Receiving QR scan &amp; receipt upload</div>
                <div>• Queue delay wait / reschedule decision</div>
                <div>• Download official Reseta (PDF)</div>
              </div>
            </div>

            {/* Doctor Actor Below on Left or Staggered */}
            <div className={`neu-raised-sm rounded-2xl p-4 border-2 border-[#16865C]/40 bg-[#16865C]/5 text-center transition-opacity ${selectedActor !== 'all' && selectedActor !== 'doctor' ? 'opacity-40' : 'opacity-100'}`}>
              <div className="w-12 h-12 rounded-full mx-auto bg-[#16865C] text-white flex items-center justify-center shadow-md mb-2">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#172B4D] dark:text-white">Attending Physician</h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Licensed clinician, specialist &amp; prescription issuer
              </p>
              <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 text-[10px] text-left space-y-1 font-medium text-[#475569] dark:text-[#CBD5E1]">
                <div>• Calendar availability &amp; breaks</div>
                <div>• Appointment review &amp; confirmation</div>
                <div>• Overrun delay notification (+10m to +45m)</div>
                <div>• Google Meet consultation link</div>
                <div>• Prescribe medicine &amp; sign Reseta</div>
              </div>
            </div>
          </div>

          {/* Central Column: System Boundary (TeleHealth Management System) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="neu-inset rounded-2xl p-4 sm:p-5 border border-black/10 dark:border-white/10 space-y-3 bg-white/40 dark:bg-black/20">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#3478F6]">
                  System Boundary: TeleHealth Platform
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono-tabular">
                  Port 3000 · Client-Verified
                </span>
              </div>

              {/* Grid of Use Case Ovals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredUseCases.map((uc) => {
                  const isSelected = selectedUseCase?.id === uc.id;
                  const hasPatient = uc.actors.includes('patient');
                  const hasDoctor = uc.actors.includes('doctor');
                  const hasAdmin = uc.actors.includes('admin');

                  return (
                    <button
                      key={uc.id}
                      type="button"
                      onClick={() => setSelectedUseCase(uc)}
                      className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'neu-raised border-[#3478F6] bg-[#3478F6]/10 ring-2 ring-[#3478F6]/30'
                          : 'neu-btn border-transparent hover:border-black/10 dark:hover:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                            {uc.category}
                          </span>
                          <div className="flex items-center gap-1">
                            {hasPatient && (
                              <span className="w-2 h-2 rounded-full bg-[#3478F6]" title="Patient Actor" />
                            )}
                            {hasDoctor && (
                              <span className="w-2 h-2 rounded-full bg-[#16865C]" title="Doctor Actor" />
                            )}
                            {hasAdmin && (
                              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" title="Admin Actor" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#172B4D] dark:text-[#F1F5F9] leading-snug">
                          «use case» {uc.title}
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-[#64748B] dark:text-[#94A3B8] line-clamp-2">
                        {uc.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Admin Actor & Details Card */}
          <div className="lg:col-span-3 space-y-4">
            <div className={`neu-raised-sm rounded-2xl p-4 border-2 border-[#8B5CF6]/40 bg-[#8B5CF6]/5 text-center transition-opacity ${selectedActor !== 'all' && selectedActor !== 'admin' ? 'opacity-40' : 'opacity-100'}`}>
              <div className="w-12 h-12 rounded-full mx-auto bg-[#8B5CF6] text-white flex items-center justify-center shadow-md mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#172B4D] dark:text-white">Clinic Administrator</h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Executive governance, payment auditor &amp; roster manager
              </p>
              <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 text-[10px] text-left space-y-1 font-medium text-[#475569] dark:text-[#CBD5E1]">
                <div>• Radial pie metrics &amp; filtered routing</div>
                <div>• Zoom receipt audit &amp; payment confirmation</div>
                <div>• Approve/reject leaves with patient alerts</div>
                <div>• Upload clinic receiving QR asset</div>
                <div>• System audit log inspection</div>
              </div>
            </div>

            {/* Selected Use Case Inspector Card */}
            {selectedUseCase && (
              <div className="neu-raised rounded-2xl p-4 border border-[#3478F6]/30 bg-white/60 dark:bg-[#10172A] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3478F6] uppercase tracking-wide">
                    Inspecting Use Case
                  </span>
                  <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#64748B] dark:text-[#CBD5E1]">
                    {selectedUseCase.id}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#172B4D] dark:text-white leading-tight">
                  {selectedUseCase.title}
                </h4>
                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {selectedUseCase.description}
                </p>

                <div className="pt-2 border-t border-black/5 dark:border-white/10">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                    Associated Actors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUseCase.actors.map((actor) => (
                      <span
                        key={actor}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          actor === 'patient'
                            ? 'bg-[#3478F6]/10 text-[#3478F6]'
                            : actor === 'doctor'
                              ? 'bg-[#16865C]/10 text-[#16865C]'
                              : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                        }`}
                      >
                        {actor === 'doctor' ? 'Physician' : actor}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedUseCase.notes && (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[10px] text-amber-800 dark:text-amber-300">
                    <strong>Rule:</strong> {selectedUseCase.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </NeuCard>

      {/* Summary Matrix Table */}
      <NeuCard className="overflow-x-auto p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#172B4D] dark:text-[#F1F5F9]">
          Actor-to-Use-Case Traceability Matrix
        </h3>
        <p className="text-xs text-[#64748B] dark:text-[#A7B4CC]">
          Verifiable confirmation that all features in this diagram correspond directly to active views and functional handlers in the codebase.
        </p>

        <table className="w-full text-left border-collapse text-xs mt-3">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-[#64748B] dark:text-[#94A3B8]">
              <th className="py-2.5 px-3 font-bold">Use Case</th>
              <th className="py-2.5 px-3 font-bold">Category</th>
              <th className="py-2.5 px-3 font-bold text-center">Patient</th>
              <th className="py-2.5 px-3 font-bold text-center">Doctor</th>
              <th className="py-2.5 px-3 font-bold text-center">Admin</th>
              <th className="py-2.5 px-3 font-bold">Primary System Enforcement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {USE_CASES.map((uc) => (
              <tr key={uc.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-3 font-bold text-[#172B4D] dark:text-[#F1F5F9] whitespace-nowrap">
                  {uc.title}
                </td>
                <td className="py-2.5 px-3 text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                  {uc.category}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {uc.actors.includes('patient') ? (
                    <span className="inline-block w-4 h-4 rounded-full bg-[#3478F6] text-white text-[10px] font-bold leading-4">✓</span>
                  ) : (
                    <span className="text-[#CBD5E1] dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {uc.actors.includes('doctor') ? (
                    <span className="inline-block w-4 h-4 rounded-full bg-[#16865C] text-white text-[10px] font-bold leading-4">✓</span>
                  ) : (
                    <span className="text-[#CBD5E1] dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {uc.actors.includes('admin') ? (
                    <span className="inline-block w-4 h-4 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold leading-4">✓</span>
                  ) : (
                    <span className="text-[#CBD5E1] dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-[#475569] dark:text-[#A7B4CC]">
                  {uc.notes || uc.description.slice(0, 75) + '...'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeuCard>
    </div>
  );
};
