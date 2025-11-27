# GitHub Pages Setup Guide

This guide will help you deploy the VideoIntel.js documentation site to GitHub Pages.

## Prerequisites

- GitHub repository for VideoIntel.js
- Push access to the repository
- GitHub Pages enabled in repository settings

## Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
   - This allows the workflow to deploy automatically

## Step 2: Update Next.js Configuration (if needed)

If your repository name is different from `video_intel_js`, update `docs-site/next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME/' : '',
};
```

Replace `YOUR-REPO-NAME` with your actual repository name.

## Step 3: Push to Main Branch

```bash
# Make sure you're on the main branch
git checkout main

# Add all changes
git add .

# Commit
git commit -m "Add documentation site"

# Push to GitHub
git push origin main
```

## Step 4: Wait for Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see a workflow run called "Deploy Documentation to GitHub Pages"
3. Wait for it to complete (usually takes 2-3 minutes)
4. If it fails, check the logs for errors

## Step 5: Access Your Site

Once deployed, your site will be available at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

For example:
```
https://yourusername.github.io/video_intel_js/
```

## Troubleshooting

### Workflow Permission Errors

If you get permission errors:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 404 Errors

If you get 404 errors:

1. Make sure GitHub Pages is enabled with **GitHub Actions** as the source
2. Verify the `basePath` in `next.config.ts` matches your repo name
3. Check that the workflow completed successfully
4. Try clearing your browser cache

### Assets Not Loading

If CSS/JS files are not loading:

1. Check the `assetPrefix` in `next.config.ts`
2. Ensure it ends with a trailing slash: `/YOUR-REPO-NAME/`
3. Verify the `.nojekyll` file exists in `public/` directory

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Under **Custom domain**, enter your domain (e.g., `docs.example.com`)
3. Follow GitHub's instructions to configure DNS
4. Update `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
     // Remove basePath and assetPrefix for custom domain
   };
   ```

## Automatic Deployment

The site will automatically redeploy when you:

1. Push changes to the `main` branch that affect files in `docs-site/`
2. Manually trigger the workflow from the Actions tab

## Manual Deployment

To manually deploy:

1. Go to **Actions** tab
2. Select **Deploy Documentation to GitHub Pages**
3. Click **Run workflow**
4. Select the branch
5. Click **Run workflow**

## Local Testing Before Deployment

Always test locally before pushing:

```bash
cd docs-site

# Build the site
npm run build

# The static files will be in the 'out' directory
# You can serve them with any static file server

# Using Python's built-in server:
cd out
python3 -m http.server 8000

# Visit http://localhost:8000 in your browser
```

## Environment Variables (if needed)

If you need to use environment variables:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your secrets
4. Reference them in `.github/workflows/deploy-docs.yml`:
   ```yaml
   env:
     MY_SECRET: ${{ secrets.MY_SECRET }}
   ```

## Monitoring

To monitor your site:

1. Check the **Actions** tab for deployment status
2. Review **Settings** → **Pages** for deployment URL
3. Use GitHub's built-in traffic analytics (Settings → Insights → Traffic)

## Need Help?

- Check the [Next.js Static Export documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- Review [GitHub Pages documentation](https://docs.github.com/en/pages)
- Check the workflow logs in the Actions tab
- Verify all configuration files are correct

---

## Quick Reference

### Important Files
- `.github/workflows/deploy-docs.yml` - Deployment workflow
- `docs-site/next.config.ts` - Next.js configuration
- `docs-site/public/.nojekyll` - Prevents Jekyll processing

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Check for code issues

### URLs
- **Dev**: http://localhost:3000
- **Production**: https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/

---

**Last Updated**: 2025-11-27

