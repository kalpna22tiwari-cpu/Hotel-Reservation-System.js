/**
 * ReservationSystem - Main Orchestrator Service
 * Demonstrating OOP:
 * - Facade Pattern: provides a unified high-level interface for searching, booking, cancelling, and viewing reservations.
 * - Dependency Injection: accepts any StorageAdapter (JSONFileStorage by default)
 * - Encapsulation & State Management
 */

const { RoomFactory } = require('../models/Room');
const { Guest } = require('../models/User');
const { Booking } = require('../models/Booking');
const { PaymentProcessor } = require('../models/Payment');
const { JSONFileStorage } = require('../storage/FileStorage');

class ReservationSystem {
  #storage;
  #rooms; // Map<string, Room>
  #bookings; // Map<string, Booking>

  /**
   * @param {Object} [options]
   * @param {StorageAdapter} [options.storage]
   */
  constructor(options = {}) {
    this.#storage = options.storage || new JSONFileStorage();
    this.#rooms = new Map();
    this.#bookings = new Map();

    this.#loadFromStorage();
  }

  /**
   * Loads persisted data from storage adapter
   */
  #loadFromStorage() {
    try {
      const rawRooms = this.#storage.loadRooms();
      if (rawRooms && rawRooms.length > 0) {
        for (const rData of rawRooms) {
          const roomInstance = RoomFactory.create(rData);
          this.#rooms.set(roomInstance.getId(), roomInstance);
        }
      } else {
        // Seed initial default inventory if empty
        this.#seedDefaultRooms();
      }

      const rawBookings = this.#storage.loadBookings();
      if (rawBookings && rawBookings.length > 0) {
        for (const bData of rawBookings) {
          const matchedRoom = this.#rooms.get(bData.roomId) || null;
          const bookingInstance = new Booking({
            ...bData,
            room: matchedRoom
          });
          this.#bookings.set(bookingInstance.getBookingId(), bookingInstance);
        }
      }
    } catch (err) {
      console.warn("Could not load stored data, initializing default seed:", err.message);
      this.#seedDefaultRooms();
    }
  }

  /**
   * Seed realistic hotel rooms and hostel dorm beds
   */
  #seedDefaultRooms() {
    const seedRooms = [
      // Standard Rooms
      {
        id: 'RM-101',
        roomNumber: '101',
        category: 'Standard',
        basePrice: 85,
        maxGuests: 2,
        amenities: ['High-Speed Wi-Fi', 'Queen Bed', 'Air Conditioning', 'En-suite Bathroom', 'Work Desk'],
        description: 'Cozy and modern standard room with garden view, perfect for solo travelers or couples.',
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'RM-102',
        roomNumber: '102',
        category: 'Standard',
        basePrice: 90,
        maxGuests: 2,
        amenities: ['High-Speed Wi-Fi', 'Twin Beds', 'Air Conditioning', 'LED TV', 'City View'],
        description: 'Bright twin bed standard room with direct city views and dedicated workspace.',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
      },

      // Deluxe Rooms
      {
        id: 'RM-201',
        roomNumber: '201',
        category: 'Deluxe',
        basePrice: 160,
        maxGuests: 3,
        hasBalcony: true,
        includesBreakfast: true,
        amenities: ['High-Speed Wi-Fi', 'King Bed', 'Private Ocean Balcony', 'Mini Bar', 'Breakfast Buffet', '55" Smart TV'],
        description: 'Luxurious deluxe room with panoramic balcony view, complimentary buffet breakfast, and minibar.',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'RM-202',
        roomNumber: '202',
        category: 'Deluxe',
        basePrice: 175,
        maxGuests: 3,
        hasBalcony: true,
        includesBreakfast: true,
        amenities: ['High-Speed Wi-Fi', 'King Bed', 'Mountain View Terrace', 'Espresso Maker', 'Luxury Bathrobes'],
        description: 'Serene mountain-view deluxe retreat featuring premium pillow-top mattress and artisanal coffee bar.',
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
      },

      // Suite Rooms
      {
        id: 'RM-301',
        roomNumber: '301',
        category: 'Suite',
        basePrice: 320,
        maxGuests: 4,
        hasJacuzzi: true,
        hasPersonalButler: true,
        amenities: ['Ultra High-Speed Wi-Fi', 'Private Hydro-Spa Jacuzzi', 'Separate Living Room', '24/7 Butler Service', 'VIP Lounge', 'Complimentary Champagne'],
        description: 'Presidential grand suite with private hydrotherapy jacuzzi, dedicated 24/7 butler, and executive club privileges.',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
      },

      // Hostel Dorm Beds (Fulfilling Hostel reservation system requirement)
      {
        id: 'HSTL-A1',
        roomNumber: 'Dorm-A (Bed 1)',
        category: 'Hostel Dorm',
        basePrice: 28,
        maxGuests: 1,
        bedType: 'Lower Privacy Pod Bunk',
        isCoed: true,
        amenities: ['High-Speed Wi-Fi', 'Electronic Digital Locker', 'Privacy Blackout Curtain', 'Individual Power Socket & Reading Light', 'Shared Lounge & Guest Kitchen'],
        description: 'Pod-style lower bunk bed in our vibrant backpacker dorm. Includes keycard security locker and communal lounge access.',
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'HSTL-A2',
        roomNumber: 'Dorm-A (Bed 2)',
        category: 'Hostel Dorm',
        basePrice: 26,
        maxGuests: 1,
        bedType: 'Upper Bunk Bed',
        isCoed: true,
        amenities: ['High-Speed Wi-Fi', 'Personal Locker', 'Reading Lamp', 'Shared Modern Shower Suites', 'Social Common Rooftop'],
        description: 'Upper bunk bed in social 6-bed mixed dorm. Ideal for students, remote workers, and globetrotters.',
        image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'HSTL-F1',
        roomNumber: 'Dorm-F (Bed 1 - Female Only)',
        category: 'Hostel Dorm',
        basePrice: 30,
        maxGuests: 1,
        bedType: 'Lower Privacy Bunk',
        isCoed: false,
        amenities: ['High-Speed Wi-Fi', 'Female-Only Sanctuary', 'Full-Length Mirror & Vanity', 'Secure Locker', 'Hairdryer & En-suite Bath'],
        description: 'Safe, premium female-only 4-bed dorm pod with dedicated vanity station and secure card access.',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
      }
    ];

    this.#rooms.clear();
    for (const r of seedRooms) {
      const roomInstance = RoomFactory.create(r);
      this.#rooms.set(roomInstance.getId(), roomInstance);
    }
    this.#storage.saveRooms(Array.from(this.#rooms.values()));
  }

  /**
   * Save current state to storage
   */
  #persist() {
    this.#storage.saveRooms(Array.from(this.#rooms.values()));
    this.#storage.saveBookings(Array.from(this.#bookings.values()));
  }

  // --- ROOM MANAGEMENT ---

  /**
   * Returns all registered rooms
   */
  getAllRooms() {
    return Array.from(this.#rooms.values());
  }

  /**
   * Add a new room
   */
  addRoom(roomData) {
    const room = RoomFactory.create(roomData);
    if (this.#rooms.has(room.getId())) {
      throw new Error(`Room with ID ${room.getId()} already exists.`);
    }
    this.#rooms.set(room.getId(), room);
    this.#persist();
    return room;
  }

  /**
   * Get room by ID
   */
  getRoomById(roomId) {
    return this.#rooms.get(roomId) || null;
  }

  // --- SEARCH ENGINE ---

  /**
   * Search available rooms matching multiple criteria
   * @param {Object} criteria
   * @param {string} [criteria.category] - 'Standard', 'Deluxe', 'Suite', 'Hostel Dorm', or 'All'
   * @param {string} [criteria.checkIn] - YYYY-MM-DD
   * @param {string} [criteria.checkOut] - YYYY-MM-DD
   * @param {number} [criteria.guests]
   * @param {number} [criteria.minPrice]
   * @param {number} [criteria.maxPrice]
   * @param {string} [criteria.searchQuery]
   * @returns {Array<Room>}
   */
  searchRooms(criteria = {}) {
    const {
      category,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      searchQuery
    } = criteria;

    const allBookings = Array.from(this.#bookings.values()).map(b => b.toJSON());

    return Array.from(this.#rooms.values()).filter(room => {
      // 1. Availability status
      if (!room.getIsAvailable()) return false;

      // 2. Category filter
      if (category && category !== 'All' && category.toLowerCase() !== 'all') {
        if (room.getCategory().toLowerCase() !== category.toLowerCase()) {
          return false;
        }
      }

      // 3. Guest Capacity
      if (guests && Number(guests) > 0) {
        if (room.getMaxGuests() < Number(guests)) {
          return false;
        }
      }

      // 4. Price range
      if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
        if (room.getBasePrice() < Number(minPrice)) return false;
      }
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
        if (room.getBasePrice() > Number(maxPrice)) return false;
      }

      // 5. Keyword search (Room number, description, amenities)
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchesNumber = room.getRoomNumber().toLowerCase().includes(query);
        const matchesCategory = room.getCategory().toLowerCase().includes(query);
        const matchesDesc = room.getDescription().toLowerCase().includes(query);
        const matchesAmenities = room.getAmenities().some(a => a.toLowerCase().includes(query));

        if (!matchesNumber && !matchesCategory && !matchesDesc && !matchesAmenities) {
          return false;
        }
      }

      // 6. Date Range Collision Check
      if (checkIn && checkOut) {
        const available = room.isAvailableForDates(checkIn, checkOut, allBookings);
        if (!available) return false;
      }

      return true;
    });
  }

  /**
   * Check room availability for dates
   */
  checkAvailability(roomId, checkIn, checkOut) {
    const room = this.getRoomById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found.`);

    const allBookings = Array.from(this.#bookings.values()).map(b => b.toJSON());
    return room.isAvailableForDates(checkIn, checkOut, allBookings);
  }

  // --- RESERVATION ENGINE ---

  /**
   * Make a room reservation with payment simulation
   * @param {Object} params
   */
  makeReservation({
    guestData,
    roomId,
    checkInDate,
    checkOutDate,
    guestsCount = 1,
    paymentMethod = 'card',
    paymentDetails = {}
  }) {
    // 1. Validate Room
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error(`Room with ID "${roomId}" was not found.`);
    }

    // 2. Validate Guest
    const guest = new Guest({
      id: guestData.id || `GST-${Date.now()}`,
      name: guestData.name,
      email: guestData.email,
      phone: guestData.phone || ''
    });

    // 3. Validate Date Availability
    const isAvailable = this.checkAvailability(roomId, checkInDate, checkOutDate);
    if (!isAvailable) {
      throw new Error(`Room #${room.getRoomNumber()} (${room.getCategory()}) is already booked for the selected dates (${checkInDate} to ${checkOutDate}).`);
    }

    // 4. Calculate total amount polymorphically
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffNights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = room.calculatePrice(diffNights, guestsCount);

    // 5. Payment Simulation
    const paymentResult = PaymentProcessor.process(paymentMethod, totalAmount, paymentDetails);
    if (!paymentResult.success) {
      throw new Error(`Payment declined: ${paymentResult.message}`);
    }

    // Record payment transaction
    this.#storage.saveTransaction({
      transactionId: paymentResult.transactionId,
      guestEmail: guest.getEmail(),
      amount: totalAmount,
      method: paymentResult.method,
      status: 'SUCCESS',
      timestamp: paymentResult.timestamp,
      details: paymentResult.details
    });

    // 6. Instantiate Booking
    const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const booking = new Booking({
      bookingId,
      user: guest,
      room,
      roomId: room.getId(),
      roomNumber: room.getRoomNumber(),
      roomCategory: room.getCategory(),
      checkInDate,
      checkOutDate,
      guestsCount,
      totalAmount,
      paymentStatus: 'PAID',
      paymentDetails: paymentResult,
      bookingStatus: 'CONFIRMED'
    });

    this.#bookings.set(bookingId, booking);
    this.#persist();

    return {
      success: true,
      booking,
      receipt: booking.getBookingDetails(),
      message: `Reservation confirmed for room #${room.getRoomNumber()} (${room.getCategory()})!`
    };
  }

  /**
   * Cancel an existing reservation with refund simulation
   * @param {string} bookingId
   * @param {string} [reason]
   */
  cancelReservation(bookingId, reason = "Cancelled by user") {
    const booking = this.#bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking with ID "${bookingId}" was not found.`);
    }

    // Execute cancellation on model
    const cancellationSummary = booking.cancel(reason);

    // If refund is applicable, simulate refund processing
    if (cancellationSummary.refundAmount > 0) {
      const paymentMethod = booking.getPaymentDetails()?.method || 'card';
      const refundResult = PaymentProcessor.refund(
        paymentMethod,
        cancellationSummary.refundTransactionId,
        cancellationSummary.refundAmount
      );

      this.#storage.saveTransaction({
        transactionId: cancellationSummary.refundTransactionId,
        bookingId,
        amount: cancellationSummary.refundAmount,
        type: 'REFUND',
        status: 'PROCESSED',
        timestamp: new Date().toISOString()
      });
    }

    this.#persist();

    return {
      success: true,
      summary: cancellationSummary,
      message: `Booking ${bookingId} has been successfully cancelled. Refund: $${cancellationSummary.refundAmount} (${cancellationSummary.refundPercentage}).`
    };
  }

  /**
   * Get booking details by ID
   */
  getBookingDetails(bookingId) {
    const booking = this.#bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }
    return booking.getBookingDetails();
  }

  /**
   * Generate official invoice for booking
   */
  getBookingInvoice(bookingId) {
    const booking = this.#bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }
    return booking.generateInvoice();
  }

  /**
   * Get bookings for a specific user email
   */
  getBookingsByUser(email) {
    if (!email) return [];
    const normalized = email.trim().toLowerCase();
    return Array.from(this.#bookings.values())
      .filter(b => {
        const u = b.getUser();
        const userEmail = u ? (u.email || u.getEmail?.()) : '';
        return userEmail && userEmail.toLowerCase() === normalized;
      })
      .map(b => b.getBookingDetails());
  }

  /**
   * Get all bookings
   */
  getAllBookings() {
    return Array.from(this.#bookings.values()).map(b => b.getBookingDetails());
  }

  /**
   * System summary analytics
   */
  getAnalytics() {
    const totalRooms = this.#rooms.size;
    const allBookings = Array.from(this.#bookings.values());
    const confirmedBookings = allBookings.filter(b => b.isActive());
    const cancelledBookings = allBookings.filter(b => b.getBookingStatus() === 'CANCELLED');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.getTotalAmount(), 0);
    const totalRefunded = cancelledBookings.reduce((sum, b) => sum + (b.getRefundDetails()?.refundAmount || 0), 0);

    // Categorization breakdown
    const categoryStats = {};
    for (const room of this.#rooms.values()) {
      const cat = room.getCategory();
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    }

    return {
      totalRooms,
      categoryStats,
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      netRevenue: Math.round((totalRevenue - totalRefunded) * 100) / 100,
      totalRefunded: Math.round(totalRefunded * 100) / 100
    };
  }
}

module.exports = {
  ReservationSystem
};
