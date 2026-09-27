import { query } from '../config/db';
import { IEscrowLedger, LedgerEntryType } from '../types/index';
import crypto from 'crypto';

const memoryLedger: IEscrowLedger[] = [];

export class EscrowLedgerRepository {
  static async addEntry(entry: {
    booking_id: string;
    milestone_id?: string;
    entry_type: LedgerEntryType;
    amount: number;
    debit_account: string;
    credit_account: string;
    gateway_reference_id?: string;
    idempotency_key: string;
  }): Promise<IEscrowLedger> {
    try {
      const res = await query(
        `INSERT INTO escrow_ledger (
          booking_id, milestone_id, entry_type, amount, debit_account, credit_account, gateway_reference_id, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          entry.booking_id,
          entry.milestone_id || null,
          entry.entry_type,
          entry.amount,
          entry.debit_account,
          entry.credit_account,
          entry.gateway_reference_id || null,
          entry.idempotency_key,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryLedger.push(res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Fallback
    }

    const item: IEscrowLedger = {
      id: crypto.randomUUID(),
      booking_id: entry.booking_id,
      milestone_id: entry.milestone_id,
      entry_type: entry.entry_type,
      amount: entry.amount,
      debit_account: entry.debit_account,
      credit_account: entry.credit_account,
      gateway_reference_id: entry.gateway_reference_id,
      idempotency_key: entry.idempotency_key,
      created_at: new Date(),
    };
    memoryLedger.push(item);
    return item;
  }
}
