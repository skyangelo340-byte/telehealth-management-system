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

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In error:', error);
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

export async function sendOtpEmailViaGmail(
  recipientEmail: string,
  otpCode: string
): Promise<{ success: boolean; sentTo: string }> {
  let token = await getAccessToken();
  let signedInUser = auth.currentUser;

  if (!token) {
    const authResult = await googleSignIn();
    if (!authResult) {
      throw new Error('Google authentication was cancelled.');
    }
    token = authResult.accessToken;
    signedInUser = authResult.user;
  }

  const targetEmail = recipientEmail.trim() || signedInUser?.email || '';
  if (!targetEmail) {
    throw new Error('No recipient email address specified.');
  }

  const subject = `TeleHealth Password Reset OTP: ${otpCode}`;
  const htmlBody = [
    `<div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; color: #172B4D;">`,
    `<h2 style="margin: 0 0 8px 0; color: #3478F6;">TeleHealth Clinical Portal</h2>`,
    `<p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">You requested a password reset for your TeleHealth account (<strong>${targetEmail}</strong>).</p>`,
    `<div style="background: #ffffff; border: 2px solid #3478F6; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px;">`,
    `<div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em;">Your 6-Digit Verification OTP</div>`,
    `<div style="font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #172B4D; margin-top: 6px; font-family: monospace;">${otpCode}</div>`,
    `</div>`,
    `<p style="font-size: 12px; color: #64748B; margin: 0;">Enter this 6-digit code on the TeleHealth Reset Password screen to set your new password. If you did not request this code, please ignore this email.</p>`,
    `</div>`,
  ].join('');

  const mimeMessage = [
    `To: ${targetEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
  ].join('\r\n');

  const raw = encodeBase64Url(mimeMessage);

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
      // Token expired or missing scope; re-prompt once
      cachedAccessToken = null;
      const retryAuth = await googleSignIn();
      if (!retryAuth) {
        throw new Error('Google re-authentication failed.');
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
      return { success: true, sentTo: targetEmail };
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || 'Failed to send OTP email via Gmail API.'
    );
  }

  return { success: true, sentTo: targetEmail };
}
