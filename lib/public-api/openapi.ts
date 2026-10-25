import { z } from "zod";
import { searchSchema, jobSchema, jobsResultSchema } from "./jobs";

const problemSchema = { type: "object", required: ["type", "title", "status", "code", "detail", "resolution"], properties: { type: { type: "string", format: "uri" }, title: { type: "string" }, status: { type: "integer" }, code: { type: "string" }, detail: { type: "string" }, resolution: { type: "string" } } };
const errorResponse = { description: "Problem details with a stable code and a recovery hint.", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } };
const searchJson = z.toJSONSchema(searchSchema, { target: "openapi-3.0" });
export const openapi = {
  openapi: "3.0.3", info: { title: "ugc.community public jobs API", version: "1.0.0", description: "Read-only public UGC opportunities. No API key or OAuth is required. Accounts, applications, contacts, private source records, and review queues are not exposed. No write operations or subscriptions are supported. Stable versions have at least 90 days of deprecation notice, with Deprecation and Sunset headers plus migration links. Policy: https://ugc.community/docs/deprecation.", contact: { name: "ugc.community support", email: "cody@isolated.tech", url: "https://ugc.community/contact" } },
  "x-deprecation-policy": { url: "https://ugc.community/docs/deprecation", minimumNoticeDays: 90, signals: ["Deprecation", "Sunset", "Link"], currentlyDeprecated: false },
  servers: [{ url: "https://ugc.community" }], security: [],
  externalDocs: { description: "Authentication policy, examples, limits, MCP and CLI usage", url: "https://ugc.community/docs" },
  paths: {
    "/api/v1/jobs": { get: { operationId: "searchJobs", summary: "Search current UGC opportunities", description: "Search only published, current listings. External listings expire seven days after freshness verification; closing dates are always honored. Results contain 20 jobs per page. Follow next until it is null. No authentication or OAuth scopes are needed.", security: [],
      parameters: Object.entries(searchJson.properties || {}).map(([name, schema]) => ({ name, in: "query", required: false, description: (schema as { description?: string }).description, schema })),
      responses: { "200": { description: "Current jobs, count, pagination, and the next URL.", content: { "application/json": { schema: { $ref: "#/components/schemas/JobPage" } } } }, "400": errorResponse, "405": errorResponse, "429": { ...errorResponse, headers: { "Retry-After": { description: "Seconds to wait before retrying.", schema: { type: "integer", example: 60 } } } }, "503": errorResponse } } },
    "/api/v1/jobs/{id}": { get: { operationId: "getJob", summary: "Read a current job", description: "Retrieve one published, unexpired listing. A closed, expired, unpublished, or unknown ID returns the same 404. No authentication or OAuth scopes are needed.", security: [], parameters: [{ name: "id", in: "path", required: true, description: "The ID returned by searchJobs.", schema: { type: "string", minLength: 1, maxLength: 200, pattern: "^[A-Za-z0-9_-]+$" } }], responses: { "200": { description: "Public job details, compensation, application destination, and source attribution.", content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } }, "404": errorResponse, "405": errorResponse, "429": errorResponse, "503": errorResponse } } },
  },
  components: { schemas: { Job: z.toJSONSchema(jobSchema, { target: "openapi-3.0" }), JobPage: z.toJSONSchema(jobsResultSchema, { target: "openapi-3.0" }), Problem: problemSchema } },
};
