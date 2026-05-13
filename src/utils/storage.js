/**
 * Simple localStorage wrapper for Ashelia.
 * All app data lives under one key: "ashelia:data"
 */

const STORAGE_KEY = "ashelia:data";

/**
 * @typedef {Object} AsheliaData
 * @property {Object} appState
 * @property {string|null} coupleId
 * @property {Object|null} currentCouple
 * @property {Object.<string, Object>} partners
 * @property {Object.<string, Object>} questionPool
 * @property {Object|null} dailyQuestion
 * @property {string|null} dailyAnswerDate
 * @property {Object.<string, Object>} answers
 * @property {Object.<string, Object>} streaks
 * @property {Object} revealState
 */

/**
 * Load the whole Ashelia state object from localStorage.
 * @returns {AsheliaData|null}
 */
function get() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error("Failed to load Ashelia data from localStorage", err);
    return null;
  }
}

/**
 * Save the whole Ashelia state object to localStorage.
 * @param {AsheliaData} data
 */
async function set(data) {
  try {
    const json = JSON.stringify(data, null, 2);
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error("Failed to save Ashelia data to localStorage", err);
  }
}

/**
 * Delete all Ashelia data (useful for dev/reset).
 */
function clear() {
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Zustand‑compatible storage object for createJSONStorage.
 */
export const storage = {
  getItem: async (name) => {
    const data = get();
    return data ? data : null;
  },
  setItem: async (name, value) => {
    const data = get() ?? {};
    Object.assign(data, JSON.parse(value));
    await set(data);
  },
  removeItem: async (name) => {
    const data = get();
    if (!data) {
      return;
    }
    delete data[name];
    await set(data);
  },
};

export default storage;