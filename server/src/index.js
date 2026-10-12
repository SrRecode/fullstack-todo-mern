import "dotenv/config";
import { app } from "./app.js";
import { connectStorage } from "./storage.js";

const port = Number(process.env.PORT || 4000);
const mode = process.env.STORAGE_MODE || "file";

try {
  await connectStorage(mode, process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Daymark API listening at http://localhost:${port} (${mode} storage)`));
} catch (error) {
  console.error(`Unable to start the API: ${error.message}`);
  process.exitCode = 1;
}
