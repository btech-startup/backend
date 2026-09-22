import { prisma } from '../lib/prisma';
import { CalendarDayStatus, CalendarSlotType, CalendarStatus } from '../types';

export interface GetCalendarOptions {
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isPublic?: boolean;
}

export interface BlockDateDto {
  date: string; // YYYY-MM-DD
  endDate?: string; // Optional end date for multi-day range
  title?: string;
  eventType?: string; // "MAINTENANCE", "LEAVE", "EXTERNAL_BOOKING", "BLOCKED"
  notes?: string;
  slotType?: CalendarSlotType;
}

export interface VerifyDateResult {
  vendorId: string;
  businessName: string;
  date: string;
  dayOfWeek: string;
  slotType: CalendarSlotType;
  isAvailable: boolean;
  status: CalendarStatus;
  message: string;
  conflict?: {
    eventType?: string;
    title?: string;
    slotType?: string;
    status?: string;
  } | null;
  suggestedAvailableDates: string[];
}

export class CalendarService {
  /**
   * Helper to format Date to YYYY-MM-DD string
   */
  public static formatDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper to get Day of Week name
   */
  public static getDayOfWeek(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  /**
   * Helper to compute an array of YYYY-MM-DD strings between start and end date (inclusive)
   */
  public static getDateRangeArray(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const [eY, eM, eD] = endDateStr.split('-').map(Number);

    const current = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    // Safeguard to at most 180 days
    let count = 0;
    while (current <= end && count < 180) {
      dates.push(this.formatDateString(current));
      current.setDate(current.getDate() + 1);
      count++;
    }

    return dates;
  }

  /**
   * Retrieve vendor calendar matrix for a month or date range
   */
  public static async getVendorCalendar(vendorId: string, options: GetCalendarOptions = {}) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, businessName: true, category: true, status: true },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    let startDateStr: string;
    let endDateStr: string;
    let periodLabel: string;

    if (options.startDate && options.endDate) {
      startDateStr = options.startDate;
      endDateStr = options.endDate;
      periodLabel = `${startDateStr} to ${endDateStr}`;
    } else if (options.month) {
      // e.g. "2026-12"
      const [yStr, mStr] = options.month.split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new Error('Invalid month format. Please use YYYY-MM (e.g. 2026-12)');
      }
      startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      periodLabel = `${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      // Default to current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      periodLabel = `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    // Fetch all existing calendar entries in range
    const calendarEntries = await prisma.vendorCalendar.findMany({
      where: {
        vendorId,
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
      include: {
        deal: {
          select: {
            id: true,
            status: true,
            agreedPrice: true,
            offeredPrice: true,
            eventType: true,
            clientName: true,
            clientPhone: true,
          },
        },
      },
    });

    // Also fetch confirmed/accepted deals that might have an eventDate in this range
    const activeDeals = await prisma.deal.findMany({
      where: {
        vendorId,
        eventDate: {
          gte: startDateStr,
          lte: endDateStr,
        },
        status: {
          in: ['DEAL_ACCEPTED', 'CONFIRMED', 'PAYMENT_PENDING'],
        },
      },
    });

    // Create lookup maps by date
    const entryMap = new Map<string, any>();
    for (const entry of calendarEntries) {
      entryMap.set(`${entry.date}_${entry.slotType}`, entry);
      // Also register full day key if slotType is FULL_DAY
      if (entry.slotType === CalendarSlotType.FULL_DAY) {
        entryMap.set(entry.date, entry);
      }
    }

    // Include any active deals not yet in vendorCalendar table
    for (const deal of activeDeals) {
      if (deal.eventDate && !entryMap.has(deal.eventDate)) {
        const syntheticEntry = {
          id: `deal-${deal.id}`,
          date: deal.eventDate,
          status: CalendarStatus.BOOKED,
          slotType: CalendarSlotType.FULL_DAY,
          title: `${deal.eventType} (Confirmed Booking)`,
          eventType: deal.eventType,
          clientName: deal.clientName,
          clientPhone: deal.clientPhone,
          dealId: deal.id,
          deal,
          notes: `Booked via Platform Chatbot Deal (#${deal.id.slice(0, 8)})`,
        };
        entryMap.set(deal.eventDate, syntheticEntry);
      }
    }

    // Generate date array
    const allDates = this.getDateRangeArray(startDateStr, endDateStr);

    let availableCount = 0;
    let bookedCount = 0;
    let blockedCount = 0;
    let tentativeCount = 0;

    const calendar: CalendarDayStatus[] = allDates.map((dateStr) => {
      const dayOfWeek = this.getDayOfWeek(dateStr);
      const existing = entryMap.get(dateStr);

      if (existing) {
        const isPublic = options.isPublic ?? false;
        const currentStatus = (existing.status as CalendarStatus) || CalendarStatus.BOOKED;

        if (currentStatus === CalendarStatus.BOOKED) bookedCount++;
        else if (currentStatus === CalendarStatus.BLOCKED) blockedCount++;
        else if (currentStatus === CalendarStatus.TENTATIVE) tentativeCount++;

        return {
          date: dateStr,
          dayOfWeek,
          isAvailable: false,
          status: currentStatus,
          slotType: (existing.slotType as CalendarSlotType) || CalendarSlotType.FULL_DAY,
          event: isPublic
            ? {
                title: currentStatus === CalendarStatus.BLOCKED ? 'Date Unavailable' : 'Event Booked',
                eventType: existing.eventType || 'Event',
              }
            : {
                id: existing.id,
                title: existing.title || (currentStatus === CalendarStatus.BLOCKED ? 'Date Unavailable' : 'Booked Event'),
                eventType: existing.eventType || 'Private Event',
                clientName: existing.clientName || existing.deal?.clientName || null,
                clientPhone: existing.clientPhone || existing.deal?.clientPhone || null,
                dealId: existing.dealId || null,
                notes: existing.notes || null,
              },
        };
      }

      availableCount++;
      return {
        date: dateStr,
        dayOfWeek,
        isAvailable: true,
        status: CalendarStatus.AVAILABLE,
        slotType: CalendarSlotType.FULL_DAY,
        event: null,
      };
    });

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        category: vendor.category,
      },
      period: {
        label: periodLabel,
        startDate: startDateStr,
        endDate: endDateStr,
        totalDays: allDates.length,
      },
      summary: {
        totalDays: allDates.length,
        availableDays: availableCount,
        bookedDays: bookedCount,
        blockedDays: blockedCount,
        tentativeDays: tentativeCount,
      },
      calendar,
    };
  }

  /**
   * Verify if a vendor is available on a specific date and slot
   * If booked or blocked, returns alternative available dates nearby (+/- 7 days)
   */
  public static async verifyDateAvailability(
    vendorId: string,
    date: string,
    slotType: CalendarSlotType = CalendarSlotType.FULL_DAY,
    isPublic: boolean = true
  ): Promise<VerifyDateResult> {
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD (e.g. 2026-12-15)');
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, businessName: true, category: true },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const dayOfWeek = this.getDayOfWeek(date);

    // Check calendar entries
    const conflictEntry = await prisma.vendorCalendar.findFirst({
      where: {
        vendorId,
        date,
        OR: [
          { slotType: CalendarSlotType.FULL_DAY },
          { slotType },
        ],
      },
    });

    // Check active deal on that date
    const conflictDeal = !conflictEntry
      ? await prisma.deal.findFirst({
          where: {
            vendorId,
            eventDate: date,
            status: { in: ['DEAL_ACCEPTED', 'CONFIRMED', 'PAYMENT_PENDING'] },
          },
        })
      : null;

    if (conflictEntry || conflictDeal) {
      const status = conflictEntry ? (conflictEntry.status as CalendarStatus) : CalendarStatus.BOOKED;
      const eventType = conflictEntry?.eventType || conflictDeal?.eventType || 'Scheduled Event';
      const eventTitle = conflictEntry?.title || (conflictDeal ? `${conflictDeal.eventType} Booking` : 'Event Reserved');

      // Find nearby available dates within +/- 7 days (future dates)
      const suggestedAvailableDates = await this.findNearbyAvailableDates(vendorId, date, 5);

      return {
        vendorId: vendor.id,
        businessName: vendor.businessName || 'Vendor',
        date,
        dayOfWeek,
        slotType,
        isAvailable: false,
        status,
        message:
          status === CalendarStatus.BLOCKED
            ? `Vendor has marked ${date} (${dayOfWeek}) as unavailable/blocked.`
            : `Vendor already has an event scheduled on ${date} (${dayOfWeek}): ${eventType}.`,
        conflict: {
          status,
          eventType,
          title: isPublic ? (status === CalendarStatus.BLOCKED ? 'Date Unavailable' : 'Booked Event') : eventTitle,
          slotType: conflictEntry?.slotType || CalendarSlotType.FULL_DAY,
        },
        suggestedAvailableDates,
      };
    }

    return {
      vendorId: vendor.id,
      businessName: vendor.businessName || 'Vendor',
      date,
      dayOfWeek,
      slotType,
      isAvailable: true,
      status: CalendarStatus.AVAILABLE,
      message: `Great news! ${vendor.businessName || 'Vendor'} is open and available for bookings on ${date} (${dayOfWeek}).`,
      conflict: null,
      suggestedAvailableDates: [],
    };
  }

  /**
   * Search nearby available dates within a +/- 7 day window
   */
  private static async findNearbyAvailableDates(
    vendorId: string,
    targetDate: string,
    limit: number = 5
  ): Promise<string[]> {
    const [year, month, day] = targetDate.split('-').map(Number);
    const target = new Date(year, month - 1, day);

    const candidates: string[] = [];
    for (let offset = 1; offset <= 7; offset++) {
      // Check next days first (+1, +2...), then prior days (-1, -2...)
      const nextDate = new Date(target);
      nextDate.setDate(target.getDate() + offset);
      candidates.push(this.formatDateString(nextDate));

      const prevDate = new Date(target);
      prevDate.setDate(target.getDate() - offset);
      candidates.push(this.formatDateString(prevDate));
    }

    // Filter out dates that have conflicts
    const conflicts = await prisma.vendorCalendar.findMany({
      where: {
        vendorId,
        date: { in: candidates },
      },
      select: { date: true },
    });

    const dealConflicts = await prisma.deal.findMany({
      where: {
        vendorId,
        eventDate: { in: candidates },
        status: { in: ['DEAL_ACCEPTED', 'CONFIRMED', 'PAYMENT_PENDING'] },
      },
      select: { eventDate: true },
    });

    const conflictDates = new Set<string>();
    conflicts.forEach((c) => conflictDates.add(c.date));
    dealConflicts.forEach((d) => {
      if (d.eventDate) conflictDates.add(d.eventDate);
    });

    const available = candidates.filter((d) => !conflictDates.has(d));
    // Deduplicate and sort chronologically
    return Array.from(new Set(available)).sort().slice(0, limit);
  }

  /**
   * Manually block date(s) for maintenance, personal leave, or external bookings
   */
  public static async blockDates(vendorId: string, dto: BlockDateDto) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    const slotType = dto.slotType || CalendarSlotType.FULL_DAY;
    const datesToBlock: string[] = dto.endDate
      ? this.getDateRangeArray(dto.date, dto.endDate)
      : [dto.date];

    const results = [];

    for (const d of datesToBlock) {
      // Upsert calendar entry
      const entry = await prisma.vendorCalendar.upsert({
        where: {
          vendorId_date_slotType: {
            vendorId,
            date: d,
            slotType,
          },
        },
        update: {
          status: CalendarStatus.BLOCKED,
          title: dto.title || 'Date Blocked by Vendor',
          eventType: dto.eventType || 'MAINTENANCE',
          notes: dto.notes,
        },
        create: {
          vendorId,
          date: d,
          slotType,
          status: CalendarStatus.BLOCKED,
          title: dto.title || 'Date Blocked by Vendor',
          eventType: dto.eventType || 'MAINTENANCE',
          notes: dto.notes,
        },
      });
      results.push(entry);
    }

    return {
      success: true,
      message: `Successfully blocked ${results.length} date(s) on calendar.`,
      blockedDates: results.map((r) => ({
        id: r.id,
        date: r.date,
        slotType: r.slotType,
        status: r.status,
        title: r.title,
      })),
    };
  }

  /**
   * Unblock a date or remove a calendar entry
   */
  public static async unblockDate(vendorId: string, calendarId: string) {
    const entry = await prisma.vendorCalendar.findFirst({
      where: {
        id: calendarId,
        vendorId,
      },
    });

    if (!entry) {
      throw new Error('Calendar entry not found for this vendor.');
    }

    if (entry.dealId) {
      throw new Error('Cannot unblock a date linked to an active client booking deal. Please manage the deal directly.');
    }

    await prisma.vendorCalendar.delete({
      where: { id: entry.id },
    });

    return {
      success: true,
      message: `Date ${entry.date} (${entry.slotType}) has been unblocked and is now open for bookings.`,
      date: entry.date,
    };
  }

  /**
   * Synchronize or reserve a calendar slot for a platform deal
   */
  public static async syncDealToCalendar(dealId: string) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { vendor: true },
    });

    if (!deal || !deal.eventDate) return null;

    const isConfirmed = ['DEAL_ACCEPTED', 'CONFIRMED', 'PAYMENT_PENDING'].includes(deal.status);
    const calendarStatus = isConfirmed ? CalendarStatus.BOOKED : CalendarStatus.TENTATIVE;

    const entry = await prisma.vendorCalendar.upsert({
      where: {
        vendorId_date_slotType: {
          vendorId: deal.vendorId,
          date: deal.eventDate,
          slotType: CalendarSlotType.FULL_DAY,
        },
      },
      update: {
        dealId: deal.id,
        status: calendarStatus,
        title: `${deal.clientName} - ${deal.eventType}`,
        eventType: deal.eventType,
        clientName: deal.clientName,
        clientPhone: deal.clientPhone,
        notes: `Platform Deal Status: ${deal.status}. Agreed Price: ₹${(deal.agreedPrice || deal.offeredPrice).toLocaleString('en-IN')}`,
      },
      create: {
        vendorId: deal.vendorId,
        date: deal.eventDate,
        slotType: CalendarSlotType.FULL_DAY,
        dealId: deal.id,
        status: calendarStatus,
        title: `${deal.clientName} - ${deal.eventType}`,
        eventType: deal.eventType,
        clientName: deal.clientName,
        clientPhone: deal.clientPhone,
        notes: `Platform Deal Status: ${deal.status}. Agreed Price: ₹${(deal.agreedPrice || deal.offeredPrice).toLocaleString('en-IN')}`,
      },
    });

    return entry;
  }
}
