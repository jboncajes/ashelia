import useStore from "../store/useStore";
import { getQuestionPool } from "./questionPool";

/**
 * Get today's date in YYYY-MM-DD format.
 * @returns {string}
 */
function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get a deterministic seed from a coupleId and date string.
 * @param {string} coupleId
 * @param {string} date "YYYY-MM-DD"
 * @returns {number}
 */
function getSeed(coupleId, date) {
  let hash = 0;
  const combined = coupleId + date;
  for (let i = 0; i < combined.length; i += 1) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32‑bit integer
  }
  return Math.abs(hash % 2147483647);
}

/**
 * Simple seeded random number generator.
 * @param {number} seed
 * @returns {() => number} Function returning 0–1 float.
 */
function createSeededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Fisher–Yates shuffle of an array (mutates).
 * @param {Array} array
 * @param {function(): number} random 0–1 float generator
 */
function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Filter the question pool by the current couple's settings.
 * @param {Array<{id: string, filters: string[]}>} pool
 * @param {string[]} activeFilters
 * @returns {Array<{id: string, filters: string[]}>}
 */
function filterPoolByFilters(pool, activeFilters) {
  if (!activeFilters || activeFilters.length === 0) {
    return pool;
  }
  // Question must have at least one filter that matches any active filter.
  return pool.filter((q) =>
    q.filters.some((f) => activeFilters.includes(f)),
  );
}

/**
 * Decide the daily question for the current couple and date.
 * - If already decided for today, reuse it.
 * - Otherwise, pick one from the filtered pool.
 * @returns {Promise<{question: Question|null, date: string}>}
 */
async function pickDailyQuestion() {
  const state = useStore.getState();
  const { coupleId, currentCouple, questionPool, dailyAnswerDate, dailyQuestion } = state;

  if (!coupleId || !currentCouple) {
    return { question: null, date: null };
  }

  const today = getTodayDate();

  // If we already have a daily question for this date, reuse it.
  if (dailyAnswerDate === today && dailyQuestion) {
    return { question: dailyQuestion, date: today };
  }

  const filters = currentCouple.settings.filters || [];
  const pool = Object.values(questionPool);
  const filteredPool = filterPoolByFilters(pool, filters);

  if (filteredPool.length === 0) {
    console.warn("No questions match current filters", filters);
    return { question: null, date: today };
  }

  const seed = getSeed(coupleId, today);
  const random = createSeededRandom(seed);
  const shuffled = [...filteredPool]; // copy before shuffling
  shuffle(shuffled, random);

  const selected = shuffled[0];

  useStore.setState({
    dailyQuestion: selected,
    dailyAnswerDate: today,
  });

  return { question: selected, date: today };
}

/**
 * Manually trigger a new daily question (for testing only).
 * This does NOT change the date; it just picks a fresh question for today.
 * @returns {Promise<{question: Question|null, date: string}>}
 */
async function forceNewDailyQuestion() {
  const state = useStore.getState();
  const { coupleId, currentCouple, questionPool } = state;
  if (!coupleId || !currentCouple) {
    return { question: null, date: null };
  }

  const today = getTodayDate();
  const filters = currentCouple.settings.filters || [];
  const pool = Object.values(questionPool);
  const filteredPool = filterPoolByFilters(pool, filters);

  if (filteredPool.length === 0) {
    return { question: null, date: today };
  }

  const seed = getSeed(coupleId, today);
  const random = createSeededRandom(seed);
  const shuffled = [...filteredPool];
  shuffle(shuffled, random);

  const selected = shuffled[0];

  useStore.setState({
    dailyQuestion: selected,
    dailyAnswerDate: today,
  });

  return { question: selected, date: today };
}

/**
 * Check if the current partner has already answered today.
 * @returns {boolean}
 */
function hasAnsweredToday() {
  const state = useStore.getState();
  const { coupleId, dailyAnswerDate, answers } = state;
  if (!coupleId || !dailyAnswerDate) {
    return false;
  }

  const key = `${coupleId}:d${dailyAnswerDate}`;
  const answer = answers[key];
  if (!answer) {
    return false;
  }

  const partnerId = state.appState.userId;
  if (!partnerId) {
    return false;
  }

  const partner =
    Object.values(state.partners).find((p) => p.id === partnerId) ||
    null;

  const field =
    partner?.isPartnerA === true
      ? "partnerAAnsweredAt"
      : "partnerBAnsweredAt";

  return !!answer[field];
}

/**
 * Load the question pool into Zustand if not already loaded.
 * (For now, this is a dummy loader; later you may load from API.)
 */
async function loadQuestionPoolIfNeeded() {
  const state = useStore.getState();
  const pool = getQuestionPool();
  const poolIds = Object.keys(pool);
  const stateIds = Object.keys(state.questionPool);

  if (
    poolIds.length > 0 &&
    (stateIds.length === 0 ||
      poolIds.sort().join(",") !== stateIds.sort().join(","))
  ) {
    useStore.setState({ questionPool: pool });
  }
}

export {
  pickDailyQuestion,
  forceNewDailyQuestion,
  hasAnsweredToday,
  loadQuestionPoolIfNeeded,
};