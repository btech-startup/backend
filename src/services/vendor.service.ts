import { prisma } from '../lib/prisma';
import { OnboardingStep, VendorStatus } from '../types';

export interface UpdateVendorProfileDto {
  ownerName?: string;
  businessName?: string;
  category?: string;
  email?: string;
  bio?: string;
  experienceYears?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
  portfolioUrls?: string[];
}

export class VendorService {
  /**
   * Retrieves full profile of the authenticated vendor
   */
  public static async getProfile(vendorId: string): Promise<any> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        kyc: true,
        _count: {
          select: { priceCards: true },
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    return {
      id: vendor.id,
      phone: vendor.phone,
      email: vendor.email,
      ownerName: vendor.ownerName,
      businessName: vendor.businessName,
      category: vendor.category,
      bio: vendor.bio,
      experienceYears: vendor.experienceYears,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      pincode: vendor.pincode,
      status: vendor.status,
      onboardingStep: vendor.onboardingStep,
      profileImage: vendor.profileImage,
      portfolioUrls: vendor.portfolioUrls ? JSON.parse(vendor.portfolioUrls) : [],
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      kyc: vendor.kyc
        ? {
            aadhaarVerified: vendor.kyc.aadhaarVerified,
            panVerified: vendor.kyc.panVerified,
            bankVerified: vendor.kyc.bankVerified,
            isFullyVerified: vendor.kyc.isFullyVerified,
          }
        : null,
      priceCardsCount: vendor._count.priceCards,
    };
  }

  /**
   * Updates vendor profile details from the dashboard
   */
  public static async updateProfile(
    vendorId: string,
    data: UpdateVendorProfileDto
  ): Promise<any> {
    const existing = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!existing) {
      throw new Error('Vendor not found');
    }

    // Check email uniqueness if email changed
    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.vendor.findFirst({
        where: {
          email: data.email,
          NOT: { id: vendorId },
        },
      });
      if (emailTaken) {
        throw new Error('This email address is already registered to another vendor.');
      }
    }

    // If vendor was in PROFILE_COMPLETION and now has business name & category, advance to COMPLETED
    let nextStep = existing.onboardingStep;
    if (
      existing.status === VendorStatus.VERIFIED &&
      (data.businessName || existing.businessName) &&
      (data.category || existing.category)
    ) {
      nextStep = OnboardingStep.COMPLETED;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        ...(data.portfolioUrls !== undefined && {
          portfolioUrls: JSON.stringify(data.portfolioUrls),
        }),
        onboardingStep: nextStep,
      },
      include: {
        kyc: true,
      },
    });

    return {
      id: updated.id,
      phone: updated.phone,
      email: updated.email,
      ownerName: updated.ownerName,
      businessName: updated.businessName,
      category: updated.category,
      bio: updated.bio,
      experienceYears: updated.experienceYears,
      address: updated.address,
      city: updated.city,
      state: updated.state,
      pincode: updated.pincode,
      status: updated.status,
      onboardingStep: updated.onboardingStep,
      profileImage: updated.profileImage,
      portfolioUrls: updated.portfolioUrls ? JSON.parse(updated.portfolioUrls) : [],
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Retrieves dashboard analytics & status overview
   */
  public static async getDashboardStats(vendorId: string): Promise<any> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        kyc: true,
        priceCards: {
          select: {
            id: true,
            title: true,
            price: true,
            pricingUnit: true,
            isActive: true,
          },
        },
      },
    });

    if (!vendor) throw new Error('Vendor not found');

    const activeCards = vendor.priceCards.filter((pc) => pc.isActive);

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName || 'Setup Your Business Name',
        ownerName: vendor.ownerName || 'Valued Vendor',
        category: vendor.category || 'Not Specified',
        status: vendor.status,
        onboardingStep: vendor.onboardingStep,
        phone: vendor.phone,
      },
      kycStatus: {
        isFullyVerified: vendor.kyc?.isFullyVerified ?? false,
        aadhaarVerified: vendor.kyc?.aadhaarVerified ?? false,
        panVerified: vendor.kyc?.panVerified ?? false,
        bankVerified: vendor.kyc?.bankVerified ?? false,
      },
      priceCards: {
        total: vendor.priceCards.length,
        active: activeCards.length,
        packages: activeCards,
      },
      notifications: [
        !vendor.kyc?.isFullyVerified
          ? { type: 'ALERT', message: 'Complete your KYC verification to receive event inquiries.' }
          : { type: 'SUCCESS', message: 'Your business profile and KYC are verified and active.' },
        vendor.priceCards.length === 0
          ? { type: 'INFO', message: 'Create your first price card package to showcase your rates to clients.' }
          : { type: 'INFO', message: `You have ${activeCards.length} active service packages listed.` },
      ],
    };
  }
}
