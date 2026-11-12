export const PUSH_NOTIFICATION_SERVICE = Symbol('PUSH_NOTIFICATION_SERVICE');
export type PushMessage = { title: string; body: string; data: { type: string; postId: string; notificationId: string; deepLink: string } };
export interface PushNotificationService { send(tokens: string[], message: PushMessage): Promise<{ invalidTokens: string[] }>; }
