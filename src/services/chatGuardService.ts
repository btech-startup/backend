import { sanitizeChatMessage, ChatSanitizeResult } from '../utils/chatGuard';
import { query } from '../config/db';

export class ChatGuardService {
  static async processMessage(
    senderId: string,
    receiverId: string,
    message: string
  ): Promise<ChatSanitizeResult> {
    const result = sanitizeChatMessage(message);

    if (result.isViolation) {
      await query(
        `INSERT INTO chat_audit_logs (sender_id, receiver_id, original_message, violation_type, sanitized_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [senderId, receiverId, textTruncate(message, 500), result.violationType, result.sanitizedMessage]
      );
    }

    return result;
  }
}

function textTruncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}
