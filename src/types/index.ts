export enum VendorStatus {
  PENDING_OTP = 'PENDING_OTP',
  PENDING_KYC = 'PENDING_KYC',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum OnboardingStep {
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  KYC_VERIFICATION = 'KYC_VERIFICATION',
  PROFILE_COMPLETION = 'PROFILE_COMPLETION',
  COMPLETED = 'COMPLETED',
}

export enum PricingUnit {
  PER_EVENT = 'PER_EVENT',
  PER_DAY = 'PER_DAY',
  PER_HOUR = 'PER_HOUR',
  PER_PLATE = 'PER_PLATE',
  FIXED = 'FIXED',
}

export enum VendorCategory {
  CATERING = 'CATERING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  DECORATION = 'DECORATION',
  VENUE = 'VENUE',
  SOUND_DJ = 'SOUND_DJ',
  MAKEUP_ARTIST = 'MAKEUP_ARTIST',
  EVENT_PLANNER = 'EVENT_PLANNER',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export interface JwtPayload {
  vendorId: string;
  phone: string;
  status: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | any;
}
