/**
 * Room Models - Demonstrating OOP:
 * - Encapsulation (private fields & validation)
 * - Inheritance (Base Room -> StandardRoom, DeluxeRoom, SuiteRoom, HostelDormRoom)
 * - Polymorphism (calculatePrice, getAmenities, getDetails)
 */

class Room {
  #id;
  #roomNumber;
  #basePrice;
  #maxGuests;
  #amenities;
  #isAvailable;
  #description;
  #image;

  /**
   * @param {Object} params
   * @param {string} params.id
   * @param {string} params.roomNumber
   * @param {number} params.basePrice
   * @param {number} params.maxGuests
   * @param {string[]} params.amenities
   * @param {boolean} [params.isAvailable=true]
   * @param {string} [params.description='']
   * @param {string} [params.image='']
   */
  constructor({ id, roomNumber, basePrice, maxGuests, amenities = [], isAvailable = true, description = '', image = '' }) {
    if (new.target === Room) {
      throw new Error("Cannot instantiate abstract class Room directly. Use specialized subclasses.");
    }
    if (!id || !roomNumber) {
      throw new Error("Room ID and Room Number are required.");
    }
    if (basePrice <= 0) {
      throw new Error("Base price must be a positive number.");
    }
    if (maxGuests <= 0) {
      throw new Error("Room capacity must be at least 1 guest.");
    }

    this.#id = id;
    this.#roomNumber = roomNumber;
    this.#basePrice = Number(basePrice);
    this.#maxGuests = Number(maxGuests);
    this.#amenities = Array.isArray(amenities) ? [...amenities] : [];
    this.#isAvailable = Boolean(isAvailable);
    this.#description = description;
    this.#image = image;
  }

  // Getters
  getId() { return this.#id; }
  getRoomNumber() { return this.#roomNumber; }
  getBasePrice() { return this.#basePrice; }
  getMaxGuests() { return this.#maxGuests; }
  getAmenities() { return [...this.#amenities]; }
  getIsAvailable() { return this.#isAvailable; }
  getDescription() { return this.#description; }
  getImage() { return this.#image; }

  // Setters with encapsulation
  setIsAvailable(status) {
    this.#isAvailable = Boolean(status);
  }

  setDescription(desc) {
    this.#description = desc;
  }

  setBasePrice(price) {
    if (price <= 0) throw new Error("Price must be greater than 0");
    this.#basePrice = Number(price);
  }

  /**
   * Abstract method for category to be implemented by child classes
   * @returns {string}
   */
  getCategory() {
    throw new Error("Abstract method getCategory() must be implemented by subclass.");
  }

  /**
   * Polymorphic method to calculate total stay cost
   * Can be overridden by subclasses to add luxury taxes, surcharges, or hostel discounts
   * @param {number} nights
   * @param {number} [guests=1]
   * @returns {number}
   */
  calculatePrice(nights, guests = 1) {
    if (nights <= 0) throw new Error("Number of nights must be at least 1.");
    if (guests > this.#maxGuests) {
      throw new Error(`Guest count (${guests}) exceeds room capacity (${this.#maxGuests}).`);
    }
    return this.#basePrice * nights;
  }

  /**
   * Checks if room is available for given dates against existing bookings
   * @param {string|Date} checkIn
   * @param {string|Date} checkOut
   * @param {Array<Object>} existingBookings
   * @returns {boolean}
   */
  isAvailableForDates(checkIn, checkOut, existingBookings = []) {
    if (!this.#isAvailable) return false;

    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();

    if (isNaN(start) || isNaN(end) || start >= end) {
      throw new Error("Invalid check-in or check-out dates.");
    }

    for (const booking of existingBookings) {
      // Only check active/confirmed bookings for this room
      if (booking.roomId !== this.#id || booking.status === 'CANCELLED') {
        continue;
      }

      const bStart = new Date(booking.checkInDate).getTime();
      const bEnd = new Date(booking.checkOutDate).getTime();

      // Overlap condition: start < bEnd && end > bStart
      if (start < bEnd && end > bStart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Serialize object for JSON storage
   */
  toJSON() {
    return {
      id: this.#id,
      roomNumber: this.#roomNumber,
      category: this.getCategory(),
      basePrice: this.#basePrice,
      maxGuests: this.#maxGuests,
      amenities: this.getAmenities(),
      isAvailable: this.#isAvailable,
      description: this.#description,
      image: this.#image
    };
  }
}

/**
 * Standard Room Subclass
 */
class StandardRoom extends Room {
  constructor(params) {
    const defaultAmenities = ['High-Speed Wi-Fi', 'Flat-screen TV', 'Air Conditioning', 'En-suite Bathroom', 'Work Desk'];
    const mergedAmenities = Array.from(new Set([...(params.amenities || []), ...defaultAmenities]));
    super({
      ...params,
      amenities: mergedAmenities,
      description: params.description || 'Comfortable and affordable standard room equipped with essential modern amenities.'
    });
  }

  getCategory() {
    return 'Standard';
  }

  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    // Standard cleaning fee
    const cleaningFee = 15;
    return base + cleaningFee;
  }
}

/**
 * Deluxe Room Subclass
 */
class DeluxeRoom extends Room {
  #hasBalcony;
  #includesBreakfast;

  constructor(params) {
    const defaultAmenities = [
      'High-Speed Wi-Fi', '55" 4K Smart TV', 'Climate Control AC', 
      'King-sized Bed', 'Mini Bar', 'Scenic View', 'Complimentary Breakfast', 'Bathrobes & Slippers'
    ];
    const mergedAmenities = Array.from(new Set([...(params.amenities || []), ...defaultAmenities]));
    super({
      ...params,
      amenities: mergedAmenities,
      description: params.description || 'Spacious deluxe room with premium furnishings, private balcony, and complimentary breakfast.'
    });
    this.#hasBalcony = params.hasBalcony !== undefined ? Boolean(params.hasBalcony) : true;
    this.#includesBreakfast = params.includesBreakfast !== undefined ? Boolean(params.includesBreakfast) : true;
  }

  getCategory() {
    return 'Deluxe';
  }

  getHasBalcony() { return this.#hasBalcony; }
  getIncludesBreakfast() { return this.#includesBreakfast; }

  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    // Deluxe includes complimentary breakfast and luxury service charge (5%)
    const serviceCharge = base * 0.05;
    return Math.round((base + serviceCharge) * 100) / 100;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      hasBalcony: this.#hasBalcony,
      includesBreakfast: this.#includesBreakfast
    };
  }
}

/**
 * Suite Room Subclass
 */
class SuiteRoom extends Room {
  #hasJacuzzi;
  #hasPersonalButler;

  constructor(params) {
    const defaultAmenities = [
      'Ultra High-Speed Wi-Fi', 'Private Jacuzzi', 'Separate Living Room',
      'King Bed + Walk-in Closet', 'Complimentary Gourmet Breakfast',
      '24/7 Dedicated Butler Service', 'Executive Lounge Access', 'Premium Sound System'
    ];
    const mergedAmenities = Array.from(new Set([...(params.amenities || []), ...defaultAmenities]));
    super({
      ...params,
      amenities: mergedAmenities,
      description: params.description || 'Top-tier executive suite offering expansive luxury, private jacuzzi, and 24/7 VIP butler service.'
    });
    this.#hasJacuzzi = params.hasJacuzzi !== undefined ? Boolean(params.hasJacuzzi) : true;
    this.#hasPersonalButler = params.hasPersonalButler !== undefined ? Boolean(params.hasPersonalButler) : true;
  }

  getCategory() {
    return 'Suite';
  }

  getHasJacuzzi() { return this.#hasJacuzzi; }
  getHasPersonalButler() { return this.#hasPersonalButler; }

  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    // Suite includes VIP concierge & luxury hospitality tax (10%)
    const luxuryTax = base * 0.10;
    return Math.round((base + luxuryTax) * 100) / 100;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      hasJacuzzi: this.#hasJacuzzi,
      hasPersonalButler: this.#hasPersonalButler
    };
  }
}

/**
 * Hostel Dorm Bed / Room Subclass (for Hostel Reservation System requirement)
 */
class HostelDormRoom extends Room {
  #bedType; // e.g. 'Single Bunk Bed', 'Lower Bunk', 'Private Pod'
  #isCoed;

  constructor(params) {
    const defaultAmenities = [
      'High-Speed Wi-Fi', 'Personal Secure Locker', 'Individual Reading Lamp & USB Plug',
      'Privacy Curtain', 'Shared Lounge & Kitchen Access', 'Common Bunk Area'
    ];
    const mergedAmenities = Array.from(new Set([...(params.amenities || []), ...defaultAmenities]));
    super({
      ...params,
      amenities: mergedAmenities,
      description: params.description || 'Cozy and social hostel dorm bed with individual security locker and shared communal facilities.'
    });
    this.#bedType = params.bedType || 'Upper/Lower Bunk Bed';
    this.#isCoed = params.isCoed !== undefined ? Boolean(params.isCoed) : true;
  }

  getCategory() {
    return 'Hostel Dorm';
  }

  getBedType() { return this.#bedType; }
  getIsCoed() { return this.#isCoed; }

  calculatePrice(nights, guests = 1) {
    // Budget-friendly hostel pricing without luxury surcharge, plus small student/backpacker discount for 3+ nights
    let total = super.calculatePrice(nights, guests);
    if (nights >= 3) {
      total = total * 0.90; // 10% long-stay discount
    }
    return Math.round(total * 100) / 100;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      bedType: this.#bedType,
      isCoed: this.#isCoed
    };
  }
}

/**
 * RoomFactory - Polymorphic instantiation based on category
 */
class RoomFactory {
  static create(data) {
    const category = (data.category || '').toLowerCase();
    switch (category) {
      case 'standard':
        return new StandardRoom(data);
      case 'deluxe':
        return new DeluxeRoom(data);
      case 'suite':
        return new SuiteRoom(data);
      case 'hostel dorm':
      case 'hostel':
      case 'dorm':
        return new HostelDormRoom(data);
      default:
        // Default to StandardRoom if category is generic
        return new StandardRoom(data);
    }
  }
}

module.exports = {
  Room,
  StandardRoom,
  DeluxeRoom,
  SuiteRoom,
  HostelDormRoom,
  RoomFactory
};
