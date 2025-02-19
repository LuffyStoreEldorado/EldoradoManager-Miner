// fetchDetails.js

// Helper function to fetch details for a given gameId.
async function fetchDetails(gameId) {
  const url = `https://www.eldorado.gg/api/library/${gameId}/Account/`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching gameId ${gameId}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Fetch error for gameId ${gameId}:`, error);
    return null;
  }
}

// Helper function to delay for a given number of milliseconds.
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Read and parse the games.json file.
  const gamesContent = await Bun.file("games.json").text();
  const games = JSON.parse(gamesContent);

  // Extract game IDs from the parsed JSON (assumes each object has a gameId property).
  const gameIds = games.map((game) => game.gameId);

  // Array to hold the fetched details.
  const details = [];

  // Process IDs in batches of 10.
  const batchSize = 10;
  for (let i = 0; i < gameIds.length; i += batchSize) {
    // Get a slice of up to 10 game IDs.
    const batch = gameIds.slice(i, i + batchSize);
    console.log(`Fetching details for gameIds: ${batch.join(", ")}`);

    // Initiate all fetch requests concurrently for this batch.
    const batchPromises = batch.map((gameId) => fetchDetails(gameId));
    // Wait until all requests in the current batch complete.
    const results = await Promise.all(batchPromises);

    // Filter out any null responses (errors) and add the rest to our details array.
    details.push(...results.filter((detail) => detail !== null));

    // If there are more IDs to process, wait 5 minutes before processing the next batch.
    if (i + batchSize < gameIds.length) {
      console.log("Waiting 5 minutes before processing the next batch...");
      await delay(5 * 60 * 1000); // 5 minutes in milliseconds.
    }
  }

  // Save all the collected details to details.json with pretty-print formatting.
  await Bun.write("details.json", JSON.stringify(details, null, 2));
  console.log("All details saved to details.json");
}

// Run the main function.
main().catch((err) => console.error("Unexpected error:", err));
