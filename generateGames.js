import { CONFIG, MESSAGES } from './config.js'; // Import configuration and messages
import * as fs from 'fs/promises'; // Import Node.js file system promises API

// Define temporary and output directories
const TEMP_DIR = './tmp';
const OUTPUT_DIR = './output';

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
    // Re-throw to halt execution if critical directory creation fails
    throw error;
  }
}

/**
 * Deletes all files in a given directory.
 * @param {string} dirPath - The path of the directory to clear.
 */
async function clearDirectory(dirPath) {
  try {
    // Check if the directory exists before attempting to read it
    await fs.access(dirPath); 
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      await fs.unlink(`${dirPath}/${file}`); // Delete file
      console.log(`Deleted old file: ${dirPath}/${file}`);
    }
  } catch (error) {
    // If directory doesn't exist, it's fine. Otherwise, log error.
    if (error.code !== 'ENOENT') { // ENOENT means 'Entry Not Found'
      console.error(`Error clearing directory ${dirPath}:`, error);
    } else {
      console.log(`Directory ${dirPath} does not exist, no files to clear.`);
    }
  }
}

/**
 * Fetches the initial list of games from eldorado.gg API and filters for "Account" category.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of game objects, or an empty array on error.
 */
async function fetchAndFilterAccountsData() {
  const url = "https://www.eldorado.gg/api/library/?locale=en-US";
  try {
    console.log(MESSAGES.initialFetchStart);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const accounts = data.filter(item => item.category === "Account");
    console.log(MESSAGES.initialFetchFound(accounts.length));
    return accounts;
  } catch (error) {
    console.error(MESSAGES.initialFetchError, error);
    return []; // Return an empty array on error to prevent further issues.
  }
}

/**
 * Fetches detailed information for a specific game ID.
 * @param {string} gameId - The ID of the game to fetch details for.
 * @returns {Promise<Object|null>} A promise that resolves to the game details object, or null if an error occurs.
 */
async function fetchDetails(gameId) {
  const url = `https://www.eldorado.gg/api/library/${gameId}/Account/`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(MESSAGES.fetchDetailsError(gameId, response.status, response.statusText));
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(MESSAGES.fetchErrorGeneric(gameId), error);
    return null;
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
 * Main function to orchestrate the fetching, processing, and merging of game details.
 */
async function main() {
  // Ensure necessary directories exist
  await ensureDir(TEMP_DIR);
  await ensureDir(OUTPUT_DIR);
  
  // Clear the output directory before generating new files
  await clearDirectory(OUTPUT_DIR);

  // --- Step 1: Fetch and filter the initial list of games ---
  const initialGamesData = await fetchAndFilterAccountsData();

  if (initialGamesData.length === 0) {
    console.log(MESSAGES.noAccountGames);
    return;
  }

  // Save the initial games data to games.json in the temporary directory
  const gamesFilePath = `${TEMP_DIR}/games.json`;
  try {
    // fs.promises.writeFile takes a string or Buffer for data
    await fs.writeFile(gamesFilePath, JSON.stringify(initialGamesData, null, 2));
    console.log(MESSAGES.initialGamesSaveSuccess.replace("games.json", gamesFilePath));
  } catch (error) {
    console.error(MESSAGES.initialGamesSaveError, error);
    return; // Exit if initial games data cannot be saved
  }

  // Extract game IDs from the fetched data.
  const gameIds = initialGamesData.map((game) => game.gameId).filter(id => id);

  // Array to hold all the collected details.
  const allDetails = [];

  // Define the batch size from config.js
  const batchSize = CONFIG.batchSize;

  // --- Step 2: Process game IDs in batches to fetch details ---
  for (let i = 0; i < gameIds.length; i += batchSize) {
    const batch = gameIds.slice(i, i + batchSize);
    const currentBatchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(gameIds.length / batchSize);
    console.log(MESSAGES.processingBatch(currentBatchNum, totalBatches, batch));

    // Initiate all fetch requests concurrently for the current batch.
    const batchPromises = batch.map((gameId) => fetchDetails(gameId));
    
    // Wait until all requests in the current batch complete.
    const results = await Promise.all(batchPromises);

    // Filter out any null responses (indicating errors) and add valid results to the main array.
    allDetails.push(...results.filter((detail) => detail !== null));

    // If there are more IDs to process, wait for the configured delay before the next batch.
    if (i + batchSize < gameIds.length) {
      const delayMinutes = CONFIG.batchDelayMs / (60 * 1000);
      console.log(MESSAGES.batchCompleteWaiting.replace("{delayMinutes}", delayMinutes));
      await delay(CONFIG.batchDelayMs);
    }
  }

  // --- Step 3: Save all collected details to details.json in the temporary directory ---
  const detailsFilePath = `${TEMP_DIR}/details.json`;
  try {
    await fs.writeFile(detailsFilePath, JSON.stringify(allDetails, null, 2));
    console.log(MESSAGES.detailsSaveSuccess(allDetails.length).replace("details.json", detailsFilePath));
  } catch (error) {
    console.error(MESSAGES.detailsSaveError, error);
    return; // Exit if details cannot be saved
  }

  // --- Step 4: Merge the details based on gameId and save to EldoradoGames-{isotime}.json in the output directory ---
  console.log(MESSAGES.mergingStart);

  // Read and parse the games.json and details.json files from the temporary directory.
  let gamesContent;
  let detailsContent;
  try {
    // fs.promises.readFile returns a Buffer, so use .toString() to get string content
    gamesContent = await fs.readFile(gamesFilePath, { encoding: 'utf8' });
    detailsContent = await fs.readFile(detailsFilePath, { encoding: 'utf8' });
  } catch (error) {
    console.error(MESSAGES.readFilesError, error);
    return;
  }
  
  const games = JSON.parse(gamesContent);
  const details = JSON.parse(detailsContent);

  // Merge the details based on gameId
  const mergedGames = games.map((game) => {
    // Find the corresponding detail for the gameId
    const detail = details.find((d) => d.gameId === game.gameId);

    // If detail exists, add tradeEnvironments and attributes to the game object
    if (detail) {
      return {
        ...game,
        tradeEnvironments: detail.tradeEnvironments,
        attributes: detail.attributes,
      };
    }

    // Return game without any changes if no matching detail is found
    return game;
  });

  // Generate ISO timestamp for the output file
  const isoTime = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, ''); //YYYY-MM-DDTHH-MM-SS
  const finalOutputFileName = `EldoradoGames-${isoTime}.json`;
  const finalOutputFilePath = `${OUTPUT_DIR}/${finalOutputFileName}`;

  // Write the merged result to the final output file
  try {
    await fs.writeFile(finalOutputFilePath, JSON.stringify(mergedGames, null, 2));
    console.log(MESSAGES.mergeSaveSuccess.replace("EldoradoGames.json", finalOutputFilePath));
  } catch (error) {
    console.error(MESSAGES.mergeSaveError, error);
  }
}

// Run the main function and catch any top-level unexpected errors.
main().catch((err) => console.error(MESSAGES.unexpectedError, err));
