/**
 * Grand Horizon Hotel & Hostel Reservation System - Frontend Client Application
 * Implements client-side Object-Oriented architecture matching the Node.js backend.
 */

// --- OOP ROOM MODELS ---

class Room {
  constructor({ id, roomNumber, basePrice, maxGuests, amenities = [], isAvailable = true, description = '', image = '' }) {
    this.id = id;
    this.roomNumber = roomNumber;
    this.basePrice = Number(basePrice);
    this.maxGuests = Number(maxGuests);
    this.amenities = [...amenities];
    this.isAvailable = Boolean(isAvailable);
    this.description = description;
    this.image = image;
  }

  getCategory() { return 'Standard'; }

  calculatePrice(nights, guests = 1) {
    if (nights <= 0) return this.basePrice;
    return this.basePrice * nights;
  }

  isAvailableForDates(checkIn, checkOut, bookings = []) {
    if (!this.isAvailable) return false;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) return true;

    for (const b of bookings) {
      if (b.roomId !== this.id || b.status === 'CANCELLED') continue;
      const bStart = new Date(b.checkInDate).getTime();
      const bEnd = new Date(b.checkOutDate).getTime();
      if (start < bEnd && end > bStart) return false; // Overlap
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      roomNumber: this.roomNumber,
      category: this.getCategory(),
      basePrice: this.basePrice,
      maxGuests: this.maxGuests,
      amenities: this.amenities,
      isAvailable: this.isAvailable,
      description: this.description,
      image: this.image
    };
  }
}

class StandardRoom extends Room {
  getCategory() { return 'Standard'; }
  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    return base + 15; // standard cleaning charge
  }
}

class DeluxeRoom extends Room {
  constructor(params) {
    super(params);
    this.hasBalcony = params.hasBalcony ?? true;
    this.includesBreakfast = params.includesBreakfast ?? true;
  }
  getCategory() { return 'Deluxe'; }
  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    return Math.round((base * 1.05) * 100) / 100; // 5% luxury tax
  }
}

class SuiteRoom extends Room {
  constructor(params) {
    super(params);
    this.hasJacuzzi = params.hasJacuzzi ?? true;
    this.hasPersonalButler = params.hasPersonalButler ?? true;
  }
  getCategory() { return 'Suite'; }
  calculatePrice(nights, guests = 1) {
    const base = super.calculatePrice(nights, guests);
    return Math.round((base * 1.10) * 100) / 100; // 10% presidential hospitality tax
  }
}

class HostelDormRoom extends Room {
  constructor(params) {
    super(params);
    this.bedType = params.bedType || 'Upper/Lower Bunk Bed';
    this.isCoed = params.isCoed ?? true;
  }
  getCategory() { return 'Hostel Dorm'; }
  calculatePrice(nights, guests = 1) {
    let total = super.calculatePrice(nights, guests);
    if (nights >= 3) {
      total = total * 0.90; // 10% student/backpacker discount
    }
    return Math.round(total * 100) / 100;
  }
}

class RoomFactory {
  static create(data) {
    const cat = (data.category || '').toLowerCase();
    if (cat.includes('deluxe')) return new DeluxeRoom(data);
    if (cat.includes('suite')) return new SuiteRoom(data);
    if (cat.includes('hostel') || cat.includes('dorm')) return new HostelDormRoom(data);
    return new StandardRoom(data);
  }
}

// --- OOP BOOKING MODEL ---

class Booking {
  constructor({
    bookingId,
    user,
    roomId,
    roomNumber,
    roomCategory,
    checkInDate,
    checkOutDate,
    guestsCount = 1,
    nights = 1,
    totalAmount,
    paymentMethod = 'card',
    paymentStatus = 'PAID',
    transactionId = '',
    status = 'CONFIRMED',
    createdAt = null,
    cancellationReason = null,
    refundDetails = null
  }) {
    this.bookingId = bookingId;
    this.user = user;
    this.roomId = roomId;
    this.roomNumber = roomNumber;
    this.roomCategory = roomCategory;
    this.checkInDate = checkInDate;
    this.checkOutDate = checkOutDate;
    this.guestsCount = Number(guestsCount);
    this.nights = Number(nights);
    this.totalAmount = Number(totalAmount);
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
    this.transactionId = transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    this.status = status;
    this.createdAt = createdAt || new Date().toISOString();
    this.cancellationReason = cancellationReason;
    this.refundDetails = refundDetails;
  }

  cancel(reason = "User requested cancellation") {
    if (this.status === 'CANCELLED') {
      throw new Error(`Booking ${this.bookingId} is already cancelled.`);
    }

    const now = new Date().getTime();
    const checkInTime = new Date(this.checkInDate).getTime();
    const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilCheckIn >= 48) {
      refundPercentage = 1.0;
    } else if (hoursUntilCheckIn >= 24) {
      refundPercentage = 0.70;
    } else if (hoursUntilCheckIn > 0) {
      refundPercentage = 0.25;
    } else {
      refundPercentage = 0.0;
    }

    const refundAmount = Math.round((this.totalAmount * refundPercentage) * 100) / 100;

    this.status = 'CANCELLED';
    this.cancellationReason = reason;
    this.refundDetails = {
      refundPercentage: `${Math.round(refundPercentage * 100)}%`,
      refundAmount,
      refundDate: new Date().toISOString(),
      refundTransactionId: `REF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
    };

    return this.refundDetails;
  }

  toJSON() {
    return {
      bookingId: this.bookingId,
      user: this.user,
      roomId: this.roomId,
      roomNumber: this.roomNumber,
      roomCategory: this.roomCategory,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      guestsCount: this.guestsCount,
      nights: this.nights,
      totalAmount: this.totalAmount,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      transactionId: this.transactionId,
      status: this.status,
      createdAt: this.createdAt,
      cancellationReason: this.cancellationReason,
      refundDetails: this.refundDetails
    };
  }
}

// --- RESERVATION APP CONTROLLER ---

class AppController {
  constructor() {
    this.rooms = [];
    this.bookings = [];
    this.selectedCategory = 'All';
    this.activeBookingRoom = null;
    this.currentPaymentMethod = 'card';

    this.init();
  }

  async init() {
    this.setupDatePickers();
    this.loadData();
    this.bindEvents();
    this.renderRooms();
    this.renderBookings();
    this.updateStats();
  }

  setupDatePickers() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 2);

    const checkInInput = document.getElementById('check-in-date');
    const checkOutInput = document.getElementById('check-out-date');

    checkInInput.min = today.toISOString().split('T')[0];
    checkInInput.value = today.toISOString().split('T')[0];

    checkOutInput.min = tomorrow.toISOString().split('T')[0];
    checkOutInput.value = tomorrow.toISOString().split('T')[0];
  }

  loadData() {
    // Attempt load from localStorage, else fallback to defaults
    const storedRooms = localStorage.getItem('gh_hotel_rooms');
    const storedBookings = localStorage.getItem('gh_hotel_bookings');

    if (storedRooms) {
      try {
        const parsed = JSON.parse(storedRooms);
        this.rooms = parsed.map(r => RoomFactory.create(r));
      } catch (e) {
        this.initDefaultRooms();
      }
    } else {
      this.initDefaultRooms();
    }

    if (storedBookings) {
      try {
        const parsed = JSON.parse(storedBookings);
        this.bookings = parsed.map(b => new Booking(b));
      } catch (e) {
        this.bookings = [];
      }
    } else {
      this.bookings = [];
    }
  }

  saveData() {
    localStorage.setItem('gh_hotel_rooms', JSON.stringify(this.rooms.map(r => r.toJSON())));
    localStorage.setItem('gh_hotel_bookings', JSON.stringify(this.bookings.map(b => b.toJSON())));
  }

  initDefaultRooms() {
    const defaultData = [
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

    this.rooms = defaultData.map(r => RoomFactory.create(r));
    this.saveData();
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(targetTab)?.classList.add('active');

        if (targetTab === 'tab-analytics') {
          this.renderAnalytics();
        }
      });
    });

    // Category Pill Filters
    document.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCategory = pill.getAttribute('data-cat');
        this.renderRooms();
      });
    });

    // Search Form Submit
    document.getElementById('search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.renderRooms();
    });

    // Reset Filters
    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
      this.selectedCategory = 'All';
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.category-pill[data-cat="All"]')?.classList.add('active');
      document.getElementById('search-keyword').value = '';
      document.getElementById('guest-count').value = '2';
      this.setupDatePickers();
      this.renderRooms();
      this.showToast("Filters reset to default.", "info");
    });

    // Booking Modal Close
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      this.closeBookingModal();
    });

    // Invoice Modal Close
    document.getElementById('invoice-close-btn')?.addEventListener('click', () => {
      document.getElementById('invoice-modal')?.classList.remove('active');
    });

    // Payment Method Tabs
    document.querySelectorAll('.payment-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.payment-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.payment-subpanel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        this.currentPaymentMethod = btn.getAttribute('data-method');
        document.getElementById(`subpanel-${this.currentPaymentMethod}`)?.classList.add('active');
      });
    });

    // Card Input Sync with live preview
    const cardInput = document.getElementById('pay-card-num');
    cardInput?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = formatted;
      document.getElementById('card-preview-number').textContent = formatted || '•••• •••• •••• 4242';
    });

    const holderInput = document.getElementById('guest-name');
    holderInput?.addEventListener('input', (e) => {
      document.getElementById('card-preview-holder').textContent = e.target.value.toUpperCase() || 'ALEXANDER WRIGHT';
    });

    // Process Booking Button
    document.getElementById('btn-process-booking')?.addEventListener('click', () => {
      this.processBooking();
    });

    // Print Invoice
    document.getElementById('btn-print-invoice')?.addEventListener('click', () => {
      window.print();
    });

    // Booking Search in Table
    document.getElementById('booking-search-input')?.addEventListener('input', (e) => {
      this.renderBookings(e.target.value);
    });

    // Add Custom Room Form
    document.getElementById('add-room-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddNewRoom();
    });

    // Export Database
    document.getElementById('btn-export-db')?.addEventListener('click', () => {
      this.exportDatabase();
    });

    // Import Database
    document.getElementById('import-db-file')?.addEventListener('change', (e) => {
      this.importDatabase(e);
    });
  }

  // --- RENDERING ROOMS ---

  renderRooms() {
    const container = document.getElementById('rooms-grid-container');
    const checkIn = document.getElementById('check-in-date').value;
    const checkOut = document.getElementById('check-out-date').value;
    const guestCount = Number(document.getElementById('guest-count').value);
    const keyword = (document.getElementById('search-keyword').value || '').trim().toLowerCase();

    const filtered = this.rooms.filter(room => {
      // 1. Category filter
      if (this.selectedCategory !== 'All' && room.getCategory().toLowerCase() !== this.selectedCategory.toLowerCase()) {
        return false;
      }
      // 2. Capacity filter
      if (guestCount > 0 && room.maxGuests < guestCount) {
        return false;
      }
      // 3. Keyword filter
      if (keyword) {
        const matchesNum = room.roomNumber.toLowerCase().includes(keyword);
        const matchesCat = room.getCategory().toLowerCase().includes(keyword);
        const matchesDesc = room.description.toLowerCase().includes(keyword);
        const matchesAmenity = room.amenities.some(a => a.toLowerCase().includes(keyword));
        if (!matchesNum && !matchesCat && !matchesDesc && !matchesAmenity) return false;
      }
      // 4. Date Availability Check
      if (checkIn && checkOut) {
        const available = room.isAvailableForDates(checkIn, checkOut, this.bookings);
        if (!available) return false;
      }
      return true;
    });

    document.getElementById('rooms-found-text').textContent = 
      `Showing ${filtered.length} of ${this.rooms.length} room(s) available for selected criteria`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🛎️</div>
          <h3>No Available Accommodations Found</h3>
          <p>Try adjusting your travel dates, reducing the guest count, or selecting "All Categories".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(room => {
      const catClass = room.getCategory() === 'Standard' ? 'cat-standard' :
                       room.getCategory() === 'Deluxe' ? 'cat-deluxe' :
                       room.getCategory() === 'Suite' ? 'cat-suite' : 'cat-hostel';

      return `
        <article class="room-card" data-id="${room.id}">
          <div class="room-image-wrap">
            <img src="${room.image}" alt="${room.getCategory()} Room #${room.roomNumber}" class="room-image" loading="lazy">
            <span class="category-tag ${catClass}">${room.getCategory()}</span>
            <div class="room-price-badge">
              <span class="price-num">$${room.basePrice}</span>
              <span class="price-unit">/ night</span>
            </div>
          </div>

          <div class="room-content">
            <div class="room-header">
              <h3 class="room-title">#${room.roomNumber}</h3>
              <span class="room-capacity">👥 Up to ${room.maxGuests} ${room.maxGuests === 1 ? 'Guest' : 'Guests'}</span>
            </div>

            <p class="room-desc">${room.description}</p>

            <div class="amenities-list">
              ${room.amenities.slice(0, 4).map(a => `<span class="amenity-chip">✓ ${a}</span>`).join('')}
              ${room.amenities.length > 4 ? `<span class="amenity-chip">+${room.amenities.length - 4} more</span>` : ''}
            </div>

            <div class="room-footer">
              <span style="font-size: 0.8rem; color: #10b981; font-weight: 600;">● Instant Confirmation</span>
              <button class="btn-primary btn-book-room" data-id="${room.id}">
                Book Now
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to "Book Now" buttons
    container.querySelectorAll('.btn-book-room').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.getAttribute('data-id');
        this.openBookingModal(roomId);
      });
    });
  }

  // --- BOOKING MODAL & PROCESSING ---

  openBookingModal(roomId) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    this.activeBookingRoom = room;

    const checkIn = document.getElementById('check-in-date').value;
    const checkOut = document.getElementById('check-out-date').value;
    const guestCount = document.getElementById('guest-count').value;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffNights = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));

    const totalPrice = room.calculatePrice(diffNights, guestCount);
    const subtotal = room.basePrice * diffNights;
    const taxDiff = Math.max(0, Math.round((totalPrice - subtotal) * 100) / 100);

    // Populate modal values
    document.getElementById('modal-room-thumb').src = room.image;
    document.getElementById('modal-room-name').textContent = `${room.getCategory()} Room #${room.roomNumber}`;
    document.getElementById('modal-room-pricing').textContent = `$${room.basePrice}/night • Up to ${room.maxGuests} Guests`;

    document.getElementById('summary-stay-dates').textContent = `${checkIn} to ${checkOut} (${diffNights} Night${diffNights > 1 ? 's' : ''})`;
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${taxDiff.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${totalPrice.toFixed(2)}`;
    document.getElementById('btn-pay-amount').textContent = totalPrice.toFixed(2);

    document.getElementById('booking-modal')?.classList.add('active');
  }

  closeBookingModal() {
    document.getElementById('booking-modal')?.classList.remove('active');
    this.activeBookingRoom = null;
  }

  processBooking() {
    if (!this.activeBookingRoom) return;

    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();

    if (!name || !email) {
      this.showToast("Please enter your name and email address.", "error");
      return;
    }

    const checkIn = document.getElementById('check-in-date').value;
    const checkOut = document.getElementById('check-out-date').value;
    const guestCount = Number(document.getElementById('guest-count').value);

    // Conflict Check
    const isAvail = this.activeBookingRoom.isAvailableForDates(checkIn, checkOut, this.bookings);
    if (!isAvail) {
      this.showToast(`Room #${this.activeBookingRoom.roomNumber} is already booked for these dates!`, "error");
      return;
    }

    // Payment validation
    if (this.currentPaymentMethod === 'card') {
      const cardNum = document.getElementById('pay-card-num').value.replace(/\s+/g, '');
      if (cardNum.length < 13) {
        this.showToast("Invalid card number. Please provide a valid 16-digit card.", "error");
        return;
      }
    } else if (this.currentPaymentMethod === 'upi') {
      const upiId = document.getElementById('pay-upi-id').value.trim();
      if (!upiId.includes('@')) {
        this.showToast("Invalid UPI ID. Format should be user@bank.", "error");
        return;
      }
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffNights = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
    const totalAmount = this.activeBookingRoom.calculatePrice(diffNights, guestCount);

    const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const newBooking = new Booking({
      bookingId,
      user: { name, email, phone },
      roomId: this.activeBookingRoom.id,
      roomNumber: this.activeBookingRoom.roomNumber,
      roomCategory: this.activeBookingRoom.getCategory(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestsCount: guestCount,
      nights: diffNights,
      totalAmount,
      paymentMethod: this.currentPaymentMethod.toUpperCase(),
      paymentStatus: 'PAID'
    });

    this.bookings.unshift(newBooking);
    this.saveData();
    this.closeBookingModal();

    this.showToast(`🎉 Reservation confirmed! Booking ID: ${bookingId}`, "success");

    this.renderRooms();
    this.renderBookings();
    this.updateStats();

    // Automatically display official invoice modal for the guest
    setTimeout(() => {
      this.showInvoice(bookingId);
    }, 400);
  }

  // --- INVOICE & RECEIPT MODAL ---

  showInvoice(bookingId) {
    const booking = this.bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    document.getElementById('inv-ref-id').textContent = booking.bookingId;
    document.getElementById('inv-date').textContent = `Issued: ${new Date(booking.createdAt).toLocaleDateString()}`;
    document.getElementById('inv-guest-name').textContent = booking.user.name;
    document.getElementById('inv-guest-email').textContent = booking.user.email;
    document.getElementById('inv-guest-phone').textContent = booking.user.phone || 'N/A';

    document.getElementById('inv-room-name').textContent = `${booking.roomCategory} Room #${booking.roomNumber}`;
    document.getElementById('inv-stay-dates').textContent = `${booking.checkInDate} to ${booking.checkOutDate} (${booking.nights} Nights)`;
    document.getElementById('inv-guests-count').textContent = `${booking.guestsCount} Guest(s)`;

    const tbody = document.getElementById('inv-breakdown-body');
    tbody.innerHTML = `
      <tr>
        <td>Room Accommodation (${booking.nights} Nights @ $${(booking.totalAmount / booking.nights).toFixed(2)})</td>
        <td>$${(booking.totalAmount / booking.nights).toFixed(2)}</td>
        <td>${booking.nights}</td>
        <td style="text-align: right;">$${booking.totalAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Payment Method (${booking.paymentMethod}) - Ref #${booking.transactionId}</td>
        <td>--</td>
        <td>1</td>
        <td style="text-align: right; color: #10b981;">Authorized</td>
      </tr>
      <tr class="invoice-total-row">
        <td colspan="3">Grand Total Paid (USD)</td>
        <td style="text-align: right;">$${booking.totalAmount.toFixed(2)}</td>
      </tr>
    `;

    const cancelBlock = document.getElementById('inv-cancellation-block');
    if (booking.status === 'CANCELLED') {
      cancelBlock.style.display = 'block';
      document.getElementById('inv-cancellation-details').textContent = 
        `Cancelled (${booking.cancellationReason || 'User request'}). Refund Amount: $${booking.refundDetails?.refundAmount?.toFixed(2) || '0.00'} (${booking.refundDetails?.refundPercentage || '0%'}) processed to original payment method.`;
    } else {
      cancelBlock.style.display = 'none';
    }

    document.getElementById('invoice-modal')?.classList.add('active');
  }

  // --- BOOKINGS TABLE & CANCELLATION ---

  renderBookings(query = '') {
    const tbody = document.getElementById('bookings-table-body');
    const q = query.trim().toLowerCase();

    const filtered = this.bookings.filter(b => {
      if (!q) return true;
      return b.bookingId.toLowerCase().includes(q) ||
             b.user.email.toLowerCase().includes(q) ||
             b.user.name.toLowerCase().includes(q) ||
             b.roomNumber.toLowerCase().includes(q);
    });

    document.getElementById('nav-booking-count').textContent = this.bookings.filter(b => b.status === 'CONFIRMED').length;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No reservations found. Book a room from the Rooms & Dorms tab!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(b => {
      const isConfirmed = b.status === 'CONFIRMED';
      return `
        <tr>
          <td><strong style="color: var(--accent-gold);">${b.bookingId}</strong></td>
          <td>
            <div>${b.user.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${b.user.email}</div>
          </td>
          <td>[${b.roomCategory}] #${b.roomNumber}</td>
          <td>${b.checkInDate} → ${b.checkOutDate} (${b.nights}n)</td>
          <td><strong>$${b.totalAmount.toFixed(2)}</strong></td>
          <td><span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">${b.paymentMethod}</span></td>
          <td>
            <span class="status-badge ${isConfirmed ? 'status-confirmed' : 'status-cancelled'}">
              ${isConfirmed ? '● Confirmed' : '✕ Cancelled'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-secondary btn-view-invoice" data-id="${b.bookingId}" style="padding: 4px 10px; font-size: 0.8rem;">
                Invoice
              </button>
              ${isConfirmed ? `
                <button class="btn-danger btn-cancel-booking" data-id="${b.bookingId}" style="padding: 4px 10px; font-size: 0.8rem;">
                  Cancel
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showInvoice(btn.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        const bId = btn.getAttribute('data-id');
        this.handleCancelReservation(bId);
      });
    });
  }

  handleCancelReservation(bookingId) {
    const booking = this.bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const confirmCancel = confirm(
      `Are you sure you want to cancel reservation ${bookingId}?\n\n` +
      `Tiered Refund Policy:\n` +
      `• > 48h before check-in: 100% Refund\n` +
      `• 24h - 48h before check-in: 70% Refund\n` +
      `• < 24h: 25% Refund`
    );

    if (confirmCancel) {
      try {
        const refund = booking.cancel("Customer voluntary cancellation");
        this.saveData();
        this.showToast(`Booking cancelled. Refund of $${refund.refundAmount} (${refund.refundPercentage}) processed!`, "success");
        this.renderRooms();
        this.renderBookings();
        this.updateStats();
      } catch (err) {
        this.showToast(err.message, "error");
      }
    }
  }

  // --- ANALYTICS & DATABASE EXPORT/IMPORT ---

  updateStats() {
    const totalRooms = this.rooms.length;
    const confirmed = this.bookings.filter(b => b.status === 'CONFIRMED');
    const cancelled = this.bookings.filter(b => b.status === 'CANCELLED');

    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRefunded = cancelled.reduce((sum, b) => sum + (b.refundDetails?.refundAmount || 0), 0);
    const netRevenue = Math.max(0, totalRevenue - totalRefunded);

    document.getElementById('stat-total-rooms').textContent = totalRooms;
    document.getElementById('stat-available-rooms').textContent = totalRooms - confirmed.length;
    document.getElementById('stat-active-bookings').textContent = confirmed.length;
    document.getElementById('stat-net-revenue').textContent = `$${netRevenue.toFixed(0)}`;
  }

  renderAnalytics() {
    // Category distribution
    const catCounts = {};
    for (const r of this.rooms) {
      const c = r.getCategory();
      catCounts[c] = (catCounts[c] || 0) + 1;
    }

    const distList = document.getElementById('category-distribution-list');
    distList.innerHTML = Object.entries(catCounts).map(([cat, count]) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px;">
        <span style="font-weight: 600;">${cat}</span>
        <span style="color: var(--accent-gold); font-weight: 700;">${count} room(s) / beds</span>
      </div>
    `).join('');

    // Financial overview
    const confirmed = this.bookings.filter(b => b.status === 'CONFIRMED');
    const cancelled = this.bookings.filter(b => b.status === 'CANCELLED');
    const totalGross = confirmed.reduce((s, b) => s + b.totalAmount, 0);
    const totalRefunds = cancelled.reduce((s, b) => s + (b.refundDetails?.refundAmount || 0), 0);

    const finList = document.getElementById('financial-overview-list');
    finList.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted);">Gross Bookings:</span>
        <span style="font-weight: 700;">$${totalGross.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted);">Processed Refunds:</span>
        <span style="font-weight: 700; color: #fb7185;">-$${totalRefunds.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 1.1rem; color: #10b981;">
        <span style="font-weight: 700;">Net Revenue:</span>
        <span style="font-weight: 800;">$${(totalGross - totalRefunds).toFixed(2)}</span>
      </div>
    `;
  }

  handleAddNewRoom() {
    const num = document.getElementById('new-room-number').value.trim();
    const cat = document.getElementById('new-room-category').value;
    const price = Number(document.getElementById('new-room-price').value);
    const cap = Number(document.getElementById('new-room-capacity').value);
    const desc = document.getElementById('new-room-desc').value.trim();

    if (!num || !price || !desc) {
      this.showToast("Please fill in all room fields.", "error");
      return;
    }

    const id = `RM-${Date.now().toString().slice(-4)}`;
    const newRoom = RoomFactory.create({
      id,
      roomNumber: num,
      category: cat,
      basePrice: price,
      maxGuests: cap,
      description: desc,
      amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'En-suite Facilities'],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    });

    this.rooms.push(newRoom);
    this.saveData();
    this.showToast(`New ${cat} Room #${num} added to inventory!`, "success");
    document.getElementById('add-room-form').reset();
    this.renderRooms();
    this.updateStats();
    this.renderAnalytics();
  }

  exportDatabase() {
    const payload = {
      exportedAt: new Date().toISOString(),
      rooms: this.rooms.map(r => r.toJSON()),
      bookings: this.bookings.map(b => b.toJSON())
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel_hostel_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Database exported successfully!", "success");
  }

  importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.rooms)) {
          this.rooms = data.rooms.map(r => RoomFactory.create(r));
        }
        if (Array.isArray(data.bookings)) {
          this.bookings = data.bookings.map(b => new Booking(b));
        }
        this.saveData();
        this.renderRooms();
        this.renderBookings();
        this.updateStats();
        this.showToast("Database imported successfully!", "success");
      } catch (err) {
        this.showToast("Invalid JSON backup file.", "error");
      }
    };
    reader.readAsText(file);
  }

  showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <div>${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.hotelApp = new AppController();
});
