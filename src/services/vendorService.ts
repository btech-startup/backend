import { VendorRepository } from '../repositories/vendorRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { ServiceCategory } from '../types/index';

export class VendorService {
  static async submitKYC(
    userId: string,
    data: {
      business_name: string;
      category: ServiceCategory;
      aadhaar_masked: string;
      gstin?: string;
      bank_account_number: string;
      bank_ifsc: string;
      virtual_payment_address: string;
    }
  ) {
    return VendorRepository.createKYC({
      user_id: userId,
      ...data,
    });
  }

  static async addCatalogService(
    userId: string,
    serviceData: {
      title: string;
      description: string;
      base_price: number;
      price_unit: string;
      max_capacity?: number;
    }
  ) {
    const vendor = await VendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new Error('Vendor profile not found. Complete KYC first.');
    }

    return VendorRepository.addService({
      vendor_id: vendor.id,
      ...serviceData,
    });
  }

  static async getVendorPayouts(userId: string) {
    const vendor = await VendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const bookings = await BookingRepository.findByVendorId(vendor.id);
    const lockedEscrow = bookings.reduce((sum, b) => sum + Number(b.net_payable_amount || 0), 0);

    return {
      vendorId: vendor.id,
      virtualPaymentAddress: vendor.virtual_payment_address,
      lockedEscrowBalance: lockedEscrow,
      inTransitPayouts: Math.round(lockedEscrow * 0.50),
      withdrawableBalance: Math.round(lockedEscrow * 0.20),
    };
  }
}
