import * as fs from "node:fs/promises";
import { config, messages } from "./config.mjs";

const SWAGGER_FETCH_CONFIG = {
	swaggerUrl: "https://www.eldorado.gg/swagger/seller/swagger.json",
	eldoradoIdToken: process.env.ELDORADO_TOKEN,
};

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path of the directory to ensure.
 */
async function ensureDir(dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
		console.log(messages.ensuredDirectory(dirPath));
	} catch (error) {
		console.error(`Error ensuring directory ${dirPath}:`, error);
		process.exit(1);
	}
}

/**
 * Fetches the swagger.json file from the specified URL with authentication.
 * @returns {Promise<Object|null>} The parsed JSON content of the Swagger file, or null on error.
 */
async function fetchSwaggerJson() {
	if (!SWAGGER_FETCH_CONFIG.eldoradoIdToken) {
		console.error(
			messages.unexpectedError,
			"ELDORADO_ID_TOKEN environment variable is not set. Please set it.",
		);
		return null;
	}

	console.log(messages.fetchSwaggerStart(SWAGGER_FETCH_CONFIG.swaggerUrl));

	try {
		const response = await fetch(SWAGGER_FETCH_CONFIG.swaggerUrl, {
			method: "GET",
			headers: {
				Cookie: `__Host-EldoradoIdToken=${SWAGGER_FETCH_CONFIG.eldoradoIdToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`HTTP error! Status: ${response.status} - ${response.statusText}`,
			);
			console.error(`Response body: ${errorText}`);
			throw new Error(
				`Failed to fetch swagger.json with status ${response.status}`,
			);
		}

		const data = await response.json();
		console.log(messages.fetchSwaggerSuccess);
		return data;
	} catch (error) {
		console.error(messages.fetchSwaggerError, error);
		return null;
	}
}

/**
 * Main function to orchestrate the swagger.json fetching and saving process.
 * @returns {Promise<void>}
 */
async function main() {
	const outputDirectory = config.outputDirectory;
	const outputFileName = config.api.name;

	await ensureDir(outputDirectory);

	const swaggerContent = await fetchSwaggerJson();

	if (swaggerContent) {
		const outputPath = `${outputDirectory}/${outputFileName}`;
		try {
			await fs.writeFile(outputPath, JSON.stringify(swaggerContent, null, 2));
			console.log(messages.swaggerSaveSuccess(outputPath));
		} catch (error) {
			console.error(messages.swaggerSaveError(outputPath), error);
			process.exit(1);
		}
	} else {
		console.log(messages.noSwaggerContent);
	}
}

main().catch(console.error);
