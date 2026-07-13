import Notification from "../models/Notification.js";

interface CreateNotificationInput {
  message: string;
  toEmail: string;
  actionRoute?: string;
}

/**
 * Creates a notification document in the database.
 * Fires-and-forgets (does not throw) so it never blocks the main flow.
 */
export const createNotification = async ({
  message,
  toEmail,
  actionRoute = "/",
}: CreateNotificationInput): Promise<void> => {
  try {
    await Notification.create({ message, toEmail, actionRoute });
  } catch (error) {
    console.error("Failed to create notification:", (error as Error).message);
  }
};