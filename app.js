const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

getResponseObjectFromStateObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

getResponseObjectFromDistrictObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

getResponseObjectFromCasesObject = (dbObject) => {
  return {
    totalCases: dbObject["sum(cases)"],
    totalCured: dbObject["sum(cured)"],
    totalActive: dbObject["sum(active)"],
    totalDeaths: dbObject["sum(deaths)"],
  };
};

///get all states API
app.get("/states/", async (request, response) => {
  const getMoviesQuery = `
    SELECT *
    FROM state
    ORDER BY state_id`;

  const statesArray = await db.all(getMoviesQuery);
  response.send(
    statesArray.map((eachstates) =>
      getResponseObjectFromStateObject(eachstates)
    )
  );
});

//get a state API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;

  const requiredStateDetails = await db.get(getStateQuery);
  response.send(getResponseObjectFromStateObject(requiredStateDetails));
});

///add a state API

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

///get a district API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;

  const requiredDisctrictDetails = await db.get(getDistrictQuery);
  response.send(getResponseObjectFromDistrictObject(requiredDisctrictDetails));
});

//5 Delete a district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletingQuery = `
    DELETE
    FROM district
    WHERE district_id = ${districtId};`;
  await db.run(deletingQuery);
  response.send("District Removed");
});

///6 updating a district details
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails1 = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails1;
  const updateDistrictQuery = `
  UPDATE
    district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    active = ${active},
    deaths = ${deaths}
    
  WHERE 
  district_id = ${districtId};`;
  const districtDetails = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

///7 total cases in a state API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases) as totalCases,
      SUM(cured) as totalCured,
      SUM(active) as totalActive,
      SUM(deaths) as totalDeaths
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send(stats);
  ///*response.send({
  // totalCases: stats["SUM(cases)"],
  // totalCured: stats["SUM(cured)"],
  // totalActive: stats["SUM(active)"],
  // totalDeaths: stats["SUM(deaths)"],
  //});
});

///8 get stateName based on district API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.param;
  const stateBasedOnDistrictQuery = `
    SELECT state.state_name
    FROM state INNER JOIN district ON state.state_id = district.state_id
    WHERE state.state_id = district.state_id;`;
  const stateName = await db.get(stateBasedOnDistrictQuery);
  response.send({ stateName: stateName });
});
module.exports = app;
