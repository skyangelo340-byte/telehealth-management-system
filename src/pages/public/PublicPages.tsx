import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  HelpCircle,
  Mail,
  KeyRound,
  AlertCircle,
  ChevronDown,
  Stethoscope,
  FileText,
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
  HeartPulse,
  Code2,
} from 'lucide-react';
import {
  Department,
  AppointmentType,
  DoctorProfile,
  ScreenId,
  UserRole,
  AssessmentMessage,
  AssessmentSummary,
} from '../../types';
import {
  NeuCard,
  NeuButton,
  NeuInput,
  NeuModal,
  StatusIndicator,
} from '../../components/ui/NeumorphicPrimitives';
import {
  sendOtpEmailViaGmail,
  googleSignIn,
} from '../../services/googleAuth';
import {
  analyzeSymptomConversation,
  GOOGLE_COLAB_NOTEBOOK_PYTHON,
} from '../../services/symptomTriageService';

interface PublicPagesProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onBookAppointmentClick: () => void;
  onAuthenticateCredentials: (email: string, password: string) => { success: boolean; error?: string };
  onGoogleLoginSuccess: (email: string, displayName: string) => { success: boolean; error?: string } | void;
  onRegisterPatientAccount: (
    fullName: string,
    email: string,
    phone: string,
    password: string
  ) => { success: boolean; error?: string };
  onResetUserPassword: (email: string, newPassword: string) => void;
  onOpenPrivacyModal: () => void;
  onOpenTermsModal: () => void;
  departments: Department[];
  appointmentTypes: AppointmentType[];
  doctors: DoctorProfile[];
  pendingBookingIntent: boolean;
}

export const PublicPages: React.FC<PublicPagesProps> = ({
  currentScreen,
  onNavigate,
  onBookAppointmentClick,
  onAuthenticateCredentials,
  onGoogleLoginSuccess,
  onRegisterPatientAccount,
  onResetUserPassword,
  onOpenPrivacyModal,
  onOpenTermsModal,
  departments,
  doctors,
  pendingBookingIntent,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);
  const [regError, setRegError] = useState('');

  // Forgot password via Google Email OTP state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'new-password' | 'done'>('email');
  const [generatedOtp, setGeneratedOtp] = useState('482910');
  const [otpInput, setOtpInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [confirmSendModalOpen, setConfirmSendModalOpen] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Scroll animation state for Hero & Departments
  const heroRef = useRef<HTMLDivElement | null>(null);
  const deptRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [deptVisible, setDeptVisible] = useState(false);

  useEffect(() => {
    if (currentScreen !== 'landing') return;
    setHeroVisible(false);
    const timer = setTimeout(() => setHeroVisible(true), 60);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroRef.current) {
            if (entry.isIntersecting) setHeroVisible(true);
          }
          if (entry.target === deptRef.current) {
            if (entry.isIntersecting) setDeptVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (deptRef.current) observer.observe(deptRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [currentScreen]);

  // Public Symptom Assessment conversational state
  const [chatMessages, setChatMessages] = useState<AssessmentMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Maligayang pagdating sa TeleHealth Pre-Consultation Symptom Assessment. Ibahagi ang iyong nararamdamang sintomas, ilang araw na ito, at gaano kalala. Tandaan: Mga tanong na may kinalaman sa kalusugan at panggagamot lamang ang sinasagot ng AI Assistant na ito.',
      timestamp: 'Just now',
      followUpOptions: [
        'Masakit ang ulo sa umaga at 150/95 ang BP ko',
        'May makating pantal / rash sa braso nang 3 araw',
        'Nangingilo at sumasakit ang bagang kapag umiinom ng malamig',
        'May lagnat at ubo na 2 araw na',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzingChat, setIsAnalyzingChat] = useState(false);
  const [shareAssessmentWithDoc, setShareAssessmentWithDoc] = useState(true);
  const [publicAssessments, setPublicAssessments] = useState<AssessmentSummary[]>([]);

  if (currentScreen === 'telehealth-assessment') {
    const handleSendMessage = async (textToSend: string) => {
      if (!textToSend.trim() || isAnalyzingChat) return;
      const trimmed = textToSend.trim();
      const userMsg: AssessmentMessage = {
        id: `m-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: 'Just now',
      };

      const updatedHistory = [...chatMessages, userMsg];
      setChatMessages(updatedHistory);
      setChatInput('');
      setIsAnalyzingChat(true);

      try {
        const result = await analyzeSymptomConversation({
          messages: updatedHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          latestUserMessage: trimmed,
        });

        const assistantMsg: AssessmentMessage = {
          id: `m-${Date.now() + 1}`,
          sender: 'assistant',
          text: result.replyText,
          timestamp: 'Just now',
          followUpOptions: result.followUpOptions,
          clinicalReport: {
            isMedicalTopic: result.isMedicalTopic,
            hasEnoughInfo: result.hasEnoughInfo,
            chiefSymptoms: result.chiefSymptoms,
            recommendedActions: result.recommendedActions,
            risksIfIgnored: result.risksIfIgnored,
            firstAidSteps: result.firstAidSteps,
            doctorRecommendationReason: result.doctorRecommendationReason,
            randomForest: result.randomForest,
          },
        };

        setChatMessages((prev) => [...prev, assistantMsg]);

        if (result.isMedicalTopic && result.hasEnoughInfo) {
          setPublicAssessments((prev) => [
            {
              id: `asmt-${Date.now()}`,
              patientId: 'guest',
              createdAt: new Date().toISOString(),
              chiefSymptoms:
                result.chiefSymptoms.length > 0 ? result.chiefSymptoms : [trimmed],
              duration: 'Assessed today',
              severityLevel: result.randomForest.urgencyLevel,
              recommendedDepartment: result.randomForest.predictedDepartmentName,
              recommendedAppointmentType: 'General Consultation',
              summaryText: result.replyText,
              sharedWithDoctor: shareAssessmentWithDoc,
            },
            ...prev,
          ]);
        }
      } finally {
        setIsAnalyzingChat(false);
      }
    };

    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#3478F6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant · Pre-Consultation Medical Guidance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
              TeleHealth Pre-Visit Symptom Assessment
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Provides recommended actions, risks if ignored, first-aid (paunang lunas), and specialist doctor matching.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <NeuButton
              onClick={() => onNavigate('landing')}
              className="!shadow-[0_2px_6px_rgba(23,43,77,0.06)] !border-black/5 bg-white/75 backdrop-blur-xs"
            >
              Back to Home
            </NeuButton>
            <NeuButton
              variant="primary"
              onClick={onBookAppointmentClick}
              icon={<Calendar className="w-4 h-4" />}
              className="!shadow-[0_3px_8px_rgba(52,120,246,0.22)] !border-transparent"
            >
              Book an Appointment
            </NeuButton>
          </div>
        </div>

        <div>
          <NeuCard className="w-full flex flex-col justify-between min-h-[480px] space-y-5 !bg-white/20 !backdrop-blur-[3px] !border !border-white/70 !shadow-[0_8px_30px_rgba(23,43,77,0.07),inset_0_1px_1px_rgba(255,255,255,0.85)]">
            {/* Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#3478F6]/15 text-[#1D4ED8] font-bold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assistant</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setChatMessages([
                    {
                      id: 'm-reset',
                      sender: 'assistant',
                      text: 'Handa na ulit ang ating AI Assistant. Ano ang nararamdaman mong sintomas ngayon, ilang araw na, at gaano kalala?',
                      timestamp: 'Just now',
                      followUpOptions: [
                        'Masakit ang ulo sa umaga at 150/95 ang BP ko',
                        'May makating pantal / rash sa braso nang 3 araw',
                        'Nangingilo at sumasakit ang bagang kapag umiinom ng malamig',
                      ],
                    },
                  ])
                }
                className="text-xs font-bold text-[#3478F6] hover:underline cursor-pointer"
              >
                Reset Chat
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl text-sm leading-relaxed transition-all ${
                    m.sender === 'user'
                      ? 'bg-[#3478F6]/90 backdrop-blur-[2px] text-white shadow-[0_4px_14px_rgba(52,120,246,0.22)] border border-white/30 ml-8'
                      : 'bg-white/65 backdrop-blur-[2px] border border-white/80 shadow-[0_4px_16px_rgba(23,43,77,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] text-[#0F172A] mr-4'
                  }`}
                >
                  <div
                    className={`text-xs font-extrabold tracking-tight mb-1.5 flex items-center justify-between gap-2 ${
                      m.sender === 'user' ? 'text-white' : 'text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>
                        {m.sender === 'user' ? 'Patient / Visitor' : 'AI Assistant'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-bold ${
                          m.sender === 'user' ? 'text-white/90' : 'text-[#475569]'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-semibold leading-relaxed ${
                      m.sender === 'user' ? 'text-white' : 'text-[#0F172A]'
                    }`}
                  >
                    {m.text}
                  </p>

                  {/* Non-Medical Guardrail Notice */}
                  {m.clinicalReport && !m.clinicalReport.isMedicalTopic && (
                    <div className="mt-3 p-3 rounded-xl bg-[#C63D4D]/10 border border-[#C63D4D]/30 text-xs text-[#C63D4D] font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Paalala: Ang AI Assistant na ito ay para lamang sa mga medikal na sintomas, paunang lunas, at konsultasyon sa doktor.
                      </span>
                    </div>
                  )}

                  {/* Full Clinical Triage Report when hasEnoughInfo is true */}
                  {m.clinicalReport &&
                    m.clinicalReport.isMedicalTopic &&
                    m.clinicalReport.hasEnoughInfo && (
                      <div className="mt-4 space-y-3.5 pt-3.5 border-t border-black/10 text-xs">
                        {/* 1. Recommended Actions (Ano ang dapat gawin) */}
                        {m.clinicalReport.recommendedActions.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-[#3478F6]/10 border border-[#3478F6]/25 space-y-1.5">
                            <div className="font-extrabold text-[#1D4ED8] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>1. Rekomendadong Dapat Gawin (Recommended Actions)</span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A] font-medium">
                              {m.clinicalReport.recommendedActions.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 2. Risks if Ignored (Mga mangyayari kapag pinabayaan) */}
                        {m.clinicalReport.risksIfIgnored.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-[#C63D4D]/10 border border-[#C63D4D]/25 space-y-1.5">
                            <div className="font-extrabold text-[#C63D4D] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>2. Mga Posibleng Mangyari Kapag Pinabayaan (Risks if Left Untreated)</span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A] font-medium">
                              {m.clinicalReport.risksIfIgnored.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 3. First Aid / Paunang Lunas */}
                        {m.clinicalReport.firstAidSteps.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-[#16865C]/10 border border-[#16865C]/25 space-y-1.5">
                            <div className="font-extrabold text-[#16865C] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                              <HeartPulse className="w-4 h-4 shrink-0" />
                              <span>
                                3. Paunang Lunas Habang Hindi Pa Nakakapagpa-Checkup (First Aid &amp; Home Care)
                              </span>
                            </div>
                            <ul className="space-y-1 pl-5 list-disc text-[#0F172A] font-medium">
                              {m.clinicalReport.firstAidSteps.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 4. Suggested Specialist Doctor */}
                        <div className="p-4 rounded-xl bg-white/80 border border-[#3478F6]/30 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-extrabold text-[#172B4D] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                              <Stethoscope className="w-4 h-4 text-[#3478F6]" />
                              <span>
                                4. Inirerekomendang Doktor at Departamento
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#E9EEF3]/80 border border-black/5">
                            <div className="space-y-0.5">
                              <div className="text-sm font-extrabold text-[#172B4D]">
                                {m.clinicalReport.randomForest.recommendedDoctorName}
                              </div>
                              <div className="text-xs font-bold text-[#3478F6]">
                                {m.clinicalReport.randomForest.predictedDepartmentName} ·{' '}
                                {m.clinicalReport.randomForest.recommendedDoctorTitle}
                              </div>
                              <div className="text-[11px] text-[#475569]">
                                Specialty: {m.clinicalReport.randomForest.recommendedDoctorSpecialty}
                              </div>
                              {m.clinicalReport.doctorRecommendationReason && (
                                <p className="text-xs text-[#172B4D] pt-1">
                                  {m.clinicalReport.doctorRecommendationReason}
                                </p>
                              )}
                            </div>

                            <NeuButton
                              size="sm"
                              variant="primary"
                              onClick={onBookAppointmentClick}
                              icon={<Calendar className="w-3.5 h-3.5" />}
                              className="shrink-0"
                            >
                              Book with {m.clinicalReport.randomForest.recommendedDoctorName}
                            </NeuButton>
                          </div>
                        </div>
                      </div>
                    )}

                  {m.followUpOptions && m.followUpOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3.5">
                      {m.followUpOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={isAnalyzingChat}
                          onClick={() => handleSendMessage(opt)}
                          className="bg-white/75 hover:bg-white border border-[#3478F6]/30 shadow-xs px-3 py-1.5 rounded-xl text-xs font-bold text-[#1D4ED8] hover:text-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzingChat && (
                <div className="p-4 rounded-2xl bg-white/65 border border-white/80 text-xs font-semibold text-[#172B4D] mr-8 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3478F6] shrink-0" />
                  <span>
                    Sinusuri ng AI Assistant ang iyong sintomas...
                  </span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(chatInput);
              }}
              className="flex items-center gap-2.5 pt-3.5 border-t border-white/45"
            >
              <input
                type="text"
                disabled={isAnalyzingChat}
                placeholder="I-type ang iyong nararamdamang sintomas, ilang araw na, o tanong tungkol sa gamutan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Symptom description input"
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-[#0F172A] placeholder:text-[#1E293B]/75 bg-white/55 backdrop-blur-[2px] border border-white/80 shadow-[inset_0_1px_2px_rgba(23,43,77,0.05)] focus:bg-white/80 focus:outline-none"
              />
              <NeuButton
                type="submit"
                variant="primary"
                size="md"
                loading={isAnalyzingChat}
                icon={<Send className="w-4 h-4" />}
                className="!shadow-[0_4px_12px_rgba(52,120,246,0.25)] !border-white/25 font-bold"
              >
                Send
              </NeuButton>
            </form>
          </NeuCard>
        </div>
      </div>
    );
  }

  if (currentScreen === 'privacy-policy') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
              Privacy Policy & Patient Data Governance
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Last Updated: October 2026 · TeleHealth Management System
            </p>
          </div>
          <NeuButton onClick={() => onNavigate('landing')}>Back to Home</NeuButton>
        </div>

        <NeuCard className="space-y-4 text-sm leading-relaxed text-[#172B4D]">
          <h2 className="text-lg font-bold">1. Purpose & Clinical Confidentiality</h2>
          <p className="text-[#64748B]">
            The TeleHealth Management System is engineered to protect patient confidentiality across every step of the consultation workflow. Sensitive clinical fields—including known allergies, current medications, existing medical conditions, and consultation summaries—are strictly scoped to authorized healthcare providers and the authenticated patient.
          </p>

          <h2 className="text-lg font-bold">2. Calendar & Scheduling Privacy</h2>
          <p className="text-[#64748B]">
            Public and patient-facing availability calendars only return slot availability status (Available, Booked, Blocked, or Unavailable). No other patient’s identity, reason for visit, or clinical notes are ever transmitted through calendar endpoints.
          </p>

          <h2 className="text-lg font-bold">3. Authentication & Account Linking</h2>
          <p className="text-[#64748B]">
            When signing in via Google Identity or standard clinic credentials, verified email addresses are matched server-side to prevent duplicate medical records. OAuth secrets, database credentials, and private session keys are never exposed in client-side code.
          </p>
        </NeuCard>
      </div>
    );
  }

  if (currentScreen === 'terms-conditions') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
              Terms and Conditions of Service
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Standard Clinic Scheduling Rules & Patient Responsibilities
            </p>
          </div>
          <NeuButton onClick={() => onNavigate('landing')}>Back to Home</NeuButton>
        </div>

        <NeuCard className="space-y-4 text-sm leading-relaxed text-[#172B4D]">
          <h2 className="text-lg font-bold">1. Standard Clinic Hours & 1-Hour Slot Boundaries</h2>
          <p className="text-[#64748B]">
            Appointments are scheduled in 1-hour blocks during Morning Hours (7:00 AM–11:00 AM) and Afternoon Hours (1:00 PM–5:00 PM), up to a maximum of 8 standard slots per physician per day. Displayed end times represent exclusive slot boundaries.
          </p>

          <h2 className="text-lg font-bold">2. Cancellations, Rescheduling & Conflict Prevention</h2>
          <p className="text-[#64748B]">
            All bookings are validated on the server using transaction-safe locks so two patients cannot reserve the same slot simultaneously. Cancellations or reschedule requests must be submitted at least 24 hours before the appointment start time.
          </p>

          <h2 className="text-lg font-bold">3. Non-Emergency Medical Disclaimer</h2>
          <p className="text-[#64748B]">
            TeleHealth consultations and optional symptom assessments do not replace emergency medical care. In the event of a medical emergency, contact local emergency responders immediately.
          </p>
        </NeuCard>
      </div>
    );
  }

  if (currentScreen === 'sign-in') {
    const handleCredentialsSignIn = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !email.includes('@')) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      if (!password.trim()) {
        setAuthError('Please enter your password.');
        return;
      }
      const result = onAuthenticateCredentials(email.trim(), password);
      if (!result.success) {
        setAuthError(result.error || 'Invalid email or password.');
        return;
      }
      setAuthError('');
    };

    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <NeuCard size="lg" className="space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl neu-raised-sm mx-auto flex items-center justify-center text-[#3478F6] mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#172B4D]">Sign In to TeleHealth</h1>
            <p className="text-xs text-[#64748B]">
              {pendingBookingIntent
                ? 'Please sign in or create an account to continue to your appointment booking.'
                : 'Sign in with your account email and password to access your portal.'}
            </p>
          </div>

          {pendingBookingIntent && (
            <div className="neu-inset rounded-xl p-3 text-xs text-[#3478F6] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Booking intent preserved: You will be redirected directly to Book Appointment after signing in.</span>
            </div>
          )}

          <form onSubmit={handleCredentialsSignIn} className="space-y-4" noValidate>
            <NeuInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="Enter your email address"
            />
            <NeuInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="Enter your password"
              rightElement={
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-[#3478F6] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              }
            />

            {authError && (
              <div className="text-xs text-[#C63D4D] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <NeuButton type="submit" variant="primary" className="w-full" size="lg">
              Sign In
            </NeuButton>
          </form>

          {/* Recognizable Continue with Google Section */}
          <div className="space-y-3 pt-2 border-t border-black/5">
            <NeuButton
              type="button"
              className="w-full font-semibold"
              onClick={async () => {
                setAuthError('');
                try {
                  const res = await googleSignIn(false);
                  const signedInEmail =
                    res?.user?.email ||
                    res?.user?.providerData?.find((p) => p.email)?.email;
                  const signedInName =
                    res?.user?.displayName ||
                    res?.user?.providerData?.find((p) => p.displayName)?.displayName ||
                    (signedInEmail ? signedInEmail.split('@')[0] : 'Patient');

                  if (signedInEmail) {
                    const loginRes = onGoogleLoginSuccess(signedInEmail, signedInName);
                    if (loginRes && !loginRes.success && loginRes.error) {
                      setAuthError(loginRes.error);
                    }
                  } else if (res?.user) {
                    const loginRes = onGoogleLoginSuccess(
                      `${res.user.uid}@google.user`,
                      signedInName
                    );
                    if (loginRes && !loginRes.success && loginRes.error) {
                      setAuthError(loginRes.error);
                    }
                  }
                } catch (err: any) {
                  const code = err?.code || '';
                  if (code === 'auth/popup-blocked') {
                    setAuthError(
                      'Popup was blocked by your browser. Please allow popups for this site and click Continue with Google again.'
                    );
                  } else if (code === 'auth/unauthorized-domain') {
                    setAuthError(
                      `This domain (${window.location.hostname}) is not yet added to Firebase Authorized Domains.`
                    );
                  } else if (
                    code === 'auth/popup-closed-by-user' ||
                    code === 'auth/cancelled-popup-request'
                  ) {
                    setAuthError('Google Sign-In popup was closed before completing sign-in.');
                  } else {
                    setAuthError(
                      err?.message || 'Google Sign-In could not be completed. Please try again.'
                    );
                  }
                }
              }}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              }
            >
              Continue with Google
            </NeuButton>
          </div>

          <div className="text-center text-xs text-[#64748B] pt-2 border-t border-black/5">
            New patient to TeleHealth?{' '}
            <button
              type="button"
              onClick={() => onNavigate('create-account')}
              className="text-[#3478F6] font-semibold hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </NeuCard>
      </div>
    );
  }

  if (currentScreen === 'create-account') {
    const handleCreateAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (!regName.trim() || !regEmail.includes('@') || !regPhone.trim() || regPassword.length < 6) {
        setRegError('Please complete all required fields (password minimum 6 characters).');
        return;
      }
      if (!regAgreed) {
        setRegError('You must agree to the Terms and Privacy Policy to create an account.');
        return;
      }
      const res = onRegisterPatientAccount(
        regName.trim(),
        regEmail.trim(),
        regPhone.trim(),
        regPassword
      );
      if (!res.success) {
        setRegError(res.error || 'Could not create account.');
        return;
      }
      setRegError('');
    };

    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <NeuCard size="lg" className="space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-[#172B4D]">Create Patient Account</h1>
            <p className="text-xs text-[#64748B]">
              Register once to manage your medical profile and book 1-hour clinic consultations.
            </p>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
            <NeuInput
              label="Full Legal Name"
              required
              placeholder="e.g., Elena Rodriguez"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NeuInput
                label="Email Address"
                type="email"
                required
                placeholder="patient@example.org"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <NeuInput
                label="Contact Number"
                type="tel"
                required
                placeholder="+1 (415) 555-0194"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>
            <NeuInput
              label="Create Password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
            />

            <label className="flex items-start gap-2.5 text-xs text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={regAgreed}
                onChange={(e) => setRegAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#3478F6]"
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={onOpenTermsModal}
                  className="text-[#3478F6] font-semibold hover:underline"
                >
                  Terms and Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacyModal}
                  className="text-[#3478F6] font-semibold hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            {regError && (
              <p className="text-xs text-[#C63D4D] font-semibold">{regError}</p>
            )}

            <NeuButton type="submit" variant="primary" className="w-full" size="lg">
              Create Account & Continue
            </NeuButton>
          </form>

          <div className="text-center text-xs text-[#64748B] pt-2 border-t border-black/5">
            Already have a patient or clinician account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('sign-in')}
              className="text-[#3478F6] font-semibold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </NeuCard>
      </div>
    );
  }

  if (currentScreen === 'forgot-password') {
    const handleSendOtpToGoogle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetEmail.trim() || !resetEmail.includes('@')) {
        setResetError('Please enter your registered Google / email address.');
        return;
      }
      setResetError('');
      setConfirmSendModalOpen(true);
    };

    const executeSendOtpEmail = async () => {
      setConfirmSendModalOpen(false);
      setIsSendingOtp(true);
      setResetError('');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setOtpInput('');
      try {
        const result = await sendOtpEmailViaGmail(resetEmail.trim(), code);
        if (result.sentTo) {
          setResetEmail(result.sentTo);
        }
        setResetStep('otp');
      } catch (err: any) {
        setResetError(
          err?.message ||
            'Could not send OTP via Gmail. Please sign in with Google when prompted and grant permission.'
        );
      } finally {
        setIsSendingOtp(false);
      }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
      e.preventDefault();
      if (otpInput.trim().length !== 6) {
        setResetError('Please enter the 6-digit OTP code sent to your Google email.');
        return;
      }
      if (otpInput.trim() !== generatedOtp) {
        setResetError('Invalid OTP code. Please check the 6-digit code sent to your Google inbox.');
        return;
      }
      setResetError('');
      setResetStep('new-password');
    };

    const handleSaveNewPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (newResetPassword.length < 6) {
        setResetError('New password must be at least 6 characters.');
        return;
      }
      if (newResetPassword !== confirmResetPassword) {
        setResetError('Passwords do not match. Please re-enter.');
        return;
      }
      onResetUserPassword(resetEmail.trim(), newResetPassword);
      setResetError('');
      setResetStep('done');
    };

    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <NeuCard size="lg" className="space-y-5">
          <div className="text-center space-y-1">
            <div className="w-11 h-11 rounded-2xl neu-raised-sm mx-auto flex items-center justify-center text-[#3478F6] mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#172B4D]">Reset Account Password via Google OTP</h1>
            <p className="text-xs text-[#64748B]">
              {resetStep === 'email' &&
                'Enter your registered Google / Gmail address to receive a real 6-digit One-Time Password (OTP) in your Gmail inbox.'}
              {resetStep === 'otp' &&
                `Enter the 6-digit verification code sent to ${resetEmail} from telehealthotp@gmail.com.`}
              {resetStep === 'new-password' &&
                'OTP verified. Create and confirm your new account password below.'}
              {resetStep === 'done' &&
                'Your account password has been successfully updated.'}
            </p>
          </div>

          {/* Step Progress Indicator */}
          <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-center">
            <div
              className={`rounded-lg py-1.5 ${
                resetStep === 'email'
                  ? 'bg-[#3478F6] text-white'
                  : 'neu-inset text-[#16865C]'
              }`}
            >
              1. Send OTP
            </div>
            <div
              className={`rounded-lg py-1.5 ${
                resetStep === 'otp'
                  ? 'bg-[#3478F6] text-white'
                  : resetStep === 'new-password' || resetStep === 'done'
                  ? 'neu-inset text-[#16865C]'
                  : 'neu-inset text-[#64748B]'
              }`}
            >
              2. Verify OTP
            </div>
            <div
              className={`rounded-lg py-1.5 ${
                resetStep === 'new-password'
                  ? 'bg-[#3478F6] text-white'
                  : resetStep === 'done'
                  ? 'neu-inset text-[#16865C]'
                  : 'neu-inset text-[#64748B]'
              }`}
            >
              3. New Password
            </div>
          </div>

          {resetStep === 'email' && (
            <form onSubmit={handleSendOtpToGoogle} className="space-y-4" noValidate>
              <NeuInput
                label="Registered Google / Email Address"
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  if (resetError) setResetError('');
                }}
              />

              {resetError && (
                <p className="text-xs text-[#C63D4D] font-semibold">{resetError}</p>
              )}

              <NeuButton
                type="submit"
                variant="primary"
                className="w-full"
                loading={isSendingOtp}
                icon={<Mail className="w-4 h-4" />}
              >
                {isSendingOtp ? 'Sending OTP to Gmail...' : 'Send 6-Digit OTP to Google Email'}
              </NeuButton>
            </form>
          )}

          {resetStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div className="neu-inset rounded-xl p-3.5 text-xs space-y-1 border border-[#3478F6]/30">
                <div className="font-bold text-[#3478F6] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>6-Digit OTP Sent to Gmail</span>
                </div>
                <p className="text-[#64748B]">
                  A 6-digit verification code has been sent to <strong className="text-[#172B4D]">{resetEmail}</strong> from <strong className="text-[#3478F6]">telehealthotp@gmail.com</strong>. Please check your Gmail inbox (and Sent/Spam folder) and enter the code below.
                </p>
              </div>

              <NeuInput
                label="Enter 6-Digit OTP Code"
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit code from your Gmail"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (resetError) setResetError('');
                }}
              />

              {resetError && (
                <p className="text-xs text-[#C63D4D] font-semibold">{resetError}</p>
              )}

              <div className="flex items-center justify-between gap-2">
                <NeuButton
                  type="button"
                  size="sm"
                  loading={isSendingOtp}
                  onClick={() => setConfirmSendModalOpen(true)}
                >
                  Resend OTP
                </NeuButton>
                <NeuButton type="submit" variant="primary" className="flex-1">
                  Verify OTP Code
                </NeuButton>
              </div>
            </form>
          )}

          {resetStep === 'new-password' && (
            <form onSubmit={handleSaveNewPassword} className="space-y-4" noValidate>
              <NeuInput
                label="New Password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newResetPassword}
                onChange={(e) => {
                  setNewResetPassword(e.target.value);
                  if (resetError) setResetError('');
                }}
              />
              <NeuInput
                label="Confirm New Password"
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmResetPassword}
                onChange={(e) => {
                  setConfirmResetPassword(e.target.value);
                  if (resetError) setResetError('');
                }}
              />

              {resetError && (
                <p className="text-xs text-[#C63D4D] font-semibold">{resetError}</p>
              )}

              <NeuButton type="submit" variant="primary" className="w-full">
                Update Password
              </NeuButton>
            </form>
          )}

          {resetStep === 'done' && (
            <div className="neu-inset rounded-xl p-4 space-y-3 text-xs text-[#172B4D]">
              <div className="font-bold text-[#16865C] flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password Reset Complete</span>
              </div>
              <p className="text-[#64748B]">
                Your Google OTP was verified and the password for <strong>{resetEmail}</strong> has been updated. You can now sign in with your new password.
              </p>
              <NeuButton
                variant="primary"
                className="w-full"
                onClick={() => {
                  setEmail(resetEmail);
                  setPassword(newResetPassword);
                  setResetStep('email');
                  setOtpInput('');
                  setNewResetPassword('');
                  setConfirmResetPassword('');
                  onNavigate('sign-in');
                }}
              >
                Proceed to Sign In
              </NeuButton>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setResetStep('email');
                setResetError('');
                onNavigate('sign-in');
              }}
              className="text-xs text-[#64748B] hover:text-[#172B4D] font-medium cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        </NeuCard>

        <NeuModal
          isOpen={confirmSendModalOpen}
          onClose={() => setConfirmSendModalOpen(false)}
          title="Confirm Sending OTP via Gmail"
          subtitle={`From: telehealthotp@gmail.com → To: ${resetEmail}`}
          footer={
            <>
              <NeuButton onClick={() => setConfirmSendModalOpen(false)}>Cancel</NeuButton>
              <NeuButton
                variant="primary"
                loading={isSendingOtp}
                icon={<Mail className="w-4 h-4" />}
                onClick={executeSendOtpEmail}
              >
                Confirm & Send OTP Email
              </NeuButton>
            </>
          }
        >
          <div className="space-y-3 text-xs text-[#64748B]">
            <p className="text-[#172B4D] font-medium">
              Send a 6-digit password reset verification email to{' '}
              <strong className="text-[#3478F6]">{resetEmail}</strong> from{' '}
              <strong className="text-[#172B4D]">telehealthotp@gmail.com</strong>?
            </p>
            <p>
              Once confirmed, your 6-digit verification code will be dispatched directly to{' '}
              <strong>{resetEmail}</strong>.
            </p>
          </div>
        </NeuModal>
      </div>
    );
  }

  // DEFAULT: PUBLIC LANDING PAGE
  const faqs = [
    {
      q: 'How do appointment time slots work?',
      a: 'Clinic appointments are scheduled in structured 1-hour slots during Morning Hours (7:00 AM–11:00 AM) and Afternoon Hours (1:00 PM–5:00 PM), up to a maximum of 8 standard slots per doctor per day.',
    },
    {
      q: 'Can two patients accidentally book the same time slot?',
      a: 'No. Available slots are refreshed dynamically, and the booking service validates every request against existing appointments, doctor working days, and leave blocks before confirming.',
    },
    {
      q: 'Is my medical history visible on the public calendar?',
      a: 'Never. The availability calendar only displays whether a 1-hour slot is Available, Booked, or Blocked. Personal medical history is restricted to you and your authorized physician.',
    },
    {
      q: 'What happens if I click Book an Appointment before signing in?',
      a: 'We preserve your booking intent, prompt you to sign in or create an account, and then direct you straight to the 50/50 Appointment Booking & Doctor Availability screen with your profile prefilled.',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section id="overview" className="scroll-mt-24 pt-6 sm:pt-10 px-4 sm:px-8 max-w-7xl mx-auto">
        <div
          ref={heroRef}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div
            className={`lg:col-span-7 space-y-6 transition-all duration-700 delay-100 ease-out ${
              heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
            }`}
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#172B4D] tracking-tight leading-[1.15]">
              Healthcare, made easier.
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed">
              Book verified one-hour consultations, review real-time physician availability across specialized medical departments, and manage your clinical profile in one calm, trustworthy workspace.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <NeuButton
                variant="primary"
                size="lg"
                onClick={onBookAppointmentClick}
                icon={<Calendar className="w-4 h-4" />}
              >
                Book an Appointment
              </NeuButton>
              <NeuButton
                size="lg"
                onClick={() => onNavigate('sign-in')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Portal
              </NeuButton>
            </div>
          </div>

          {/* Right Hero Interactive Preview Card */}
          <div
            className={`lg:col-span-5 transition-all duration-700 delay-200 ease-out ${
              heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
            }`}
          >
            <NeuCard size="lg" className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-3">
                <div>
                  <div className="text-xs font-semibold text-[#64748B]">Live Clinic Schedule Snapshot</div>
                  <div className="text-sm font-bold text-[#172B4D]">Standard 1-Hour Consultation Windows</div>
                </div>
                <StatusIndicator status="Active" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="neu-inset rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-[#64748B]">Morning Roster</div>
                  <div className="font-mono-tabular font-bold text-[#172B4D] text-sm">7:00 AM – 11:00 AM</div>
                  <div className="text-[11px] text-[#16865C] font-medium">4 × 1-Hour Slots</div>
                </div>
                <div className="neu-inset rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-[#64748B]">Afternoon Roster</div>
                  <div className="font-mono-tabular font-bold text-[#172B4D] text-sm">1:00 PM – 5:00 PM</div>
                  <div className="text-[11px] text-[#16865C] font-medium">4 × 1-Hour Slots</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#172B4D]">Attending Specialists Today</div>
                {doctors
                  .filter((d) => d.status !== 'Inactive' && d.status !== 'Resigned')
                  .slice(0, 3)
                  .map((doc) => (
                  <div
                    key={doc.id}
                    className="neu-raised-sm rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#172B4D]">{doc.fullName}</div>
                      <div className="text-[#64748B]">{doc.departmentName}</div>
                    </div>
                    <StatusIndicator status={doc.status} />
                  </div>
                ))}
              </div>
            </NeuCard>
          </div>
        </div>
      </section>

      {/* Medical Departments & Services */}
      <section
        id="departments"
        ref={deptRef}
        className={`max-w-7xl mx-auto px-4 sm:px-8 space-y-6 transition-all duration-700 ease-out ${
          deptVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#172B4D]">Clinical Departments & Services</h2>
            <p className="text-sm text-[#64748B] mt-1">
              Configurable outpatient departments and standardized 60-minute consultation types.
            </p>
          </div>
          <NeuButton variant="primary" size="sm" onClick={onBookAppointmentClick}>
            Schedule by Department
          </NeuButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <NeuCard
              key={dept.id}
              className="group flex flex-col justify-between gap-4 border border-transparent transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#3478F6]/40 hover:bg-white/40 cursor-pointer"
              onClick={onBookAppointmentClick}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-mono-tabular font-semibold text-[#3478F6]">DEPT · {dept.code}</span>
                  <span>{dept.doctorCount} Attending Physician(s)</span>
                </div>
                <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#3478F6] transition-colors">
                  {dept.name}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{dept.description}</p>
              </div>
              <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Lead: <strong className="text-[#172B4D]">{dept.headDoctorName}</strong></span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookAppointmentClick();
                  }}
                  className="text-[#3478F6] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center cursor-pointer"
                >
                  Book Slot →
                </button>
              </div>
            </NeuCard>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div>
          <strong className="text-[#172B4D]">TeleHealth Management System</strong> · Outpatient & Clinical Scheduling Platform
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => onNavigate('privacy-policy')}
            className="hover:text-[#172B4D] cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terms-conditions')}
            className="hover:text-[#172B4D] cursor-pointer"
          >
            Terms & Conditions
          </button>
          <span>Contact: admintelehealth@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};
