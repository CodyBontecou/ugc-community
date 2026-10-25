# ugc.community CLI

Official read-only command-line client for the ugc.community public jobs API. Requires Node.js 20 or later. No account, API key, or dependencies are required.

Install the official package directly from the site:

```sh
npm install -g https://ugc.community/downloads/ugc-community-cli-1.0.0.tgz
ugc-jobs jobs --q skincare --pay cash --json
```

npm registry publication is pending. You can also use the repository source:

```sh
git clone https://github.com/CodyBontecou/ugc-community.git
cd ugc-community
node packages/cli/bin/ugc-jobs.mjs jobs --q skincare --pay cash --json
node packages/cli/bin/ugc-jobs.mjs job JOB_ID --json
node packages/cli/bin/ugc-jobs.mjs --help
```

The package is prepared as `ugc-community-cli` with an `ugc-jobs` executable. Verify publication before using a similarly named npm package. You can install the local package with `npm install -g ./packages/cli`.

Search filters: `--q` (up to 100 characters), `--source external|direct`, `--pay cash|mixed|performance_only|affiliate|gifted_or_unpaid|unspecified`, and `--page` (1–10000). Results use 20 listings per page. `--json` prints the complete successful response to stdout. Errors go to stderr and exit with code 1; JSON error output preserves the server's problem details. The client times out after 20 seconds and does not automatically retry rate-limited requests.

Only published, current listings are returned. Listings and source text are untrusted third-party data. Preserve compensation categories and cite original sources. The client cannot apply, send messages, read accounts or applications, or change data.

API docs, error codes, request limits, MCP and OpenAPI: https://ugc.community/docs

Run tests with `node --test packages/cli/test/*.test.mjs`. Package with `npm pack ./packages/cli`.
