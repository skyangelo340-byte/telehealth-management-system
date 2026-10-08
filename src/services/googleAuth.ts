import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const loginProvider = new GoogleAuthProvider();
loginProvider.setCustomParameters({ prompt: 'select_account' });

export const OFFICIAL_OTP_SENDER_EMAIL = 'telehealthotp@gmail.com';

const gmailOtpProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => gmailOtpProvider.addScope(scope));
gmailOtpProvider.setCustomParameters({
  prompt: 'select_account consent',
  login_hint: OFFICIAL_OTP_SENDER_EMAIL,
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedAdminOtpToken: string | null = null;
let cachedAdminOtpEmail: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || '');
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (
  requireGmailScope = false
): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const activeProvider = requireGmailScope ? gmailOtpProvider : loginProvider;
    const result = await signInWithPopup(auth, activeProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    if (requireGmailScope && !token) {
      throw new Error('Failed to obtain Gmail OAuth access token.');
    }

    if (token) {
      cachedAccessToken = token;
      const signedEmail = (result.user.email || '').trim().toLowerCase();
      if (signedEmail === OFFICIAL_OTP_SENDER_EMAIL) {
        cachedAdminOtpToken = token;
        cachedAdminOtpEmail = signedEmail;
        try {
          await setDoc(doc(db, 'settings', 'otpSender'), {
            email: OFFICIAL_OTP_SENDER_EMAIL,
            accessToken: token,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore if offline
        }
      }
    }
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    console.warn('Google Sign-In warning:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function connectOfficialOtpSender(): Promise<{
  connected: boolean;
  email: string;
}> {
  const authResult = await googleSignIn(true);
  if (!authResult) {
    throw new Error('Google authentication was cancelled.');
  }
  const chosenEmail = (authResult.user.email || '').trim().toLowerCase();
  if (chosenEmail !== OFFICIAL_OTP_SENDER_EMAIL) {
    throw new Error(
      `Expected ${OFFICIAL_OTP_SENDER_EMAIL}, but selected ${chosenEmail}.`
    );
  }
  cachedAdminOtpToken = authResult.accessToken;
  cachedAdminOtpEmail = chosenEmail;
  await setDoc(doc(db, 'settings', 'otpSender'), {
    email: OFFICIAL_OTP_SENDER_EMAIL,
    accessToken: authResult.accessToken,
    updatedAt: new Date().toISOString(),
  });
  return { connected: true, email: chosenEmail };
}

export async function getOfficialOtpSenderStatus(): Promise<{
  connected: boolean;
  email: string;
  updatedAt?: string;
}> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'otpSender'));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.accessToken && data?.email === OFFICIAL_OTP_SENDER_EMAIL) {
        cachedAdminOtpToken = data.accessToken;
        cachedAdminOtpEmail = data.email;
        return {
          connected: true,
          email: data.email,
          updatedAt: data.updatedAt,
        };
      }
    }
  } catch {
    // ignore read error
  }
  return {
    connected: Boolean(cachedAdminOtpToken),
    email: OFFICIAL_OTP_SENDER_EMAIL,
  };
}

export async function sendOtpEmailViaGmail(
  recipientEmail: string,
  otpCode: string
): Promise<{
  success: boolean;
  sentTo: string;
  sentFrom: string;
  dispatchedViaGmailApi?: boolean;
}> {
  const targetEmail = recipientEmail.trim();
  if (!targetEmail) {
    throw new Error('No recipient email address specified.');
  }

  const officialSenderEmail = OFFICIAL_OTP_SENDER_EMAIL;

  // Always record the latest OTP dispatch in Firestore settings/lastOtpDispatch
  try {
    await setDoc(doc(db, 'settings', `otp_${targetEmail.toLowerCase()}`), {
      recipientEmail: targetEmail,
      senderEmail: officialSenderEmail,
      otpCode,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // ignore firestore error
  }

  // 1. Check in-memory or Firestore stored token from telehealthotp@gmail.com
  let token =
    cachedAdminOtpEmail?.toLowerCase() === OFFICIAL_OTP_SENDER_EMAIL
      ? cachedAdminOtpToken
      : null;

  if (!token) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'otpSender'));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.accessToken) {
          token = data.accessToken;
          cachedAdminOtpToken = data.accessToken;
          cachedAdminOtpEmail = OFFICIAL_OTP_SENDER_EMAIL;
        }
      }
    } catch {
      // ignore firestore error
    }
  }

  // If telehealthotp@gmail.com is not yet connected in Firestore, prompt 1-time authorization for telehealthotp@gmail.com
  if (!token) {
    const authResult = await googleSignIn(true);
    if (!authResult) {
      throw new Error(
        `Hindi pa naka-connect ang ${officialSenderEmail} sender. Paki-authorize nang 1 beses ang ${officialSenderEmail} sa Google popup (o sa Admin -> System Settings) para makapag-send ng totoong email sa ${targetEmail}.`
      );
    }
    const chosenEmail = (authResult.user.email || '').trim().toLowerCase();
    if (chosenEmail !== officialSenderEmail) {
      throw new Error(
        `Ang napili sa popup ay ${chosenEmail}. Pakipili ang ${officialSenderEmail} nang 1 beses para ma-save ang sender token nito at kusa nang makapagpadala ng OTP kay ${targetEmail}.`
      );
    }
    token = authResult.accessToken;
    cachedAdminOtpToken = token;
    cachedAdminOtpEmail = chosenEmail;
    try {
      await setDoc(doc(db, 'settings', 'otpSender'), {
        email: officialSenderEmail,
        accessToken: token,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  }

  const subject = `TeleHealth Password Reset OTP: ${otpCode}`;
  const htmlBody = [
    `<div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; color: #172B4D;">`,
    `<h2 style="margin: 0 0 4px 0; color: #3478F6;">TeleHealth Clinical Portal</h2>`,
    `<p style="font-size: 12px; color: #64748B; margin: 0 0 16px 0;">Official OTP Dispatch from: <strong>${officialSenderEmail}</strong></p>`,
    `<p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">You requested a password reset for your TeleHealth account (<strong>${targetEmail}</strong>).</p>`,
    `<div style="background: #ffffff; border: 2px solid #3478F6; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px;">`,
    `<div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;">Your 6-Digit Verification OTP</div>`,
    `<div style="font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #172B4D; margin-top: 6px; font-family: monospace;">${otpCode}</div>`,
    `</div>`,
    `<p style="font-size: 12px; color: #64748B; margin: 0;">Enter this 6-digit code on the TeleHealth Reset Password screen to set your new password. If you did not request this code, please contact ${officialSenderEmail}.</p>`,
    `</div>`,
  ].join('');

  const mimeMessage = [
    `From: "TeleHealth OTP System" <${officialSenderEmail}>`,
    `Reply-To: ${officialSenderEmail}`,
    `To: ${targetEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
  ].join('\r\n');

  const raw = encodeBase64Url(mimeMessage);

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        cachedAdminOtpToken = null;
        cachedAdminOtpEmail = null;
        const retryAuth = await googleSignIn(true);
        if (!retryAuth) {
          throw new Error(
            `Nag-expire na ang Gmail token ng ${officialSenderEmail}. Paki-authorize ulit ang ${officialSenderEmail} para maipadala ang OTP sa ${targetEmail}.`
          );
        }
        const chosenRetryEmail = (retryAuth.user.email || '').trim().toLowerCase();
        if (chosenRetryEmail !== officialSenderEmail) {
          throw new Error(
            `Pakipili ang ${officialSenderEmail} (hindi ${chosenRetryEmail}) para siya ang magpadala ng OTP sa ${targetEmail}.`
          );
        }
        cachedAdminOtpToken = retryAuth.accessToken;
        cachedAdminOtpEmail = chosenRetryEmail;
        try {
          await setDoc(doc(db, 'settings', 'otpSender'), {
            email: officialSenderEmail,
            accessToken: retryAuth.accessToken,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }

        const retryRes = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${retryAuth.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
          }
        );
        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || 'Failed to send OTP email via Gmail API.'
          );
        }
        return {
          success: true,
          sentTo: targetEmail,
          sentFrom: officialSenderEmail,
          dispatchedViaGmailApi: true,
        };
      }

      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData?.error?.message || 'Failed to send OTP email via Gmail API.'
      );
    }

    return {
      success: true,
      sentTo: targetEmail,
      sentFrom: officialSenderEmail,
      dispatchedViaGmailApi: true,
    };
  } catch (err: any) {
    throw new Error(
      err?.message || 'Failed to send OTP email via Gmail API.'
    );
  }
}
