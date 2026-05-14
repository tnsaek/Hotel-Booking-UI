export interface AppNotification {
  id: number;
  type: string;
  message?: string;
  body?: string;
  read: boolean;
  createdAt: string;
}
