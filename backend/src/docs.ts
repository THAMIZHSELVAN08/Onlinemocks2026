import { generateOpenAPIDocument } from "./openapi";

// 🔥 IMPORTANT — import all routes so they register paths
import "./routes/admin";
import "./routes/hr";
import "./routes/volunteer";
import "./routes/auth";
import "./routes/pipeline";

import fs from "fs";

const document = generateOpenAPIDocument();

fs.writeFileSync("./openapi.json", JSON.stringify(document, null, 2));

console.log("OpenAPI spec generated.");
