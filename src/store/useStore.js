import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid"; // install if you want robust IDs: npm install uuid
import { storage } from "../utils/storage";

/**
 * Types you can move to a types.js file later
 */

/**
 * @typedef {Object} AppState
 * @property {string} userId
 * @property {boolean} onboardingCompleted
 * @property {"light"|"dark"} theme
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} [avatar]
 * @property {boolean} isPartnerA
 * @property {string} coupleId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Couple
 * @property {string} id
 * @property {string} name
 * @property {string} createdAt
 * @property {string} partnerAId
 * @property {string} partnerBId
 * @property {string} partnerACode
 * @property {string} partnerBCode
 * @property {Object} settings
 * @property {string} settings.language
 * @property {string} settings.theme
 * @property {string} settings.difficulty
 * @property {string[]} settings.filters
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} text
 * @property {string} type
 * @property {"easy"|"medium"|"hard"} difficulty
 * @property {string[]} filters
 */

/**
 * @typedef {Object} Answer
 * @property {string} coupleId
 * @property {string} date
 * @property {string} questionId
 * @property {string|null} partnerAAnswer
 * @property {string|null} partnerBAnswer
 * @property {string|null} partnerAAnsweredAt
 * @property {string|null} partnerBAnsweredAt
 * @property {boolean} revealed
 * @property {Object} revealState
 * @property {string} revealState.phase
 * @property {string} revealState.transition
 */

/**
 * @typedef {Object} StreakStats
 * @property {number} current
 * @property {number} longest
 * @property {string} lastAnswerDate
 * @property {Array<{date: string, answered: boolean}>} streakHistory
 */

/**
 * @typedef {Object} StoreState
 * @property {AppState} appState
 * @property {string|null} coupleId
 * @property {Couple|null} currentCouple
 * @property {Object.<string, Profile>} partners
 * @property {Object.<string, Question>} questionPool
 * @property {Question|null} dailyQuestion
 * @property {string|null} dailyAnswerDate
 * @property {Object.<string, Answer>} answers
 * @property {Object.<string, StreakStats>} streaks
 * @property {Object} revealState
 * @property {string|null} revealState.coupleId
 * @property {string|null} revealState.date
 * @property {"partnerA"|"partnerB"|"both"} revealState.phase
 */

/**
 * @typedef {Object} StoreActions
 * @property {(name: string, partnerAName: string, partnerBName: string) => Promise<{success: boolean, error?: string, coupleId?: string}>} createCouple
 * @property {(code: string) => Promise<{success: boolean, error?: string, coupleId?: string}>} joinCouple
 * @property {(text: string, partnerKey: "A"|"B") => Promise<void>} answerDailyQuestion
 * @property {() => Promise<void>} syncAnswers
 * @property {() => Promise<void>} loadFromStorage
 * @property {() => Promise<void>} saveToStorage
 */

/**
 * @typedef {StoreState & StoreActions} Store
 */

const initialAppState = {
  userId: `u-${Date.now()}`,
  onboardingCompleted: false,
  theme: "light",
};

const initialStreaks = {
  // Will be filled per coupleId later
};

const initialRevealState = {
  coupleId: null,
  date: null,
  phase: "partnerA",
};

/**
 * Central store for Ashelia
 */
const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        // device / user state
        appState: initialAppState,

        // couple context
        coupleId: null,
        currentCouple: null,
        partners: {},

        // questions
        questionPool: {},
        dailyQuestion: null,
        dailyAnswerDate: null,

        // answers & streaks
        answers: {},
        streaks: initialStreaks,

        // UI / UX
        revealState: initialRevealState,

        // Actions
        createCouple: async (name, partnerAName, partnerBName) => {
          const state = get();
          if (state.coupleId) {
            return {
              success: false,
              error: "You are already in a couple.",
            };
          }

          const coupleId = `cpl-${uuidv4()}`;
          const partnerAId = `u-${uuidv4()}`;
          const partnerBId = `u-${uuidv4()}`;
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

          set((s) => ({
            coupleId,
            currentCouple: newCouple,
            partners: {
              ...s.partners,
              [partnerAId]: partnerAProfile,
              [partnerBId]: partnerBProfile,
            },
          }));

          await get().saveToStorage();
          return { success: true, coupleId };
        },

        joinCouple: async (code) => {
          const state = get();

          if (state.coupleId) {
            return {
              success: false,
              error: "You are already in a couple.",
            };
          }

          const couple = Object.values(state.currentCouple)
            .map(() => state.currentCouple)
            .find(
              (c) =>
                c?.partnerACode === code ||
                c?.partnerBCode === code,
            ); // This is a bit fake here; we’ll flesh this later in partnerService.

          // For now, we just pretend this is blocked unless we wire the real storage lookup.
          // In next phase we’ll implement proper code‑lookup in partnerService.

          return {
            success: false,
            error: "Join code system not fully implemented yet. Use createCouple for now.",
          };
        },

        answerDailyQuestion: async (text, partnerKey) => {
          const { coupleId, dailyAnswerDate, dailyQuestion } = get();
          if (!coupleId || !dailyAnswerDate || !dailyQuestion) {
            return;
          }

          const key = `${coupleId}:d${dailyAnswerDate}`;
          const now = new Date().toISOString();

          const answerField = partnerKey === "A" ? "partnerAAnswer" : "partnerBAnswer";
          const answeredAtField = partnerKey === "A" ? "partnerAAnsweredAt" : "partnerBAnsweredAt";

          set((s) => {
            const existing = s.answers[key] || {
              coupleId,
              date: dailyAnswerDate,
              questionId: dailyQuestion.id,
              partnerAAnswer: null,
              partnerAAnsweredAt: null,
              partnerBAnswer: null,
              partnerBAnsweredAt: null,
              revealed: false,
              revealState: { phase: "partnerA", transition: "initial" },
            };

            existing[answerField] = text;
            existing[answeredAtField] = now;
            existing.revealed = !!existing.partnerAAnswer && !!existing.partnerBAnswer;

            return {
              answers: {
                ...s.answers,
                [key]: existing,
              },
            };
          });

          await get().syncAnswers();
        },

        syncAnswers: async () => {
          const { coupleId, dailyAnswerDate, answers } = get();
          if (!coupleId || !dailyAnswerDate) {
            return;
          }

          const key = `${coupleId}:d${dailyAnswerDate}`;
          const answer = answers[key];

          if (!answer) {
            return;
          }

          // Update streaks
          const now = new Date().toISOString();
          const today = now.split("T")[0];

          const streak = get().streaks[coupleId] || {
            current: 0,
            longest: 0,
            lastAnswerDate: "",
            streakHistory: [],
          };

          const lastDate = streak.lastAnswerDate;
          const lastDay = lastDate ? new Date(lastDate).getDay() : -1;
          const todayDay = new Date(today).getDay();

          let newCurrent = streak.current;
          if (today === lastDate) {
            // already answered today, no change
          } else if (todayDay === (lastDay + 1) % 7) {
            // consecutive day
            newCurrent += 1;
          } else {
            // break
            newCurrent = 1;
          }

          const newStreak = {
            current: newCurrent,
            longest: Math.max(streak.longest, newCurrent),
            lastAnswerDate: today,
            streakHistory: [
              ...streak.streakHistory,
              { date: today, answered: true },
            ],
          };

          set((s) => ({
            streaks: {
              ...s.streaks,
              [coupleId]: newStreak,
            },
          }));

          await get().saveToStorage();
        },

        loadFromStorage: async () => {
          const rawData = await storage.get();
          if (!rawData) {
            return;
          }

          set({
            appState: rawData.appState ?? initialAppState,
            coupleId: rawData.coupleId ?? null,
            currentCouple: rawData.currentCouple ?? null,
            partners: rawData.partners ?? {},
            questionPool: rawData.questionPool ?? {},
            dailyQuestion: rawData.dailyQuestion ?? null,
            dailyAnswerDate: rawData.dailyAnswerDate ?? null,
            answers: rawData.answers ?? {},
            streaks: rawData.streaks ?? initialStreaks,
            revealState: rawData.revealState ?? initialRevealState,
          });
        },

        saveToStorage: async () => {
          const state = get();
          await storage.set({
            appState: state.appState,
            coupleId: state.coupleId,
            currentCouple: state.currentCouple,
            partners: state.partners,
            questionPool: state.questionPool,
            dailyQuestion: state.dailyQuestion,
            dailyAnswerDate: state.dailyAnswerDate,
            answers: state.answers,
            streaks: state.streaks,
            revealState: state.revealState,
          });
        },
      }),
      {
        name: "ashelia-store",
        storage: createJSONStorage(() => storage),
      },
    ),
  ),
);

/**
 * Tiny helper that generates a 6‑character uppercase code
 */
function generatePartnerCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default useStore;