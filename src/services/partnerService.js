import storage from "../utils/storage";
import useStore from "../store/useStore";

/**
 * @typedef {Object} CoupleRecord
 * @property {string} id
 * @property {string} name
 * @property {string} createdAt
 * @property {string} partnerAId
 * @property {string} partnerBId
 * @property {string} partnerACode
 * @property {string} partnerBCode
 * @property {Object} settings
 */

/**
 * Load all known couples from AsheliaData.
 * In this PWA, we only ever support one couple per device for now.
 * @returns {Object.<string, CoupleRecord>}
 */
function loadAllCouples() {
  const data = storage.get();
  if (!data || !data.currentCouple) {
    return {};
  }

  // For now Ashelia only supports one couple; extend this later if needed.
  return { [data.currentCouple.id]: data.currentCouple };
}

/**
 * Find a couple by partner code (A or B).
 * @param {string} code
 * @returns {CoupleRecord|null}
 */
function findCoupleByCode(code) {
  const couples = loadAllCouples();
  return (
    Object.values(couples).find(
      (c) => c.partnerACode === code || c.partnerBCode === code,
    ) ?? null
  );
}

/**
 * Generate a 6‑character uppercase code.
 * @returns {string}
 */
function generatePartnerCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new couple and store it in AsheliaData.
 * @param {string} name
 * @param {string} partnerAName
 * @param {string} partnerBName
 * @returns {Promise<{success: boolean, error?: string, coupleId?: string}>}
 */
async function createCouple(name, partnerAName, partnerBName) {
  const state = useStore.getState();
  if (state.coupleId) {
    return {
      success: false,
      error: "You are already in a couple.",
    };
  }

  const coupleId = `cpl-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const partnerAId = `u-${Date.now()}A`;
  const partnerBId = `u-${Date.now()}B`;
  const partnerACode = generatePartnerCode();
  const partnerBCode = generatePartnerCode();

  const now = new Date().toISOString();

  const newCouple = {
    id: coupleId,
    name,
    createdAt: now,
    partnerAId,
    partnerBId,
    partnerACode,
    partnerBCode,
    settings: {
      language: "en",
      theme: "light",
      difficulty: "balanced",
      filters: ["fun", "light"],
    },
  };

  const partnerAProfile = {
    id: partnerAId,
    name: partnerAName,
    isPartnerA: true,
    coupleId,
    createdAt: now,
  };

  const partnerBProfile = {
    id: partnerBId,
    name: partnerBName,
    isPartnerA: false,
    coupleId,
    createdAt: now,
  };

  // Load current data and merge in the new couple
  const data = storage.get();
  const merged = { ...(data || {}) };
  merged.coupleId = coupleId;
  merged.currentCouple = newCouple;
  merged.partners = {
    ...(merged.partners || {}),
    [partnerAId]: partnerAProfile,
    [partnerBId]: partnerBProfile,
  };

  try {
    await storage.set(merged);
    // Update Zustand
    useStore.setState({
      coupleId,
      currentCouple: newCouple,
      partners: merged.partners,
    });
    return { success: true, coupleId };
  } catch (err) {
    console.error("Failed to create couple", err);
    return { success: false, error: "Failed to save couple data." };
  }
}

/**
 * Attempt to join an existing couple using a code.
 * @param {string} code
 * @returns {Promise<{success: boolean, error?: string, coupleId?: string}>}
 */
async function joinCoupleByCode(code) {
  if (!code || code.length < 6) {
    return {
      success: false,
      error: "Invalid or missing partner code.",
    };
  }

  const couple = findCoupleByCode(code);
  if (!couple) {
    return {
      success: false,
      error: "No couple found with that code.",
    };
  }

  const state = useStore.getState();
  if (state.coupleId) {
    return {
      success: false,
      error: "You are already in a couple.",
    };
  }

  // Partner who is joining: this device will be the second partner.
  const isPartnerA = couple.partnerACode === code;
  const isPartnerB = couple.partnerBCode === code;

  if (!isPartnerA && !isPartnerB) {
    return {
      success: false,
      error: "Invalid code for this couple.",
    };
  }

  const partnerSlotFilled =
    (isPartnerA && couple.partnerAId) ||
    (isPartnerB && couple.partnerBId);

  if (partnerSlotFilled) {
    return {
      success: false,
      error: "This couple is full.",
    };
  }

  // This device is the second partner; we assign a fresh partner ID for it.
  const joiningPartnerId = `u-${Date.now()}`;
  const now = new Date().toISOString();
  const joiningName = isPartnerA ? "Partner A (renamed later)" : "Partner B (renamed later)";
  const isPartnerAFlag = isPartnerA;

  const newPartnerProfile = {
    id: joiningPartnerId,
    name: joiningName,
    isPartnerA: isPartnerAFlag,
    coupleId: couple.id,
    createdAt: now,
  };

  // Update couple to mark this slot as taken
  const updatedCouple = { ...couple };
  if (isPartnerA) {
    updatedCouple.partnerAId = joiningPartnerId;
  } else {
    updatedCouple.partnerBId = joiningPartnerId;
  }

  // Load current state, merge, and save
  const data = storage.get();
  const merged = { ...(data || {}) };
  merged.coupleId = couple.id;
  merged.currentCouple = updatedCouple;
  merged.partners = {
    ...(merged.partners || {}),
    [joiningPartnerId]: newPartnerProfile,
  };

  try {
    await storage.set(merged);

    // Update Zustand
    useStore.setState({
      coupleId: couple.id,
      currentCouple: updatedCouple,
      partners: merged.partners,
    });

    return {
      success: true,
      coupleId: couple.id,
      isPartnerA: isPartnerAFlag,
    };
  } catch (err) {
    console.error("Failed to join couple", err);
    return {
      success: false,
      error: "Failed to save joined couple data.",
    };
  }
}

/**
 * Check whether the current device is fully linked to a couple.
 * @returns {boolean}
 */
function isLinked() {
  const state = useStore.getState();
  return Boolean(state.coupleId && state.currentCouple);
}

/**
 * Get the current couple and partner info for this device.
 * @returns {{couple: CoupleRecord|null, partner: {id: string, name: string, isPartnerA: boolean}|null}}
 */
function getCurrentContext() {
  const state = useStore.getState();
  if (!state.coupleId || !state.currentCouple || !state.partners) {
    return { couple: null, partner: null };
  }

  const partnerId =
    state.appState.userId ||
    Object.values(state.partners).find(
      (p) => p.coupleId === state.coupleId,
    )?.id;

  if (!partnerId) {
    return { couple: state.currentCouple, partner: null };
  }

  const partner = state.partners[partnerId];

  return {
    couple: state.currentCouple,
    partner: partner
      ? {
          id: partner.id,
          name: partner.name,
          isPartnerA: partner.isPartnerA,
        }
      : null,
  };
}

export {
  generatePartnerCode,
  createCouple,
  joinCoupleByCode,
  loadAllCouples,
  findCoupleByCode,
  isLinked,
  getCurrentContext,
};