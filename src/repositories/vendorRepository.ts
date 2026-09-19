import { query } from '../config/db';
import { IVendor, IVendorService, ServiceCategory } from '../types/index';

export class VendorRepository {
  static async findByUserId(userId: string): Promise<IVendor | null> {
    try {
      const res = await query('SELECT * FROM vendors WHERE user_id = $1', [userId]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  static async findById(id: string): Promise<IVendor | null> {
    try {
      const res = await query('SELECT * FROM vendors WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  static async findAll(category?: ServiceCategory): Promise<IVendor[]> {
    let sql = 'SELECT * FROM vendors WHERE is_kyc_verified = TRUE';
    const params: any[] = [];
    if (category) {
      sql += ' AND category = $1';
      params.push(category);
    }
    const res = await query(sql, params);
    return res.rows;
  }

  static async createKYC(vendorData: {
    user_id: string;
    business_name: string;
    category: ServiceCategory;
    aadhaar_masked: string;
    gstin?: string;
    bank_account_number: string;
    bank_ifsc: string;
    virtual_payment_address: string;
  }): Promise<IVendor> {
    const res = await query(
      `INSERT INTO vendors (user_id, business_name, category, aadhaar_masked, gstin, bank_account_number, bank_ifsc, virtual_payment_address, is_kyc_verified, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
       RETURNING *`,
      [
        vendorData.user_id,
        vendorData.business_name,
        vendorData.category,
        vendorData.aadhaar_masked,
        vendorData.gstin || null,
        vendorData.bank_account_number,
        vendorData.bank_ifsc,
        vendorData.virtual_payment_address,
      ]
    );
    return res.rows[0];
  }

  static async addService(serviceData: {
    vendor_id: string;
    title: string;
    description: string;
    base_price: number;
    price_unit: string;
    max_capacity?: number;
  }): Promise<IVendorService> {
    const res = await query(
      `INSERT INTO vendor_services (vendor_id, title, description, base_price, price_unit, max_capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        serviceData.vendor_id,
        serviceData.title,
        serviceData.description,
        serviceData.base_price,
        serviceData.price_unit,
        serviceData.max_capacity || null,
      ]
    );
    return res.rows[0];
  }

  static async getServicesByVendorId(vendorId: string): Promise<IVendorService[]> {
    const res = await query('SELECT * FROM vendor_services WHERE vendor_id = $1', [vendorId]);
    return res.rows;
  }
}
