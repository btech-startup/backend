import { query } from '../config/db';
import { IFoodDonationPickup } from '../types/index';

export class FoodDonationRepository {
  static async createPickup(data: {
    booking_id: string;
    estimated_meals_count: number;
    food_type: string;
    assigned_ngo_name?: string;
  }): Promise<IFoodDonationPickup> {
    const ngo = data.assigned_ngo_name || 'Robin Hood Army (Food Rescue Unit)';
    const volunteerPhone = '+9198765XXXXX';

    const res = await query(
      `INSERT INTO food_donation_pickups (
        booking_id, estimated_meals_count, food_type, assigned_ngo_name, volunteer_phone_masked, pickup_status
      ) VALUES ($1, $2, $3, $4, $5, 'dispatched')
      RETURNING *`,
      [data.booking_id, data.estimated_meals_count, data.food_type, ngo, volunteerPhone]
    );

    return res.rows[0];
  }

  static async findAllPickups(): Promise<IFoodDonationPickup[]> {
    const res = await query('SELECT * FROM food_donation_pickups ORDER BY created_at DESC');
    return res.rows;
  }
}
