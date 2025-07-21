/**
 * Configuration settings for the Eldorado.gg game data fetching script.
 */
export const config = {
	url: "https://www.eldorado.gg/api/library",
	outputDirectory: "./output",
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
	api: {
		name: "api.json",
	},
};

/**
 * Centralized console messages used throughout the script.
 */
export const messages = {
	unexpectedError: "An unexpected error occurred during script execution:",
	invalidCommand: (command) =>
		`Error: Invalid command '${command}'. Supported commands: 'games', 'details', 'tags'.`,
	commandSuccess: (command) => `Command '${command}' executed successfully.`,
	noCommandProvided: "No command provided.",
	usageHint: "Usage: node generateGames.mjs <games|details|tags>",

	ensuredDirectory: (path) => `Ensured directory exists: ${path}`,
	couldNotReadGamesFile: (path) =>
		`Could not read ${path}. Please ensure 'games' data is available.`,
	noGameIdsForFetch: (type) =>
		`No game IDs found to fetch ${type} for. Exiting.`,
	processingBatch: (currentBatchNum, totalBatches, batchIds) =>
		`[${currentBatchNum}/${totalBatches}] Processing batch of game IDs: ${batchIds.join(", ")}`,
	batchCompleteWaiting: (delayMinutes) =>
		`Batch complete. Waiting ${delayMinutes} minutes before next batch...`,
	fetchErrorGeneric: (gameId) => `Generic fetch error for game ID ${gameId}:`,

	initialFetchStart: "Fetching initial games data (category: Account)...",
	initialFetchFound: (count) => `Found ${count} account games.`,
	initialFetchError: "Error fetching initial games data:",
	noAccountGames: "Found 0 account games. Exiting.",
	initialGamesSaveSuccess: (path) => `Initial game list saved to ${path}`,
	initialGamesSaveError: (path) => `Error saving initial games to ${path}:`,

	fetchDetailsStart: "Starting details fetch...",
	fetchDetailsError: (gameId, status, statusText) =>
		`Error fetching details for game ID ${gameId}: ${status} - ${statusText}`,
	detailsSaveSuccess: (count, path) =>
		`Successfully saved details for ${count} games to ${path}`,
	detailsSaveError: (path) => `Error saving details to ${path}:`,

	fetchTagsStart: "Starting tags fetch...",
	fetchTagsError: (gameId, status, statusText) =>
		`Error fetching tags for game ID ${gameId}: ${status} - ${statusText}`,
	tagsSaveSuccess: (count, path) =>
		`Successfully saved tags for ${count} games to ${path}`,
	tagsSaveError: (path) => `Error saving tags to ${path}:`,

	mergingStart: "Starting data merging process...",
	mergeReadFilesError: "Error reading required files for merging:",
	mergeSaveSuccess: (path) => `Merging complete, saved to ${path}`,
	mergeSaveError: (path) => `Error saving merged data to ${path}:`,

	fetchSwaggerStart: (url) => `Attempting to fetch swagger.json from: ${url}`,
	fetchSwaggerSuccess: "Swagger.json fetched successfully.",
	fetchSwaggerError: "Error during swagger.json fetch:",
	swaggerSaveSuccess: (path) => `Fetched swagger.json saved to: ${path}`,
	swaggerSaveError: (path) => `Error saving swagger.json to ${path}:`,
	noSwaggerContent:
		"No swagger.json content fetched or an error occurred. Nothing to save.",
};
