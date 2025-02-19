$url = "https://www.eldorado.gg/api/library/?locale=en-US"
curl -s $url | jq '[.[] | select(.category == "Account")]' > "games.json"