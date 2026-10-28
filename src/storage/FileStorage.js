/**
 * Storage Layer - Demonstrating OOP:
 * - Abstract StorageAdapter interface
 * - Concrete JSONFileStorage class for persistent File I/O
 */

const fs = require('fs');
const path = require('path');

/**
 * Abstract Storage Adapter Interface
 */
class StorageAdapter {
  constructor() {
    if (new.target === StorageAdapter) {
      throw new Error("Cannot instantiate abstract class StorageAdapter directly.");
    }
  }

  loadRooms() { throw new Error("loadRooms() must be implemented."); }
  saveRooms(rooms) { throw new Error("saveRooms() must be implemented."); }
  loadBookings() { throw new Error("loadBookings() must be implemented."); }
  saveBookings(bookings) { throw new Error("saveBookings() must be implemented."); }
  loadTransactions() { throw new Error("loadTransactions() must be implemented."); }
  saveTransaction(transaction) { throw new Error("saveTransaction() must be implemented."); }
}

/**
 * Concrete JSON File I/O Storage Engine
 */
class JSONFileStorage extends StorageAdapter {
  #dataDir;
  #roomsFile;
  #bookingsFile;
  #transactionsFile;

  /**
   * @param {string} [customDir]
   */
  constructor(customDir) {
    super();
    this.#dataDir = customDir || path.resolve(__dirname, '../../data');
    this.#roomsFile = path.join(this.#dataDir, 'rooms.json');
    this.#bookingsFile = path.join(this.#dataDir, 'bookings.json');
    this.#transactionsFile = path.join(this.#dataDir, 'transactions.json');

    this.#ensureDirectoryExists();
  }

  #ensureDirectoryExists() {
    try {
      if (!fs.existsSync(this.#dataDir)) {
        fs.mkdirSync(this.#dataDir, { recursive: true });
      }
    } catch (err) {
      console.error(`Failed to create data directory at ${this.#dataDir}:`, err.message);
    }
  }

  #readFileSafe(filePath, defaultFallback = []) {
    try {
      if (!fs.existsSync(filePath)) {
        this.#writeFileSafe(filePath, defaultFallback);
        return defaultFallback;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (!raw || raw.trim() === '') return defaultFallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[FileStorage Warning] Error reading ${filePath}: ${err.message}. Using fallback.`);
      return defaultFallback;
    }
  }

  #writeFileSafe(filePath, data) {
    try {
      this.#ensureDirectoryExists();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error(`[FileStorage Error] Failed writing to ${filePath}:`, err.message);
      throw err;
    }
  }

  // Implementation of StorageAdapter interface
  loadRooms() {
    return this.#readFileSafe(this.#roomsFile, []);
  }

  saveRooms(rooms) {
    const serialized = rooms.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r));
    this.#writeFileSafe(this.#roomsFile, serialized);
    return true;
  }

  loadBookings() {
    return this.#readFileSafe(this.#bookingsFile, []);
  }

  saveBookings(bookings) {
    const serialized = bookings.map(b => (typeof b.toJSON === 'function' ? b.toJSON() : b));
    this.#writeFileSafe(this.#bookingsFile, serialized);
    return true;
  }

  loadTransactions() {
    return this.#readFileSafe(this.#transactionsFile, []);
  }

  saveTransaction(transaction) {
    const current = this.loadTransactions();
    current.push(transaction);
    this.#writeFileSafe(this.#transactionsFile, current);
    return true;
  }

  getDataDirectory() {
    return this.#dataDir;
  }
}

module.exports = {
  StorageAdapter,
  JSONFileStorage
};
