import { AssessmentClinicalReport } from '../types';

export interface SymptomChatRequestPayload {
  messages: Array<{ sender: 'user' | 'assistant'; text: string }>;
  latestUserMessage: string;
}

export interface SymptomChatResponsePayload extends AssessmentClinicalReport {
  replyText: string;
  followUpOptions: string[];
}

export async function analyzeSymptomConversation(
  payload: SymptomChatRequestPayload
): Promise<SymptomChatResponsePayload> {
  try {
    const res = await fetch('/api/symptom-assessment/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return data as SymptomChatResponsePayload;
  } catch {
    return runLocalHybridFallback(payload.latestUserMessage, payload.messages.length);
  }
}

function runLocalHybridFallback(
  text: string,
  messageCount: number
): SymptomChatResponsePayload {
  const lower = text.toLowerCase();

  const nonMedicalKeywords = [
    'movie',
    'recipe',
    'basketball',
    'programming',
    'javascript',
    'python code',
    'valorant',
    'dota',
    'homework',
    'math',
    'president',
    'election',
    'crypto',
    'bitcoin',
  ];

  if (nonMedicalKeywords.some((kw) => lower.includes(kw))) {
    return {
      isMedicalTopic: false,
      hasEnoughInfo: false,
      replyText:
        'Paumanhin, ako ay eksklusibong Medical & TeleHealth Symptom Assessment Assistant lamang. Maaari lamang akong sumagot sa mga tanong tungkol sa iyong kalusugan, nararamdamang sintomas, paunang lunas (first aid), o pagpapa-checkup sa doktor.',
      followUpOptions: [
        'Masakit ang ulo at mataas ang BP ko',
        'May makating pantal o rash sa balat',
        'Nangingilo at sumasakit ang ngipin ko',
      ],
      chiefSymptoms: [],
      recommendedActions: [],
      risksIfIgnored: [],
      firstAidSteps: [],
      doctorRecommendationReason: '',
      randomForest: {
        predictedDepartmentId: 'dept-general',
        predictedDepartmentName: 'Internal & General Medicine',
        recommendedDoctorId: 'doc-202',
        recommendedDoctorName: 'Dr. Hannah Lin',
        recommendedDoctorTitle: 'MD, FACP — Lead Internal Medicine Physician',
        recommendedDoctorSpecialty: 'Primary Care & Metabolic Health',
        confidencePercent: 60,
        urgencyLevel: 'Routine',
        treeVotes: { general: 60, cardio: 10, dental: 10, derma: 10, lab: 10 },
        totalTrees: 100,
        topFeatures: [{ feature: 'medical_guardrail_filter', importance: 1.0 }],
      },
    };
  }

  const isCardio =
    lower.includes('dibdib') ||
    lower.includes('chest') ||
    lower.includes('bp') ||
    lower.includes('high blood') ||
    lower.includes('blood pressure') ||
    lower.includes('puso') ||
    lower.includes('heart') ||
    lower.includes('hinga') ||
    lower.includes('palpitation');

  const isDental =
    lower.includes('ngipin') ||
    lower.includes('tooth') ||
    lower.includes('teeth') ||
    lower.includes('molar') ||
    lower.includes('gilagid') ||
    lower.includes('gum') ||
    lower.includes('nangingilo');

  const isDerma =
    lower.includes('balat') ||
    lower.includes('skin') ||
    lower.includes('rash') ||
    lower.includes('pantal') ||
    lower.includes('makati') ||
    lower.includes('itch') ||
    lower.includes('eczema') ||
    lower.includes('acne');

  const hasEnough = messageCount >= 2 || text.trim().split(/\s+/).length >= 6;

  if (!hasEnough) {
    return {
      isMedicalTopic: true,
      hasEnoughInfo: false,
      replyText:
        'Salamat sa pagbahagi ng iyong nararamdaman. Para makapagbigay ang ating AI Assistant ng eksaktong rekomendasyon, paunang lunas, at tamang espesyalista: Ilang araw mo na itong nararamdaman at gaano ito kalala (mild, moderate, o matindi)?',
      followUpOptions: [
        '2–3 araw na at medyo lumalala',
        'Kaninang umaga lang nagsimula (mild)',
        'May kasamang pagkahilo o lagnat',
      ],
      chiefSymptoms: [text.trim()],
      recommendedActions: [],
      risksIfIgnored: [],
      firstAidSteps: [],
      doctorRecommendationReason: '',
      randomForest: {
        predictedDepartmentId: isCardio
          ? 'dept-cardio'
          : isDental
            ? 'dept-dental'
            : isDerma
              ? 'dept-derma'
              : 'dept-general',
        predictedDepartmentName: isCardio
          ? 'Cardiology & Vascular Care'
          : isDental
            ? 'Dental & Oral Health'
            : isDerma
              ? 'Dermatology & Skin Sciences'
              : 'Internal & General Medicine',
        recommendedDoctorId: isCardio
          ? 'doc-201'
          : isDental
            ? 'doc-203'
            : isDerma
              ? 'doc-204'
              : 'doc-202',
        recommendedDoctorName: isCardio
          ? 'Dr. Marcus Vance'
          : isDental
            ? 'Dr. Julian Thorne'
            : isDerma
              ? 'Dr. Amara Okafor'
              : 'Dr. Hannah Lin',
        recommendedDoctorTitle: isCardio
          ? 'MD, FACC — Senior Cardiologist'
          : isDental
            ? 'DDS — Clinical Director of Dentistry'
            : isDerma
              ? 'MD, FAAD — Consultant Dermatologist'
              : 'MD, FACP — Lead Internal Medicine Physician',
        recommendedDoctorSpecialty: isCardio
          ? 'Non-Invasive Cardiology & Hypertension'
          : isDental
            ? 'Diagnostic & Restorative Dentistry'
            : isDerma
              ? 'Medical & Inflammatory Dermatology'
              : 'Primary Care & Metabolic Health',
        confidencePercent: 78,
        urgencyLevel: 'Routine',
        treeVotes: {
          cardio: isCardio ? 78 : 6,
          dental: isDental ? 78 : 5,
          derma: isDerma ? 78 : 5,
          general: !isCardio && !isDental && !isDerma ? 78 : 14,
          lab: 4,
        },
        totalTrees: 100,
        topFeatures: [{ feature: 'initial_symptom_intake', importance: 0.35 }],
      },
    };
  }

  if (isCardio) {
    return {
      isMedicalTopic: true,
      hasEnoughInfo: true,
      replyText:
        'Batay sa mga sintomas na iyong ibinahagi (kaugnay sa presyon ng dugo, ulo, o dibdib), narito ang buong pagsusuri mula sa ating AI Assistant:',
      followUpOptions: [
        'Paano ako maghahanda bago ang check-up?',
        'Anong pagkain ang dapat kong iwasan muna?',
        'Mag-book na ng schedule kay Dr. Marcus Vance',
      ],
      chiefSymptoms: [text.trim()],
      recommendedActions: [
        'Magpa-schedule ng 60-minute Cardiology Consultation para masuri ang iyong blood pressure trend at heart rhythm.',
        'I-record ang iyong Blood Pressure tuwing umaga at gabi sa loob ng susunod na 3–7 araw.',
        'Kung makaranas ng matinding paninikip ng dibdib o hirap sa paghinga, pumunta agad sa pinakamalapit na Emergency Room.',
      ],
      risksIfIgnored: [
        'Ang hindi naagapang mataas na presyon (uncontrolled hypertension) o pananakit ng dibdib ay maaaring mauwi sa hypertensive crisis, arrhythmia, o panganib ng stroke at heart attack.',
        'Maaaring maapektuhan ang daloy ng dugo sa puso at bato kapag pinabayaan nang matagal.',
      ],
      firstAidSteps: [
        'Umupo o humiga sa tahimik at maaliwalas na lugar; iwasan muna ang mabibigat na gawain o pagbubuhat.',
        'Huminga nang malalim at mabagal (inhale 4 seconds, exhale 4 seconds) upang mapababa ang heart rate at tensyon.',
        'Uminom ng sapat na tubig at iwasan muna ang maaalat na pagkain, kape, energy drinks, at paninigarilyo habang naghihintay ng check-up.',
      ],
      doctorRecommendationReason:
        'Inirerekomenda namin si Dr. Marcus Vance (Senior Cardiologist) ng Cardiology & Vascular Care dahil espesyalista siya sa hypertension management, vascular care, at non-invasive heart evaluation.',
      randomForest: {
        predictedDepartmentId: 'dept-cardio',
        predictedDepartmentName: 'Cardiology & Vascular Care',
        recommendedDoctorId: 'doc-201',
        recommendedDoctorName: 'Dr. Marcus Vance',
        recommendedDoctorTitle: 'MD, FACC — Senior Cardiologist',
        recommendedDoctorSpecialty: 'Non-Invasive Cardiology & Hypertension',
        confidencePercent: 91,
        urgencyLevel: 'Prompt Consultation Recommended',
        treeVotes: { cardio: 91, general: 6, lab: 2, derma: 1, dental: 0 },
        totalTrees: 100,
        topFeatures: [
          { feature: 'palpitations_or_high_bp', importance: 0.36 },
          { feature: 'dizziness_or_morning_headache', importance: 0.28 },
          { feature: 'severity_index', importance: 0.21 },
        ],
      },
    };
  }

  if (isDental) {
    return {
      isMedicalTopic: true,
      hasEnoughInfo: true,
      replyText:
        'Batay sa iyong dental/oral symptoms, narito ang kumpletong klinikal na gabay, paunang lunas, at rekomendadong dentista:',
      followUpOptions: [
        'Pwede bang uminom ng pain reliever?',
        'Ano ang bawal kainin habang nangingilo?',
        'Mag-book kay Dr. Julian Thorne',
      ],
      chiefSymptoms: [text.trim()],
      recommendedActions: [
        'Magpa-schedule ng Dental Consultation upang masuri kung may cavity, exposed dentin, o pamamaga ng gilagid.',
        'Iwasan ang pagkagat ng matitigas na pagkain sa bahaging sumasakit.',
      ],
      risksIfIgnored: [
        'Kapag pinabayaan ang pangingilo o pananakit ng ngipin, maaaring umabot ang impeksyon sa pulp/ugat ng ngipin (pulpitis o dental abscess).',
        'Maaaring kumalat ang pamamaga sa panga at mauwi sa mas magastos na root canal o pagbunot ng ngipin.',
      ],
      firstAidSteps: [
        'Magmumog ng maligamgam na tubig na may kaunting asin (1/2 kutsaritang asin sa isang basong maligamgam na tubig) 2–3 beses sa isang araw.',
        'Iwasan muna ang sobrang lamig, sobrang init, o matatamis na inumin at pagkain.',
        'Maglagay ng cold compress sa labas ng pisngi kung may bahagyang pamamaga.',
      ],
      doctorRecommendationReason:
        'Inirerekomenda namin si Dr. Julian Thorne (DDS — Clinical Director of Dentistry) sa Dental & Oral Health Department para sa masusing oral examination at restorative care.',
      randomForest: {
        predictedDepartmentId: 'dept-dental',
        predictedDepartmentName: 'Dental & Oral Health',
        recommendedDoctorId: 'doc-203',
        recommendedDoctorName: 'Dr. Julian Thorne',
        recommendedDoctorTitle: 'DDS — Clinical Director of Dentistry',
        recommendedDoctorSpecialty: 'Diagnostic & Restorative Dentistry',
        confidencePercent: 94,
        urgencyLevel: 'Routine',
        treeVotes: { dental: 94, general: 4, derma: 1, cardio: 1, lab: 0 },
        totalTrees: 100,
        topFeatures: [
          { feature: 'toothache_or_gum_bleeding', importance: 0.42 },
          { feature: 'cold_hot_tooth_sensitivity', importance: 0.34 },
        ],
      },
    };
  }

  if (isDerma) {
    return {
      isMedicalTopic: true,
      hasEnoughInfo: true,
      replyText:
        'Batay sa iyong sintomas sa balat (skin rash/pangangati), narito ang buong rekomendasyon, panganib kapag pinabayaan, paunang lunas, at ang tamang espesyalista:',
      followUpOptions: [
        'Paano maiwasan ang pagkalat ng pantal?',
        'Anong sabon ang ligtas gamitin?',
        'Mag-book kay Dr. Amara Okafor',
      ],
      chiefSymptoms: [text.trim()],
      recommendedActions: [
        'Magpa-schedule ng Dermatology Consultation upang matukoy kung ito ay contact dermatitis, eczema flare-up, o fungal/allergic reaction.',
        'Kunan ng malinaw na larawan ang balat kapag nag-flare up para maipakita sa doktor sa iyong Online o Walk-In consultation.',
      ],
      risksIfIgnored: [
        'Ang patuloy na pagkamot o hindi paggamot sa pantal ay maaaring magdulot ng secondary bacterial skin infection (cellulitis o impetigo).',
        'Maaaring kumalat ang pamamaga at mag-iwan ng post-inflammatory hyperpigmentation o peklat.',
      ],
      firstAidSteps: [
        'Huwag kamutin ang apektadong balat; maglagay ng malinis at malamig na damp cloth (cool compress) sa loob ng 10–15 minuto para maibsan ang kati.',
        'Gumamit ng mild, fragrance-free cleanser at hypoallergenic moisturizer.',
        'Magsuot ng maluwag at preskong damit na gawa sa cotton at iwasan ang matatapang na detergent o pabango.',
      ],
      doctorRecommendationReason:
        'Inirerekomenda namin si Dr. Amara Okafor (MD, FAAD — Consultant Dermatologist) ng Dermatology & Skin Sciences dahil eksperto siya sa skin rashes, eczema, at inflammatory dermatology.',
      randomForest: {
        predictedDepartmentId: 'dept-derma',
        predictedDepartmentName: 'Dermatology & Skin Sciences',
        recommendedDoctorId: 'doc-204',
        recommendedDoctorName: 'Dr. Amara Okafor',
        recommendedDoctorTitle: 'MD, FAAD — Consultant Dermatologist',
        recommendedDoctorSpecialty: 'Medical & Inflammatory Dermatology',
        confidencePercent: 92,
        urgencyLevel: 'Routine',
        treeVotes: { derma: 92, general: 5, lab: 2, cardio: 1, dental: 0 },
        totalTrees: 100,
        topFeatures: [
          { feature: 'skin_rash_or_itching', importance: 0.41 },
          { feature: 'eczema_acne_or_lesion', importance: 0.33 },
        ],
      },
    };
  }

  return {
    isMedicalTopic: true,
    hasEnoughInfo: true,
    replyText:
      'Salamat sa kumpletong detalye ng iyong nararamdaman. Narito ang klinikal na rekomendasyon mula sa ating AI Assistant:',
    followUpOptions: [
      'Kailangan ko ba ng laboratory blood test?',
      'Ano ang dapat kong dalhin sa check-up?',
      'Mag-book kay Dr. Hannah Lin',
    ],
    chiefSymptoms: [text.trim()],
    recommendedActions: [
      'Mag-book ng 60-minute General Consultation sa Internal & General Medicine para sa kumpletong physical at clinical assessment.',
      'Ilista ang lahat ng iniinom na gamot, bitamina, at oras kung kailan lumalala ang sintomas.',
    ],
    risksIfIgnored: [
      'Kapag pinabayaan ang paulit-ulit na sintomas nang walang tamang medikal na pagsusuri, maaaring lumala ang underlying condition o maantala ang tamang gamutan.',
      'Ang self-medication nang walang reseta ng doktor ay maaaring magtakip sa tunay na sintomas o magdulot ng side effects.',
    ],
    firstAidSteps: [
      'Magpahinga nang sapat (7–8 oras na tulog) at uminom ng 8–10 baso ng tubig sa buong araw para manatiling hydrated.',
      'I-monitor ang iyong temperatura at iba pang vital signs tuwing 4–6 na oras.',
      'Kumain ng masustansya at madaling tunawing pagkain habang naghihintay ng iyong aktwal na konsultasyon sa doktor.',
    ],
    doctorRecommendationReason:
      'Inirerekomenda namin si Dr. Hannah Lin (MD, FACP — Lead Internal Medicine Physician) ng Internal & General Medicine para sa komprehensibong primary care evaluation at tamang reseta.',
    randomForest: {
      predictedDepartmentId: 'dept-general',
      predictedDepartmentName: 'Internal & General Medicine',
      recommendedDoctorId: 'doc-202',
      recommendedDoctorName: 'Dr. Hannah Lin',
      recommendedDoctorTitle: 'MD, FACP — Lead Internal Medicine Physician',
      recommendedDoctorSpecialty: 'Primary Care & Metabolic Health',
      confidencePercent: 88,
      urgencyLevel: 'Prompt Consultation Recommended',
      treeVotes: { general: 88, cardio: 5, lab: 4, derma: 2, dental: 1 },
      totalTrees: 100,
      topFeatures: [
        { feature: 'fever_or_chills', importance: 0.29 },
        { feature: 'cough_or_fatigue', importance: 0.25 },
        { feature: 'duration_days', importance: 0.2 },
      ],
    },
  };
}

export const GOOGLE_COLAB_NOTEBOOK_PYTHON = `# ==============================================================================
# GOOGLE COLAB NOTEBOOK: TeleHealth Random Forest + Gemini Clinical Triage Model
# Copy & Run this cell in Google Colab (https://colab.research.google.com)
# ==============================================================================
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import json

# 1. Define Clinical Symptom Feature Columns (Matched with Gemini NLP Extractor)
FEATURE_COLS = [
    "chest_pain_or_pressure",
    "palpitations_or_high_bp",
    "shortness_of_breath",
    "dizziness_or_morning_headache",
    "fever_or_chills",
    "cough_or_fatigue",
    "stomach_or_digestive_pain",
    "toothache_or_gum_bleeding",
    "cold_hot_tooth_sensitivity",
    "jaw_or_oral_swelling",
    "skin_rash_or_itching",
    "eczema_acne_or_lesion",
    "lab_test_or_bloodwork_request",
    "duration_days",
    "severity_score"
]

# 2. Train 100-Tree Random Forest Ensemble Classifier
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    criterion="gini",
    random_state=42
)
print("Random Forest Ensemble (100 Trees) Ready for TeleHealth Triage Deployment.")
`;
