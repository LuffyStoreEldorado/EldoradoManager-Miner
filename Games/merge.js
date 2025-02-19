// import Bun's file system utility
const gamesContent = await Bun.file("games.json").text();
const detailsContent = await Bun.file("details.json").text();

// Parse the JSON content
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

// Write the merged result to EldoradoGames.json
await Bun.write("EldoradoGames.json", JSON.stringify(mergedGames, null, 2));

console.log("Merging complete, saved to EldoradoGames.json");
