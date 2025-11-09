/**
 * Push Notifications using Firebase Cloud Messaging
 */

import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) {
  const { token, title, body, data, imageUrl } = params;

  try {
    const message = {
      notification: { title, body, imageUrl },
      data,
      token,
    };

    const response = await getMessaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("Push notification error:", error);
    return { success: false, error };
  }
}

export async function sendMulticastNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const { tokens, title, body, data } = params;

  const message = {
    notification: { title, body },
    data,
    tokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);
  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}
