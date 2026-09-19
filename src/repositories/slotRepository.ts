import { IVenue, IServiceSlotBooking, SlotType, SlotStatus, ServiceCategory } from '../types/index';
import fs from 'fs';
import path from 'path';
const DATA_DIR = typeof __dirname !== 'undefined'
  ? path.join(__dirname, '../data')
  : path.join(process.cwd(), 'src/data');
const DATA_FILE = path.join(DATA_DIR, 'slot_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir', e);
  }
}

// Pre-seeded luxury venues
const INITIAL_VENUES: IVenue[] = [
  {
    id: 'ven_kohinoor_01',
    vendor_id: 'vnd_royal_banquet',
    name: 'Grand Kohinoor Convention Center',
    tagline: 'Palatial 2,500-Capacity Crystal Ballroom with 360° Stage',
    city: 'Hyderabad',
    area: 'Jubilee Hills / Hitec City',
    address: 'Plot 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    latitude: 17.4319,
    longitude: 78.4073,
    seated_capacity: 1200,
    floating_capacity: 2500,
    dining_capacity: 800,
    ac_rooms: 8,
    parking_capacity: 350,
    generator_backup_kva: 250,
    stage_dimensions: '45ft x 22ft (Hydraulic Rise)',
    base_slot_price: 175000,
    rating: 4.9,
    features: [
      'Centralized VRV Air Conditioning',
      'Dedicated Pure-Veg & Non-Veg Commercial Kitchens',
      '8 Deluxe Bride/Groom AC Suites with Keycard Access',
      '350 Car Valet Parking with Underground Bay',
      'Built-in 4K LED Video Walls & Truss Rigging'
    ],
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1545232979-fbf678683a31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80'
    ],
    synergy_vendors: {
      caterer_name: 'Royal Nizami & Coastal Feast Master',
      caterer_id: 'svc_cat_01',
      decorator_name: 'Vibrant Floral Mandap & LED Trussing',
      decorator_id: 'svc_dec_01',
      events_executed: 48
    }
  },
  {
    id: 'ven_royal_palace_02',
    vendor_id: 'vnd_royal_banquet',
    name: 'Royal Palace Banquet & Lawn',
    tagline: 'Opulent Banquet with Open-Air Starlit Cocktail Lawn',
    city: 'Hyderabad',
    area: 'Gachibowli Financial District',
    address: 'Adjacent to WaveRock SEZ, Gachibowli, Hyderabad, Telangana 500032',
    latitude: 17.4435,
    longitude: 78.3772,
    seated_capacity: 500,
    floating_capacity: 1100,
    dining_capacity: 400,
    ac_rooms: 4,
    parking_capacity: 180,
    generator_backup_kva: 150,
    stage_dimensions: '36ft x 16ft',
    base_slot_price: 95000,
    rating: 4.8,
    features: [
      'Acoustically Treated Indoor Banquet',
      'Lush Green Outdoor Cocktail Lawn (6,000 sq.ft)',
      'Covered Dining Hall with 25 Live Food Counters',
      '24x7 Uninterrupted DG Power Backup'
    ],
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80'
    ],
    synergy_vendors: {
      caterer_name: 'Swagath Traditional Brahmin Bhojanam',
      caterer_id: 'svc_cat_02',
      decorator_name: 'Mandap Arts & Floral Creations',
      decorator_id: 'svc_dec_02',
      events_executed: 32
    }
  },
  {
    id: 'ven_sampradaya_03',
    vendor_id: 'vnd_sampradaya',
    name: 'Sampradaya Heritage Mandapam',
    tagline: 'Authentic Chettinad Teak Wood Architecture for Sacred Muhurthams',
    city: 'Bengaluru',
    area: 'Indiranagar / Old Airport Road',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    latitude: 12.9716,
    longitude: 77.6412,
    seated_capacity: 450,
    floating_capacity: 900,
    dining_capacity: 350,
    ac_rooms: 6,
    parking_capacity: 120,
    generator_backup_kva: 125,
    stage_dimensions: '32ft x 18ft (Carved Teak Pillars)',
    base_slot_price: 135000,
    rating: 4.95,
    features: [
      'Carved Teakwood Mandap Structure with Traditional Yagna Kunda',
      'Eco-friendly Banana Leaf Traditional Dining Hall',
      'Temple-Architecture Inner Sanctum for Pooja',
      'Green Certified Solar Powered Facility'
    ],
    images: [
      'https://images.unsplash.com/photo-1545232979-fbf678683a31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
    ],
    synergy_vendors: {
      caterer_name: 'Swagath Traditional Brahmin Bhojanam',
      caterer_id: 'svc_cat_02',
      decorator_name: 'Vedic Floral Mandap Crafts',
      decorator_id: 'svc_dec_01',
      events_executed: 41
    }
  }
];

// Pre-seeded modular services
const INITIAL_MODULAR_SERVICES = [
  {
    id: 'svc_cat_01',
    vendor_id: 'vnd_royal_banquet',
    category: ServiceCategory.CATERING,
    title: 'Royal Nizami & Coastal Wedding Feast',
    description: 'Authentic Dum Biryani, Mirchi ka Salan, Live Appam & Tandoor counters, Double ka Meetha & Apricot Delight.',
    base_price: 450,
    price_unit: 'per_plate',
    min_pax: 150,
    rating: 4.9,
    image: '🍽️'
  },
  {
    id: 'svc_cat_02',
    vendor_id: 'vnd_swagath_caterers',
    category: ServiceCategory.CATERING,
    title: 'Swagath Traditional Banana Leaf Bhojanam',
    description: '100% Pure Veg 36-item South Indian feast served on fresh plantain leaf with 3 types of payasam.',
    base_price: 380,
    price_unit: 'per_plate',
    min_pax: 100,
    rating: 5.0,
    image: '🍌'
  },
  {
    id: 'svc_pho_01',
    vendor_id: 'vnd_studio_pixel',
    category: ServiceCategory.PHOTOGRAPHY,
    title: 'Studio Pixel 1-Lead Cinematic Photography',
    description: 'Traditional + Candid HD coverage, 4K Drone Aerials, Cinematic Highlights Film & 40-Page Flush Mount Album.',
    base_price: 35000,
    price_unit: 'per_event',
    sla_days: 21,
    rating: 4.85,
    image: '📸'
  },
  {
    id: 'svc_pur_01',
    vendor_id: 'vnd_vedam_purohit',
    category: ServiceCategory.PUROHIT_POOJA,
    title: 'Sri Vedam Vedic Purohit & 45-Item Samagri Kit',
    description: 'Certified Vedic priests for Vivaha Muhurtham with fresh ghee, homam samagri, pattu vastram and pooja vessels.',
    base_price: 8500,
    price_unit: 'per_ritual',
    rating: 5.0,
    image: '🪔'
  },
  {
    id: 'svc_dec_01',
    vendor_id: 'vnd_vibrant_decor',
    category: ServiceCategory.DECOR_SOUND,
    title: 'Vibrant Stage Floral Mandap & Concert Sound',
    description: 'Imported Carnations & Jasmine Mandap, 40ft Entrance Archway, JBL Line Array Audio & Dimmer Mood Lighting.',
    base_price: 45000,
    price_unit: 'per_event',
    rating: 4.8,
    image: '🎵'
  },
  {
    id: 'svc_mgr_01',
    vendor_id: 'vnd_kalyanam_directors',
    category: 'event_manager',
    title: 'Kalyanam Royal Turnkey Event Management',
    description: 'End-to-end dedicated Event Director managing venue, caterers, sound, logistics, guest RSVP and rituals.',
    base_price: 150000,
    price_unit: 'turnkey_package',
    rating: 4.95,
    image: '👑'
  }
];

// Pre-seeded BookMyShow-style slot bookings
// Demonstrates that booked slots are padlocked and unbookable by other customers
const INITIAL_SLOT_BOOKINGS: IServiceSlotBooking[] = [
  {
    id: 'slot_bk_01',
    vendor_id: 'vnd_royal_banquet',
    venue_id: 'ven_kohinoor_01',
    event_date: '2026-10-15',
    slot_type: 'morning',
    start_time: '06:00',
    end_time: '14:00',
    status: 'booked',
    locked_by_user_id: 'usr_customer_demo',
    booking_id: 'bk_demo_101',
    handshake_otp: '849201',
    host_name: 'Rahul Sharma & Sneha Rao',
    guest_count: 500,
    advance_amount: 75000,
    created_at: new Date('2026-09-10T10:00:00Z')
  },
  {
    id: 'slot_bk_02',
    vendor_id: 'vnd_royal_banquet',
    venue_id: 'ven_kohinoor_01',
    event_date: '2026-11-22',
    slot_type: 'morning',
    start_time: '06:00',
    end_time: '14:00',
    status: 'booked',
    locked_by_user_id: 'usr_ananya_host',
    booking_id: 'bk_demo_102',
    handshake_otp: '739102',
    host_name: 'Ananya & Rohan (Karthika Masam Muhurtham)',
    guest_count: 800,
    advance_amount: 87500,
    created_at: new Date('2026-09-11T12:00:00Z')
  },
  {
    id: 'slot_bk_03',
    vendor_id: 'vnd_royal_banquet',
    venue_id: 'ven_royal_palace_02',
    event_date: '2026-10-15',
    slot_type: 'evening',
    start_time: '16:00',
    end_time: '23:30',
    status: 'booked',
    locked_by_user_id: 'usr_vikram_host',
    booking_id: 'bk_demo_103',
    host_name: 'Vikram & Meera (Sangeet & Reception)',
    guest_count: 350,
    advance_amount: 47500,
    created_at: new Date('2026-09-12T08:30:00Z')
  }
];

// Pre-seeded Annadanam Surplus Food Pickups
const INITIAL_FOOD_DONATIONS = [
  {
    id: 'fd_101',
    booking_ref: 'BK-2026-9102',
    venue_name: 'Grand Kohinoor Convention Center',
    city: 'Hyderabad',
    meals: 120,
    food_type: 'Royal Nizami Dum Biryani & Mirchi Salan Surplus',
    assigned_ngo: 'Robin Hood Army (Food Rescue Unit)',
    ngo_contact: '+91 98490 22114',
    driver_name: 'Suresh Kumar',
    driver_phone: '+91 91234 56789',
    temperature_celsius: 64.5,
    status: 'DISPATCHED',
    pickup_window: '22:15 - 23:00 IST',
    donor_name: 'Rahul Sharma (Event Host)',
    tax_receipt_80g: {
      receipt_no: '80G-HYD-2026-9921',
      eligible_amount: 18000,
      exemption_section: 'Section 80G(5)(vi) of IT Act, 1961',
      certificate_url: 'https://eventwise.in/tax/80G-HYD-2026-9921.pdf'
    },
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'fd_102',
    booking_ref: 'BK-2026-8819',
    venue_name: 'Sampradaya Heritage Mandapam',
    city: 'Bengaluru',
    meals: 85,
    food_type: 'Pure Veg South Indian 36-Course Banquet Feast',
    assigned_ngo: 'Feeding India NGO (Zomato Giving)',
    ngo_contact: '+91 80234 11988',
    driver_name: 'Manjunath Gowda',
    driver_phone: '+91 99887 66554',
    temperature_celsius: 68.0,
    status: 'COLLECTED',
    pickup_window: '21:30 - 22:15 IST',
    donor_name: 'Dr. Venkatesh & Family',
    tax_receipt_80g: {
      receipt_no: '80G-BLR-2026-4412',
      eligible_amount: 12750,
      exemption_section: 'Section 80G(5)(vi) of IT Act, 1961',
      certificate_url: 'https://eventwise.in/tax/80G-BLR-2026-4412.pdf'
    },
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'fd_103',
    booking_ref: 'BK-2026-7734',
    venue_name: 'Royal Palace Banquet & Lawn',
    city: 'Hyderabad',
    meals: 160,
    food_type: 'Cocktail Reception Continental & Mughlai Spread',
    assigned_ngo: 'Roti Bank Foundation Hyderabad',
    ngo_contact: '+91 94401 77290',
    driver_name: 'Mohd. Imran',
    driver_phone: '+91 98765 11223',
    temperature_celsius: 62.0,
    status: 'DISTRIBUTED',
    pickup_window: '23:00 - 23:45 IST',
    donor_name: 'Vikram & Meera',
    tax_receipt_80g: {
      receipt_no: '80G-HYD-2026-1049',
      eligible_amount: 24000,
      exemption_section: 'Section 80G(5)(vi) of IT Act, 1961',
      certificate_url: 'https://eventwise.in/tax/80G-HYD-2026-1049.pdf'
    },
    created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'fd_104',
    booking_ref: 'BK-2026-6211',
    venue_name: 'Sri Krishna Grand Kalyana Mandapam',
    city: 'Chennai',
    meals: 95,
    food_type: 'Traditional Tamil Brahmin Kalyana Virundhu',
    assigned_ngo: 'No Food Waste Foundation Chennai',
    ngo_contact: '+91 44281 99011',
    driver_name: 'K. Balaji',
    driver_phone: '+91 98410 88776',
    temperature_celsius: 66.2,
    status: 'PENDING_DISPATCH',
    pickup_window: '22:30 - 23:15 IST',
    donor_name: 'Sridhar Ramanathan',
    tax_receipt_80g: {
      receipt_no: '80G-CHN-2026-7821',
      eligible_amount: 14250,
      exemption_section: 'Section 80G(5)(vi) of IT Act, 1961',
      certificate_url: 'https://eventwise.in/tax/80G-CHN-2026-7821.pdf'
    },
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];

// Pre-seeded Anti-Circumvention Chat Violations
const INITIAL_CHAT_VIOLATIONS = [
  {
    id: 'viol_001',
    sender_id: 'usr_cust_8819',
    sender_name: 'Rahul Sharma (Customer)',
    sender_role: 'customer',
    receiver_id: 'vnd_royal_banquet',
    receiver_name: 'Royal Palace Banquet',
    violation_type: 'PHONE_NUMBER_DETECTED',
    original_message: 'Directly call me on 98490 22114 so we can bypass the platform fee.',
    sanitized_message: 'Directly call me on [PHONE NUMBER BLOCKED] so we can bypass the platform fee.',
    status: 'flagged',
    fine_amount: 0,
    admin_notes: '',
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'viol_002',
    sender_id: 'vnd_photo_01',
    sender_name: 'Studio Pixel Photography',
    sender_role: 'vendor',
    receiver_id: 'usr_ananya_host',
    receiver_name: 'Ananya Rao',
    violation_type: 'UPI_HANDLE_DETECTED',
    original_message: 'Transfer ₹25,000 balance to studiopixel@okhdfcbank to save GST 18%.',
    sanitized_message: 'Transfer ₹25,000 balance to [UPI ID REDACTED] to save GST 18%.',
    status: 'warned',
    fine_amount: 0,
    admin_notes: 'System warning issued to vendor regarding anti-circumvention policy.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'viol_003',
    sender_id: 'vnd_decor_02',
    sender_name: 'Vrindavan Mandap Arts',
    sender_role: 'vendor',
    receiver_id: 'usr_vikram_host',
    receiver_name: 'Vikram Singhania',
    violation_type: 'CASH_DISCOUNT_ATTEMPT',
    original_message: 'If you pay ₹50,000 in cash offline at the venue, I will give you free floral entrance arches.',
    sanitized_message: 'If you pay ₹50,000 in [OFFLINE TRANSACTION ATTEMPT REDACTED], I will give you free floral entrance arches.',
    status: 'flagged',
    fine_amount: 2500,
    admin_notes: '',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'viol_004',
    sender_id: 'usr_rohan_host',
    sender_name: 'Rohan Mehta',
    sender_role: 'customer',
    receiver_id: 'vnd_swagath_caterers',
    receiver_name: 'Swagath Traditional Bhojanam',
    violation_type: 'OFFLINE_LINK_DETECTED',
    original_message: 'Check my contact card at https://wa.me/919988776655 for fast booking confirmation.',
    sanitized_message: 'Check my contact card at [EXTERNAL LINK REDACTED] for fast booking confirmation.',
    status: 'warned',
    fine_amount: 0,
    admin_notes: 'Auto-sanitized by EventWise anti-leakage regex engine.',
    created_at: new Date(Date.now() - 10800000).toISOString()
  }
];

// Pre-seeded Double-Entry Escrow Ledger
const INITIAL_ESCROW_TRANSACTIONS = [
  {
    id: 'tx_escrow_88191',
    transaction_ref: 'TXN-RBI-2026-991201',
    booking_id: 'bk_demo_101',
    host_name: 'Rahul Sharma & Sneha Rao',
    vendor_name: 'Grand Kohinoor Convention Center',
    service_category: 'venue',
    type: 'M1_ADVANCE_LOCK',
    direction: 'CREDIT',
    amount: 75000,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'HELD_IN_ESCROW',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    notes: '20% Advance held under RBI Escrow Direction Section 18. Auto-locked.'
  },
  {
    id: 'tx_escrow_88192',
    transaction_ref: 'TXN-RBI-2026-991202',
    booking_id: 'bk_demo_101',
    host_name: 'Rahul Sharma & Sneha Rao',
    vendor_name: 'Grand Kohinoor Convention Center',
    service_category: 'venue',
    type: 'PLATFORM_COMMISSION',
    direction: 'CREDIT',
    amount: 14000,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'SETTLED',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    notes: '8% Take-Rate platform revenue deduction credited to EventWise Operating Account.'
  },
  {
    id: 'tx_escrow_88193',
    transaction_ref: 'TXN-RBI-2026-991203',
    booking_id: 'bk_demo_102',
    host_name: 'Ananya & Rohan (Muhurtham)',
    vendor_name: 'Sampradaya Heritage Mandapam',
    service_category: 'venue',
    type: 'M2_OTP_RELEASE',
    direction: 'DEBIT',
    amount: 67500,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'SETTLED',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    notes: '50% Milestone 2 released upon verified 6-digit handshake OTP (739102) check-in at venue.'
  },
  {
    id: 'tx_escrow_88194',
    transaction_ref: 'TXN-RBI-2026-991204',
    booking_id: 'bk_demo_103',
    host_name: 'Vikram & Meera (Sangeet)',
    vendor_name: 'Royal Palace Banquet & Lawn',
    service_category: 'venue',
    type: 'M3_AUDIT_RELEASE',
    direction: 'DEBIT',
    amount: 28500,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'SETTLED',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    notes: 'Final 30% Milestone 3 disbursed after 72-hour zero-dispute audit window.'
  },
  {
    id: 'tx_escrow_88195',
    transaction_ref: 'TXN-RBI-2026-991205',
    booking_id: 'bk_demo_101',
    host_name: 'Rahul Sharma (Customer)',
    vendor_name: 'Royal Nizami & Coastal Feast Master',
    service_category: 'catering',
    type: 'DISPUTE_CLAWBACK',
    direction: 'DEBIT',
    amount: 15000,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'CLAWED_BACK',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    notes: 'Tribunal Clawback: delayed buffet setup refund credited back to customer UPI pool.'
  },
  {
    id: 'tx_escrow_88196',
    transaction_ref: 'TXN-RBI-2026-991206',
    booking_id: 'bk_demo_101',
    host_name: 'Rahul Sharma (Customer)',
    vendor_name: 'Verified Standby Drone Team',
    service_category: 'photography',
    type: 'SOS_SURGE_BONUS',
    direction: 'CREDIT',
    amount: 9000,
    currency: 'INR',
    nodal_bank: 'HDFC RBI Nodal Account #••••9812',
    status: 'SETTLED',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    notes: '+20% SOS Emergency Dispatch surge premium auto-credited from defaulted vendor security deposit.'
  }
];

class SlotStore {
  venues: IVenue[] = [...INITIAL_VENUES];
  services: any[] = [...INITIAL_MODULAR_SERVICES];
  slotBookings: IServiceSlotBooking[] = [...INITIAL_SLOT_BOOKINGS];
  foodDonations: any[] = [...INITIAL_FOOD_DONATIONS];
  chatViolations: any[] = [...INITIAL_CHAT_VIOLATIONS];
  escrowLedger: any[] = [...INITIAL_ESCROW_TRANSACTIONS];
  kycApplications: any[] = [
    {
      id: 'merch_001',
      businessName: 'Royal Grand Palace & Convention Center',
      category: 'venue',
      city: 'Hyderabad (Gachibowli)',
      gstin: '36AAACG1234F1Z5',
      fireSafetyNoc: 'NOC-HYD-FIRE-2026-8819',
      bankAccount: 'HDFC Nodal Escrow •••• 9812',
      specsSummary: '1,200 Seated • 2,500 Floating • 8 AC Suites • 350 Valet Cars • 250 KVA Genset',
      status: 'pending',
      appliedDate: '2026-10-12',
      riskScore: 6,
    },
    {
      id: 'merch_002',
      businessName: 'Annapurna Gourmet Caterers',
      category: 'catering',
      city: 'Hyderabad (Banjara Hills)',
      gstin: '36BBKPG8821D1ZA',
      fssai: '13624011000234 (Valid till Dec 2027)',
      bankAccount: 'ICICI Nodal Escrow •••• 4120',
      specsSummary: 'Gold ₹450 • Diamond ₹650 • Platinum ₹850 • FSSAI Grade A+ Kitchen Audit',
      status: 'pending',
      appliedDate: '2026-10-13',
      riskScore: 4,
    },
    {
      id: 'merch_003',
      businessName: 'Lumiere Cinematic Wedding Visuals',
      category: 'photo',
      city: 'Bengaluru (Indiranagar)',
      gstin: '29AABCL9901M1ZQ',
      bankAccount: 'Axis Nodal Escrow •••• 6319',
      specsSummary: 'Sony Cinema FX6 4K • DJI Ronin Gimbal • Drone 4K Pilots • 14-Day Delivery SLA',
      status: 'verified',
      appliedDate: '2026-09-28',
      riskScore: 2,
    },
    {
      id: 'merch_004',
      businessName: 'Sanskritik Vaidik Purohit Samiti',
      category: 'purohit',
      city: 'Hyderabad (Secunderabad)',
      gstin: '36UADVP5512B1Z2',
      bankAccount: 'SBI Nodal Escrow •••• 1104',
      specsSummary: 'Veda Vangmaya Certified • 100% Organic Homa Dravya Kit • Muhurtham Precision',
      status: 'verified',
      appliedDate: '2026-10-01',
      riskScore: 1,
    },
    {
      id: 'merch_005',
      businessName: 'Vrindavan Mandap & Floral Decorators',
      category: 'decor',
      city: 'Hyderabad (Madhapur)',
      gstin: '36CCCPD4419K1ZM',
      fireSafetyNoc: 'NOC-TEL-DECOR-4410',
      bankAccount: 'Kotak Nodal Escrow •••• 8290',
      specsSummary: 'Eco-friendly Reusable Fiberglass Mandaps • Fire-retardant Drapes • LED Par Rigs',
      status: 'pending',
      appliedDate: '2026-10-14',
      riskScore: 12,
    },
  ];

  disputes: any[] = [
    {
      id: 'dsp_9012',
      booking_id: 'bk_demo_101',
      host_name: 'Rahul Sharma & Sneha Rao',
      vendor_name: 'Royal Nizami & Coastal Feast Master',
      reason: 'Breakfast setup delayed by 45 minutes past muhurtham window; live counter equipment fault',
      claimed_amount: 15000,
      status: 'pending',
      refund_amount: 0,
      arbitrator_notes: '',
      created_at: '2026-10-15T08:45:00.000Z'
    },
    {
      id: 'dsp_9013',
      booking_id: 'bk_demo_102',
      host_name: 'Ananya & Rohan (Muhurtham)',
      vendor_name: 'Vrindavan Traditional Mandap',
      reason: 'Mandap jasmine strands wilted due to non-AC logistics; color theme mismatch',
      claimed_amount: 25000,
      status: 'pending',
      refund_amount: 0,
      arbitrator_notes: '',
      created_at: '2026-11-22T10:15:00.000Z'
    }
  ];

  sosAlerts: any[] = [
    {
      id: 'sos_8819',
      booking_id: 'bk_demo_101',
      venue_name: 'Grand Kohinoor Convention Center',
      city: 'Hyderabad',
      category: 'photography',
      reason: 'Lead 4K drone videographer vehicle breakdown on Outer Ring Road (1 hour before Baraat)',
      surge_bonus_percentage: 20,
      base_payout: 45000,
      total_incentive_payout: 54000,
      status: 'open_broadcast',
      claimed_by_vendor_id: null,
      claimed_by_vendor_name: null,
      created_at: '2026-10-15T09:00:00.000Z'
    }
  ];

  constructor() {
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.venues) this.venues = parsed.venues;
        if (parsed.services) this.services = parsed.services;
        if (parsed.slotBookings) this.slotBookings = parsed.slotBookings;
        if (parsed.kycApplications && parsed.kycApplications.length > 0) {
          this.kycApplications = parsed.kycApplications;
        }
        if (parsed.disputes && parsed.disputes.length > 0) {
          this.disputes = parsed.disputes;
        }
        if (parsed.sosAlerts && parsed.sosAlerts.length > 0) {
          this.sosAlerts = parsed.sosAlerts;
        }
        if (parsed.foodDonations && parsed.foodDonations.length > 0) {
          this.foodDonations = parsed.foodDonations;
        }
        if (parsed.chatViolations && parsed.chatViolations.length > 0) {
          this.chatViolations = parsed.chatViolations;
        }
        if (parsed.escrowLedger && parsed.escrowLedger.length > 0) {
          this.escrowLedger = parsed.escrowLedger;
        }
      } else {
        this.saveToDisk();
      }
    } catch (e) {
      console.error('Error reading slot store from disk, using initial state:', e);
    }
  }

  saveToDisk() {
    try {
      const payload = {
        venues: this.venues,
        services: this.services,
        slotBookings: this.slotBookings,
        kycApplications: this.kycApplications,
        disputes: this.disputes,
        sosAlerts: this.sosAlerts,
        foodDonations: this.foodDonations,
        chatViolations: this.chatViolations,
        escrowLedger: this.escrowLedger,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving slot store to disk:', e);
    }
  }

  // Dispute Tribunal Management
  createDispute(data: any) {
    const claimAmt = Number(data.claim_amount || data.claimed_amount) || 15000;
    const newDispute = {
      id: `dsp_${Math.floor(1000 + Math.random() * 9000)}`,
      booking_id: data.booking_id || 'bk_demo_101',
      host_name: data.host_name || 'Rahul Sharma (Customer)',
      vendor_name: data.vendor_name || 'Assigned Vendor Partner',
      reason: data.reason || 'Service SLA violation during event',
      claimed_amount: claimAmt,
      claim_amount: claimAmt,
      milestone_stage: data.milestone_stage || 'milestone_2_handshake',
      status: 'pending',
      refund_amount: 0,
      arbitrator_notes: '',
      created_at: new Date().toISOString()
    };
    this.disputes.unshift(newDispute);
    this.saveToDisk();
    return newDispute;
  }

  getDisputes() {
    return this.disputes.map((d: any) => {
      const claim = Number(d.claim_amount || d.claimed_amount) || 15000;
      return {
        ...d,
        claim_amount: claim,
        claimed_amount: claim,
        milestone_stage: d.milestone_stage || 'milestone_2_handshake',
        status: d.status || 'pending',
        refund_amount: Number(d.refund_amount) || 0,
      };
    });
  }

  resolveDispute(id: string, refundAmount: number, notes: string) {
    const dispute = this.disputes.find(d => d.id === id);
    if (dispute) {
      dispute.status = 'resolved';
      dispute.refund_amount = refundAmount;
      dispute.arbitrator_notes = notes;
      dispute.resolved_at = new Date().toISOString();
      this.saveToDisk();
      return dispute;
    }
    return {
      id,
      status: 'resolved',
      refund_amount: refundAmount,
      arbitrator_notes: notes,
      resolved_at: new Date().toISOString()
    };
  }

  // Emergency SOS Dispatcher Management
  triggerSOS(data: any) {
    const newSOS = {
      id: `sos_${Math.floor(1000 + Math.random() * 9000)}`,
      booking_id: data.booking_id || 'bk_demo_101',
      venue_name: data.venue_name || 'Grand Kohinoor Convention Center',
      city: data.city || 'Hyderabad',
      category: data.category || 'photography',
      reason: data.reason || 'Emergency vendor replacement required (Vendor Delayed/No-Show)',
      surge_bonus_percentage: Number(data.surge_bonus_percentage) || 20,
      base_payout: Number(data.base_payout) || 45000,
      total_incentive_payout: Math.round((Number(data.base_payout) || 45000) * 1.2),
      status: 'open_broadcast',
      claimed_by_vendor_id: null,
      claimed_by_vendor_name: null,
      created_at: new Date().toISOString()
    };
    this.sosAlerts.unshift(newSOS);
    this.saveToDisk();
    return newSOS;
  }

  getSOSAlerts(city?: string) {
    const list = (city && city.toLowerCase() !== 'all')
      ? this.sosAlerts.filter(s => s.city.toLowerCase() === city.toLowerCase())
      : this.sosAlerts;
    return list.map((s: any) => ({
      ...s,
      service_category: s.service_category || s.category || 'catering',
      category: s.category || s.service_category || 'catering',
      status: s.status || 'open_broadcast',
      surge_multiplier: s.surge_multiplier || (1 + (s.surge_bonus_percentage || 20) / 100),
      reason: s.reason || 'Emergency standby replacement required',
      venue_name: s.venue_name || 'Grand Kohinoor Convention Center',
    }));
  }

  claimSOS(sosId: string, vendorId: string, vendorName: string) {
    const alert = this.sosAlerts.find(s => s.id === sosId);
    if (!alert) throw new Error('SOS alert not found');
    if (alert.status !== 'open_broadcast') throw new Error('This emergency job has already been claimed by another standby partner.');
    alert.status = 'claimed';
    alert.claimed_by_vendor_id = vendorId;
    alert.claimed_by_vendor_name = vendorName;
    alert.claimed_at = new Date().toISOString();
    this.saveToDisk();
    return alert;
  }

  dispatchSOSBackup(sosId: string, replacementVendorId: string, surgeBonus: number, reason: string) {
    const alert = this.sosAlerts.find(s => s.id === sosId) || {
      id: sosId,
      booking_id: 'bk_demo_101',
      venue_name: 'Grand Kohinoor',
      city: 'Hyderabad',
      category: 'photography',
      status: 'dispatched'
    };
    alert.status = 'dispatched';
    alert.claimed_by_vendor_id = replacementVendorId;
    alert.claimed_by_vendor_name = 'Verified Standby Partner';
    alert.surge_bonus_percentage = surgeBonus;
    this.saveToDisk();
    return {
      sosDispatchId: alert.id,
      status: 'dispatched',
      originalVendorClawback: {
        recoveredFromWallet: 25000,
        penaltyLevied: 2500.0,
      },
      newBookingReference: `BK-SOS-${Date.now().toString().slice(-4)}`,
      message: `Emergency standby vendor ${replacementVendorId} dispatched with ${surgeBonus}% surge bonus guaranteed.`,
    };
  }

  // Add newly onboarded venue
  addVenue(venueData: Partial<IVenue>): IVenue {
    const newVenue: IVenue = {
      id: `ven_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      vendor_id: venueData.vendor_id || 'vnd_partner_custom',
      name: venueData.name || 'New Luxury Convention Hall',
      tagline: venueData.tagline || 'Grand AC Banquet & Lawn with Premium Stage Rigging',
      city: venueData.city || 'Hyderabad',
      area: venueData.area || 'HITEC City',
      address: venueData.address || `${venueData.area}, ${venueData.city}`,
      latitude: venueData.latitude || 17.4319,
      longitude: venueData.longitude || 78.4073,
      seated_capacity: Number(venueData.seated_capacity) || 800,
      floating_capacity: Number(venueData.floating_capacity) || 1600,
      dining_capacity: Number(venueData.dining_capacity) || 500,
      ac_rooms: Number(venueData.ac_rooms) || 6,
      parking_capacity: Number(venueData.parking_capacity) || 200,
      generator_backup_kva: Number(venueData.generator_backup_kva) || 160,
      stage_dimensions: venueData.stage_dimensions || '40ft x 20ft',
      base_slot_price: Number(venueData.base_slot_price) || 120000,
      rating: 5.0,
      features: venueData.features || [
        'Central VRV Air-Conditioning',
        'Dedicated Commercial Kitchen',
        'Bridal Deluxe Suite with Smart Card Access',
        'Valet Parking Bay',
        '24x7 Generator Backup'
      ],
      images: venueData.images || [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1545232979-fbf678683a31?auto=format&fit=crop&w=800&q=80'
      ]
    };
    this.venues.unshift(newVenue);

    // Also register a KYC entry for the new property
    this.kycApplications.unshift({
      id: `kyc_${Date.now()}`,
      businessName: newVenue.name,
      category: 'venue',
      city: `${newVenue.city} (${newVenue.area})`,
      gstin: (venueData as any).gstin || '36AAACG9921D1Z9',
      fireSafetyNoc: (venueData as any).fireSafetyNoc || 'NOC-PENDING-AUDIT',
      bankAccount: (venueData as any).bankAccount || 'HDFC Nodal Escrow •••• 8841',
      specsSummary: `${newVenue.seated_capacity} Seated • ${newVenue.floating_capacity} Floating • ${newVenue.ac_rooms} AC Suites • ${newVenue.parking_capacity} Valet • ${newVenue.generator_backup_kva} KVA`,
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      riskScore: 2,
      venue_id: newVenue.id
    });

    this.saveToDisk();
    return newVenue;
  }

  getKYCApplications() {
    return this.kycApplications;
  }

  reviewKYCApplication(id: string, status: 'verified' | 'rejected') {
    const entry = this.kycApplications.find(k => k.id === id);
    if (entry) {
      entry.status = status;
      this.saveToDisk();
      return entry;
    }
    return null;
  }

  // Venues API
  getVenues(city?: string, minCapacity?: number): IVenue[] {

    return this.venues.filter(v => {
      if (city && city.toLowerCase() !== 'all' && !v.city.toLowerCase().includes(city.toLowerCase())) {
        return false;
      }
      if (minCapacity && v.seated_capacity < minCapacity) {
        return false;
      }
      return true;
    });
  }

  getVenueById(id: string): IVenue | null {
    return this.venues.find(v => v.id === id) || null;
  }

  // BookMyShow-style slot status lookup
  // Returns slot status for all days of the given month (or 30-day window)
  getVenueSlots(venueId: string, month: string) {
    const venue = this.getVenueById(venueId);
    if (!venue) throw new Error('Venue not found');

    const bookings = this.slotBookings.filter(b => b.venue_id === venueId);

    // Map bookings by date and slot
    const slotMap: Record<string, Record<SlotType, { status: SlotStatus; details?: any }>> = {};

    bookings.forEach(b => {
      if (!slotMap[b.event_date]) {
        slotMap[b.event_date] = {
          morning: { status: 'available' },
          evening: { status: 'available' },
          full_day: { status: 'available' }
        };
      }
      slotMap[b.event_date][b.slot_type] = {
        status: b.status,
        details: {
          booking_id: b.booking_id,
          host_name: b.host_name,
          guest_count: b.guest_count,
          advance_amount: b.advance_amount,
          start_time: b.start_time,
          end_time: b.end_time
        }
      };

      // If full day is booked, both morning and evening are automatically blocked
      if (b.slot_type === 'full_day' && (b.status === 'booked' || b.status === 'blocked_by_vendor')) {
        slotMap[b.event_date].morning = { status: b.status, details: b };
        slotMap[b.event_date].evening = { status: b.status, details: b };
      }
      // If either morning or evening is booked, full day is unavailable
      if ((b.slot_type === 'morning' || b.slot_type === 'evening') && (b.status === 'booked' || b.status === 'blocked_by_vendor')) {
        slotMap[b.event_date].full_day = { status: 'booked', details: { reason: 'Partial day slot already occupied' } };
      }
    });

    return {
      venue_id: venue.id,
      venue_name: venue.name,
      base_slot_price: venue.base_slot_price,
      month,
      slots: slotMap
    };
  }

  // Atomic Slot Reservation (Prevents double-booking like BookMyShow)
  reserveSlot(params: {
    vendor_id: string;
    venue_id?: string;
    service_id?: string;
    event_date: string;
    slot_type: SlotType;
    user_id: string;
    host_name: string;
    guest_count?: number;
    advance_amount?: number;
    permanent_booking?: boolean;
  }): IServiceSlotBooking {
    const { vendor_id, venue_id, service_id, event_date, slot_type, user_id, host_name, guest_count, advance_amount, permanent_booking } = params;

    // Check existing locks or bookings
    const existing = this.slotBookings.find(b =>
      (b.venue_id === venue_id || (b.vendor_id === vendor_id && !venue_id)) &&
      b.event_date === event_date &&
      (b.slot_type === slot_type || b.slot_type === 'full_day' || slot_type === 'full_day') &&
      (b.status === 'booked' || b.status === 'blocked_by_vendor' || (b.status === 'cart_locked' && b.locked_by_user_id !== user_id))
    );

    if (existing) {
      const reason = existing.status === 'booked'
        ? `This slot is already BOOKED (${existing.start_time} - ${existing.end_time}) by ${existing.host_name || 'another host'}`
        : existing.status === 'cart_locked'
          ? 'This slot is temporarily locked in another host checkout cart (15-min hold)'
          : 'This slot is blocked by the venue owner for private maintenance or offline reservation';
      throw new Error(`SLOT_UNAVAILABLE: ${reason}`);
    }

    const timeWindow = slot_type === 'morning'
      ? { start: '06:00', end: '14:00' }
      : slot_type === 'evening'
        ? { start: '16:00', end: '23:30' }
        : { start: '06:00', end: '23:30' };

    const newBooking: IServiceSlotBooking = {
      id: `slot_bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      vendor_id,
      venue_id,
      service_id,
      event_date,
      slot_type,
      start_time: timeWindow.start,
      end_time: timeWindow.end,
      status: permanent_booking ? 'booked' : 'cart_locked',
      locked_by_user_id: user_id,
      booking_id: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      host_name,
      guest_count: guest_count || 300,
      advance_amount: advance_amount || 50000,
      created_at: new Date()
    };

    this.slotBookings.push(newBooking);
    this.saveToDisk();
    return newBooking;
  }

  // Vendor Calendar: Toggle slot block (open vs blocked)
  toggleVendorSlotBlock(vendorId: string, eventDate: string, slotType: SlotType, block: boolean, venueId?: string): IServiceSlotBooking {
    const existingIndex = this.slotBookings.findIndex(b =>
      b.vendor_id === vendorId &&
      b.event_date === eventDate &&
      b.slot_type === slotType
    );

    if (existingIndex >= 0) {
      const existing = this.slotBookings[existingIndex];
      if (existing.status === 'booked') {
        throw new Error('Cannot modify a confirmed host booking. Contact Admin Dispute Tribunal.');
      }
      if (!block) {
        // Unblock: remove entry or set to available
        this.slotBookings.splice(existingIndex, 1);
        this.saveToDisk();
        return {
          ...existing,
          status: 'available'
        };
      } else {
        existing.status = 'blocked_by_vendor';
        this.saveToDisk();
        return existing;
      }
    }

    if (block) {
      const timeWindow = slotType === 'morning'
        ? { start: '06:00', end: '14:00' }
        : slotType === 'evening'
          ? { start: '16:00', end: '23:30' }
          : { start: '06:00', end: '23:30' };

      const newBlock: IServiceSlotBooking = {
        id: `slot_blk_${Date.now()}`,
        vendor_id: vendorId,
        venue_id: venueId || 'ven_kohinoor_01',
        event_date: eventDate,
        slot_type: slotType,
        start_time: timeWindow.start,
        end_time: timeWindow.end,
        status: 'blocked_by_vendor',
        host_name: 'Offline Walk-In / Maintenance',
        created_at: new Date()
      };
      this.slotBookings.push(newBlock);
      this.saveToDisk();
      return newBlock;
    }

    throw new Error('Slot is already available');
  }

  // Vendor Calendar: Get all bookings & blocks for a vendor
  getVendorCalendar(vendorId: string) {
    return this.slotBookings.filter(b => b.vendor_id === vendorId || b.venue_id === 'ven_kohinoor_01');
  }

  // Admin Master Slot Radar: Citywide status of all venues and dates
  getAdminSlotRadar(city?: string, date?: string) {
    const filteredVenues = this.getVenues(city);
    const targetDate = date || '2026-10-15';

    return filteredVenues.map(v => {
      const dayBookings = this.slotBookings.filter(b => b.venue_id === v.id && b.event_date === targetDate);
      const morningBooking = dayBookings.find(b => b.slot_type === 'morning' || b.slot_type === 'full_day');
      const eveningBooking = dayBookings.find(b => b.slot_type === 'evening' || b.slot_type === 'full_day');

      return {
        venue_id: v.id,
        venue_name: v.name,
        city: v.city,
        area: v.area,
        capacity: v.seated_capacity,
        date: targetDate,
        morning: {
          status: morningBooking ? morningBooking.status : 'available',
          host_name: morningBooking?.host_name,
          advance_amount: morningBooking?.advance_amount,
          booking_id: morningBooking?.booking_id
        },
        evening: {
          status: eveningBooking ? eveningBooking.status : 'available',
          host_name: eveningBooking?.host_name,
          advance_amount: eveningBooking?.advance_amount,
          booking_id: eveningBooking?.booking_id
        }
      };
    });
  }

  // Modular Services List
  getServices(category?: string) {
    if (!category || category.toLowerCase() === 'all') {
      return this.services;
    }
    return this.services.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  // Booking Lookup & Checkin Verification Support
  findBookingById(bookingId: string): IServiceSlotBooking | null {
    return this.slotBookings.find(b => b.booking_id === bookingId || b.id === bookingId) || null;
  }

  updateBookingStatus(bookingId: string, status: SlotStatus): boolean {
    const booking = this.findBookingById(bookingId);
    if (!booking) return false;
    booking.status = status;
    this.saveToDisk();
    return true;
  }

  // Admin Master Dynamic Analytics Engine
  getPlatformAnalytics() {
    const confirmedBookings = this.slotBookings.filter(b => b.status === 'booked');
    const baseBookings = 142;
    const activeBookings = baseBookings + confirmedBookings.length;

    const bookedAdvanceSum = confirmedBookings.reduce((sum, b) => sum + (Number(b.advance_amount) || 50000), 0);
    const totalGMV = 1845000 + (bookedAdvanceSum * 4);
    const totalPlatformCommission = Math.round(totalGMV * 0.10);

    const verifiedVendors = this.kycApplications.filter(k => k.status === 'verified').length + 42;
    const pendingKYC = this.kycApplications.filter(k => k.status === 'pending').length;
    const flaggedChatViolations = this.chatViolations.length;
    const openDisputes = this.disputes.filter(d => d.status === 'pending').length;
    const activeSOSAlerts = this.sosAlerts.filter(s => s.status === 'open_broadcast').length;
    const totalMealsRescued = this.foodDonations.reduce((sum, f) => sum + (Number(f.meals) || 0), 0);
    const escrowInCustody = 485000 + bookedAdvanceSum;

    const milestoneTakeRate = totalPlatformCommission;
    const escrowProtectionFees = activeBookings * 799;
    const samagriKitWholesaleMargins = 56000;
    const proVendorSubscriptions = 29970;
    const totalProjectedMonthlyTopLine = milestoneTakeRate + escrowProtectionFees + samagriKitWholesaleMargins + proVendorSubscriptions;

    return {
      activeBookings,
      totalGMV,
      totalPlatformCommission,
      escrowInCustody,
      verifiedVendors,
      pendingKYC,
      flaggedChatViolations,
      openDisputes,
      activeSOSAlerts,
      totalMealsRescued,
      monetizationEngine: {
        milestoneTakeRate,
        escrowProtectionFees,
        samagriKitWholesaleMargins,
        proVendorSubscriptions,
        totalProjectedMonthlyTopLine
      }
    };
  }

  // Annadanam Food Rescue Logistics
  getFoodDonations() {
    return this.foodDonations;
  }

  dispatchFoodPickup(id: string, ngo: string, driverName?: string, driverPhone?: string) {
    let donation = this.foodDonations.find(f => f.id === id);
    if (!donation) {
      donation = {
        id,
        booking_ref: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        venue_name: 'Convention Center',
        city: 'Hyderabad',
        meals: 75,
        food_type: 'Fresh Buffet Surplus',
        assigned_ngo: ngo,
        ngo_contact: '+91 98490 22114',
        driver_name: driverName || 'Suresh Kumar',
        driver_phone: driverPhone || '+91 91234 56789',
        temperature_celsius: 65.0,
        status: 'DISPATCHED',
        pickup_window: '22:30 - 23:15 IST',
        donor_name: 'Verified Host',
        tax_receipt_80g: {
          receipt_no: `80G-${Date.now().toString().slice(-6)}`,
          eligible_amount: 11250,
          exemption_section: 'Section 80G(5)(vi) of IT Act, 1961',
          certificate_url: 'https://eventwise.in/tax/sample-80g.pdf'
        },
        created_at: new Date().toISOString()
      };
      this.foodDonations.unshift(donation);
    } else {
      donation.assigned_ngo = ngo;
      if (driverName) donation.driver_name = driverName;
      if (driverPhone) donation.driver_phone = driverPhone;
      donation.status = 'DISPATCHED';
    }
    this.saveToDisk();
    return donation;
  }

  updateFoodPickupStatus(id: string, status: string, temperature?: number) {
    const donation = this.foodDonations.find(f => f.id === id);
    if (donation) {
      donation.status = status;
      if (temperature !== undefined && !isNaN(temperature)) {
        donation.temperature_celsius = temperature;
      }
      this.saveToDisk();
      return donation;
    }
    return null;
  }

  // Anti-Circumvention Chat Audit Logs & Sanctions
  getChatViolations() {
    return this.chatViolations;
  }

  executeChatAction(id: string, action: 'warn' | 'fine' | 'suspend', notes?: string) {
    const violation = this.chatViolations.find(v => v.id === id);
    if (!violation) throw new Error('Violation not found');
    if (action === 'warn') {
      violation.status = 'warned';
      violation.admin_notes = notes || 'Formal anti-circumvention warning issued to both parties.';
    } else if (action === 'fine') {
      violation.status = 'fine_deducted';
      violation.fine_amount = 2500;
      violation.admin_notes = notes || '₹2,500 security deposit liquidated into escrow clawback ledger.';
      this.escrowLedger.unshift({
        id: `tx_fine_${Date.now()}`,
        transaction_ref: `TXN-FINE-${Date.now().toString().slice(-6)}`,
        booking_id: 'BK-CIRCUMVENT-FINE',
        host_name: violation.sender_name,
        vendor_name: violation.receiver_name,
        service_category: 'compliance_penalty',
        type: 'DISPUTE_CLAWBACK',
        direction: 'DEBIT',
        amount: 2500,
        currency: 'INR',
        nodal_bank: 'HDFC RBI Nodal Account #••••9812',
        status: 'CLAWED_BACK',
        timestamp: new Date().toISOString(),
        notes: `Sanction: ₹2,500 compliance penalty deducted for ${violation.violation_type}`
      });
    } else if (action === 'suspend') {
      violation.status = 'suspended';
      violation.admin_notes = notes || 'Account suspended for repeated off-platform circumvention.';
    }
    this.saveToDisk();
    return violation;
  }

  // RBI Nodal Escrow Double-Entry Accounting Ledger
  getEscrowLedger() {
    const totalHeld = this.escrowLedger
      .filter(t => t.status === 'HELD_IN_ESCROW')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) + 485000;
    const totalDisbursed = this.escrowLedger
      .filter(t => t.status === 'SETTLED' && t.direction === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalCommissions = this.escrowLedger
      .filter(t => t.type === 'PLATFORM_COMMISSION')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) + 184500;

    return {
      nodal_account: 'HDFC Bank RBI Nodal Escrow A/C # 50200088192031 (IFSC: HDFC0000042)',
      nodal_reserve_balance: totalHeld,
      total_settled_disbursements: totalDisbursed,
      total_platform_commissions: totalCommissions,
      compliance_standard: 'RBI Directions on Regulation of Payment Aggregators & Gateways (DPSS.CO.PD.No.1810/02.14.008/2019-20)',
      transactions: this.escrowLedger
    };
  }

  // Admin Master Slot Override (Force-Lock or Release)
  adminOverrideSlot(venueId: string, eventDate: string, slotType: SlotType, action: 'force_lock' | 'force_release', reason?: string) {
    const existingIndex = this.slotBookings.findIndex(b =>
      b.venue_id === venueId &&
      b.event_date === eventDate &&
      (b.slot_type === slotType || b.slot_type === 'full_day' || slotType === 'full_day')
    );

    if (action === 'force_lock') {
      if (existingIndex >= 0) {
        this.slotBookings[existingIndex].status = 'blocked_by_vendor';
        this.slotBookings[existingIndex].host_name = reason || 'Admin Priority Lock / Maintenance';
        this.saveToDisk();
        return this.slotBookings[existingIndex];
      } else {
        const venue = this.getVenueById(venueId);
        const timeWindow = slotType === 'morning'
          ? { start: '06:00', end: '14:00' }
          : slotType === 'evening'
            ? { start: '16:00', end: '23:30' }
            : { start: '06:00', end: '23:30' };

        const newLock: IServiceSlotBooking = {
          id: `slot_adm_lock_${Date.now()}`,
          vendor_id: venue?.vendor_id || 'vnd_royal_banquet',
          venue_id: venueId,
          event_date: eventDate,
          slot_type: slotType,
          start_time: timeWindow.start,
          end_time: timeWindow.end,
          status: 'blocked_by_vendor',
          host_name: reason || 'Admin Priority Lock / Protocol Hold',
          created_at: new Date()
        };
        this.slotBookings.push(newLock);
        this.saveToDisk();
        return newLock;
      }
    } else {
      // force_release
      if (existingIndex >= 0) {
        const removed = this.slotBookings.splice(existingIndex, 1)[0];
        this.saveToDisk();
        return { ...removed, status: 'available' };
      }
      return { venue_id: venueId, event_date: eventDate, slot_type: slotType, status: 'available' };
    }
  }
}

export const SlotRepository = new SlotStore();
