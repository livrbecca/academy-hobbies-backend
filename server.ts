import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/scholars", async (req, res) => {
  try {
    const allScholars = await client.query("SELECT * from scholars");
    res.json(allScholars.rows);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

app.post("/scholars", async (req, res) => {
  try {
    const { name } = req.body;
    const { image_url } = req.body;
    const { pod } = req.body;
    const { notes } = req.body;

    const newScholar = await client.query(
      "INSERT INTO scholars (name, image_url, pod, notes) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, image_url, pod, notes]
    );

    res.json(newScholar.rows);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

app.get("/scholars/:podcolor", async (req, res) => {
  try {
    const { podcolor } = req.params;
    const podGroup = await client.query(
      "SELECT * from scholars WHERE UPPER(pod) LIKE UPPER($1)",
      [podcolor]
    );
    res.json(podGroup.rows);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

app.get("/scholars/alphabetically", async (req, res) => {
  try {
    const scholarsA_Z = await client.query(
      "SELECT * from scholars ORDER BY name ASC"
    );
    res.json(scholarsA_Z.rows);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port || 5000, () => {
  console.log(`Server is up and running on port ${port}`);
});
