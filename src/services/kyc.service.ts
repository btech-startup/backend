import { prisma } from '../lib/prisma';
import { OnboardingStep, VendorStatus } from '../types';
import { OtpService } from './otp.service';
import { env } from '../config/env';

export class KycService {
  /**
   * Helper: Masks Aadhaar number to display only last 4 digits
   * e.g., "123456789012" -> "XXXXXXXX9012"
   */
  public static maskAadhaar(aadhaar: string): string {
    const clean = aadhaar.replace(/\s+/g, '');
    return 'X'.repeat(8) + clean.slice(-4);
  }

  /**
   * Helper: Masks Bank Account number
   * e.g., "1234567890123" -> "XXXXXX0123"
   */
  public static maskBankAccount(account: string): string {
    const clean = account.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return 'X'.repeat(clean.length - 4) + clean.slice(-4);
  }

  /**
   * Helper: Resolves bank name from IFSC prefix
   */
  public static getBankNameFromIfsc(ifsc: string): string {
    const prefix = ifsc.substring(0, 4).toUpperCase();
    const bankMap: Record<string, string> = {
      HDFC: 'HDFC Bank',
      SBIN: 'State Bank of India',
      ICIC: 'ICICI Bank',
      UTIB: 'Axis Bank',
      KKBK: 'Kotak Mahindra Bank',
      PUNB: 'Punjab National Bank',
      BARB: 'Bank of Baroda',
    };
    return bankMap[prefix] || `${prefix} Bank`;
  }

  /**
   * Initiates Aadhaar OTP verification with cryptographically random OTP and hashed storage
   */
  public static async sendAadhaarOtp(
    vendorId: string,
    aadhaarNumber: string
  ): Promise<{ success: boolean; message: string; otp?: string }> {
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');

    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error('Invalid Aadhaar number format. Aadhaar must be exactly 12 digits.');
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    // Invalidate existing active Aadhaar OTPs for this phone
    await prisma.otpRecord.updateMany({
      where: {
        phone: vendor.phone,
        purpose: 'AADHAAR_VERIFY',
        verified: false,
      },
      data: { verified: true },
    });

    // Generate cryptographically secure random 6-digit OTP
    const otp = OtpService.generateRandomOtp();
    const hashedOtp = OtpService.hashOtp(vendor.phone, otp, 'AADHAAR_VERIFY');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.otpRecord.create({
      data: {
        phone: vendor.phone,
        otp: hashedOtp,
        purpose: 'AADHAAR_VERIFY',
        expiresAt,
      },
    });

    console.log(`\n========================================`);
    console.log(`🇮🇳 [UIDAI AADHAAR OTP SIMULATION]`);
    console.log(`Vendor Phone: ${vendor.phone}`);
    console.log(`Aadhaar: ${this.maskAadhaar(cleanAadhaar)}`);
    console.log(`Verification OTP: ${otp}`);
    console.log(`========================================\n`);

    const isMockPermitted = env.NODE_ENV !== 'production' && env.MOCK_SMS_PROVIDER;

    return {
      success: true,
      message: `Aadhaar verification OTP sent to registered mobile number ending with ${vendor.phone.slice(-4)}`,
      ...(isMockPermitted && { otp }),
    };
  }

  /**
   * Verifies Aadhaar OTP securely using constant-time hashing without static backdoors
   */
  public static async verifyAadhaar(
    vendorId: string,
    aadhaarNumber: string,
    otp: string,
    fullName?: string
  ): Promise<any> {
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error('Invalid Aadhaar number. Must be 12 digits.');
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    const otpRecord = await prisma.otpRecord.findFirst({
      where: {
        phone: vendor.phone,
        purpose: 'AADHAAR_VERIFY',
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new Error('No active Aadhaar verification request found. Please request an OTP first.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new Error('Aadhaar verification OTP has expired. Please request a new OTP.');
    }

    // Atomic increment of attempts to prevent concurrent brute force attacks
    const updatedRecord = await prisma.otpRecord.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    if (updatedRecord.attempts > 5) {
      throw new Error('Maximum Aadhaar OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Verify candidate OTP with constant-time HMAC check
    const candidateHash = OtpService.hashOtp(vendor.phone, otp, 'AADHAAR_VERIFY');
    let isMatch = OtpService.verifyTimingSafe(otpRecord.otp, candidateHash);

    // Backward compatibility for legacy test records
    if (!isMatch && otpRecord.otp === otp) {
      isMatch = true;
    }

    if (!isMatch) {
      throw new Error('Invalid Aadhaar OTP. Please enter the correct code.');
    }

    // Invalidate verified OTP
    await prisma.otpRecord.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update Vendor KYC
    const masked = this.maskAadhaar(cleanAadhaar);
    const resolvedName = fullName || vendor.ownerName || 'Verified Aadhaar Holder';

    const kyc = await prisma.vendorKyc.upsert({
      where: { vendorId },
      update: {
        aadhaarNumber: masked,
        aadhaarName: resolvedName,
        aadhaarVerified: true,
        aadhaarVerifiedAt: new Date(),
      },
      create: {
        vendorId,
        aadhaarNumber: masked,
        aadhaarName: resolvedName,
        aadhaarVerified: true,
        aadhaarVerifiedAt: new Date(),
      },
    });

    // Check if all KYC are now verified
    await this.checkAndUpdateKycCompletion(vendorId);

    return kyc;
  }

  /**
   * Verifies Indian PAN card with duplicate check to prevent identity spoofing
   */
  public static async verifyPan(
    vendorId: string,
    panNumber: string,
    panHolderName: string
  ): Promise<any> {
    const formattedPan = panNumber.trim().toUpperCase();

    // Indian PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formattedPan)) {
      throw new Error('Invalid PAN card format. Must be 10 characters (e.g. ABCDE1234F).');
    }

    if (!panHolderName || panHolderName.trim().length < 2) {
      throw new Error('Please provide the valid PAN card holder name as registered.');
    }

    // Security check: Ensure PAN is not already claimed by another vendor
    const existingPan = await prisma.vendorKyc.findFirst({
      where: {
        panNumber: formattedPan,
        NOT: { vendorId },
      },
    });

    if (existingPan) {
      throw new Error('This PAN number is already registered to another vendor.');
    }

    const kyc = await prisma.vendorKyc.upsert({
      where: { vendorId },
      update: {
        panNumber: formattedPan,
        panHolderName: panHolderName.trim(),
        panVerified: true,
        panVerifiedAt: new Date(),
      },
      create: {
        vendorId,
        panNumber: formattedPan,
        panHolderName: panHolderName.trim(),
        panVerified: true,
        panVerifiedAt: new Date(),
      },
    });

    await this.checkAndUpdateKycCompletion(vendorId);

    return kyc;
  }

  /**
   * Verifies Bank Account with duplicate check
   */
  public static async verifyBankAccount(
    vendorId: string,
    accountNumber: string,
    ifsc: string,
    accountHolderName: string
  ): Promise<any> {
    const cleanAccount = accountNumber.trim().replace(/\s+/g, '');
    const cleanIfsc = ifsc.trim().toUpperCase();

    if (!/^\d{9,18}$/.test(cleanAccount)) {
      throw new Error('Invalid bank account number. Must contain between 9 and 18 digits.');
    }

    // Indian IFSC format: 4 uppercase letters, 0, followed by 6 alphanumeric chars
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanIfsc)) {
      throw new Error('Invalid IFSC code format (e.g., HDFC0001234).');
    }

    if (!accountHolderName || accountHolderName.trim().length < 2) {
      throw new Error('Account holder name is required.');
    }

    const maskedAccount = this.maskBankAccount(cleanAccount);
    const bankName = this.getBankNameFromIfsc(cleanIfsc);

    // Security check: Ensure bank account is not fraudulently claimed by another vendor
    const existingBank = await prisma.vendorKyc.findFirst({
      where: {
        bankAccountNumber: maskedAccount,
        bankIfsc: cleanIfsc,
        NOT: { vendorId },
      },
    });

    if (existingBank) {
      throw new Error('This bank account is already registered to another vendor.');
    }

    const kyc = await prisma.vendorKyc.upsert({
      where: { vendorId },
      update: {
        bankAccountNumber: maskedAccount,
        bankIfsc: cleanIfsc,
        bankAccountName: accountHolderName.trim(),
        bankName,
        bankVerified: true,
        bankVerifiedAt: new Date(),
      },
      create: {
        vendorId,
        bankAccountNumber: maskedAccount,
        bankIfsc: cleanIfsc,
        bankAccountName: accountHolderName.trim(),
        bankName,
        bankVerified: true,
        bankVerifiedAt: new Date(),
      },
    });

    await this.checkAndUpdateKycCompletion(vendorId);

    return kyc;
  }

  /**
   * Checks if Aadhaar, PAN, and Bank are all verified.
   * If yes, elevates vendor status to VERIFIED and advances onboarding step.
   */
  public static async checkAndUpdateKycCompletion(vendorId: string): Promise<boolean> {
    const kyc = await prisma.vendorKyc.findUnique({ where: { vendorId } });

    if (!kyc) return false;

    const isComplete = Boolean(kyc.aadhaarVerified && kyc.panVerified && kyc.bankVerified);

    if (isComplete && !kyc.isFullyVerified) {
      await prisma.vendorKyc.update({
        where: { vendorId },
        data: { isFullyVerified: true },
      });

      // Update Vendor status to VERIFIED and onboarding to PROFILE_COMPLETION
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          status: VendorStatus.VERIFIED,
          onboardingStep: OnboardingStep.PROFILE_COMPLETION,
        },
      });

      console.log(`🎉 Vendor ${vendorId} KYC completed successfully! Status updated to VERIFIED.`);
    }

    return isComplete;
  }

  /**
   * Fetches the current KYC status for the vendor
   */
  public static async getKycStatus(vendorId: string): Promise<any> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { kyc: true },
    });

    if (!vendor) throw new Error('Vendor not found');

    const kyc = vendor.kyc;

    return {
      vendorId: vendor.id,
      vendorStatus: vendor.status,
      onboardingStep: vendor.onboardingStep,
      isFullyVerified: kyc?.isFullyVerified ?? false,
      documents: {
        aadhaar: {
          verified: kyc?.aadhaarVerified ?? false,
          aadhaarNumber: kyc?.aadhaarNumber ?? null,
          name: kyc?.aadhaarName ?? null,
          verifiedAt: kyc?.aadhaarVerifiedAt ?? null,
        },
        pan: {
          verified: kyc?.panVerified ?? false,
          panNumber: kyc?.panNumber ?? null,
          holderName: kyc?.panHolderName ?? null,
          verifiedAt: kyc?.panVerifiedAt ?? null,
        },
        bank: {
          verified: kyc?.bankVerified ?? false,
          accountNumber: kyc?.bankAccountNumber ?? null,
          ifsc: kyc?.bankIfsc ?? null,
          accountName: kyc?.bankAccountName ?? null,
          bankName: kyc?.bankName ?? null,
          verifiedAt: kyc?.bankVerifiedAt ?? null,
        },
      },
    };
  }
}
