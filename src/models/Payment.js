/**
 * Payment Simulation Models - Demonstrating OOP:
 * - Strategy Pattern (PaymentMethod base class)
 * - Polymorphism (CreditCardPayment, UPIPayment, NetBankingPayment, CashPayment)
 * - Encapsulation (Card masking, secure status tracking)
 */

class PaymentResult {
  constructor({ success, transactionId, method, amount, timestamp, message, details = {} }) {
    this.success = Boolean(success);
    this.transactionId = transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    this.method = method;
    this.amount = Number(amount);
    this.timestamp = timestamp || new Date().toISOString();
    this.message = message || (this.success ? 'Payment processed successfully.' : 'Payment failed.');
    this.details = details;
  }
}

/**
 * Abstract PaymentMethod
 */
class PaymentMethod {
  constructor(name) {
    if (new.target === PaymentMethod) {
      throw new Error("Cannot instantiate abstract class PaymentMethod directly.");
    }
    this.name = name;
  }

  /**
   * Process payment - must be implemented by subclasses
   * @param {number} amount
   * @param {Object} details
   * @returns {Promise<PaymentResult>|PaymentResult}
   */
  processPayment(amount, details = {}) {
    throw new Error("processPayment() must be implemented by subclass.");
  }

  /**
   * Process refund
   * @param {string} transactionId
   * @param {number} amount
   * @returns {Object}
   */
  processRefund(transactionId, amount) {
    return {
      success: true,
      refundId: `REF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      originalTransactionId: transactionId,
      amount: Number(amount),
      timestamp: new Date().toISOString(),
      message: `Refund of $${amount.toFixed(2)} processed to original ${this.name} method.`
    };
  }
}

/**
 * Credit / Debit Card Payment Simulation
 */
class CreditCardPayment extends PaymentMethod {
  constructor() {
    super('Credit/Debit Card');
  }

  processPayment(amount, details = {}) {
    const { cardNumber, cardHolder, expiryDate, cvv } = details;

    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: 'Missing mandatory card details (Card number, Cardholder name, Expiry, CVV).'
      });
    }

    // Sanitize and validate card number (simple Luhn / length check simulation)
    const cleanCard = String(cardNumber).replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(cleanCard)) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: 'Invalid card number format. Must be 13-19 numeric digits.'
      });
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(String(cvv))) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: 'Invalid CVV code. Must be 3 or 4 digits.'
      });
    }

    // Mask card for security
    const maskedCard = `****-****-****-${cleanCard.slice(-4)}`;

    return new PaymentResult({
      success: true,
      method: this.name,
      amount,
      message: `Card authorized successfully for ${cardHolder}.`,
      details: {
        cardHolder,
        maskedCard,
        expiryDate,
        authCode: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }
    });
  }
}

/**
 * UPI (Unified Payments Interface) Simulation
 */
class UPIPayment extends PaymentMethod {
  constructor() {
    super('UPI');
  }

  processPayment(amount, details = {}) {
    const { upiId } = details;

    if (!upiId) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: 'UPI Virtual Payment Address (VPA) is required.'
      });
    }

    // Simple VPA validation (username@bank or phone@upi)
    const vpaRegex = /^[\w.-]+@[\w.-]+$/;
    if (!vpaRegex.test(upiId.trim())) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: `Invalid UPI ID format: "${upiId}". Expected format: username@bank.`
      });
    }

    return new PaymentResult({
      success: true,
      method: this.name,
      amount,
      message: `UPI payment verified instantly via ${upiId.trim()}.`,
      details: {
        upiId: upiId.trim(),
        appReference: `UPI-REF-${Date.now().toString().slice(-8)}`
      }
    });
  }
}

/**
 * Net Banking Payment Simulation
 */
class NetBankingPayment extends PaymentMethod {
  constructor() {
    super('Net Banking');
  }

  processPayment(amount, details = {}) {
    const { bankName } = details;

    if (!bankName) {
      return new PaymentResult({
        success: false,
        method: this.name,
        amount,
        message: 'Please select a valid bank for Net Banking transfer.'
      });
    }

    return new PaymentResult({
      success: true,
      method: this.name,
      amount,
      message: `Net Banking transaction authenticated with ${bankName}.`,
      details: {
        bankName,
        sessionToken: `NETB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      }
    });
  }
}

/**
 * Cash / Pay on Arrival Simulation
 */
class CashPayment extends PaymentMethod {
  constructor() {
    super('Pay at Front Desk / Cash');
  }

  processPayment(amount, details = {}) {
    return new PaymentResult({
      success: true,
      method: this.name,
      amount,
      message: 'Booking confirmed. Payment of $' + amount.toFixed(2) + ' will be collected upon arrival at the reception.',
      details: {
        isPendingCollection: true,
        collectionDesk: 'Main Lobby Reception Desk'
      }
    });
  }
}

/**
 * Payment Processor / Factory Dispatcher
 */
class PaymentProcessor {
  static #methods = {
    'card': new CreditCardPayment(),
    'credit_card': new CreditCardPayment(),
    'debit_card': new CreditCardPayment(),
    'upi': new UPIPayment(),
    'netbanking': new NetBankingPayment(),
    'cash': new CashPayment()
  };

  /**
   * Process payment dynamically based on chosen method type
   * @param {string} methodType
   * @param {number} amount
   * @param {Object} details
   * @returns {PaymentResult}
   */
  static process(methodType, amount, details = {}) {
    const key = String(methodType || 'card').toLowerCase().replace(/\s+/g, '_');
    const paymentStrategy = this.#methods[key] || this.#methods['card'];
    return paymentStrategy.processPayment(amount, details);
  }

  /**
   * Process refund using matching payment strategy
   * @param {string} methodType
   * @param {string} transactionId
   * @param {number} amount
   */
  static refund(methodType, transactionId, amount) {
    const key = String(methodType || 'card').toLowerCase().replace(/\s+/g, '_');
    const paymentStrategy = this.#methods[key] || this.#methods['card'];
    return paymentStrategy.processRefund(transactionId, amount);
  }
}

module.exports = {
  PaymentResult,
  PaymentMethod,
  CreditCardPayment,
  UPIPayment,
  NetBankingPayment,
  CashPayment,
  PaymentProcessor
};
