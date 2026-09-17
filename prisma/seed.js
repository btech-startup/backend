"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMPLE_VENDORS = void 0;
exports.seed = seed;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.SAMPLE_VENDORS = [
    {
        id: '70421caf-a7ef-4cad-9960-48ba6fabf7a7',
        phone: '+919876500001',
        email: 'contact@royalgrandevents.com',
        ownerName: 'Vikram Sharma',
        businessName: 'Royal Grand Decorators & Events',
        category: 'DECORATION',
        bio: 'Premier luxury wedding and event decorators with 10+ years of royal theme creations, bespoke floral backdrops, and LED grand stages.',
        experienceYears: 10,
        address: '42 MG Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 4.9,
        reviewCount: 48,
        profileImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX5544',
            aadhaarName: 'Vikram Sharma',
            aadhaarVerified: true,
            panNumber: 'ABCDE1234F',
            panHolderName: 'Vikram Sharma',
            panVerified: true,
            bankAccountNumber: 'XXXXXX0192',
            bankIfsc: 'HDFC0001234',
            bankAccountName: 'Royal Grand Events PVT LTD',
            bankName: 'HDFC Bank',
            upiId: 'royalgrand@okhdfcbank',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-royal-decor-01',
                title: 'Royal Grand Mandap & Floral Stage Decor Package',
                category: 'DECORATION',
                description: 'Exquisite imported fresh floral backdrop, illuminated red carpet walkway, LED entrance arch, and royal velvet bride-groom seating.',
                price: 85000,
                pricingUnit: 'PER_EVENT',
                inclusions: JSON.stringify([
                    'Exotic imported floral stage backdrop (35ft x 15ft)',
                    'Grand red carpet walkway with 12 floral lit pillars',
                    'Warm ambient spotlights and fairy-light crystal chandeliers',
                    'Royal velvet bride & groom banquet seating chairs',
                    'Entrance gate welcome floral arch with personalized monogram',
                ]),
                terms: '30% advance deposit to secure date, 50% on setup morning, 20% on event conclusion.',
                isActive: true,
            },
            {
                id: 'pc-royal-decor-02',
                title: 'Sangeet & Cocktail Night Neon Glow Setup',
                category: 'DECORATION',
                description: 'Vibrant party decor with customized neon signboards, LED dance floor trussing, photo booth, and contemporary lounge seating.',
                price: 55000,
                pricingUnit: 'PER_EVENT',
                inclusions: JSON.stringify([
                    'Custom LED neon signages with couple hashtag',
                    'High-gloss acrylic dance floor with stage lighting',
                    '2 Interactive selfie booths with props & ring lights',
                    'Boho lounge bar backdrop with ambient uplighting',
                ]),
                terms: '40% advance booking deposit, balance upon setup completion.',
                isActive: true,
            },
        ],
    },
    {
        id: '81b23cdf-b8ef-4dac-8871-59cb7eabf8b8',
        phone: '+919876500002',
        email: 'info@saffronspicecatering.com',
        ownerName: 'Rajesh Kulkarni',
        businessName: 'Saffron Spice Caterers & Banquets',
        category: 'CATERING',
        bio: 'Authentic multi-cuisine gourmet catering specializing in North Indian, South Indian, Mughlai, and live international street food counters.',
        experienceYears: 14,
        address: '15 Link Road, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 4.8,
        reviewCount: 62,
        profileImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX8811',
            aadhaarName: 'Rajesh Kulkarni',
            aadhaarVerified: true,
            panNumber: 'BKUPK4589M',
            panHolderName: 'Rajesh Kulkarni',
            panVerified: true,
            bankAccountNumber: 'XXXXXX5521',
            bankIfsc: 'ICIC0000104',
            bankAccountName: 'Saffron Spice Banquets LLP',
            bankName: 'ICICI Bank',
            upiId: 'saffronspice@icici',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-saffron-cat-01',
                title: 'Grand Royal Wedding Buffet Feast (Veg & Non-Veg)',
                category: 'CATERING',
                description: 'Sumptuous 5-course feast featuring 8 starters, 4 live gourmet counters, 12 main courses, and 6 artisan desserts.',
                price: 1250,
                pricingUnit: 'PER_PLATE',
                inclusions: JSON.stringify([
                    '8 Welcome drinks & mocktail counter',
                    'Live Chaat & Woodfired Pizza station',
                    'Awadhi Dum Biryani & Dal Makhani royal spread',
                    'Artisan dessert studio with hot jalebi & rabdi',
                    'Professional uniformed waitstaff and fine bone china setup',
                ]),
                terms: 'Minimum 200 guests guarantee. 25% booking advance, 50% one week prior, 25% on event day.',
                isActive: true,
            },
        ],
    },
    {
        id: '92c34def-c9fa-4ebd-9982-60dc8fbca9c9',
        phone: '+919876500003',
        email: 'bookings@pixelcraftweddings.com',
        ownerName: 'Arjun Mehra',
        businessName: 'PixelCraft Luxury Wedding Photography',
        category: 'PHOTOGRAPHY',
        bio: 'Award-winning candid wedding storytellers, cinematography masters, and aerial 4K drone pilots preserving timeless memories.',
        experienceYears: 8,
        address: '88 Hauz Khas Village',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110016',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 5.0,
        reviewCount: 39,
        profileImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX3322',
            aadhaarName: 'Arjun Mehra',
            aadhaarVerified: true,
            panNumber: 'ARJPM9921D',
            panHolderName: 'Arjun Mehra',
            panVerified: true,
            bankAccountNumber: 'XXXXXX4489',
            bankIfsc: 'SBIN0000691',
            bankAccountName: 'PixelCraft Studios',
            bankName: 'State Bank of India',
            upiId: 'pixelcraft@oksbi',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-pixelcraft-01',
                title: 'Cinematic 3-Day Wedding Photography & Film Package',
                category: 'PHOTOGRAPHY',
                description: 'Full coverage of Mehendi, Sangeet, and Wedding by 2 candid photographers, 2 traditional cinematographers, and 1 drone specialist.',
                price: 150000,
                pricingUnit: 'PER_EVENT',
                inclusions: JSON.stringify([
                    '2 Senior Candid Photographers + 2 Cinematic Videographers',
                    '4K Drone aerial cinematic coverage',
                    '3-minute teaser film + 30-minute cinematic feature film',
                    '2 Premium handcrafted leather albums (300 pages total)',
                    'All high-resolution edited photos delivered on private cloud gallery',
                ]),
                terms: '30% booking advance, 50% during wedding days, 20% upon delivery of finished albums.',
                isActive: true,
            },
        ],
    },
    {
        id: 'a3d45ef0-da0b-4fce-aa93-71ed90cdba0a',
        phone: '+919876500004',
        email: 'events@soundwavedj.in',
        ownerName: 'Kabir Varma',
        businessName: 'SoundWave DJ & Stage Production',
        category: 'SOUND_DJ',
        bio: 'High-energy club & wedding DJ setup with concert-grade JBL line-array sound, intelligent Martin beam moving heads, CO2 jets, and dry-ice fog.',
        experienceYears: 7,
        address: '77 Jubilee Hills, Road No. 36',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 4.7,
        reviewCount: 31,
        profileImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX9900',
            aadhaarName: 'Kabir Varma',
            aadhaarVerified: true,
            panNumber: 'KBVRM3312Q',
            panHolderName: 'Kabir Varma',
            panVerified: true,
            bankAccountNumber: 'XXXXXX7733',
            bankIfsc: 'UTIB0000512',
            bankAccountName: 'SoundWave Productions',
            bankName: 'Axis Bank',
            upiId: 'soundwave@axisbank',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-soundwave-01',
                title: 'Concert Grade Sangeet & Reception DJ Rig',
                category: 'SOUND_DJ',
                description: 'JBL VRX line array sound system, 12 moving head beams, LED DJ console, dual CO2 blast cannons, and heavy dry-ice cloud fog for couple entry.',
                price: 45000,
                pricingUnit: 'PER_EVENT',
                inclusions: JSON.stringify([
                    'Celebrity Wedding DJ + Emcee / Host',
                    'JBL Line-array audio system (suitable for 800+ guests)',
                    '12 Intelligent moving beam lights with DMX controller',
                    'Dual CO2 cryo jets & low-lying heavy dry-ice fog',
                ]),
                terms: '50% advance on date locking, 50% post sound-check before event starts.',
                isActive: true,
            },
        ],
    },
    {
        id: 'b4e56f01-eb1c-40df-bb04-82fe01deca1b',
        phone: '+919876500005',
        email: 'ananya.glamour@gmail.com',
        ownerName: 'Ananya Sen',
        businessName: 'Glamour Bridal Artistry by Ananya',
        category: 'MAKEUP_ARTIST',
        bio: 'Certified international celebrity bridal makeup artist specializing in HD Airbrush makeup, glass-skin finishes, and traditional bridal styling.',
        experienceYears: 6,
        address: '12 Lavelle Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 4.9,
        reviewCount: 54,
        profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX2244',
            aadhaarName: 'Ananya Sen',
            aadhaarVerified: true,
            panNumber: 'ASENP1198C',
            panHolderName: 'Ananya Sen',
            panVerified: true,
            bankAccountNumber: 'XXXXXX8891',
            bankIfsc: 'KKBK0008056',
            bankAccountName: 'Ananya Sen Artistry',
            bankName: 'Kotak Mahindra Bank',
            upiId: 'ananya.sen@kotak',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-glamour-01',
                title: 'Luxury HD Airbrush Bridal Signature Look',
                category: 'MAKEUP_ARTIST',
                description: 'Complete bridal makeover including Temptu HD Airbrush base, MAC & Charlotte Tilbury products, bridal hairstyling, saree/lehenga draping, and flower setting.',
                price: 28000,
                pricingUnit: 'PER_EVENT',
                inclusions: JSON.stringify([
                    'Temptu 4K HD Airbrush base with 16-hour sweat resistance',
                    'Bridal hairstyling with hair extensions & fresh floral styling',
                    'Lehenga/Saree draping & jewelry placement',
                    'Premium mink eyelash extensions and colored lenses',
                    'Free trial makeup session prior to wedding date',
                ]),
                terms: '50% advance booking deposit, balance upon completion of bridal styling on wedding day.',
                isActive: true,
            },
        ],
    },
    {
        id: 'c5f67012-fc2d-41e0-cc15-930f12efdb2c',
        phone: '+919876500006',
        email: 'reservations@grandheritagepalace.com',
        ownerName: 'Mahip Singh',
        businessName: 'The Grand Heritage Palace & Lawns',
        category: 'VENUE',
        bio: 'Palatial luxury heritage destination venue featuring 40,000 sq.ft manicured royal lawns, central marble fountain court, and 24 deluxe guest suites.',
        experienceYears: 18,
        address: 'NH-8, Amer Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302028',
        status: 'VERIFIED',
        onboardingStep: 'COMPLETED',
        rating: 5.0,
        reviewCount: 78,
        profileImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=60',
        portfolioUrls: JSON.stringify([
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=60',
        ]),
        kyc: {
            aadhaarNumber: 'XXXXXXXX7766',
            aadhaarName: 'Mahip Singh',
            aadhaarVerified: true,
            panNumber: 'MSHPR8845J',
            panHolderName: 'Mahip Singh',
            panVerified: true,
            bankAccountNumber: 'XXXXXX3311',
            bankIfsc: 'BARB0JAIPUR',
            bankAccountName: 'Grand Heritage Resorts Private Limited',
            bankName: 'Bank of Baroda',
            upiId: 'grandheritage@barodampay',
            bankVerified: true,
            isFullyVerified: true,
        },
        priceCards: [
            {
                id: 'pc-venue-01',
                title: 'Complete Palace Wedding Lawn & 20 Suites (Full Day Buyout)',
                category: 'VENUE',
                description: 'Exclusive 24-hour palace buyout including 40,000 sq.ft royal wedding lawn, central heritage banquet hall, and 20 luxury guest rooms with complimentary breakfast.',
                price: 350000,
                pricingUnit: 'PER_DAY',
                inclusions: JSON.stringify([
                    '40,000 sq.ft Royal Celebration Lawn (up to 1,500 guests)',
                    'Central AC Banquet Hall (8,000 sq.ft) with royal chandeliers',
                    '20 Deluxe Heritage Palace rooms for 2 nights for family',
                    'Dedicated valet parking area for 250 cars',
                    'Complete 100% generator power backup and venue cleaning team',
                ]),
                terms: '30% advance on slot booking, 50% 30 days prior, 20% on check-in morning.',
                isActive: true,
            },
        ],
    },
];
async function seed() {
    console.log('🌱 Starting Database Seeding with Rich Sample Vendors...');
    for (const vData of exports.SAMPLE_VENDORS) {
        const { kyc, priceCards, ...vendorFields } = vData;
        // Upsert Vendor
        const vendor = await prisma.vendor.upsert({
            where: { phone: vendorFields.phone },
            update: {
                ...vendorFields,
            },
            create: {
                ...vendorFields,
            },
        });
        // Upsert KYC with Banking Details & UPI
        await prisma.vendorKyc.upsert({
            where: { vendorId: vendor.id },
            update: {
                ...kyc,
                aadhaarVerifiedAt: new Date(),
                panVerifiedAt: new Date(),
                bankVerifiedAt: new Date(),
            },
            create: {
                vendorId: vendor.id,
                ...kyc,
                aadhaarVerifiedAt: new Date(),
                panVerifiedAt: new Date(),
                bankVerifiedAt: new Date(),
            },
        });
        // Upsert Price Cards
        for (const pc of priceCards) {
            await prisma.priceCard.upsert({
                where: { id: pc.id },
                update: {
                    ...pc,
                    vendorId: vendor.id,
                },
                create: {
                    ...pc,
                    vendorId: vendor.id,
                },
            });
        }
        console.log(`✅ Seeded Vendor: [${vendor.category}] ${vendor.businessName} (Phone: ${vendor.phone})`);
    }
    // Seed a sample deal with Chatbot negotiation history for the first vendor
    const firstVendor = await prisma.vendor.findFirst({
        where: { phone: '+919876500001' },
        include: { priceCards: true, kyc: true },
    });
    if (firstVendor && firstVendor.priceCards.length > 0) {
        const targetPriceCard = firstVendor.priceCards[0];
        const sampleDealId = 'deal-sample-wedding-royal-01';
        const sampleChatHistory = [
            {
                sender: 'USER',
                message: "Hi! I'm planning my wedding for 15th December 2026 with 500 guests. The Royal Mandap package looks great! Can you offer any discount if we confirm today?",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                sender: 'CHATBOT',
                message: `Hello Aisha! 🎉 Congratulations on your upcoming wedding! The "${targetPriceCard.title}" by Royal Grand Decorators is one of our top-rated setups. The standard package price is ₹85,000. As an exclusive seasonal booking offer, I can offer an instant 10% discount bringing the total to ₹76,500! Would this fit your wedding decor budget?`,
                timestamp: new Date(Date.now() - 3400000).toISOString(),
            },
            {
                sender: 'USER',
                message: 'Could you make it ₹75,000 and include 2 extra floral pillars for the stage entrance?',
                timestamp: new Date(Date.now() - 3200000).toISOString(),
            },
            {
                sender: 'CHATBOT',
                message: 'Great news! I consulted the vendor agreement parameters: We can lock in ₹75,000 (total 11.7% discount) with the 2 additional entrance floral pillars included as a complimentary upgrade! Deal is ready for acceptance. You can secure the date with a 30% advance deposit (₹22,500).',
                timestamp: new Date(Date.now() - 3000000).toISOString(),
            },
        ];
        const samplePaymentDetails = {
            dealAmount: 75000,
            originalAmount: 85000,
            discountGiven: 10000,
            discountPercent: 11.76,
            advancePercentage: 30,
            advancePayable: 22500,
            remainingPayable: 52500,
            currency: 'INR',
            bankingSettlement: {
                accountHolderName: firstVendor.kyc?.bankAccountName || 'Royal Grand Events PVT LTD',
                bankName: firstVendor.kyc?.bankName || 'HDFC Bank',
                ifscCode: firstVendor.kyc?.bankIfsc || 'HDFC0001234',
                accountNumberMasked: firstVendor.kyc?.bankAccountNumber || 'XXXXXX0192',
                upiId: firstVendor.kyc?.upiId || 'royalgrand@okhdfcbank',
            },
            paymentTerms: '30% advance on booking, 70% post installation on event morning.',
        };
        await prisma.deal.upsert({
            where: { id: sampleDealId },
            update: {
                vendorId: firstVendor.id,
                priceCardId: targetPriceCard.id,
                clientName: 'Aisha Kapoor',
                clientPhone: '+919811122233',
                clientEmail: 'aisha.kapoor@example.com',
                eventType: 'Wedding & Reception',
                eventDate: '2026-12-15',
                guestCount: 500,
                originalPrice: 85000,
                offeredPrice: 75000,
                agreedPrice: 75000,
                discountPercent: 11.76,
                status: 'DEAL_ACCEPTED',
                chatHistory: JSON.stringify(sampleChatHistory),
                paymentDetails: JSON.stringify(samplePaymentDetails),
            },
            create: {
                id: sampleDealId,
                vendorId: firstVendor.id,
                priceCardId: targetPriceCard.id,
                clientName: 'Aisha Kapoor',
                clientPhone: '+919811122233',
                clientEmail: 'aisha.kapoor@example.com',
                eventType: 'Wedding & Reception',
                eventDate: '2026-12-15',
                guestCount: 500,
                originalPrice: 85000,
                offeredPrice: 75000,
                agreedPrice: 75000,
                discountPercent: 11.76,
                status: 'DEAL_ACCEPTED',
                chatHistory: JSON.stringify(sampleChatHistory),
                paymentDetails: JSON.stringify(samplePaymentDetails),
            },
        });
        console.log(`✅ Seeded Sample Deal & Chatbot Negotiation: ${sampleDealId}`);
    }
    console.log('🎉 Database seeding completed successfully!\n');
}
// Execute if run directly via CLI
if (require.main === module) {
    seed()
        .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
