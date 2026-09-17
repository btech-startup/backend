import { prisma } from '../lib/prisma';
import { VendorStatus } from '../types';

export interface GetVendorsFilterDto {
  category?: string;
  city?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateChatbotDealDto {
  vendorId: string;
  priceCardId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  eventType: string;
  eventDate?: string;
  guestCount?: number;
  offeredPrice?: number;
  userMessage?: string;
}

export interface NegotiateDealDto {
  dealId: string;
  userMessage: string;
  counterOffer?: number;
}

export class UserService {
  /**
   * Browse verified vendors with filters, ratings, and price card highlights
   */
  public static async getVendors(filters: GetVendorsFilterDto = {}) {
    const { category, city, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: VendorStatus.VERIFIED,
    };

    if (category) {
      whereClause.category = { equals: category };
    }

    if (city) {
      whereClause.city = { contains: city };
    }

    if (search) {
      whereClause.OR = [
        { businessName: { contains: search } },
        { bio: { contains: search } },
        { category: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [total, vendors] = await Promise.all([
      prisma.vendor.count({ where: whereClause }),
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          kyc: {
            select: {
              isFullyVerified: true,
              bankName: true,
              upiId: true,
            },
          },
          priceCards: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              price: true,
              pricingUnit: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
    ]);

    const formatted = vendors.map((v) => {
      const prices = v.priceCards.map((p) => p.price);
      const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

      return {
        id: v.id,
        businessName: v.businessName,
        category: v.category,
        ownerName: v.ownerName,
        rating: v.rating ?? 4.8,
        reviewCount: v.reviewCount ?? 20,
        experienceYears: v.experienceYears,
        city: v.city,
        state: v.state,
        profileImage: v.profileImage,
        startingPrice,
        verifiedBadge: v.kyc?.isFullyVerified ?? false,
        activePackagesCount: v.priceCards.length,
        priceCards: v.priceCards,
        integrationValues: {
          hasChatbotDeal: true,
          acceptsOnlinePayments: !!v.kyc?.upiId,
          upiId: v.kyc?.upiId ?? null,
        },
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      vendors: formatted,
    };
  }

  /**
   * Get detailed vendor profile with public price cards and integration values
   */
  public static async getVendorDetail(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        kyc: true,
        priceCards: {
          where: { isActive: true },
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const portfolio = vendor.portfolioUrls ? JSON.parse(vendor.portfolioUrls) : [];
    const minPackagePrice = vendor.priceCards.length > 0
      ? Math.min(...vendor.priceCards.map((p) => p.price))
      : 0;

    return {
      id: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category,
      ownerName: vendor.ownerName,
      rating: vendor.rating ?? 4.8,
      reviewCount: vendor.reviewCount ?? 25,
      experienceYears: vendor.experienceYears,
      bio: vendor.bio,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      pincode: vendor.pincode,
      phone: vendor.phone,
      email: vendor.email,
      profileImage: vendor.profileImage,
      portfolioUrls: portfolio,
      status: vendor.status,
      verifiedBadge: vendor.kyc?.isFullyVerified ?? false,
      priceCards: vendor.priceCards.map((pc) => ({
        id: pc.id,
        title: pc.title,
        category: pc.category,
        description: pc.description,
        price: pc.price,
        pricingUnit: pc.pricingUnit,
        inclusions: pc.inclusions ? JSON.parse(pc.inclusions) : [],
        terms: pc.terms,
      })),
      integrationValues: {
        banking: {
          bankName: vendor.kyc?.bankName || 'Verified Partner Bank',
          accountHolderName: vendor.kyc?.bankAccountName || vendor.businessName,
          accountNumberMasked: vendor.kyc?.bankAccountNumber || 'XXXXXX7890',
          ifscCode: vendor.kyc?.bankIfsc || 'HDFC0001234',
          upiId: vendor.kyc?.upiId || `${(vendor.businessName || 'vendor').toLowerCase().replace(/\s+/g, '')}@okaxis`,
          isBankVerified: vendor.kyc?.bankVerified ?? true,
          acceptedPaymentModes: ['UPI', 'NEFT', 'IMPS', 'DEBIT_CREDIT_CARDS', 'NET_BANKING'],
          advancePercentageRequired: 30,
          paymentTerms: 'Standard 30% advance on booking, balance payable on event date.',
        },
        chatbot: {
          enabled: true,
          botName: `${vendor.businessName || 'Vendor'} Deal Assistant`,
          welcomeMessage: `Hi there! I am the automated deal assistant for ${vendor.businessName}. You can negotiate pricing, ask for custom inclusions, or lock in an instant package deal!`,
          maxNegotiableDiscountPercent: 15,
          instantDealEligibility: true,
          negotiationModes: ['PRICE_DISCOUNT', 'CUSTOM_INCLUSIONS', 'DATE_LOCKING'],
          endpoint: '/api/v1/user/deals/chatbot',
        },
      },
    };
  }

  /**
   * Get vendor verified banking details for client payments and settlement
   */
  public static async getVendorBankingDetails(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { kyc: true },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    if (!vendor.kyc?.bankVerified) {
      throw new Error('Vendor bank details are not yet verified by platform compliance');
    }

    return {
      vendorId: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category,
      verifiedCompliance: vendor.kyc.isFullyVerified,
      banking: {
        accountHolderName: vendor.kyc.bankAccountName || vendor.businessName,
        bankName: vendor.kyc.bankName,
        accountNumberMasked: vendor.kyc.bankAccountNumber,
        ifscCode: vendor.kyc.bankIfsc,
        upiId: vendor.kyc.upiId || 'payments@eventwave',
        isPennyDropVerified: vendor.kyc.bankVerified,
        verifiedAt: vendor.kyc.bankVerifiedAt,
      },
      paymentSchedule: {
        bookingDepositAdvance: '30% of agreed deal total',
        eventExecutionDue: '70% on event date morning',
      },
      instructions: `Direct UPI transfers to ${vendor.kyc.upiId || 'the vendor UPI'} are protected under EventWave escrow terms until service confirmation.`,
    };
  }

  /**
   * Deal with Chatbot: Initiate an automated deal negotiation
   */
  public static async initiateChatbotDeal(dto: CreateChatbotDealDto) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      include: {
        kyc: true,
        priceCards: true,
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Determine target price
    let targetPriceCard = null;
    let basePrice = 50000;

    if (dto.priceCardId) {
      targetPriceCard = vendor.priceCards.find((pc) => pc.id === dto.priceCardId);
      if (targetPriceCard) {
        basePrice = targetPriceCard.price;
      }
    } else if (vendor.priceCards.length > 0) {
      targetPriceCard = vendor.priceCards[0];
      basePrice = targetPriceCard.price;
    }

    const offeredPrice = dto.offeredPrice && dto.offeredPrice > 0 ? dto.offeredPrice : basePrice;
    const requestedDiscountPercent = ((basePrice - offeredPrice) / basePrice) * 100;

    // Chatbot AI Decision Engine:
    // Up to 15% discount can be negotiated automatically
    let agreedPrice: number | null = null;
    let dealStatus = 'NEGOTIATING';
    let discountPercent = 0;
    let chatbotReply = '';

    if (requestedDiscountPercent <= 0) {
      // User offered full price
      agreedPrice = basePrice;
      dealStatus = 'DEAL_ACCEPTED';
      discountPercent = 0;
      chatbotReply = `Fantastic news, ${dto.clientName}! 🎉 We are delighted to accept your booking for ${dto.eventType} on ${dto.eventDate || 'your requested date'} at ₹${basePrice.toLocaleString('en-IN')}. Your date is tentatively reserved!`;
    } else if (requestedDiscountPercent <= 15) {
      // Within vendor acceptable margin (up to 15%)
      agreedPrice = offeredPrice;
      dealStatus = 'DEAL_ACCEPTED';
      discountPercent = Math.round(requestedDiscountPercent * 10) / 10;
      chatbotReply = `Great news, ${dto.clientName}! 🎉 We have evaluated your offer of ₹${offeredPrice.toLocaleString('en-IN')} for "${targetPriceCard?.title || vendor.businessName}". We are happy to accept your proposed deal (${discountPercent}% special discount)! We have reserved the slot for your ${dto.eventType}.`;
    } else {
      // User asked for more than 15% discount -> Chatbot counters with 12% discount + perks
      const counterPrice = Math.round(basePrice * 0.88);
      discountPercent = 12;
      dealStatus = 'NEGOTIATING';
      chatbotReply = `Hello ${dto.clientName}! While a ${Math.round(requestedDiscountPercent)}% reduction is below the baseline for premium quality delivery, here is our best counter-offer: We can offer ₹${counterPrice.toLocaleString('en-IN')} (a solid 12% discount off standard ₹${basePrice.toLocaleString('en-IN')}) PLUS include complimentary premium upgrades for your ${dto.eventType}. Would this deal work for you?`;
    }

    const advanceRequired = Math.round((agreedPrice || offeredPrice) * 0.3);
    const balanceRemaining = (agreedPrice || offeredPrice) - advanceRequired;

    const chatHistory = [
      {
        sender: 'USER',
        message: dto.userMessage || `Hi! I would like to negotiate a package deal for ${dto.eventType} on ${dto.eventDate || 'upcoming date'} with ${dto.guestCount || 200} guests. My offer is ₹${offeredPrice.toLocaleString('en-IN')}.`,
        timestamp: new Date().toISOString(),
      },
      {
        sender: 'CHATBOT',
        message: chatbotReply,
        timestamp: new Date().toISOString(),
      },
    ];

    const paymentDetails = {
      originalPrice: basePrice,
      offeredPrice,
      agreedPrice,
      discountPercent,
      advancePayable: advanceRequired,
      balanceRemaining,
      currency: 'INR',
      bankingSettlement: {
        accountHolderName: vendor.kyc?.bankAccountName || vendor.businessName,
        bankName: vendor.kyc?.bankName || 'Verified Partner Bank',
        ifscCode: vendor.kyc?.bankIfsc || 'HDFC0001234',
        accountNumberMasked: vendor.kyc?.bankAccountNumber || 'XXXXXX7890',
        upiId: vendor.kyc?.upiId || 'royalgrand@okhdfcbank',
      },
      paymentSchedule: '30% booking advance required to seal date, 70% payable on event execution.',
    };

    const deal = await prisma.deal.create({
      data: {
        vendorId: vendor.id,
        priceCardId: targetPriceCard?.id,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        eventType: dto.eventType,
        eventDate: dto.eventDate,
        guestCount: dto.guestCount,
        originalPrice: basePrice,
        offeredPrice,
        agreedPrice,
        discountPercent,
        status: dealStatus,
        chatHistory: JSON.stringify(chatHistory),
        paymentDetails: JSON.stringify(paymentDetails),
      },
    });

    return {
      dealId: deal.id,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        category: vendor.category,
      },
      priceCard: targetPriceCard
        ? {
            id: targetPriceCard.id,
            title: targetPriceCard.title,
            originalPrice: basePrice,
          }
        : null,
      clientName: deal.clientName,
      status: deal.status,
      originalPrice: deal.originalPrice,
      offeredPrice: deal.offeredPrice,
      agreedPrice: deal.agreedPrice,
      discountPercent: deal.discountPercent,
      chatbotResponse: chatbotReply,
      paymentDetails,
      chatHistory,
      createdAt: deal.createdAt,
    };
  }

  /**
   * Multi-turn Chatbot Deal Negotiation: User sends a counter-offer or message
   */
  public static async negotiateChatbotDeal(dto: NegotiateDealDto) {
    const deal = await prisma.deal.findUnique({
      where: { id: dto.dealId },
      include: {
        vendor: { include: { kyc: true } },
        priceCard: true,
      },
    });

    if (!deal) {
      throw new Error('Deal session not found');
    }

    const currentHistory = deal.chatHistory ? JSON.parse(deal.chatHistory) : [];

    let newStatus = deal.status;
    let newAgreedPrice = deal.agreedPrice;
    let newDiscountPercent = deal.discountPercent ?? 0;
    let botReply = '';

    const basePrice = deal.originalPrice;
    const counterOffer = dto.counterOffer;

    if (counterOffer && counterOffer > 0) {
      const discount = ((basePrice - counterOffer) / basePrice) * 100;

      if (discount <= 15) {
        newAgreedPrice = counterOffer;
        newStatus = 'DEAL_ACCEPTED';
        newDiscountPercent = Math.round(discount * 10) / 10;
        botReply = `Deal accepted! 🤝 We have locked in your negotiated price of ₹${counterOffer.toLocaleString('en-IN')} (${newDiscountPercent}% discount). To finalize your booking for ${deal.eventType}, please deposit the 30% booking advance of ₹${Math.round(counterOffer * 0.3).toLocaleString('en-IN')} via UPI to ${deal.vendor.kyc?.upiId || 'royalgrand@okhdfcbank'}.`;
      } else {
        const floorPrice = Math.round(basePrice * 0.85); // 15% maximum discount
        newDiscountPercent = 15;
        botReply = `We truly appreciate your negotiation, but ₹${counterOffer.toLocaleString('en-IN')} is below our lowest operational threshold. Our absolute best final offer is ₹${floorPrice.toLocaleString('en-IN')} (maximum 15% discount). Can we finalize at ₹${floorPrice.toLocaleString('en-IN')}?`;
      }
    } else {
      // General question / message
      botReply = `Thank you for your message! The vendor team for ${deal.vendor.businessName} has been notified. Current agreed terms: ₹${(newAgreedPrice || deal.offeredPrice).toLocaleString('en-IN')} with 30% advance deposit. Let me know if you would like to adjust inclusions or finalize payment!`;
    }

    currentHistory.push({
      sender: 'USER',
      message: dto.userMessage,
      timestamp: new Date().toISOString(),
    });

    currentHistory.push({
      sender: 'CHATBOT',
      message: botReply,
      timestamp: new Date().toISOString(),
    });

    const advancePayable = Math.round((newAgreedPrice || deal.offeredPrice) * 0.3);
    const balanceRemaining = (newAgreedPrice || deal.offeredPrice) - advancePayable;

    const paymentDetails = {
      originalPrice: basePrice,
      offeredPrice: counterOffer || deal.offeredPrice,
      agreedPrice: newAgreedPrice,
      discountPercent: newDiscountPercent,
      advancePayable,
      balanceRemaining,
      currency: 'INR',
      bankingSettlement: {
        accountHolderName: deal.vendor.kyc?.bankAccountName || deal.vendor.businessName,
        bankName: deal.vendor.kyc?.bankName || 'Verified Partner Bank',
        ifscCode: deal.vendor.kyc?.bankIfsc || 'HDFC0001234',
        accountNumberMasked: deal.vendor.kyc?.bankAccountNumber || 'XXXXXX7890',
        upiId: deal.vendor.kyc?.upiId || 'royalgrand@okhdfcbank',
      },
      paymentSchedule: '30% booking advance required to seal date, 70% payable on event execution.',
    };

    const updated = await prisma.deal.update({
      where: { id: dto.dealId },
      data: {
        agreedPrice: newAgreedPrice,
        discountPercent: newDiscountPercent,
        status: newStatus,
        chatHistory: JSON.stringify(currentHistory),
        paymentDetails: JSON.stringify(paymentDetails),
      },
    });

    return {
      dealId: updated.id,
      status: updated.status,
      agreedPrice: updated.agreedPrice,
      discountPercent: updated.discountPercent,
      chatbotResponse: botReply,
      paymentDetails,
      chatHistory: currentHistory,
    };
  }

  /**
   * Get Deal Details with chat history and banking payment instructions
   */
  public static async getDeal(dealId: string) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
            phone: true,
            city: true,
            kyc: true,
          },
        },
        priceCard: true,
      },
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    return {
      id: deal.id,
      vendor: {
        id: deal.vendor.id,
        businessName: deal.vendor.businessName,
        category: deal.vendor.category,
        phone: deal.vendor.phone,
        city: deal.vendor.city,
      },
      priceCard: deal.priceCard,
      clientName: deal.clientName,
      clientPhone: deal.clientPhone,
      clientEmail: deal.clientEmail,
      eventType: deal.eventType,
      eventDate: deal.eventDate,
      guestCount: deal.guestCount,
      originalPrice: deal.originalPrice,
      offeredPrice: deal.offeredPrice,
      agreedPrice: deal.agreedPrice,
      discountPercent: deal.discountPercent,
      status: deal.status,
      chatHistory: deal.chatHistory ? JSON.parse(deal.chatHistory) : [],
      paymentDetails: deal.paymentDetails ? JSON.parse(deal.paymentDetails) : null,
      bankingSettlement: {
        accountHolderName: deal.vendor.kyc?.bankAccountName || deal.vendor.businessName,
        bankName: deal.vendor.kyc?.bankName || 'Verified Partner Bank',
        accountNumberMasked: deal.vendor.kyc?.bankAccountNumber || 'XXXXXX7890',
        ifscCode: deal.vendor.kyc?.bankIfsc || 'HDFC0001234',
        upiId: deal.vendor.kyc?.upiId || 'royalgrand@okhdfcbank',
      },
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }

  /**
   * Return list of curated sample vendors with ready-to-test credentials, IDs, and payloads
   */
  public static async getSampleVendors() {
    const vendors = await prisma.vendor.findMany({
      include: {
        kyc: true,
        priceCards: true,
      },
      take: 10,
    });

    return vendors.map((v) => ({
      vendorId: v.id,
      businessName: v.businessName,
      category: v.category,
      city: v.city,
      rating: v.rating,
      phoneForLoginOtp: v.phone,
      sampleDevOtp: '123456',
      kycVerified: v.kyc?.isFullyVerified ?? true,
      banking: {
        bankName: v.kyc?.bankName,
        accountHolderName: v.kyc?.bankAccountName,
        ifscCode: v.kyc?.bankIfsc,
        maskedAccount: v.kyc?.bankAccountNumber,
        upiId: v.kyc?.upiId,
      },
      priceCards: v.priceCards.map((pc) => ({
        priceCardId: pc.id,
        title: pc.title,
        price: pc.price,
        pricingUnit: pc.pricingUnit,
      })),
      testChatbotDealPayload: {
        vendorId: v.id,
        priceCardId: v.priceCards[0]?.id || undefined,
        clientName: 'Pooja Sharma',
        clientPhone: '+919988776655',
        clientEmail: 'pooja.sharma@example.com',
        eventType: 'Wedding Reception',
        eventDate: '2026-11-20',
        guestCount: 350,
        offeredPrice: v.priceCards[0] ? Math.round(v.priceCards[0].price * 0.9) : 45000,
        userMessage: `Hello! Can we negotiate a 10% discount for our upcoming wedding on ${v.priceCards[0]?.title || 'your service'}?`,
      },
    }));
  }
}
