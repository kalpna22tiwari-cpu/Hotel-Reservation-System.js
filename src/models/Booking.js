/**
 * Booking Model - Demonstrating OOP:
 * - Encapsulation (Private fields, state machine for booking status)
 * - Rich business logic (Invoice generation, cancellation policy calculation, formatted details)
 */

class Booking {
  #bookingId;
  #user;
  #room;
  #roomId;
  #roomNumber;
  #roomCategory;
  #checkInDate;
  #checkOutDate;
  #guestsCount;
  #nights;
  #totalAmount;
  #paymentStatus;
  #paymentDetails;
  #bookingStatus; // 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  #createdAt;
  #cancellationReason;
  #refundDetails;

  /**
   * @param {Object} params
   */
  constructor({
    bookingId,
    user,
    room,
    roomId,
    roomNumber,
    roomCategory,
    checkInDate,
    checkOutDate,
    guestsCount = 1,
    totalAmount,
    paymentStatus = 'PAID',
    paymentDetails = null,
    bookingStatus = 'CONFIRMED',
    createdAt = null,
    cancellationReason = null,
    refundDetails = null
  }) {
    if (!bookingId) {
      throw new Error("Booking ID is required.");
    }
    if (!checkInDate || !checkOutDate) {
      throw new Error("Check-in and Check-out dates are required.");
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      throw new Error("Invalid check-in / check-out date range. Check-out must be after check-in.");
    }

    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.#bookingId = bookingId;
    this.#user = user;
    this.#room = room || null;
    this.#roomId = roomId || (room ? room.getId() : null);
    this.#roomNumber = roomNumber || (room ? room.getRoomNumber() : '');
    this.#roomCategory = roomCategory || (room ? room.getCategory() : '');
    this.#checkInDate = new Date(checkInDate).toISOString().split('T')[0];
    this.#checkOutDate = new Date(checkOutDate).toISOString().split('T')[0];
    this.#guestsCount = Number(guestsCount) || 1;
    this.#nights = nights;
    this.#totalAmount = Number(totalAmount);
    this.#paymentStatus = paymentStatus;
    this.#paymentDetails = paymentDetails;
    this.#bookingStatus = bookingStatus;
    this.#createdAt = createdAt || new Date().toISOString();
    this.#cancellationReason = cancellationReason;
    this.#refundDetails = refundDetails;
  }

  // Getters
  getBookingId() { return this.#bookingId; }
  getUser() { return this.#user; }
  getRoom() { return this.#room; }
  getRoomId() { return this.#roomId; }
  getRoomNumber() { return this.#roomNumber; }
  getRoomCategory() { return this.#roomCategory; }
  getCheckInDate() { return this.#checkInDate; }
  getCheckOutDate() { return this.#checkOutDate; }
  getGuestsCount() { return this.#guestsCount; }
  getNights() { return this.#nights; }
  getTotalAmount() { return this.#totalAmount; }
  getPaymentStatus() { return this.#paymentStatus; }
  getPaymentDetails() { return this.#paymentDetails; }
  getBookingStatus() { return this.#bookingStatus; }
  getCreatedAt() { return this.#createdAt; }
  getCancellationReason() { return this.#cancellationReason; }
  getRefundDetails() { return this.#refundDetails; }

  isActive() {
    return this.#bookingStatus === 'CONFIRMED';
  }

  /**
   * Cancel booking with tiered refund policy
   * - > 48 hours before check-in: 100% refund
   * - 24 to 48 hours before check-in: 70% refund
   * - < 24 hours: 25% refund (emergency cancellation)
   * @param {string} reason
   * @returns {Object} Refund and cancellation summary
   */
  cancel(reason = "User requested cancellation") {
    if (this.#bookingStatus === 'CANCELLED') {
      throw new Error(`Booking ${this.#bookingId} is already cancelled.`);
    }

    const now = new Date().getTime();
    const checkInTime = new Date(this.#checkInDate).getTime();
    const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilCheckIn >= 48) {
      refundPercentage = 1.0; // 100%
    } else if (hoursUntilCheckIn >= 24) {
      refundPercentage = 0.70; // 70%
    } else if (hoursUntilCheckIn > 0) {
      refundPercentage = 0.25; // 25%
    } else {
      refundPercentage = 0.0; // No refund after check-in date
    }

    const refundAmount = Math.round((this.#totalAmount * refundPercentage) * 100) / 100;

    this.#bookingStatus = 'CANCELLED';
    this.#cancellationReason = reason;
    this.#refundDetails = {
      refundPercentage: `${Math.round(refundPercentage * 100)}%`,
      refundAmount,
      refundDate: new Date().toISOString(),
      refundTransactionId: `REF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
    };

    return {
      bookingId: this.#bookingId,
      status: this.#bookingStatus,
      refundPercentage: this.#refundDetails.refundPercentage,
      refundAmount: this.#refundDetails.refundAmount,
      refundTransactionId: this.#refundDetails.refundTransactionId,
      reason: this.#cancellationReason
    };
  }

  /**
   * Generates a comprehensive booking details view / receipt
   */
  getBookingDetails() {
    return {
      bookingId: this.#bookingId,
      status: this.#bookingStatus,
      guest: {
        name: this.#user ? (this.#user.name || this.#user.getName?.() || 'Valued Guest') : 'Valued Guest',
        email: this.#user ? (this.#user.email || this.#user.getEmail?.() || 'N/A') : 'N/A',
        phone: this.#user ? (this.#user.phone || this.#user.getPhone?.() || 'N/A') : 'N/A'
      },
      room: {
        roomId: this.#roomId,
        roomNumber: this.#roomNumber,
        category: this.#roomCategory
      },
      stay: {
        checkIn: this.#checkInDate,
        checkOut: this.#checkOutDate,
        nights: this.#nights,
        guests: this.#guestsCount
      },
      payment: {
        status: this.#paymentStatus,
        totalAmount: this.#totalAmount,
        currency: 'USD ($)',
        transactionId: this.#paymentDetails ? this.#paymentDetails.transactionId : 'N/A',
        paymentMethod: this.#paymentDetails ? this.#paymentDetails.method : 'N/A',
        paidAt: this.#paymentDetails ? this.#paymentDetails.timestamp : this.#createdAt
      },
      cancellation: this.#bookingStatus === 'CANCELLED' ? {
        reason: this.#cancellationReason,
        refund: this.#refundDetails
      } : null,
      createdAt: this.#createdAt
    };
  }

  /**
   * Generates formatted text invoice
   */
  generateInvoice() {
    const details = this.getBookingDetails();
    const border = "=".repeat(60);
    const subBorder = "-".repeat(60);

    return `
${border}
               GRAND HORIZON RESIDENCE & HOSTEL
                     OFFICIAL BOOKING INVOICE
${border}
Booking Reference: ${details.bookingId}
Booking Date:      ${new Date(details.createdAt).toLocaleString()}
Status:            ${details.status}
${subBorder}
GUEST INFORMATION:
  Guest Name:      ${details.guest.name}
  Email:           ${details.guest.email}
  Phone:           ${details.guest.phone}

RESERVATION DETAILS:
  Category:        ${details.room.category} Room
  Room Number:     #${details.room.roomNumber}
  Check-In Date:   ${details.stay.checkIn} (From 2:00 PM)
  Check-Out Date:  ${details.stay.checkOut} (Until 11:00 AM)
  Duration:        ${details.stay.nights} Night(s)
  Guests:          ${details.stay.guests} Person(s)

PAYMENT SUMMARY:
  Total Amount:    $${details.payment.totalAmount.toFixed(2)} USD
  Payment Method:  ${details.payment.paymentMethod}
  Transaction ID:  ${details.payment.transactionId}
  Payment Status:  ${details.payment.status}
${details.status === 'CANCELLED' ? `
CANCELLATION & REFUND:
  Reason:          ${details.cancellation.reason}
  Refund Rate:     ${details.cancellation.refund.refundPercentage}
  Refund Amount:   $${details.cancellation.refund.refundAmount.toFixed(2)}
  Refund Ref ID:   ${details.cancellation.refund.refundTransactionId}
` : ''}
${border}
     Thank you for choosing Grand Horizon Residence & Hostel!
        24/7 Concierge Support: support@grandhorizon.com
${border}
    `.trim();
  }

  /**
   * Serialization for database/file storage
   */
  toJSON() {
    return {
      bookingId: this.#bookingId,
      user: this.#user && typeof this.#user.toJSON === 'function' ? this.#user.toJSON() : this.#user,
      roomId: this.#roomId,
      roomNumber: this.#roomNumber,
      roomCategory: this.#roomCategory,
      checkInDate: this.#checkInDate,
      checkOutDate: this.#checkOutDate,
      guestsCount: this.#guestsCount,
      nights: this.#nights,
      totalAmount: this.#totalAmount,
      paymentStatus: this.#paymentStatus,
      paymentDetails: this.#paymentDetails,
      bookingStatus: this.#bookingStatus,
      createdAt: this.#createdAt,
      cancellationReason: this.#cancellationReason,
      refundDetails: this.#refundDetails
    };
  }
}

module.exports = {
  Booking
};
