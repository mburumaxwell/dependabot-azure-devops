# Bruno API Collection

This directory contains Bruno API testing files for the dependabot-azure-devops project.

## Getting Started

### Option 1: VS Code Extension (Recommended)

1. Install the [Bruno VS Code extension](https://marketplace.visualstudio.com/items?itemName=bruno-api-client.bruno)
2. Open the collection in VS Code
3. Run requests directly from the editor

### Option 2: Bruno Desktop App

1. Download and install [Bruno](https://www.usebruno.com/downloads)
2. Open the collection by selecting this `bruno/` folder

## Environment Setup

1. Copy `.env.sample` to `.env`
2. Fill in the required environment variables:

   ```bash
   AZURE_DEVOPS_PAT="your-azure-devops-personal-access-token"
   ```

The environment variables are automatically loaded and available in your requests.

## Request Organization

Requests are organized by prefix:

- `azdo-*` - Azure DevOps related API calls
- `web-*` - Web application API calls

Browse the collection to see all available requests and their documentation.
