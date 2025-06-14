/**
 * Configuration settings for the Eldorado game data fetching script.
 * Adjust these values to change script behavior.
 */
export const CONFIG = {
  batchSize: 10,
  batchDelayMs: 1 * 60 * 1000, // Default: 5 minutes
};
/**
 * Centralized console messages used throughout the script.
 * This makes it easier to manage and update log messages.
 */
export const MESSAGES = {
  initialFetchStart: "Fetching account category...",
  initialFetchFound: (count) => `Found ${count} games.`,
  initialFetchError: "Error fetching initial games data:",
  noAccountGames: "Found 0 games exiting script.",
  initialGamesSaveSuccess: "Initial game list saved to games.json",
  initialGamesSaveError: "Error saving initial games to games.json:",
  processingBatch: (currentBatchNum, totalBatches, gameIds) =>
    `[${currentBatchNum}/${totalBatches}] ${gameIds.join(", ")}`,
  batchCompleteWaiting: `Batch complete. Waiting ${CONFIG.batchDelayMs}...`,
  fetchDetailsError: (gameId, status, statusText) =>
    `Error fetching ${gameId}: ${status} - ${statusText}`,
  fetchErrorGeneric: (gameId) => `Fetch error ${gameId}:`,
  detailsSaveSuccess: (count) => `Successfully saved details for ${count} games to details.json`,
  detailsSaveError: "Error saving details to details.json:",
  mergingStart: "Starting data merging process...",
  readFilesError: "Error reading games.json or details.json for merging:",
  mergeSaveSuccess: "Merging complete, saved to EldoradoGames.json",
  mergeSaveError: "Error saving merged data to EldoradoGames.json:",
  unexpectedError: "An unexpected error occurred during script execution:",
};
