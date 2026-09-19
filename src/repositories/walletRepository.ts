import { query } from '../config/db';
import { IWallet, IWalletTransaction, WalletTransactionType, WalletTransactionStatus } from '../types';

export class WalletRepository {
  static async createWallet(userId: string): Promise<IWallet> {
    const sql = `
      INSERT INTO wallets (user_id)
      VALUES ($1)
      RETURNING *
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  static async findByUserId(userId: string): Promise<IWallet | null> {
    const sql = `SELECT * FROM wallets WHERE user_id = $1`;
    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  static async creditBalance(walletId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const updateSql = `
      UPDATE wallets
      SET available_balance = available_balance + $2,
          total_earned = total_earned + $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await query(updateSql, [walletId, amount]);
    const wallet = updateResult.rows[0];

    const transSql = `
      INSERT INTO wallet_transactions (wallet_id, booking_id, transaction_type, amount, balance_after, description, reference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(transSql, [
      walletId, 
      bookingId || null, 
      WalletTransactionType.CREDIT, 
      amount, 
      wallet.available_balance, 
      description, 
      `REF-${Date.now()}`, 
      WalletTransactionStatus.COMPLETED
    ]);

    return wallet;
  }

  static async debitBalance(walletId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const updateSql = `
      UPDATE wallets
      SET available_balance = available_balance - $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await query(updateSql, [walletId, amount]);
    const wallet = updateResult.rows[0];

    const transSql = `
      INSERT INTO wallet_transactions (wallet_id, booking_id, transaction_type, amount, balance_after, description, reference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(transSql, [
      walletId, 
      bookingId || null, 
      WalletTransactionType.DEBIT, 
      amount, 
      wallet.available_balance, 
      description, 
      `REF-${Date.now()}`, 
      WalletTransactionStatus.COMPLETED
    ]);

    return wallet;
  }

  static async lockBalance(walletId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const updateSql = `
      UPDATE wallets
      SET available_balance = available_balance - $2,
          locked_balance = locked_balance + $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await query(updateSql, [walletId, amount]);
    const wallet = updateResult.rows[0];

    const transSql = `
      INSERT INTO wallet_transactions (wallet_id, booking_id, transaction_type, amount, balance_after, description, reference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(transSql, [
      walletId, 
      bookingId || null, 
      WalletTransactionType.ESCROW_HOLD, 
      amount, 
      wallet.available_balance, 
      description, 
      `REF-${Date.now()}`, 
      WalletTransactionStatus.COMPLETED
    ]);

    return wallet;
  }

  static async releaseLockedBalance(walletId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const updateSql = `
      UPDATE wallets
      SET locked_balance = locked_balance - $2,
          available_balance = available_balance + $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await query(updateSql, [walletId, amount]);
    const wallet = updateResult.rows[0];

    const transSql = `
      INSERT INTO wallet_transactions (wallet_id, booking_id, transaction_type, amount, balance_after, description, reference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(transSql, [
      walletId, 
      bookingId || null, 
      WalletTransactionType.ESCROW_RELEASE, 
      amount, 
      wallet.available_balance, 
      description, 
      `REF-${Date.now()}`, 
      WalletTransactionStatus.COMPLETED
    ]);

    return wallet;
  }

  static async withdraw(walletId: string, amount: number): Promise<IWallet> {
    const updateSql = `
      UPDATE wallets
      SET available_balance = available_balance - $2,
          total_withdrawn = total_withdrawn + $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await query(updateSql, [walletId, amount]);
    const wallet = updateResult.rows[0];

    const transSql = `
      INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, description, reference_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await query(transSql, [
      walletId, 
      WalletTransactionType.WITHDRAWAL, 
      amount, 
      wallet.available_balance, 
      'Funds Withdrawal', 
      `WD-${Date.now()}`, 
      WalletTransactionStatus.COMPLETED
    ]);

    return wallet;
  }

  static async getTransactions(walletId: string, limit: number = 50): Promise<IWalletTransaction[]> {
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await query(sql, [walletId, limit]);
    return result.rows;
  }

  static async getTransactionsByBooking(bookingId: string): Promise<IWalletTransaction[]> {
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [bookingId]);
    return result.rows;
  }
}
