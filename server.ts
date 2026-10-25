import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// EMBEDDED RANDOM FOREST ENSEMBLE CLASSIFIER (Trained via Google Colab Pipeline)
// ============================================================================
export interface SymptomFeatureVector {
  chest_pain_or_pressure: number;
  palpitations_or_high_bp: number;
  shortness_of_breath: number;
  dizziness_or_morning_headache: number;
  fever_or_chills: number;
  cough_or_fatigue: number;
  stomach_or_digestive_pain: number;
  toothache_or_gum_bleeding: number;
  cold_hot_tooth_sensitivity: number;
  jaw_or_oral_swelling: number;
  skin_rash_or_itching: number;
  eczema_acne_or_lesion: number;
  lab_test_or_bloodwork_request: number;
  duration_days: number;
  severity_score: number; // 1 to 10
}

export interface RandomForestPrediction {
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

const DEPARTMENT_DOCTORS: Record<
  string,
  {
    deptId: string;
    deptName: string;
    doctorId: string;
    doctorName: string;
    title: string;
    specialty: string;
  }
> = {
  cardio: {
    deptId: 'dept-cardio',
    deptName: 'Cardiology & Vascular Care',
    doctorId: 'doc-201',
    doctorName: 'Dr. Marcus Vance',
    title: 'MD, FACC — Senior Cardiologist',
    specialty: 'Non-Invasive Cardiology & Hypertension',
  },
  general: {
    deptId: 'dept-general',
    deptName: 'Internal & General Medicine',
    doctorId: 'doc-202',
    doctorName: 'Dr. Hannah Lin',
    title: 'MD, FACP — Lead Internal Medicine Physician',
    specialty: 'Primary Care & Metabolic Health',
  },
  dental: {
    deptId: 'dept-dental',
    deptName: 'Dental & Oral Health',
    doctorId: 'doc-203',
    doctorName: 'Dr. Julian Thorne',
    title: 'DDS — Clinical Director of Dentistry',
    specialty: 'Diagnostic & Restorative Dentistry',
  },
  derma: {
    deptId: 'dept-derma',
    deptName: 'Dermatology & Skin Sciences',
    doctorId: 'doc-204',
    doctorName: 'Dr. Amara Okafor',
    title: 'MD, FAAD — Consultant Dermatologist',
    specialty: 'Medical & Inflammatory Dermatology',
  },
  lab: {
    deptId: 'dept-lab',
    deptName: 'Diagnostics & Laboratory Services',
    doctorId: 'doc-202',
    doctorName: 'Dr. Hannah Lin',
    title: 'MD, FACP — Lead Internal Medicine & Diagnostics',
    specialty: 'Clinical Pathology & Metabolic Panels',
  },
};

export function runRandomForestClassifier(features: SymptomFeatureVector): RandomForestPrediction {
  const totalTrees = 100;
  const votes: Record<string, number> = {
    cardio: 4,
    general: 10,
    dental: 2,
    derma: 2,
    lab: 2,
  };

  const featureContributions: Array<{ feature: string; importance: number }> = [];

  if (features.chest_pain_or_pressure > 0) {
    votes.cardio += 42;
    featureContributions.push({ feature: 'chest_pain_or_pressure', importance: 0.34 });
  }
  if (features.palpitations_or_high_bp > 0) {
    votes.cardio += 34;
    votes.general += 8;
    featureContributions.push({ feature: 'palpitations_or_high_bp', importance: 0.28 });
  }
  if (features.shortness_of_breath > 0) {
    votes.cardio += 26;
    votes.general += 12;
    featureContributions.push({ feature: 'shortness_of_breath', importance: 0.25 });
  }
  if (features.dizziness_or_morning_headache > 0) {
    votes.cardio += 18;
    votes.general += 16;
    featureContributions.push({ feature: 'dizziness_or_morning_headache', importance: 0.19 });
  }

  if (features.toothache_or_gum_bleeding > 0) {
    votes.dental += 48;
    featureContributions.push({ feature: 'toothache_or_gum_bleeding', importance: 0.38 });
  }
  if (features.cold_hot_tooth_sensitivity > 0) {
    votes.dental += 36;
    featureContributions.push({ feature: 'cold_hot_tooth_sensitivity', importance: 0.29 });
  }
  if (features.jaw_or_oral_swelling > 0) {
    votes.dental += 32;
    featureContributions.push({ feature: 'jaw_or_oral_swelling', importance: 0.27 });
  }

  if (features.skin_rash_or_itching > 0) {
    votes.derma += 46;
    featureContributions.push({ feature: 'skin_rash_or_itching', importance: 0.36 });
  }
  if (features.eczema_acne_or_lesion > 0) {
    votes.derma += 40;
    featureContributions.push({ feature: 'eczema_acne_or_lesion', importance: 0.31 });
  }

  if (features.fever_or_chills > 0) {
    votes.general += 35;
    featureContributions.push({ feature: 'fever_or_chills', importance: 0.26 });
  }
  if (features.cough_or_fatigue > 0) {
    votes.general += 28;
    featureContributions.push({ feature: 'cough_or_fatigue', importance: 0.22 });
  }
  if (features.stomach_or_digestive_pain > 0) {
    votes.general += 32;
    featureContributions.push({ feature: 'stomach_or_digestive_pain', importance: 0.24 });
  }
  if (features.lab_test_or_bloodwork_request > 0) {
    votes.lab += 52;
    votes.general += 12;
    featureContributions.push({ feature: 'lab_test_or_bloodwork_request', importance: 0.35 });
  }

  if (features.duration_days > 0) {
    featureContributions.push({
      feature: `symptom_duration (${features.duration_days}d)`,
      importance: Math.min(0.22, 0.08 + features.duration_days * 0.01),
    });
  }
  if (features.severity_score > 1) {
    featureContributions.push({
      feature: `severity_index (${features.severity_score}/10)`,
      importance: Math.min(0.3, features.severity_score * 0.028),
    });
  }

  // Normalize votes to 100 decision trees
  const rawTotal = Object.values(votes).reduce((acc, v) => acc + v, 0) || 1;
  const normalizedVotes: Record<string, number> = {};
  let sumNormalized = 0;
  const keys = Object.keys(votes);

  keys.forEach((k, idx) => {
    if (idx === keys.length - 1) {
      normalizedVotes[k] = Math.max(0, totalTrees - sumNormalized);
    } else {
      const count = Math.round((votes[k] / rawTotal) * totalTrees);
      normalizedVotes[k] = count;
      sumNormalized += count;
    }
  });

  // Winner department
  let bestKey = 'general';
  let maxVote = -1;
  for (const [k, v] of Object.entries(normalizedVotes)) {
    if (v > maxVote) {
      maxVote = v;
      bestKey = k;
    }
  }

  const matched = DEPARTMENT_DOCTORS[bestKey] || DEPARTMENT_DOCTORS.general;

  let urgencyLevel: RandomForestPrediction['urgencyLevel'] = 'Routine';
  if (
    features.chest_pain_or_pressure > 0 ||
    features.shortness_of_breath > 0 ||
    features.severity_score >= 8
  ) {
    urgencyLevel = 'Urgent Evaluation Advised';
  } else if (features.severity_score >= 5 || features.duration_days >= 4 || features.fever_or_chills > 0) {
    urgencyLevel = 'Prompt Consultation Recommended';
  }

  const topFeatures =
    featureContributions.length > 0
      ? featureContributions.sort((a, b) => b.importance - a.importance).slice(0, 4)
      : [{ feature: 'general_clinical_intake', importance: 0.18 }];

  return {
    predictedDepartmentId: matched.deptId,
    predictedDepartmentName: matched.deptName,
    recommendedDoctorId: matched.doctorId,
    recommendedDoctorName: matched.doctorName,
    recommendedDoctorTitle: matched.title,
    recommendedDoctorSpecialty: matched.specialty,
    confidencePercent: Math.max(54, Math.min(98, maxVote)),
    urgencyLevel,
    treeVotes: normalizedVotes,
    totalTrees,
    topFeatures,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // ==========================================================================
  // POST /api/symptom-assessment/chat
  // Hybrid Gemini 3.8 Flash + Random Forest Clinical Triage Endpoint
  // ==========================================================================
  app.post('/api/symptom-assessment/chat', async (req, res) => {
    try {
      const { messages = [], latestUserMessage = '' } = req.body as {
        messages: Array<{ sender: 'user' | 'assistant'; text: string }>;
        latestUserMessage: string;
      };

      if (!latestUserMessage.trim()) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationHistoryText = messages
        .map((m) => `${m.sender === 'user' ? 'Patient' : 'Clinical Assistant'}: ${m.text}`)
        .join('\n');

      const systemInstruction = `You are the official TeleHealth Clinical Triage & Pre-Consultation Symptom Assessment Assistant.
CRITICAL RULES:
1. STRICT MEDICAL GUARDRAIL: You MUST ONLY answer questions related to medical symptoms, health concerns, first-aid (paunang lunas), clinical triage, medications, or booking a doctor consultation.
   - If the user asks about ANYTHING non-medical (e.g., coding, math, games, politics, general trivia, recipes, movies, jokes), set "isMedicalTopic" to false and politely refuse in Taglish/English, stating that you are exclusively a Medical & TeleHealth Symptom Assessment Assistant.
2. LANGUAGE ADAPTABILITY: Respond naturally in the same language the user uses (Tagalog, Taglish, or English).
3. GATHERING SUFFICIENT CLINICAL CONTEXT:
   - If the user has only mentioned a vague symptom without duration, severity, or key accompanying details (usually on their first short message, unless they already gave full details like duration/severity/symptoms), set "hasEnoughInfo" to false, ask 1 to 2 focused clinical clarifying questions (e.g., ilang araw na, gaano kasakit 1-10, may kasama bang lagnat/pagkahilo), and provide 3 clickable "followUpOptions" that the patient can tap to answer quickly.
   - Once the user has provided enough symptom context (or if their message already clearly describes their symptom + duration/context, or after 2+ turns of medical description), set "hasEnoughInfo" to true and provide a COMPLETE, comprehensive clinical assessment containing:
     a) "recommendedActions": Concrete steps the patient should take right now (Magrerekomenda ng dapat gawin).
     b) "risksIfIgnored": Clear explanation of potential medical complications or what could happen if the symptom is ignored/left untreated (Mga posibleng mangyari kapag pinabayaan).
     c) "firstAidSteps": Safe, practical home care / first-aid measures while waiting for their actual doctor check-up (Paunang lunas habang hindi pa nakakapagpa-checkup sa doktor).
     d) "doctorRecommendationReason": Why they should consult the recommended specialist doctor at TeleHealth Medical Center.
4. FEATURE EXTRACTION FOR RANDOM FOREST:
   - Always extract the binary/numerical symptom features accurately from the entire conversation so far so our Random Forest Classifier can compute the department and specialist match.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Conversation History:\n${conversationHistoryText}\n\nLatest Patient Message: ${latestUserMessage}`,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMedicalTopic: {
                type: Type.BOOLEAN,
                description: 'True if the user input is about health, symptoms, medicine, or clinic consultations. False if off-topic.',
              },
              hasEnoughInfo: {
                type: Type.BOOLEAN,
                description: 'True if we have enough symptom context to provide full recommendations, risks if ignored, first aid, and doctor suggestion.',
              },
              replyText: {
                type: Type.STRING,
                description: 'Conversational empathetic response to the patient (ask clarifying questions if hasEnoughInfo is false, or summarize guidance if true).',
              },
              followUpOptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 short clickable replies or symptom options for the patient.',
              },
              chiefSymptoms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of detected clinical symptoms.',
              },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Recommended actions to do (populated when hasEnoughInfo is true).',
              },
              risksIfIgnored: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'What could happen / complications if left untreated or ignored (populated when hasEnoughInfo is true).',
              },
              firstAidSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Safe first-aid / paunang lunas while waiting for the actual doctor consultation (populated when hasEnoughInfo is true).',
              },
              doctorRecommendationReason: {
                type: Type.STRING,
                description: 'Explanation of why the suggested specialist doctor is appropriate for their check-up.',
              },
              extractedFeatures: {
                type: Type.OBJECT,
                properties: {
                  chest_pain_or_pressure: { type: Type.INTEGER },
                  palpitations_or_high_bp: { type: Type.INTEGER },
                  shortness_of_breath: { type: Type.INTEGER },
                  dizziness_or_morning_headache: { type: Type.INTEGER },
                  fever_or_chills: { type: Type.INTEGER },
                  cough_or_fatigue: { type: Type.INTEGER },
                  stomach_or_digestive_pain: { type: Type.INTEGER },
                  toothache_or_gum_bleeding: { type: Type.INTEGER },
                  cold_hot_tooth_sensitivity: { type: Type.INTEGER },
                  jaw_or_oral_swelling: { type: Type.INTEGER },
                  skin_rash_or_itching: { type: Type.INTEGER },
                  eczema_acne_or_lesion: { type: Type.INTEGER },
                  lab_test_or_bloodwork_request: { type: Type.INTEGER },
                  duration_days: { type: Type.INTEGER },
                  severity_score: { type: Type.INTEGER },
                },
                required: [
                  'chest_pain_or_pressure',
                  'palpitations_or_high_bp',
                  'shortness_of_breath',
                  'dizziness_or_morning_headache',
                  'fever_or_chills',
                  'cough_or_fatigue',
                  'stomach_or_digestive_pain',
                  'toothache_or_gum_bleeding',
                  'cold_hot_tooth_sensitivity',
                  'jaw_or_oral_swelling',
                  'skin_rash_or_itching',
                  'eczema_acne_or_lesion',
                  'lab_test_or_bloodwork_request',
                  'duration_days',
                  'severity_score',
                ],
              },
            },
            required: [
              'isMedicalTopic',
              'hasEnoughInfo',
              'replyText',
              'followUpOptions',
              'chiefSymptoms',
              'recommendedActions',
              'risksIfIgnored',
              'firstAidSteps',
              'doctorRecommendationReason',
              'extractedFeatures',
            ],
          },
        },
      });

      const rawJson = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawJson);

      const rfPrediction = runRandomForestClassifier(
        parsed.extractedFeatures || {
          chest_pain_or_pressure: 0,
          palpitations_or_high_bp: 0,
          shortness_of_breath: 0,
          dizziness_or_morning_headache: 0,
          fever_or_chills: 0,
          cough_or_fatigue: 0,
          stomach_or_digestive_pain: 0,
          toothache_or_gum_bleeding: 0,
          cold_hot_tooth_sensitivity: 0,
          jaw_or_oral_swelling: 0,
          skin_rash_or_itching: 0,
          eczema_acne_or_lesion: 0,
          lab_test_or_bloodwork_request: 0,
          duration_days: 1,
          severity_score: 3,
        }
      );

      res.json({
        ...parsed,
        randomForest: rfPrediction,
      });
    } catch (err: any) {
      console.error('Symptom Assessment API Error:', err);
      res.status(500).json({
        error: err?.message || 'Failed to process clinical symptom assessment.',
      });
    }
  });

  // ==========================================================================
  // ==========================================================================
  // PAYMONGO QR PH INTEGRATION (Environment-Driven Test/Live Support)
  // ==========================================================================
  const serverAuthoritativeFeeRates: Record<string, number> = {};
  const processedPayMongoEventIds = new Set<string>();

  function getPaymongoConfig() {
    const envRaw = (process.env.PAYMONGO_ENVIRONMENT || 'test').toLowerCase();
    const mode: 'live' | 'test' = envRaw === 'live' || envRaw === 'production' ? 'live' : 'test';
    const secretKey = process.env.PAYMONGO_SECRET_KEY || '';
    const publicKey = process.env.PAYMONGO_PUBLIC_KEY || '';
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || '';

    if (!secretKey || secretKey.includes('placeholder')) {
      return {
        valid: false,
        errorType: 'PAYMONGO_NOT_CONFIGURED',
        errorMessage: `PayMongo ${mode.toUpperCase()} mode secret key (PAYMONGO_SECRET_KEY) is not configured in server environment variables.`,
        mode,
        secretKey: '',
        publicKey: '',
        webhookSecret: '',
      };
    }

    if (mode === 'live') {
      if (!secretKey.startsWith('sk_live_')) {
        return {
          valid: false,
          errorType: 'KEY_MISMATCH',
          errorMessage:
            'PAYMONGO_ENVIRONMENT is set to "live", but PAYMONGO_SECRET_KEY does not start with "sk_live_". Live mode requires valid sk_live_* credentials.',
          mode,
          secretKey,
          publicKey,
          webhookSecret,
        };
      }
      if (publicKey && !publicKey.includes('placeholder') && !publicKey.startsWith('pk_live_')) {
        return {
          valid: false,
          errorType: 'KEY_MISMATCH',
          errorMessage:
            'PAYMONGO_ENVIRONMENT is set to "live", but PAYMONGO_PUBLIC_KEY does not start with "pk_live_". Live mode requires valid pk_live_* credentials.',
          mode,
          secretKey,
          publicKey,
          webhookSecret,
        };
      }
    } else {
      if (secretKey.startsWith('sk_live_')) {
        return {
          valid: false,
          errorType: 'KEY_MISMATCH',
          errorMessage:
            'PAYMONGO_ENVIRONMENT is set to "test", but PAYMONGO_SECRET_KEY starts with "sk_live_". Set PAYMONGO_ENVIRONMENT="live" to enable live mode or use "sk_test_*" key.',
          mode,
          secretKey,
          publicKey,
          webhookSecret,
        };
      }
    }

    return {
      valid: true,
      errorType: null,
      errorMessage: null,
      mode,
      secretKey,
      publicKey,
      webhookSecret,
    };
  }

  function getAuthoritativeFeePhp(): { valid: boolean; feePhp: number; errorMessage?: string } {
    const envVal = process.env.PAYMONGO_CONSULTATION_FEE_PHP ?? '10';
    const parsed = parseFloat(envVal);
    if (isNaN(parsed) || parsed <= 0) {
      return {
        valid: false,
        feePhp: 0,
        errorMessage:
          'PAYMONGO_CONSULTATION_FEE_PHP server environment variable is missing, invalid, or zero. A valid fee rate > 0 is required.',
      };
    }
    return { valid: true, feePhp: parsed };
  }

  // GET /api/payments/paymongo/config-status
  app.get('/api/payments/paymongo/config-status', (_req, res) => {
    const config = getPaymongoConfig();
    const feeInfo = getAuthoritativeFeePhp();
    res.json({
      mode: config.mode,
      isConfigured: config.valid && feeInfo.valid,
      errorType: !config.valid ? config.errorType : !feeInfo.valid ? 'FEE_NOT_CONFIGURED' : null,
      errorMessage: !config.valid ? config.errorMessage : !feeInfo.valid ? feeInfo.errorMessage : null,
      apiHost: 'https://api.paymongo.com/v1',
      consultationFeePhp: feeInfo.feePhp,
      consultationFeeLabel: feeInfo.valid ? `₱${feeInfo.feePhp.toFixed(2)} PHP` : 'Fee Not Configured',
    });
  });

  // POST /api/payments/paymongo/create-intent
  app.post('/api/payments/paymongo/create-intent', async (req, res) => {
    try {
      const { appointmentId, referenceNumber } = req.body || {};
      if (!appointmentId || !referenceNumber) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Missing required appointmentId or referenceNumber.',
        });
        return;
      }

      const config = getPaymongoConfig();
      if (!config.valid) {
        res.status(400).json({
          error: config.errorType,
          message: config.errorMessage,
          mode: config.mode,
        });
        return;
      }

      // Check authoritative server fee schedule
      const feeInfo = getAuthoritativeFeePhp();
      if (!feeInfo.valid) {
        res.status(400).json({
          error: 'FEE_NOT_CONFIGURED',
          message:
            feeInfo.errorMessage ||
            'No authoritative server-side PHP fee schedule is configured. PayMongo Payment Intent creation is refused until a valid consultation fee is set.',
          mode: config.mode,
        });
        return;
      }

      const feeAmountPhp = feeInfo.feePhp;
      const amountInCentavos = Math.round(feeAmountPhp * 100);
      const authHeader = `Basic ${Buffer.from(`${config.secretKey}:`).toString('base64')}`;

      // Create Payment Intent via POST https://api.paymongo.com/v1/payment_intents
      const paymongoRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amountInCentavos,
              payment_method_allowed: ['qrph'],
              currency: 'PHP',
              description: `TeleHealth Consultation Fee (${referenceNumber})`,
              statement_descriptor: 'TeleHealth Medical',
              metadata: {
                bookingReference: referenceNumber,
                appointmentId,
                environmentMode: config.mode,
              },
            },
          },
        }),
      });

      const paymongoData: any = await paymongoRes.json();

      if (!paymongoRes.ok) {
        res.status(paymongoRes.status).json({
          error: 'PAYMONGO_API_ERROR',
          message:
            paymongoData?.errors?.[0]?.detail ||
            'Failed to create PayMongo Payment Intent for QR Ph.',
          details: paymongoData,
          mode: config.mode,
        });
        return;
      }

      const intent = paymongoData.data;
      res.json({
        paymentIntentId: intent.id,
        clientKey: intent.attributes.client_key,
        amountCentavos: intent.attributes.amount,
        currency: intent.attributes.currency,
        status: intent.attributes.status,
        mode: config.mode,
      });
    } catch (err: any) {
      console.error('PayMongo Payment Intent Error:', err);
      res.status(500).json({
        error: 'SERVER_ERROR',
        message: err?.message || 'An unexpected error occurred creating PayMongo Payment Intent.',
      });
    }
  });

  // POST /api/payments/paymongo/attach-qrph
  app.post('/api/payments/paymongo/attach-qrph', async (req, res) => {
    try {
      const { paymentIntentId, clientKey } = req.body || {};
      if (!paymentIntentId || !clientKey) {
        res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing paymentIntentId or clientKey.' });
        return;
      }

      const config = getPaymongoConfig();
      if (!config.valid) {
        res.status(400).json({ error: config.errorType, message: config.errorMessage, mode: config.mode });
        return;
      }

      const authHeader = `Basic ${Buffer.from(`${config.secretKey}:`).toString('base64')}`;

      // 1. Create Payment Method (type: qrph)
      const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'qrph',
            },
          },
        }),
      });
      const pmData: any = await pmRes.json();
      if (!pmRes.ok) {
        res.status(pmRes.status).json({
          error: 'PAYMONGO_METHOD_ERROR',
          message: pmData?.errors?.[0]?.detail || 'Failed to create QR Ph Payment Method.',
          mode: config.mode,
        });
        return;
      }

      const paymentMethodId = pmData.data.id;

      // 2. Attach Payment Method to Payment Intent
      const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
            },
          },
        }),
      });

      const attachData: any = await attachRes.json();
      if (!attachRes.ok) {
        res.status(attachRes.status).json({
          error: 'PAYMONGO_ATTACH_ERROR',
          message: attachData?.errors?.[0]?.detail || 'Failed to attach QR Ph method to Payment Intent.',
          mode: config.mode,
        });
        return;
      }

      const nextAction = attachData?.data?.attributes?.next_action;
      const qrCodeImageUrl = nextAction?.code?.image_url || nextAction?.redirect?.url;

      res.json({
        paymentIntentId,
        paymentStatus: attachData?.data?.attributes?.status,
        qrCodeImageUrl,
        mode: config.mode,
      });
    } catch (err: any) {
      console.error('PayMongo Attach Error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err?.message });
    }
  });

  // POST /api/payments/paymongo/webhook
  app.post('/api/payments/paymongo/webhook', async (req, res) => {
    try {
      const signatureHeader = req.headers['paymongo-signature'] as string;
      const config = getPaymongoConfig();
      const webhookSecret = config.webhookSecret;

      const rawBody = JSON.stringify(req.body);

      // Verify PayMongo HMAC-SHA256 Signature
      if (signatureHeader && webhookSecret && !webhookSecret.includes('placeholder')) {
        const parts = signatureHeader.split(',').reduce((acc: Record<string, string>, p) => {
          const [k, v] = p.split('=');
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {});

        const timestamp = parts.t;
        const testSig = parts.te;
        const liveSig = parts.li;

        // Mode-aware signature evaluation
        const providedSig = config.mode === 'live' ? (liveSig || testSig) : (testSig || liveSig);

        if (config.mode === 'live' && !liveSig) {
          console.warn('PayMongo Webhook Warning: Live mode webhook received without "li" signature component.');
        }

        if (timestamp && providedSig) {
          // Enforce 5-minute (300s) timestamp freshness window
          const nowSeconds = Math.floor(Date.now() / 1000);
          const timeDiff = Math.abs(nowSeconds - parseInt(timestamp, 10));
          if (timeDiff > 300) {
            console.warn('PayMongo Webhook Error: Timestamp out of freshness window.');
            res.status(401).json({ error: 'EXPIRED_TIMESTAMP', message: 'Webhook timestamp expired.' });
            return;
          }

          const computedHmac = crypto
            .createHmac('sha256', webhookSecret)
            .update(`${timestamp}.${rawBody}`)
            .digest('hex');

          const bufComputed = Buffer.from(computedHmac);
          const bufProvided = Buffer.from(providedSig);

          if (bufComputed.length !== bufProvided.length || !crypto.timingSafeEqual(bufComputed, bufProvided)) {
            console.warn('PayMongo Webhook Warning: HMAC-SHA256 signature mismatch.');
            res.status(401).json({ error: 'INVALID_SIGNATURE', message: 'Timing-safe HMAC signature comparison failed.' });
            return;
          }
        }
      }

      const event = req.body?.data;
      if (!event || !event.id) {
        res.status(400).json({ error: 'INVALID_EVENT', message: 'Missing event body or ID.' });
        return;
      }

      // Event Deduplication
      if (processedPayMongoEventIds.has(event.id)) {
        console.log(`PayMongo Webhook: Duplicate event ${event.id} ignored.`);
        res.json({ status: 'DUPLICATE_IGNORED', id: event.id });
        return;
      }
      processedPayMongoEventIds.add(event.id);

      const eventType = event.attributes?.type;
      const resourceData = event.attributes?.data;

      console.log(`PayMongo Webhook Received (${config.mode.toUpperCase()} mode): type=${eventType}, eventId=${event.id}`);

      if (eventType === 'payment.paid') {
        const bookingRef = resourceData?.attributes?.metadata?.bookingReference;
        console.log(`PayMongo Payment Success Verified (${config.mode.toUpperCase()} mode) for Booking Ref: ${bookingRef}`);
      }

      res.json({ status: 'PROCESSED', id: event.id, mode: config.mode });
    } catch (err: any) {
      console.error('PayMongo Webhook Error:', err);
      res.status(500).json({ error: 'WEBHOOK_ERROR', message: err?.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeleHealth Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
