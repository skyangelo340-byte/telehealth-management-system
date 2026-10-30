import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Stethoscope,
  Send,
  Loader2,
  Calendar,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  ArrowLeft,
  Info,
} from 'lucide-react';
import {
  AssessmentMessage,
  PatientProfile,
  ScreenId,
} from '../../types';
import { NeuButton } from '../../components/ui/NeumorphicPrimitives';
import { analyzeSymptomConversation } from '../../services/symptomTriageService';

interface TeleHealthAssessmentViewProps {
  mode: 'guest' | 'patient';
  patientProfile?: PatientProfile;
  onNavigate: (screen: ScreenId) => void;
  onBookAppointmentClick: () => void;
}

const COMMON_SYMPTOM_STARTERS = [
  {
    icon: '🩺',
    label: 'Mataas ang BP at masakit ang batok',
    text: 'Masakit ang batok at ulo ko ngayong umaga, at 150/95 ang naitalang blood pressure ko.',
  },
  {
    icon: '🫁',
    label: 'Ubo, sipon at masakit na lalamunan',
    text: 'May ubo, sipon, at masakit na lalamunan ako nang 3 araw na.',
  },
  {
    icon: '🌡️',
    label: 'Lagnat at pananakit ng katawan',
    text: 'May mataas akong lagnat (38.7°C) at sumasakit ang buong katawan mula kagabi.',
  },
  {
    icon: '🤢',
    label: 'Pananakit ng tiyan at pagtatae',
    text: 'Masakit ang tiyan ko sa may pusod at 3 beses nang nagtatae simula kaninang madaling-araw.',
  },
  {
    icon: '🩹',
    label: 'Makating pantal sa braso o katawan',
    text: 'May lumabas na makating pantal at pamumula sa aking mga braso na 2 araw nang hindi nawawala.',
  },
  {
    icon: '🦷',
    label: 'Nangingilo at sumasakit ang ngipin',
    text: 'Nangingilo at sumasakit ang bagang ko lalo na kapag umiinom ng malamig o kumakain ng matamis.',
  },
];

export const TeleHealthAssessmentView: React.FC<TeleHealthAssessmentViewProps> = ({
  mode,
  patientProfile,
  onNavigate,
  onBookAppointmentClick,
}) => {
  const initialGreeting: AssessmentMessage = {
    id: 'm-init',
    sender: 'assistant',
    text: 'Magandang araw! Ako ang inyong TeleHealth Pre-Visit Symptom Assessment Assistant. Maaari mo bang ilahad ang iyong nararamdamang sintomas, kailan pa ito nagsimula, at kung gaano ito kalubha? Tutulungan kitang makakuha ng paunang lunas at itutugma sa angkop na espesyalistang doktor.',
    timestamp: 'Just now',
    followUpOptions: [
      'Masakit ang ulo sa umaga at 150/95 ang BP ko',
      'May makating pantal / rash sa braso nang 3 araw',
      'Nangingilo at sumasakit ang bagang kapag umiinom ng malamig',
      'May lagnat at ubo na 2 araw na',
    ],
  };

  const [chatMessages, setChatMessages] = useState<AssessmentMessage[]>([initialGreeting]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzingChat, setIsAnalyzingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAnalyzingChat]);

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
    } finally {
      setIsAnalyzingChat(false);
    }
  };

  const handleReset = () => {
    setChatMessages([initialGreeting]);
    setChatInput('');
  };

  const isInitialWelcomeState = chatMessages.length === 1 && chatMessages[0].id === 'm-init';

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-5">
      {/* 1. Header & Navigation Hierarchy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Stethoscope className="w-3.5 h-3.5" />
            <span>AI Clinical Intake & Triage Assistant</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span>Tagalog & English</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            TeleHealth Pre-Visit Symptom Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Provides recommended actions, risks if ignored, first-aid (paunang lunas), and specialist doctor matching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(mode === 'patient' ? 'patient-dashboard' : 'landing')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{mode === 'patient' ? 'Dashboard' : 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
            title="I-reset ang usapan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <NeuButton
            variant="primary"
            onClick={onBookAppointmentClick}
            icon={<Calendar className="w-4 h-4" />}
            className="!shadow-md"
          >
            Book Appointment
          </NeuButton>
        </div>
      </div>

      {/* 2. Original Safety Disclaimer */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 p-3.5 sm:p-4 text-xs sm:text-sm shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Paalala: Ang AI Assistant na ito ay para lamang sa mga medikal na sintomas, paunang lunas, at konsultasyon sa doktor.
            </p>
            <p className="text-amber-800/80 dark:text-amber-300/80 text-xs">
              Provides recommended actions, risks if ignored, first-aid (paunang lunas), and specialist doctor matching.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Chat Conversation Card */}
      <div className="rounded-2xl bg-white dark:bg-[#10172A] border border-slate-200 dark:border-white/10 shadow-lg flex flex-col min-h-[580px] overflow-hidden">
        {/* Conversation Header Strip */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-[#0B1020] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>TeleHealth Clinical Assistant</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Handang makinig sa iyong mga sintomas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              {chatMessages.length} mensahe
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded-md cursor-pointer"
            >
              Panibagong Tanong
            </button>
          </div>
        </div>

        {/* Conversation Scrollable Body */}
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[560px]">
          {/* Calm Welcome Guide (Shown when starting or after reset) */}
          {isInitialWelcomeState && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Gabay sa Paggamit ng Pre-Visit Intake:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-blue-100 dark:border-white/5 space-y-1 shadow-2xs">
                  <div className="font-bold text-blue-700 dark:text-blue-400">
                    1. Ilarawan ang Sintomas
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Sabihin kung ano ang nararamdaman, ilang araw na, at kung gaano kalubha.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-blue-100 dark:border-white/5 space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    2. Paunang Lunas & Risgo
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Bibigyan ka ng AI ng tamang home care at mga posibleng panganib kapag pinabayaan.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-blue-100 dark:border-white/5 space-y-1 shadow-2xs">
                  <div className="font-bold text-purple-700 dark:text-purple-400">
                    3. Rekomendang Doktor
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Itatapat ka sa tamang departamento at espesyalista para sa mabilis na appointment.
                  </p>
                </div>
              </div>

              {/* Quick Starter Chips */}
              <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/40 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  O pumili ng karaniwang sintomas upang magsimula agad:
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOM_STARTERS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnalyzingChat}
                      onClick={() => handleSendMessage(item.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-left"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Message Stream */}
          {chatMessages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
              >
                {/* Message Bubble Container */}
                <div
                  style={isUser ? { color: '#ffffff' } : undefined}
                  className={`max-w-[94%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 transition-all ${
                    isUser
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-[#ffffff] shadow-md border border-blue-500/30'
                      : 'bg-slate-50 dark:bg-[#131E3A] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-white/10 shadow-sm'
                  }`}
                >
                  {/* Sender Meta Row */}
                  <div
                    className={`flex items-center justify-between gap-3 pb-2 mb-2 border-b text-xs ${
                      isUser
                        ? 'border-white/20 text-[#ffffff]'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {isUser ? (
                        <>
                          <User className="w-3.5 h-3.5 text-blue-100" />
                          <span
                            style={{ color: '#ffffff' }}
                            className="text-[#ffffff] font-semibold"
                          >
                            {patientProfile?.fullName || 'Ikaw (Patient)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-700 dark:text-blue-300">
                            TeleHealth Clinical Assistant
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      style={isUser ? { color: '#dbeafe' } : undefined}
                      className={`font-mono-tabular text-[11px] ${
                        isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Main Message Content */}
                  <div
                    style={isUser ? { color: '#ffffff' } : undefined}
                    className={`text-sm sm:text-[15px] font-normal leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'text-[#ffffff] dark:text-[#ffffff] font-medium'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Non-Medical Guardrail Alert */}
                  {m.clinicalReport && !m.clinicalReport.isMedicalTopic && (
                    <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        Paalala: Ang AI Assistant na ito ay nakatuon lamang sa mga medikal na sintomas, paunang lunas, at pagpapatingin sa doktor.
                      </span>
                    </div>
                  )}

                  {/* Detailed Clinical Triage Report Cards */}
                  {m.clinicalReport &&
                    m.clinicalReport.isMedicalTopic &&
                    m.clinicalReport.hasEnoughInfo && (
                      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-white/10 space-y-3.5">
                        {/* 1. Recommended Actions */}
                        {m.clinicalReport.recommendedActions.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 space-y-2">
                            <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>1. Rekomendadong Dapat Gawin (Recommended Actions)</span>
                            </div>
                            <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium">
                              {m.clinicalReport.recommendedActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 2. Risks If Ignored */}
                        {m.clinicalReport.risksIfIgnored.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 space-y-2">
                            <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>2. Posibleng Mangyari Kapag Pinabayaan (Risks if Left Untreated)</span>
                            </div>
                            <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium">
                              {m.clinicalReport.risksIfIgnored.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 3. First Aid / Paunang Lunas */}
                        {m.clinicalReport.firstAidSteps.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                              <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>3. Paunang Lunas Habang Naghihintay (First Aid & Home Care)</span>
                            </div>
                            <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium">
                              {m.clinicalReport.firstAidSteps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 4. Specialist Doctor Recommendation Card */}
                        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1226] border border-blue-300 dark:border-blue-700/70 shadow-sm space-y-3">
                          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>4. Inirerekomendang Espesyalistang Doktor</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-white/10">
                            <div className="space-y-1">
                              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {m.clinicalReport.randomForest.recommendedDoctorName}
                              </div>
                              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {m.clinicalReport.randomForest.predictedDepartmentName} ·{' '}
                                {m.clinicalReport.randomForest.recommendedDoctorTitle}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                Espesyalidad: {m.clinicalReport.randomForest.recommendedDoctorSpecialty}
                              </div>
                              {m.clinicalReport.doctorRecommendationReason && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                                  {m.clinicalReport.doctorRecommendationReason}
                                </p>
                              )}
                            </div>

                            <NeuButton
                              size="sm"
                              variant="primary"
                              onClick={onBookAppointmentClick}
                              icon={<Calendar className="w-3.5 h-3.5" />}
                              className="shrink-0 font-bold self-start sm:self-center"
                            >
                              Book Consultation
                            </NeuButton>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Interactive Follow-up Suggestion Chips */}
                  {m.followUpOptions && m.followUpOptions.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Maaari mo ring itanong o piliin ang mga sumusunod:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.followUpOptions.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isAnalyzingChat}
                            onClick={() => handleSendMessage(opt)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-700/60 transition-colors cursor-pointer disabled:opacity-50 text-left shadow-2xs"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Real-time Analyzing Indicator */}
          {isAnalyzingChat && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-[#131E3A] border border-blue-200 dark:border-blue-800/60 text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 max-w-md animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Sinusuri ng AI Assistant ang iyong mga sintomas at naghahanda ng paunang lunas...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Prominent Accessible Message Composer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#0B1020] border-t border-slate-200 dark:border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(chatInput);
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                disabled={isAnalyzingChat}
                placeholder="I-type ang nararamdamang sintomas, kailan nagsimula, o itanong ang gamutan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Ilarawan ang sintomas"
                className="w-full rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#162038] border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!chatInput.trim() || isAnalyzingChat}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer shrink-0 disabled:cursor-not-allowed"
            >
              {isAnalyzingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
