"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openapi_1 = require("./openapi");
// 🔥 IMPORTANT — import all routes so they register paths
require("./routes/admin");
require("./routes/hr");
require("./routes/volunteer");
require("./routes/auth");
require("./routes/pipeline");
const fs_1 = __importDefault(require("fs"));
const document = (0, openapi_1.generateOpenAPIDocument)();
fs_1.default.writeFileSync("./openapi.json", JSON.stringify(document, null, 2));
console.log("OpenAPI spec generated.");
