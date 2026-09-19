import { WalletRepository } from '../repositories/walletRepository';
import { IWallet, IWalletTransaction } from '../types';

export class WalletService {
  static async getOrCreateWallet(userId: string): Promise<IWallet> {
    let wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await WalletRepository.createWallet(userId);
    }
    return wallet;
  }

  static async getBalance(userId: string): Promise<IWallet> {
    return await this.getOrCreateWallet(userId);
  }

  static async creditWallet(userId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    return await WalletRepository.creditBalance(wallet.id, amount, description, bookingId);
  }

  static async debitWallet(userId: string, amount: number, description: string, bookingId?: string): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.available_balance < amount) {
      throw new Error('Insufficient available balance');
    }
    return await WalletRepository.debitBalance(wallet.id, amount, description, bookingId);
  }

  static async holdEscrow(userId: string, amount: number, description: string, bookingId: string): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.available_balance < amount) {
      throw new Error('Insufficient available balance for escrow hold');
    }
    return await WalletRepository.lockBalance(wallet.id, amount, description, bookingId);
  }

  static async releaseEscrow(userId: string, amount: number, description: string, bookingId: string): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.locked_balance < amount) {
      throw new Error('Insufficient locked balance to release');
    }
    return await WalletRepository.releaseLockedBalance(wallet.id, amount, description, bookingId);
  }

  static async withdrawFunds(userId: string, amount: number): Promise<IWallet> {
    if (amount < 100) {
      throw new Error('Minimum withdrawal amount is 100');
    }
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.available_balance < amount) {
      throw new Error('Insufficient available balance for withdrawal');
    }
    return await WalletRepository.withdraw(wallet.id, amount);
  }

  static async getTransactionHistory(userId: string, limit?: number): Promise<IWalletTransaction[]> {
    const wallet = await this.getOrCreateWallet(userId);
    return await WalletRepository.getTransactions(wallet.id, limit);
  }
}
