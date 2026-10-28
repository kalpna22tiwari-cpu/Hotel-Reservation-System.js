/**
 * Hotel & Hostel Reservation System
 * Main CLI Entry Point & Automated Verification Suite
 *
 * Demonstrates:
 * 1. OOP Design Patterns: Encapsulation, Inheritance, Polymorphism, Strategy, Factory
 * 2. Room Categorization: Standard, Deluxe, Suite, Hostel Dorm
 * 3. Search Engine with date collision avoidance
 * 4. Payment Simulation (Credit Card, UPI, Net Banking, Cash)
 * 5. Booking Creation, Receipt & Invoice Generation
 * 6. Reservation Cancellation & Tiered Refund Simulation
 * 7. Persistent File I/O Database (JSON)
 */

const path = require('path');
const readline = require('readline');
const { ReservationSystem } = require('./src/services/ReservationSystem');
const { JSONFileStorage } = require('./src/storage/FileStorage');

// Helper to log banners
function printBanner(title) {
  const line = '═'.repeat(70);
  console.log('\n' + line);
  console.log(`  🌟 ${title.toUpperCase()}`);
  console.log(line);
}

function printSection(title) {
  console.log(`\n▶ [STEP] ${title}`);
  console.log('─'.repeat(60));
}

async function runAutomatedDemo() {
  printBanner("Grand Horizon Hotel & Backpacker Hostel Reservation Engine");
  console.log("Initializing Object-Oriented Reservation System with Persistent File I/O...");

  const storageDir = path.resolve(__dirname, './data');
  const storage = new JSONFileStorage(storageDir);
  const system = new ReservationSystem({ storage });

  console.log(`✓ Persistent storage connected at: ${storage.getDataDirectory()}`);

  // 1. Room Categorization Showcase
  printSection("1. Displaying Room Categories (OOP Subclasses)");
  const allRooms = system.getAllRooms();
  console.log(`Found ${allRooms.length} rooms & dorm beds across multiple categories:\n`);

  allRooms.forEach(room => {
    console.log(` • [${room.getCategory()}] Room #${room.getRoomNumber()}`);
    console.log(`   Rate: $${room.getBasePrice()}/night | Max Capacity: ${room.getMaxGuests()} Guest(s)`);
    console.log(`   Key Amenities: ${room.getAmenities().slice(0, 3).join(', ')}...`);
    if (typeof room.getHasJacuzzi === 'function' && room.getHasJacuzzi()) {
      console.log(`   ✨ VIP Perks: Private Jacuzzi & Dedicated Butler`);
    }
    if (typeof room.getBedType === 'function') {
      console.log(`   🎒 Hostel Perk: ${room.getBedType()} with Secure Digital Locker`);
    }
    console.log('');
  });

  // 2. Search Available Rooms
  printSection("2. Searching Rooms: Filter by Category='Hostel Dorm' for 2 Guests");
  const checkIn = '2026-11-01';
  const checkOut = '2026-11-04'; // 3 nights

  const hostelSearch = system.searchRooms({
    category: 'Hostel Dorm',
    checkIn,
    checkOut
  });
  console.log(`Available Hostel Dorms for ${checkIn} -> ${checkOut}: ${hostelSearch.length} beds found.`);
  hostelSearch.forEach(b => console.log(`   → #${b.getRoomNumber()} ($${b.getBasePrice()}/night)`));

  printSection("3. Searching Rooms: Filter by Category='Suite'");
  const suiteSearch = system.searchRooms({
    category: 'Suite',
    checkIn,
    checkOut
  });
  console.log(`Available Luxury Suites: ${suiteSearch.length} room found.`);
  const selectedSuite = suiteSearch[0];
  console.log(`   → #${selectedSuite.getRoomNumber()} (${selectedSuite.getDescription()})`);

  // 3. Make a Booking with Payment Simulation (Credit Card)
  printSection("4. Making Reservation for Presidential Suite (Payment Simulation: Credit Card)");
  const guest1 = {
    name: 'Alexander Wright',
    email: 'alex.wright@example.com',
    phone: '+1 (555) 234-5678'
  };

  const cardPaymentDetails = {
    cardNumber: '4532 8912 3456 7890',
    cardHolder: 'Alexander Wright',
    expiryDate: '12/28',
    cvv: '883'
  };

  console.log(`Guest "${guest1.name}" booking Suite #${selectedSuite.getRoomNumber()} from ${checkIn} to ${checkOut}...`);
  const booking1Result = system.makeReservation({
    guestData: guest1,
    roomId: selectedSuite.getId(),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    guestsCount: 2,
    paymentMethod: 'card',
    paymentDetails: cardPaymentDetails
  });

  console.log(`\n🎉 ${booking1Result.message}`);
  console.log(`Booking Reference: ${booking1Result.receipt.bookingId}`);
  console.log(`Amount Charged: $${booking1Result.receipt.payment.totalAmount} (Auth Code: ${booking1Result.receipt.payment.paidAt})`);
  console.log(`Transaction ID: ${booking1Result.receipt.payment.transactionId}`);

  // 4. Test Date Overlap Collision Prevention
  printSection("5. Conflict Testing: Attempting Double-Booking on Overlapping Dates");
  console.log(`Attempting to book the SAME Suite #${selectedSuite.getRoomNumber()} for ${checkIn} to ${checkOut}...`);
  try {
    system.makeReservation({
      guestData: { name: 'Intruder Guest', email: 'intruder@test.com' },
      roomId: selectedSuite.getId(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestsCount: 1,
      paymentMethod: 'card',
      paymentDetails: cardPaymentDetails
    });
    console.log("❌ ERROR: Double booking was allowed!");
  } catch (err) {
    console.log(`🛡️ SUCCESS: Conflict caught and prevented! -> "${err.message}"`);
  }

  // 5. Make another booking for a Hostel Dorm Bed (Payment Simulation: UPI)
  printSection("6. Making Hostel Dorm Bed Reservation (Payment Simulation: UPI)");
  const hostelBed = hostelSearch[0];
  const guest2 = {
    name: 'Sarah Connor',
    email: 'sarah.backpacker@example.com',
    phone: '+1 (555) 987-6543'
  };

  const upiPaymentDetails = {
    upiId: 'sarah@okaxis'
  };

  console.log(`Guest "${guest2.name}" booking Hostel Bed #${hostelBed.getRoomNumber()}...`);
  const booking2Result = system.makeReservation({
    guestData: guest2,
    roomId: hostelBed.getId(),
    checkInDate: '2026-11-05',
    checkOutDate: '2026-11-09', // 4 nights -> eligible for long stay discount!
    guestsCount: 1,
    paymentMethod: 'upi',
    paymentDetails: upiPaymentDetails
  });

  console.log(`\n🎉 ${booking2Result.message}`);
  console.log(`Booking Reference: ${booking2Result.receipt.bookingId}`);
  console.log(`Hostel 4-Night Total (with 10% backpacker discount): $${booking2Result.receipt.payment.totalAmount}`);
  console.log(`UPI Payment Status: Instant Auth via ${booking2Result.receipt.payment.paymentMethod}`);

  // 6. View Detailed Booking View & Official Invoice
  printSection("7. Booking Details View & Official Invoice Generation");
  const invoice = system.getBookingInvoice(booking1Result.receipt.bookingId);
  console.log(invoice);

  // 7. Cancellation and Refund Simulation
  printSection("8. Reservation Cancellation & Refund Processing Simulation");
  console.log(`Cancelling Booking: ${booking1Result.receipt.bookingId}...`);
  const cancelResult = system.cancelReservation(
    booking1Result.receipt.bookingId,
    "Emergency flight schedule change"
  );
  console.log(`✓ ${cancelResult.message}`);
  console.log(`✓ Refund Reference: ${cancelResult.summary.refundTransactionId}`);

  // 8. Verify Room Availability Restored
  printSection("9. Verifying Room Availability Restored After Cancellation");
  const isAvailableAgain = system.checkAvailability(selectedSuite.getId(), checkIn, checkOut);
  console.log(`Is Suite #${selectedSuite.getRoomNumber()} available again for ${checkIn} to ${checkOut}? -> ${isAvailableAgain ? '✅ YES (Available)' : '❌ NO'}`);

  // 9. Persistence Verification: Reload from File Storage
  printSection("10. Database File I/O Persistence Verification");
  console.log("Instantiating fresh ReservationSystem instance reading from disk JSON files...");
  const reloadedSystem = new ReservationSystem({ storage });
  const reloadedBookings = reloadedSystem.getAllBookings();
  console.log(`✓ Successfully reloaded ${reloadedBookings.length} bookings from JSON files.`);
  const cancelledBookingInDb = reloadedSystem.getBookingDetails(booking1Result.receipt.bookingId);
  console.log(`✓ Booking ${cancelledBookingInDb.bookingId} persisted status: ${cancelledBookingInDb.status}`);
  console.log(`✓ Active Booking ${booking2Result.receipt.bookingId} persisted status: ${reloadedSystem.getBookingDetails(booking2Result.receipt.bookingId).status}`);

  // 10. Analytics Summary
  printSection("11. Financial & Inventory Analytics");
  const stats = reloadedSystem.getAnalytics();
  console.log(` • Total Inventory:    ${stats.totalRooms} rooms/beds`);
  console.log(` • Categories:         Standard: ${stats.categoryStats['Standard']}, Deluxe: ${stats.categoryStats['Deluxe']}, Suite: ${stats.categoryStats['Suite']}, Hostel: ${stats.categoryStats['Hostel Dorm']}`);
  console.log(` • Total Reservations: ${stats.totalBookings}`);
  console.log(` • Confirmed Active:   ${stats.confirmedBookings}`);
  console.log(` • Net Revenue:        $${stats.netRevenue}`);
  console.log(` • Total Refunded:     $${stats.totalRefunded}`);

  printBanner("All Features Successfully Demonstrated & Verified");
  console.log("You can also run the interactive web GUI by opening 'index.html' in your browser!\n");
}

// Check if running directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--interactive') || args.includes('-i')) {
    runInteractiveCLI();
  } else {
    runAutomatedDemo().catch(err => console.error("Execution failed:", err));
  }
}

/**
 * Interactive Console CLI for users who want a menu
 */
function runInteractiveCLI() {
  const storage = new JSONFileStorage();
  const system = new ReservationSystem({ storage });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function showMenu() {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║        HOTEL & HOSTEL RESERVATION SYSTEM MENU            ║
╠══════════════════════════════════════════════════════════╣
║ 1. View All Rooms & Hostel Dorms                         ║
║ 2. Search Available Rooms                                ║
║ 3. Make a New Reservation (with Payment Simulation)      ║
║ 4. View Booking Details & Official Invoice               ║
║ 5. Cancel a Reservation (with Refund Calculation)        ║
║ 6. View Analytics & Net Revenue                          ║
║ 7. Run Full Automated Demo                               ║
║ 8. Exit                                                  ║
╚══════════════════════════════════════════════════════════╝
    `);
    rl.question('Select an option (1-8): ', handleMenuChoice);
  }

  function handleMenuChoice(choice) {
    switch (choice.trim()) {
      case '1': {
        const rooms = system.getAllRooms();
        console.table(rooms.map(r => ({
          ID: r.getId(),
          Room: '#' + r.getRoomNumber(),
          Category: r.getCategory(),
          'Price/Night': '$' + r.getBasePrice(),
          Capacity: r.getMaxGuests() + ' guest(s)',
          Available: r.getIsAvailable() ? 'YES' : 'NO'
        })));
        showMenu();
        break;
      }
      case '2': {
        rl.question('Enter Category (Standard, Deluxe, Suite, Hostel Dorm, or All): ', cat => {
          rl.question('Enter Check-in Date (YYYY-MM-DD): ', checkIn => {
            rl.question('Enter Check-out Date (YYYY-MM-DD): ', checkOut => {
              const results = system.searchRooms({ category: cat, checkIn, checkOut });
              console.log(`\nFound ${results.length} available room(s):`);
              results.forEach(r => console.log(` • [${r.getCategory()}] #${r.getRoomNumber()} - $${r.getBasePrice()}/night`));
              showMenu();
            });
          });
        });
        break;
      }
      case '3': {
        rl.question('Room ID (e.g., RM-101, RM-201, RM-301, HSTL-A1): ', roomId => {
          rl.question('Guest Name: ', name => {
            rl.question('Guest Email: ', email => {
              rl.question('Check-In Date (YYYY-MM-DD): ', checkIn => {
                rl.question('Check-Out Date (YYYY-MM-DD): ', checkOut => {
                  rl.question('Payment Method (card/upi/cash): ', method => {
                    try {
                      let details = {};
                      if (method.toLowerCase() === 'upi') {
                        details = { upiId: `${name.toLowerCase().replace(/\s+/g, '')}@okbank` };
                      } else {
                        details = {
                          cardNumber: '4532 1122 3344 5566',
                          cardHolder: name,
                          expiryDate: '12/28',
                          cvv: '123'
                        };
                      }

                      const res = system.makeReservation({
                        guestData: { name, email },
                        roomId,
                        checkInDate: checkIn,
                        checkOutDate: checkOut,
                        guestsCount: 1,
                        paymentMethod: method,
                        paymentDetails: details
                      });
                      console.log('\n✅ Reservation Confirmed!');
                      console.log('Booking Reference:', res.receipt.bookingId);
                      console.log('Total Paid:', '$' + res.receipt.payment.totalAmount);
                    } catch (err) {
                      console.log('\n❌ Reservation Failed:', err.message);
                    }
                    showMenu();
                  });
                });
              });
            });
          });
        });
        break;
      }
      case '4': {
        rl.question('Enter Booking ID (e.g. BK-123456-789): ', bookingId => {
          try {
            console.log(system.getBookingInvoice(bookingId.trim()));
          } catch (err) {
            console.log('❌ Error:', err.message);
          }
          showMenu();
        });
        break;
      }
      case '5': {
        rl.question('Enter Booking ID to Cancel: ', bookingId => {
          rl.question('Reason for Cancellation: ', reason => {
            try {
              const res = system.cancelReservation(bookingId.trim(), reason);
              console.log('✅ ' + res.message);
            } catch (err) {
              console.log('❌ Cancellation Failed:', err.message);
            }
            showMenu();
          });
        });
        break;
      }
      case '6': {
        const stats = system.getAnalytics();
        console.log('\n📊 SYSTEM REVENUE & INVENTORY METRICS:');
        console.log(JSON.stringify(stats, null, 2));
        showMenu();
        break;
      }
      case '7': {
        runAutomatedDemo().then(showMenu);
        break;
      }
      case '8': {
        console.log('Goodbye!');
        rl.close();
        break;
      }
      default:
        console.log('Invalid option.');
        showMenu();
    }
  }

  showMenu();
}

module.exports = {
  runAutomatedDemo
};
