# Cloudflare Pages Deployment

This project is configured to deploy to Cloudflare Pages using GitHub Actions.

## Setting up Cloudflare Pages Deployment

To deploy this project to Cloudflare Pages, follow these steps:

### 1. Create a Cloudflare Pages project

1. Go to the [Cloudflare Pages dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Click "Create a project" 
3. Choose "Connect to Git" (but we'll be deploying via GitHub Actions, not direct integration)
4. Name your project `clifford-dejong` (or update the name in the GitHub workflow file)
5. Under Settings, set the build command to `npm run build` and output directory to `/`

### 2. Generate Cloudflare API Token

1. Go to the [API Tokens page](https://dash.cloudflare.com/profile/api-tokens) in your Cloudflare dashboard
2. Click "Create Token"
3. Select "Create Custom Token"
4. Name your token (e.g., "GitHub Actions - Clifford de Jong")
5. Under "Permissions", add the following permissions:
   - Account > Cloudflare Pages > Edit
   - Account > Account Settings > Read
6. Under "Account Resources", select "Include > Specific account" and select your account
7. Create the token and copy the value

### 3. Set up GitHub repository secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and Variables > Actions
3. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: The API token you generated
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (found in the URL of your Cloudflare dashboard: `https://dash.cloudflare.com/:account_id`)

### 4. Deploy

The workflow is configured to deploy automatically when you push to the `main` or `dev` branches:
- Pushes to `main` will deploy to the production environment
- Pushes to `dev` will deploy to the preview environment

## Manually Triggering a Deployment

You can manually trigger a deployment by going to the "Actions" tab in your GitHub repository, selecting the "Deploy to Cloudflare Pages" workflow, and clicking "Run workflow".

## Custom Domains

To set up a custom domain:

1. Go to your Cloudflare Pages project in the dashboard
2. Navigate to the "Custom domains" tab
3. Click "Set up a custom domain"
4. Follow the instructions to configure your domain

If your domain is already managed by Cloudflare, the setup will be automatic.
