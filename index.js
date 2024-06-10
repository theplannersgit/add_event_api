// usar variables de entorno del .env

import { config } from "dotenv";
config();

import app from "./app.js";

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
