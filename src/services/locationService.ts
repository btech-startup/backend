import { LocationRepository } from '../repositories/locationRepository';
import { calculateHaversineDistance } from '../utils/geofence';

export class LocationService {
  static async trackVendorLocation(vendorId: string, latitude: number, longitude: number) {
    return await LocationRepository.upsertVendorLocation(vendorId, latitude, longitude);
  }

  static async getVendorLocation(vendorId: string) {
    return await LocationRepository.getVendorLocation(vendorId);
  }

  static async getNearbyVendors(latitude: number, longitude: number, radiusKm: number, category?: string) {
    return await LocationRepository.findNearbyVendors(latitude, longitude, radiusKm, category);
  }

  static async getCheckinHistory(vendorId: string) {
    return await LocationRepository.getCheckinsByVendor(vendorId);
  }

  static async getBookingCheckinStatus(bookingId: string) {
    return await LocationRepository.getCheckinByBooking(bookingId);
  }

  static async calculateETA(vendorLat: number, vendorLng: number, venueLat: number, venueLng: number) {
    const distanceKm = calculateHaversineDistance(vendorLat, vendorLng, venueLat, venueLng);
    const averageSpeedKmh = 40; // Assuming 40 km/h average speed in city traffic
    const timeHours = distanceKm / averageSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      etaMinutes: timeMinutes > 0 ? timeMinutes : 1
    };
  }
}
