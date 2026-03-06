"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = void 0;
exports.generateOpenAPIDocument = generateOpenAPIDocument;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const zod_1 = require("zod");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.registry = new zod_to_openapi_1.OpenAPIRegistry();
// 🔐 Register security scheme properly
exports.registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
});
function generateOpenAPIDocument() {
    const generator = new zod_to_openapi_1.OpenApiGeneratorV3(exports.registry.definitions);
    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "Mock Placements API",
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:5000",
            },
        ],
    });
}
