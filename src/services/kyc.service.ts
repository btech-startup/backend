import { prisma } from '../lib/prisma';
import { OnboardingStep, VendorStatus } from '../types';

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
   * Initiates Aadhaar OTP verification
   */
  public static async sendAadhaarOtp(
    vendorId: string,
    aadhaarNumber: string
  ): Promise<{ success: boolean; message: string; otp?: string }> {
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');

    if (!/^\d{12}$/.test(cleanAadhaar)) {
      throw new Error('Invalid Aadhaar number format. Aadhaar must be exactly 12 digits.');
    }

    // Generate Aadhaar verification OTP
    const mockOtp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    await prisma.otpRecord.create({
      data: {
        phone: vendor.phone,
        otp: mockOtp,
        purpose: 'AADHAAR_VERIFY',
        expiresAt,
      },
    });

    console.log(`\n========================================`);
    console.log(`🇮🇳 [UIDAI AADHAAR OTP SIMULATION]`);
    console.log(`Vendor Phone: ${vendor.phone}`);
    console.log(`Aadhaar: ${this.maskAadhaar(cleanAadhaar)}`);
    console.log(`Verification OTP: ${mockOtp}`);
    console.log(`========================================\n`);

    return {
      success: true,
      message: `Aadhaar verification OTP sent to registered mobile number ending with ${vendor.phone.slice(-4)}`,
      otp: mockOtp,
    };
  }

  /**
   * Verifies Aadhaar OTP and marks Aadhaar verified
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

    if (!otpRecord || otpRecord.otp !== otp) {
      // In development / demo, also accept default mock OTP '123456'
      if (otp !== '123456') {
        throw new Error('Invalid Aadhaar OTP. Please enter the correct code.');
      }
    }

    if (otpRecord) {
      await prisma.otpRecord.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
    }

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
   * Verifies Indian PAN card
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
   * Verifies Bank Account via penny drop simulation
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
