/**
 * User Models - Demonstrating OOP:
 * - Encapsulation (data validation, private properties)
 * - Inheritance (User -> Guest, Admin)
 */

class User {
  #id;
  #name;
  #email;
  #phone;
  #role;

  /**
   * @param {Object} params
   * @param {string} params.id
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.phone
   * @param {string} [params.role='guest']
   */
  constructor({ id, name, email, phone, role = 'guest' }) {
    if (!id || !name || !email) {
      throw new Error("User ID, name, and email are mandatory.");
    }
    this.#validateEmail(email);
    this.#id = id;
    this.#name = name.trim();
    this.#email = email.trim().toLowerCase();
    this.#phone = phone ? phone.trim() : '';
    this.#role = role;
  }

  #validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email address format: "${email}"`);
    }
  }

  // Getters
  getId() { return this.#id; }
  getName() { return this.#name; }
  getEmail() { return this.#email; }
  getPhone() { return this.#phone; }
  getRole() { return this.#role; }

  // Setters
  setName(name) {
    if (!name || name.trim().length === 0) throw new Error("Name cannot be empty.");
    this.#name = name.trim();
  }

  setPhone(phone) {
    this.#phone = phone ? phone.trim() : '';
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      phone: this.#phone,
      role: this.#role
    };
  }
}

class Guest extends User {
  #loyaltyPoints;
  #preferences;

  constructor(params) {
    super({ ...params, role: 'guest' });
    this.#loyaltyPoints = params.loyaltyPoints || 0;
    this.#preferences = params.preferences || [];
  }

  getLoyaltyPoints() { return this.#loyaltyPoints; }
  addLoyaltyPoints(points) {
    if (points > 0) this.#loyaltyPoints += points;
  }

  getPreferences() { return [...this.#preferences]; }
  setPreferences(prefs) {
    this.#preferences = Array.isArray(prefs) ? [...prefs] : [];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      loyaltyPoints: this.#loyaltyPoints,
      preferences: this.#preferences
    };
  }
}

class Admin extends User {
  #adminLevel;

  constructor(params) {
    super({ ...params, role: 'admin' });
    this.#adminLevel = params.adminLevel || 'Manager';
  }

  getAdminLevel() { return this.#adminLevel; }

  toJSON() {
    return {
      ...super.toJSON(),
      adminLevel: this.#adminLevel
    };
  }
}

module.exports = {
  User,
  Guest,
  Admin
};
