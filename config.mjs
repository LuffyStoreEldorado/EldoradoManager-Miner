/**
 * Configuration settings for the Eldorado.gg game data fetching script.
 * Adjust these values to change script behavior.
 */
export const config = {
  url: "https://www.eldorado.gg/api/library",
  games: {
    name: "EldoradoGames.json",
  },
  details: {
    name: "EldoradoDetails.json",
    batchSize: 10,
    batchDelayMs: 1 * 60 * 1000,
  },
  tags: {
    name: "EldoradoTags.json",
    batchSize: 10,
    batchDelayMs: 1 * 60 * 1000,
  },
  outputDirectory: "./output",
};

/**
 * Centralized console messages used throughout the script.
 * This makes it easier to manage and update log messages.
 */
export const messages = {
  // TO DO
};
