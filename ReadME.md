# EldoradoManager-Miner ⛏️

A collection of Node.js scripts to programmatically fetch and organize game, api data from Eldorado.gg.

## What it mines 📊

This project focuses on extracting **Account** game listing data from Eldorado.gg. Specifically, it mines:

* **Initial Game Listings**: A filtered list of "Account" category games.

* **Detailed Offer Information**: Granular details for each account offer, including `tradeEnvironments` and `attributes`.

* **API Definition**: The project also includes a script to fetch and save the latest seller API definition (`swagger.json`), which details endpoints for managing offers, orders, and notifications.

## How it Works 🛠️

The project utilizes a modular CLI approach, allowing you to run specific data fetching tasks. Data is saved as JSON files in the designated output directory.

### Core Scripts

* `generateGames.mjs`: Fetches and processes game data (games, details, tags) from Eldorado.gg's public API.

* `generateApi.mjs`: Fetches the seller API's Swagger/OpenAPI definition.

* `config.mjs`: Centralized configuration for API URLs, file names, batching, and console messages.

## Output 📂

All generated JSON data will be saved in the `./output` directory, as configured in `config.mjs`
