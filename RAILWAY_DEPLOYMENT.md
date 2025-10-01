# Railway Deployment Guide

This document explains the Railway deployment configuration for the Laura - Cosmic Dream application.

## What Was Configured

### 1. Railway Configuration (`railway.toml`)

The `railway.toml` file configures Railway's behavior:

```toml
[build]
builder = "NIXPACKS"                          # Use Railway's Nixpacks builder
buildCommand = "npm install && npm run build" # Build the production bundle

[deploy]
startCommand = "npm run serve"                # Start the static file server
healthcheckPath = "/"                         # Health check endpoint
healthcheckTimeout = 100                      # 100 seconds for health check
restartPolicyType = "ON_FAILURE"             # Auto-restart on failure
restartPolicyMaxRetries = 10                 # Maximum restart attempts

[[deploy.environmentVariables]]
name = "NODE_ENV"
value = "production"                          # Set production environment
```

### 2. Static File Server

Since Vite builds a static SPA, we need a server to serve the files. We use `sirv-cli`:

- **Package**: `sirv-cli` (added to production dependencies)
- **Command**: `sirv dist --port ${PORT:-3000} --cors --single`
- **Features**:
  - Serves files from the `dist/` folder
  - Supports SPA routing (`--single` flag)
  - CORS enabled
  - Uses Railway's `PORT` environment variable (defaults to 3000 locally)

### 3. Vite Configuration Enhancements

Enhanced `vite.config.ts` with production optimizations:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,              // No sourcemaps in production
    minify: 'esbuild',             // Fast minification
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'], // Code splitting
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,                    // Expose to network
  },
  preview: {
    port: 3000,
    host: true,
  },
})
```

### 4. Railway Ignore File

Created `.railwayignore` to exclude unnecessary files from deployment:
- Source files (`src/`) - already compiled to `dist/`
- Development configuration
- Documentation files (except README.md)
- Git files
- Temporary files and logs

## How to Deploy

### Prerequisites
- A GitHub account
- A Railway account (sign up at [railway.app](https://railway.app))

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Connect to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose the `Kvnbbg/Laura` repository

3. **Railway automatically:**
   - Detects the `railway.toml` configuration
   - Installs dependencies
   - Builds the project
   - Starts the server
   - Assigns a public URL

4. **Access your app**
   - Railway will provide a public URL (e.g., `your-app.up.railway.app`)
   - Your app will be live and accessible!

## Testing Locally

You can test the production build locally:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Serve the production build:**
   ```bash
   npm run serve
   ```

3. **Access the app:**
   - Open `http://localhost:3000` in your browser
   - Test all routes (/, /about, /contact)
   - Verify client-side routing works

## Environment Variables

Railway automatically provides:
- `PORT` - The port your app should listen on
- `NODE_ENV` - Set to "production" via railway.toml

You can add additional environment variables in the Railway dashboard if needed.

## Build Output

The production build creates:
- `dist/index.html` - Main HTML file
- `dist/assets/` - Optimized JS and CSS files
  - Separate vendor chunk for React libraries
  - Minified application code
  - Optimized CSS

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compiles without errors: `npm run build`
- Check Railway build logs for specific errors

### App Won't Start
- Verify `npm run serve` works locally
- Check that `dist/` folder exists and has content
- Review Railway deployment logs

### Routes Return 404
- Ensure `--single` flag is in the serve command
- This enables SPA mode for React Router

### Health Check Fails
- Railway checks `/` endpoint
- Ensure the server starts within the timeout period (100 seconds)
- Check that the app responds on the Railway-provided PORT

## Performance Optimizations

The configuration includes several optimizations:

1. **Code Splitting**: React libraries separated into vendor chunk
2. **Minification**: esbuild minifies all JS code
3. **No Source Maps**: Reduces bundle size in production
4. **Static File Serving**: sirv-cli is lightweight and fast
5. **CORS Enabled**: For API calls if needed

## Security Considerations

- No source code is included in deployment (see `.railwayignore`)
- Source maps disabled in production
- Environment variables managed through Railway dashboard
- HTTPS automatically provided by Railway

## Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Deployment history
- Automatic restarts on failure (up to 10 retries)

## Cost

Railway offers:
- Free tier for hobby projects
- Pay-as-you-go for production apps
- No credit card required for initial deployment

For more information, visit [Railway's pricing page](https://railway.app/pricing).

## Support

For issues related to:
- **The app**: Check the main README.md and GETTING_STARTED.md
- **Railway**: Visit [Railway's documentation](https://docs.railway.app)
- **Deployment configuration**: Review this guide and railway.toml

---

Built with 💜 using Pro-Jumpstart with Copilot
