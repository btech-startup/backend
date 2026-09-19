export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  OPS_AGENT = 'ops_agent',
}

export enum ServiceCategory {
  BANQUET_HALL = 'banquet_hall',
  PHOTOGRAPHY = 'photography',
  CATERING = 'catering',
  DECOR_SOUND = 'decor_sound',
  MAKEUP = 'makeup',
  PUROHIT_POOJA = 'purohit_pooja',
  SAMAGRI_KIT = 'samagri_kit',
}

export enum BookingStatus {
  DRAFT = 'draft',
  NEGOTIATING = 'negotiating',
  ADVANCE_PAID = 'advance_paid',
  ACTIVE_CONFIRMED = 'active_confirmed',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

export enum MilestoneStage {
  ADVANCE_LOCK = 'advance_lock',
  EVENT_CHECKIN = 'event_checkin',
  WORK_DELIVERY = 'work_delivery',
}

export enum MilestoneStatus {
  PENDING_FUNDING = 'pending_funding',
  HELD_ESCROW = 'held_escrow',
  PAYOUT_SCHEDULED = 'payout_scheduled',
  RELEASED = 'released',
  REFUNDED = 'refunded',
}

export enum LedgerEntryType {
  ESCROW_DEPOSIT = 'escrow_deposit',
  VENDOR_PAYOUT = 'vendor_payout',
  PLATFORM_COMMISSION = 'platform_commission',
  DISPUTE_REFUND = 'dispute_refund',
  SOS_CLAWBACK = 'sos_clawback',
}

export enum NegotiationSender {
  CLIENT = 'client',
  VENDOR = 'vendor',
}

export enum NegotiationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COUNTERED = 'countered',
  EXPIRED = 'expired',
}

export interface IUser {
  id: string;
  phone_number: string;
  full_name: string;
  email?: string;
  password_hash?: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IVendor {
  id: string;
  user_id: string;
  business_name: string;
  category: ServiceCategory;
  aadhaar_masked: string;
  gstin?: string;
  bank_account_number: string;
  bank_ifsc: string;
  virtual_payment_address: string;
  is_kyc_verified: boolean;
  verified_at?: Date;
  rating_avg: number;
  created_at: Date;
}

export interface IVendorService {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  base_price: number;
  price_unit: string;
  max_capacity?: number;
  created_at: Date;
}

export interface IBooking {
  id: string;
  booking_reference: string;
  client_id: string;
  vendor_id: string;
  service_id: string;
  event_date: string;
  event_slot: string;
  venue_address: string;
  venue_latitude: number;
  venue_longitude: number;
  gross_amount: number;
  platform_fee: number;
  tax_amount: number;
  net_payable_amount: number;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface IBookingMilestone {
  id: string;
  booking_id: string;
  stage: MilestoneStage;
  split_percentage: number;
  gross_amount: number;
  net_vendor_payout: number;
  status: MilestoneStatus;
  trigger_type: string;
  otp_code?: string;
  auto_release_deadline?: Date;
  released_at?: Date;
  created_at: Date;
}

export interface IEscrowLedger {
  id: string;
  booking_id: string;
  milestone_id?: string;
  entry_type: LedgerEntryType;
  amount: number;
  debit_account: string;
  credit_account: string;
  gateway_reference_id?: string;
  idempotency_key: string;
  created_at: Date;
}

export interface IBookingNegotiation {
  id: string;
  booking_id: string;
  sender_type: NegotiationSender;
  proposed_price: number;
  counter_discount_percentage: number;
  remarks?: string;
  status: NegotiationStatus;
  expires_at: Date;
  created_at: Date;
}

export interface IVenueCheckin {
  id: string;
  booking_id: string;
  vendor_id: string;
  expected_latitude: number;
  expected_longitude: number;
  actual_latitude?: number;
  actual_longitude?: number;
  radial_distance_meters?: number;
  submitted_otp?: string;
  is_verified: boolean;
  verified_at?: Date;
  created_at: Date;
}

export interface IFamilyContribution {
  id: string;
  booking_id: string;
  contributor_name: string;
  relation: string;
  target_amount: number;
  paid_amount: number;
  upi_transaction_ref?: string;
  status: 'pending' | 'completed';
  created_at: Date;
}

export interface IMuhurthamDate {
  calendar_date: string;
  panchangam_event: string;
  demand_multiplier: number;
  standby_pool_required: boolean;
}

export interface IFoodDonationPickup {
  id: string;
  booking_id: string;
  estimated_meals_count: number;
  food_type: string;
  assigned_ngo_name: string;
  volunteer_phone_masked: string;
  pickup_status: 'dispatched' | 'collected' | 'completed';
  completed_at?: Date;
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

// Wallet types
export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export interface IWallet {
  id: string;
  user_id: string;
  available_balance: number;
  locked_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IWalletTransaction {
  id: string;
  wallet_id: string;
  booking_id?: string;
  transaction_type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string;
  status: WalletTransactionStatus;
  created_at: Date;
}

// Deliverables types
export enum DeliverableStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
  REJECTED = 'rejected',
}

export interface IDeliverable {
  id: string;
  booking_id: string;
  vendor_id: string;
  title: string;
  description: string;
  file_urls: string[];
  status: DeliverableStatus;
  submitted_at?: Date;
  reviewed_at?: Date;
  reviewer_notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Notification types  
export enum NotificationType {
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  MILESTONE_RELEASED = 'milestone_released',
  CHECKIN_VERIFIED = 'checkin_verified',
  DELIVERABLE_SUBMITTED = 'deliverable_submitted',
  DELIVERABLE_APPROVED = 'deliverable_approved',
  NEGOTIATION_RECEIVED = 'negotiation_received',
  WALLET_CREDITED = 'wallet_credited',
  WALLET_WITHDRAWN = 'wallet_withdrawn',
  DISPUTE_RAISED = 'dispute_raised',
  DISPUTE_RESOLVED = 'dispute_resolved',
  SOS_DISPATCHED = 'sos_dispatched',
  GENERAL = 'general',
}

export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: Date;
}
