# HubSpot MCP Server
A Model Context Protocol (MCP) server that provides tools for interacting with HubSpot CRM. This server allows you to create, update, delete, and fetch summary records (stored as Note 
engagements) in HubSpot.

## DockerFile
- docker build -t mcp-hubspot-ts .
- docker run --env-file .env -it mcp-hubspot-ts


## Features

- Create a summary as a Note engagement in HubSpot
- Fetch all summary records (Notes) from HubSpot
- Filter summary records by date
- Update existing summary records
- Delete summary records
- Send summary records via command box
- hubspot contact pipeline
`
```

### Manual Installation
1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Create a .env File**

   Create a `.env` file in the project root with your HubSpot credentials:

   ```env
   HUBSPOT_ACCESS_TOKEN=your_access_token_here
   USER_ROLES_FILE=path/to/user_roles.json
   ```

3. **Build the Project**

   Compile your TypeScript files:

   ```bash
   npm run build
   ```

4. **Start the Server**

   Start the MCP server:

   ```bash
   npm start
   ```

## Development

To run the server in development mode with hot-reloading:

```bash
npm run dev
```

## Testing with MCP Inspector

To inspect and test your MCP server implementation, you can use the MCP Inspector. For example:

```bash
npx @modelcontextprotocol/inspector -e HUBSPOT_ACCESS_TOKEN=your_access_token_here node build/index.js
```

This will start the MCP Inspector UI on http://localhost:5173. Use the UI to send JSON-RPC requests to your server.

## Configuration

The server can be configured using environment variables:

- `HUBSPOT_ACCESS_TOKEN`: Your HubSpot API access token
- `HUBSPOT_CONTACT_ID`: Your HubSpot contact ID
- `USER_ROLES_FILE`: Path to the user roles configuration file

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.