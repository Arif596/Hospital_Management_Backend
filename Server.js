import "dotenv/config";          // PEHLI line, baaki imports se pehle
// import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./configure/db.js";
import seedAdmin from "./Utils/seedAdmin.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedAdmin(); // creates the admin from .env after DB connects

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();