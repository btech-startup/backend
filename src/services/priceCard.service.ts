import { prisma } from '../lib/prisma';
import { PricingUnit } from '../types';

export interface CreatePriceCardDto {
  title: string;
  category?: string;
  description?: string;
  price: number;
  pricingUnit?: PricingUnit;
  inclusions?: string[];
  terms?: string;
  isActive?: boolean;
}

export interface UpdatePriceCardDto {
  title?: string;
  category?: string;
  description?: string;
  price?: number;
  pricingUnit?: PricingUnit;
  inclusions?: string[];
  terms?: string;
  isActive?: boolean;
}

export class PriceCardService {
  /**
   * Creates a new price card package for the vendor
   */
  public static async createPriceCard(
    vendorId: string,
    data: CreatePriceCardDto
  ): Promise<any> {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const priceCard = await prisma.priceCard.create({
      data: {
        vendorId,
        title: data.title.trim(),
        category: data.category?.trim() || vendor.category || 'General',
        description: data.description?.trim(),
        price: data.price,
        pricingUnit: data.pricingUnit || PricingUnit.PER_EVENT,
        inclusions: data.inclusions ? JSON.stringify(data.inclusions) : JSON.stringify([]),
        terms: data.terms?.trim(),
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return {
      ...priceCard,
      inclusions: priceCard.inclusions ? JSON.parse(priceCard.inclusions) : [],
    };
  }

  /**
   * Retrieves all price cards for a specific vendor
   */
  public static async getVendorPriceCards(vendorId: string): Promise<any[]> {
    const cards = await prisma.priceCard.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });

    return cards.map((card) => ({
      ...card,
      inclusions: card.inclusions ? JSON.parse(card.inclusions) : [],
    }));
  }

  /**
   * Retrieves a single price card by ID for the vendor
   */
  public static async getPriceCardById(
    vendorId: string,
    priceCardId: string
  ): Promise<any> {
    const card = await prisma.priceCard.findFirst({
      where: {
        id: priceCardId,
        vendorId,
      },
    });

    if (!card) {
      throw new Error('Price card not found or unauthorized access');
    }

    return {
      ...card,
      inclusions: card.inclusions ? JSON.parse(card.inclusions) : [],
    };
  }

  /**
   * Updates an existing price card
   */
  public static async updatePriceCard(
    vendorId: string,
    priceCardId: string,
    data: UpdatePriceCardDto
  ): Promise<any> {
    const existing = await prisma.priceCard.findFirst({
      where: {
        id: priceCardId,
        vendorId,
      },
    });

    if (!existing) {
      throw new Error('Price card not found or unauthorized access');
    }

    const updated = await prisma.priceCard.update({
      where: { id: priceCardId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.pricingUnit !== undefined && { pricingUnit: data.pricingUnit }),
        ...(data.inclusions !== undefined && {
          inclusions: JSON.stringify(data.inclusions),
        }),
        ...(data.terms !== undefined && { terms: data.terms?.trim() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return {
      ...updated,
      inclusions: updated.inclusions ? JSON.parse(updated.inclusions) : [],
    };
  }

  /**
   * Deletes a price card package
   */
  public static async deletePriceCard(
    vendorId: string,
    priceCardId: string
  ): Promise<{ success: boolean; message: string }> {
    const existing = await prisma.priceCard.findFirst({
      where: {
        id: priceCardId,
        vendorId,
      },
    });

    if (!existing) {
      throw new Error('Price card not found or unauthorized access');
    }

    await prisma.priceCard.delete({
      where: { id: priceCardId },
    });

    return {
      success: true,
      message: 'Price card deleted successfully',
    };
  }

  /**
   * Public retrieval of active price cards for clients / organizers
   */
  public static async getPublicVendorPriceCards(vendorId: string): Promise<any> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        category: true,
        city: true,
        status: true,
        profileImage: true,
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const cards = await prisma.priceCard.findMany({
      where: {
        vendorId,
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });

    return {
      vendor,
      priceCards: cards.map((c) => ({
        ...c,
        inclusions: c.inclusions ? JSON.parse(c.inclusions) : [],
      })),
    };
  }
}
