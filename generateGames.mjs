import * as fs from "node:fs/promises";
import { config } from "./config.mjs";

// Define output directory using the configurable value
const OUTPUT_DIR = config.outputDirectory; // Now reads from config

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path of the directory to ensure.
 */
async function ensureDir(dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
		// console.log(`Ensured directory exists: ${dirPath}`); // Removed as MESSAGES is empty
	} catch (error) {
		console.error(`Error ensuring directory ${dirPath}:`, error);
		throw error;
	}
}

/**
 * Fetches the initial list of games from eldorado.gg API and filters for "Account" category.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of game objects, or an empty array on error.
 */
async function fetchGamesData() {
	const url = `${config.url}/?locale=en-US`; // Use base URL from config
	try {
		// console.log(MESSAGES.initialFetchStart); // Removed as MESSAGES is empty
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		const accounts = data.filter((item) => item.category === "Account");
		// console.log(MESSAGES.initialFetchFound(accounts.length)); // Removed as MESSAGES is empty
		return accounts;
	} catch (error) {
		console.error("Error fetching initial games data:", error); // Simple error message
		return [];
	}
}

/**
 * Fetches initial game list and saves it. This is the functionality for 'games' command.
 */
async function runFetchGames() {
	await ensureDir(OUTPUT_DIR); // Ensure temporary directory exists

	const initialGamesData = await fetchGamesData();

	if (initialGamesData.length === 0) {
		console.log("Found 0 account games. Exiting."); // Simple message
		return;
	}

	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		await fs.writeFile(
			gamesFilePath,
			JSON.stringify(initialGamesData, null, 2),
		);
		console.log(`Initial game list saved to ${gamesFilePath}`); // Simple success message
	} catch (error) {
		console.error(`Error saving initial games to ${gamesFilePath}:`, error); // Simple error message
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
			// Other cases (details, tags, all, merge) will be added later
			default:
				console.error(
					`Error: Invalid command '${
						command || "No command provided"
					}'. Only 'games' is supported for now.`,
				);
				console.log("Usage: node generateGames.mjs games");
				process.exit(1);
		}
		console.log(`Command '${command}' executed successfully.`);
	} catch (err) {
		console.error("An unexpected error occurred during script execution:", err); // Simple error message
		process.exit(1);
	}
}

// Run the main function.
main();
