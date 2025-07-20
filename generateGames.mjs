import * as fs from "node:fs/promises";
import { config } from "./config.mjs";

// Define output directory using the configurable value
const OUTPUT_DIR = config.outputDirectory;

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path of the directory to ensure.
 */
async function ensureDir(dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
		console.log(`Ensured directory exists: ${dirPath}`);
	} catch (error) {
		console.error(`Error ensuring directory ${dirPath}:`, error);
		throw error;
	}
}

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches the initial list of games from eldorado.gg API and filters for "Account" category.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of game objects, or an empty array on error.
 */
async function fetchGamesData() {
	const url = `${config.url}/?locale=en-US`; // Use base URL from config
	try {
		console.log("Fetching initial games data (category: Account)...");
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		const accounts = data.filter((item) => item.category === "Account");
		console.log(`Found ${accounts.length} account games.`);
		return accounts;
	} catch (error) {
		console.error("Error fetching initial games data:", error);
		return [];
	}
}

/**
 * Fetches detailed information for a specific game ID.
 * @param {string} gameId - The ID of the game to fetch details for.
 * @returns {Promise<Object|null>} A promise that resolves to the game details object, or null if an error occurs.
 */
async function fetchGameDetails(gameId) {
	const url = `${config.url}/${gameId}/Account/`; // Use base URL from config
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				`Error fetching details for game ID ${gameId}: ${response.status} - ${response.statusText}`,
			);
			return null;
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Generic fetch error for game ID ${gameId}:`, error);
		return null;
	}
}

/**
 * Fetches tags for a specific game ID.
 * @param {string} gameId - The ID of the game to fetch tags for.
 * @returns {Promise<Object|null>} A promise that resolves to the tags object, or null if an error occurs.
 */
async function fetchGameTags(gameId) {
	// IMPORTANT: This URL is a placeholder. You'll need to confirm the actual API endpoint for tags.
	// Example: Maybe it's `https://www.eldorado.gg/api/library/${gameId}/tags/` or `https://www.eldorado.gg/api/game/${gameId}/tags`
	const url = `${config.url}/${gameId}/filters/`; // Adjust this URL based on actual API
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				`Error fetching tags for game ID ${gameId}: ${response.status} - ${response.statusText}`,
			);
			return null;
		}
		const data = await response.json();
		return { gameId, tags: data }; // Assuming tags come as an array or object directly
	} catch (error) {
		console.error(`Generic fetch error for game ID ${gameId}:`, error);
		return null;
	}
}

/**
 * Fetches initial game list and saves it. This is the functionality for 'games' command.
 */
async function runFetchGames() {
	await ensureDir(OUTPUT_DIR); // Ensure output directory exists

	const initialGamesData = await fetchGamesData();

	if (initialGamesData.length === 0) {
		console.log("Found 0 account games. Exiting.");
		return;
	}

	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		await fs.writeFile(
			gamesFilePath,
			JSON.stringify(initialGamesData, null, 2),
		);
		console.log(`Initial game list saved to ${gamesFilePath}`);
	} catch (error) {
		console.error(`Error saving initial games to ${gamesFilePath}:`, error);
		process.exit(1);
	}
}

/**
 * Fetches game details in batches and saves them. This is the functionality for 'details' command.
 */
async function runFetchDetails() {
	await ensureDir(OUTPUT_DIR); // Ensure output directory exists

	// Read games data from OUTPUT_DIR (where 'games' command now saves it)
	let initialGamesData;
	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		const gamesContent = await fs.readFile(gamesFilePath, { encoding: "utf8" });
		initialGamesData = JSON.parse(gamesContent);
	} catch (error) {
		console.error(
			`Could not read ${gamesFilePath}. Please ensure 'games' data is available.`,
		);
		process.exit(1);
	}

	const gameIds = initialGamesData
		.map((game) => game.gameId)
		.filter((id) => id);
	if (gameIds.length === 0) {
		console.log("No game IDs found to fetch details for. Exiting.");
		return;
	}

	console.log("Starting details fetch...");
	const allDetails = [];
	const batchSize = config.details.batchSize;

	for (let i = 0; i < gameIds.length; i += batchSize) {
		const batch = gameIds.slice(i, i + batchSize);
		const currentBatchNum = Math.floor(i / batchSize) + 1;
		const totalBatches = Math.ceil(gameIds.length / batchSize);
		console.log(
			`[${currentBatchNum}/${totalBatches}] Processing batch of game IDs: ${batch.join(", ")}`,
		);

		const batchPromises = batch.map((gameId) => fetchGameDetails(gameId));
		const results = await Promise.all(batchPromises);
		allDetails.push(...results.filter((detail) => detail !== null));

		if (i + batchSize < gameIds.length) {
			const delayMinutes = config.details.batchDelayMs / (60 * 1000);
			console.log(
				`Batch complete. Waiting ${delayMinutes} minutes before next batch...`,
			);
			await delay(config.details.batchDelayMs);
		}
	}

	// Save details data directly to OUTPUT_DIR
	const detailsFilePath = `${OUTPUT_DIR}/${config.details.name}`;
	try {
		await fs.writeFile(detailsFilePath, JSON.stringify(allDetails, null, 2));
		console.log(
			`Successfully saved details for ${allDetails.length} games to ${detailsFilePath}`,
		);
	} catch (error) {
		console.error(`Error saving details to ${detailsFilePath}:`, error);
		process.exit(1);
	}
}

/**
 * Fetches game tags in batches and saves them. This is the functionality for 'tags' command.
 */
async function runFetchTags() {
	await ensureDir(OUTPUT_DIR); // Ensure output directory exists

	// Read games data from OUTPUT_DIR (where 'games' command saves it)
	let initialGamesData;
	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		const gamesContent = await fs.readFile(gamesFilePath, { encoding: "utf8" });
		initialGamesData = JSON.parse(gamesContent);
	} catch (error) {
		console.error(
			`Could not read ${gamesFilePath}. Please ensure 'games' data is available.`,
		);
		process.exit(1);
	}

	const gameIds = initialGamesData
		.map((game) => game.gameId)
		.filter((id) => id);
	if (gameIds.length === 0) {
		console.log("No game IDs found to fetch tags for. Exiting.");
		return;
	}

	console.log("Starting tags fetch...");
	const allTags = [];
	const batchSize = config.tags.batchSize;

	for (let i = 0; i < gameIds.length; i += batchSize) {
		const batch = gameIds.slice(i, i + batchSize);
		const currentBatchNum = Math.floor(i / batchSize) + 1;
		const totalBatches = Math.ceil(gameIds.length / batchSize);
		console.log(
			`[${currentBatchNum}/${totalBatches}] Processing batch of game IDs: ${batch.join(", ")}`,
		);

		const batchPromises = batch.map((gameId) => fetchGameTags(gameId));
		const results = await Promise.all(batchPromises);
		allTags.push(...results.filter((tag) => tag !== null));

		if (i + batchSize < gameIds.length) {
			const delayMinutes = config.tags.batchDelayMs / (60 * 1000);
			console.log(
				`Batch complete. Waiting ${delayMinutes} minutes before next batch...`,
			);
			await delay(config.tags.batchDelayMs);
		}
	}

	// Save tags data directly to OUTPUT_DIR
	const tagsFilePath = `${OUTPUT_DIR}/${config.tags.name}`;
	try {
		await fs.writeFile(tagsFilePath, JSON.stringify(allTags, null, 2));
		console.log(
			`Successfully saved tags for ${allTags.length} games to ${tagsFilePath}`,
		);
	} catch (error) {
		console.error(`Error saving tags to ${tagsFilePath}:`, error);
		process.exit(1);
	}
}

/**
 * Main function to act as a CLI dispatcher.
 */
async function main() {
	const args = process.argv.slice(2); // Get command-line arguments
	const command = args[0];

	try {
		switch (command) {
			case "games":
				await runFetchGames();
				break;
			case "details":
				await runFetchDetails();
				break;
			case "tags": // New case for 'tags'
				await runFetchTags();
				break;
			// 'all', 'merge' will be added later
			default:
				console.error(
					`Error: Invalid command '${command || "No command provided"}'. Supported commands: 'games', 'details', 'tags'.`,
				);
				console.log("Usage: node generateGames.mjs <games|details|tags>");
				process.exit(1);
		}
		console.log(`Command '${command}' executed successfully.`);
	} catch (err) {
		console.error("An unexpected error occurred during script execution:", err);
		process.exit(1);
	}
}

// Run the main function.
main();
