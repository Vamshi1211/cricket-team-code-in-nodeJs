const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server is running at 3000 port"));
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
  }
};

initializeDBAndServer();

//GET API Returns a list of all the players in the player table

const convertIntoCamelCase = (eachPlayerObject) => {
  return {
    playerId: eachPlayerObject.player_id,
    playerName: eachPlayerObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;

  const getPlayersResponseArray = await db.all(getPlayersQuery);
  const getCamelCase = getPlayersResponseArray.map((eachPlayer) => {
    const getCamelCaseResponse = convertIntoCamelCase(eachPlayer);
    return getCamelCaseResponse;
  });
  response.send(getCamelCase);
});

//GET API Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details
                            WHERE player_id = ${playerId};`;
  const getPlayersResponseArray = await db.get(getPlayerQuery);
  const getCamelCase = convertIntoCamelCase(getPlayersResponseArray);
  response.send(getCamelCase);
});

//PUT API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const addPlayerDetailsQuery = `UPDATE player_details
                              SET 
                                player_name = '${playerName}'
                              WHERE 
                                player_id = ${playerId};`;
  const getPlayerUpdate = await db.run(addPlayerDetailsQuery);
  response.send("Player Details Updated");
});

//GET API Returns the match details of a specific match
const convertIntoCamelCaseForMatchTable = (matchObject) => {
  return {
    matchId: matchObject.match_id,
    match: matchObject.match,
    year: matchObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details
                            WHERE match_id = ${matchId};`;
  const getMatchResponse = await db.get(getMatchQuery);
  const getCamelCase = convertIntoCamelCaseForMatchTable(getMatchResponse);
  response.send(getCamelCase);
});

//GET API Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT * FROM player_match_score
                               NATURAL JOIN match_details
                               WHERE player_id = ${playerId};`;
  const getPlayerMatchResponse = await db.all(getPlayerMatchQuery);
  const getMatchDetails = getPlayerMatchResponse.map((eachMatch) =>
    convertIntoCamelCaseForMatchTable(eachMatch)
  );
  response.send(getMatchDetails);
});

//GET API Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_match_score
                               NATURAL JOIN player_details
                               WHERE match_id = ${matchId};`;
  const getPlayerResponse = await db.all(getPlayerQuery);
  const getPlayerDetails = getPlayerResponse.map((eachPlayer) =>
    convertIntoCamelCase(eachPlayer)
  );
  response.send(getPlayerDetails);
});

//GET API Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT
                                player_details.player_id AS playerId,
                                player_details.player_name AS playerName,
                                SUM(player_match_score.score) AS totalScore,
                                SUM(fours) AS totalFours,
                                SUM(sixes) AS totalSixes FROM 
                                player_details INNER JOIN player_match_score ON
                                player_details.player_id = player_match_score.player_id
                                WHERE player_details.player_id = ${playerId};`;
  const getPlayerMatchResponse = await db.all(getPlayerMatchQuery);
  response.send(getPlayerMatchResponse[0]);
  //console.log(getPlayerMatchResponse);
});

module.exports = app;
