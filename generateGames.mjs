import * as fs from "node:fs/promises";
import { config, messages } from "./config.mjs";

const OUTPUT_DIR = config.outputDirectory;

async function ensureDir(/** @type {string} */ dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
		console.log(messages.ensuredDirectory(dirPath));
	} catch (error) {
		console.error(`Error ensuring directory ${dirPath}:`, error);
		throw error;
	}
}

async function delay(/** @type {number} */ ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGamesData() {
	const url = `${config.url}/?locale=en-US`;
	try {
		console.log(messages.initialFetchStart);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data =
			/** @type {Array<{category: string, gameId: string | number}>} */ (
				await response.json()
			);
		const accounts = data.filter((item) => item.category === "Account");
		console.log(messages.initialFetchFound(accounts.length));
		return accounts;
	} catch (error) {
		console.error(messages.initialFetchError, error);
		return [];
	}
}

async function fetchOfferAttributes(/** @type {string | number} */ gameId) {
	const url = `${config.url}/${gameId}/Account/attributes/offers`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				messages.fetchOfferAttributesError(
					gameId,
					response.status,
					response.statusText,
				),
			);
			return [];
		}
		return /** @type {Array<{id: string, type: string, values: unknown[]}>} */ (
			await response.json()
		);
	} catch (error) {
		console.error(messages.fetchErrorGeneric(gameId), error);
		return [];
	}
}

async function fetchGameDetails(/** @type {string | number} */ gameId) {
	const url = `${config.url}/${gameId}/Account/`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				messages.fetchDetailsError(
					gameId,
					response.status,
					response.statusText,
				),
			);
			return null;
		}
		const data = /** @type {Record<string, unknown>} */ (await response.json());
		const offerAttributes = await fetchOfferAttributes(gameId);
		return { ...data, offerAttributes, attributeIdsCsv: null };
	} catch (error) {
		console.error(messages.fetchErrorGeneric(gameId), error);
		return null;
	}
}

async function runFetchGames() {
	await ensureDir(OUTPUT_DIR);

	const initialGamesData = await fetchGamesData();

	if (initialGamesData.length === 0) {
		console.log(messages.noAccountGames);
		return;
	}

	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		await fs.writeFile(
			gamesFilePath,
			JSON.stringify(initialGamesData, null, 2),
		);
		console.log(messages.initialGamesSaveSuccess(gamesFilePath));
	} catch (error) {
		console.error(messages.initialGamesSaveError(gamesFilePath), error);
		process.exit(1);
	}
}

async function runFetchDetails() {
	await ensureDir(OUTPUT_DIR);

	/** @type {Array<{gameId: string | number}>} */
	let initialGamesData;
	const gamesFilePath = `${OUTPUT_DIR}/${config.games.name}`;
	try {
		const gamesContent = await fs.readFile(gamesFilePath, { encoding: "utf8" });
		initialGamesData = JSON.parse(gamesContent);
	} catch (_error) {
		console.error(messages.couldNotReadGamesFile(gamesFilePath));
		process.exit(1);
	}

	const gameIds = initialGamesData
		.map((game) => game.gameId)
		.filter((id) => id);
	if (gameIds.length === 0) {
		console.log(messages.noGameIdsForFetch("details"));
		return;
	}

	console.log(messages.fetchDetailsStart);
	const allDetails = [];
	const batchSize = config.details.batchSize;

	for (let i = 0; i < gameIds.length; i += batchSize) {
		const batch = gameIds.slice(i, i + batchSize);
		const currentBatchNum = Math.floor(i / batchSize) + 1;
		const totalBatches = Math.ceil(gameIds.length / batchSize);
		console.log(messages.processingBatch(currentBatchNum, totalBatches, batch));

		const batchPromises = batch.map((gameId) => fetchGameDetails(gameId));
		const results = await Promise.all(batchPromises);
		allDetails.push(...results.filter((detail) => detail !== null));

		if (i + batchSize < gameIds.length) {
			const delayMinutes = config.details.batchDelayMs / (60 * 1000);
			console.log(messages.batchCompleteWaiting(delayMinutes));
			await delay(config.details.batchDelayMs);
		}
	}

	const detailsFilePath = `${OUTPUT_DIR}/${config.details.name}`;
	try {
		await fs.writeFile(detailsFilePath, JSON.stringify(allDetails, null, 2));
		console.log(
			messages.detailsSaveSuccess(allDetails.length, detailsFilePath),
		);
	} catch (error) {
		console.error(messages.detailsSaveError(detailsFilePath), error);
		process.exit(1);
	}
}

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	try {
		switch (command) {
			case "games":
				await runFetchGames();
				break;
			case "details":
				await runFetchDetails();
				break;
			default:
				console.error(
					messages.invalidCommand(command || messages.noCommandProvided),
				);
				console.log(messages.usageHint);
				process.exit(1);
		}
		console.log(messages.commandSuccess(command));
	} catch (err) {
		console.error(messages.unexpectedError, err);
		process.exit(1);
	}
}

main();
