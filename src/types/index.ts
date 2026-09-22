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

export enum CalendarSlotType {
  FULL_DAY = 'FULL_DAY',
  MORNING = 'MORNING',
  EVENING = 'EVENING',
}

export enum CalendarStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  TENTATIVE = 'TENTATIVE',
}

export interface CalendarDayStatus {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Monday, Tuesday, etc.
  isAvailable: boolean;
  status: CalendarStatus;
  slotType: CalendarSlotType;
  event?: {
    id?: string;
    title?: string;
    eventType?: string;
    clientName?: string;
    clientPhone?: string;
    dealId?: string | null;
    notes?: string | null;
  } | null;
}
