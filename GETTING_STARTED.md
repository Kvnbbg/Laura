# Getting Started with Laura - Cosmic Dream

Welcome to your new React application with scss-cosmic-dream integration! 🌟

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run serve` - Serve the production build locally (for testing)
- `npm run preview` - Preview production build locally (using Vite)
- `npm run lint` - Check code quality with ESLint

## Project Structure

```
Laura/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout       # Main layout wrapper
│   │   └── Navigation   # Navigation bar
│   ├── pages/          # Page components
│   │   ├── Home        # Landing page
│   │   ├── About       # About page
│   │   └── Contact     # Contact page with form
│   ├── styles/         # SCSS cosmic dream styles
│   │   ├── _variables  # Theme variables
│   │   ├── _base       # Base styles
│   │   ├── _components # Component styles
│   │   └── main        # Main entry point
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── railway.toml        # Railway deployment config
└── package.json        # Dependencies
```

## Customizing Your App

### Change Colors

Edit `src/styles/_variables.scss`:

```scss
$cosmic-purple: #your-color;
$cosmic-blue: #your-color;
```

### Add a New Page

1. Create component in `src/pages/YourPage.tsx`
2. Create styles in `src/pages/YourPage.scss`
3. Add route in `src/App.tsx`:
   ```tsx
   <Route path="/your-page" element={<YourPage />} />
   ```
4. Add link in `src/components/Navigation.tsx`

### Modify the Theme

All theme settings are in `src/styles/_variables.scss`:

- Colors and gradients
- Spacing and sizing
- Typography
- Shadows and effects

## SCSS Cosmic Dream Features

### Utility Classes

- **Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`
- **Cards:** `.card` (with hover effects)
- **Grid:** `.grid`, `.grid-2`, `.grid-3`
- **Flex:** `.flex`, `.flex-center`, `.flex-between`
- **Spacing:** `.mt-*`, `.mb-*`, `.py-*` (xs, sm, md, lg, xl)
- **Text:** `.text-center`, `.text-primary`, `.gradient-text`
- **Effects:** `.cosmic-glow`, `.float`

### Using Components

```tsx
// Button
<button className="btn btn-primary">Click me</button>

// Card
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Grid
<div className="grid grid-3">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>
```

## Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder contains optimized production files ready to deploy.

### Deploy Options

- **Railway:** Push to GitHub and connect your repo at [railway.app](https://railway.app). Railway will automatically detect the `railway.toml` configuration and deploy your app.
- **Vercel:** Connect your GitHub repo for automatic deployments
- **Netlify:** Drag and drop the `dist/` folder
- **GitHub Pages:** Use `gh-pages` package
- **Any static host:** Upload contents of `dist/` folder

### Deploying to Railway

This project is configured for Railway deployment with the included `railway.toml` file.

1. **Push your code to GitHub**
2. **Visit [railway.app](https://railway.app)** and sign in
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select this repository**
5. Railway will automatically:
   - Detect the `railway.toml` configuration
   - Install dependencies with `npm install`
   - Build the project with `npm run build`
   - Start the server with `npm run serve`
   - Assign a public URL to your app

The `railway.toml` file configures:

- Build command: `npm install && npm run build`
- Start command: `npm run serve`
- Health check settings
- Environment variables (NODE_ENV=production)

## Next Steps

1. **Customize content** - Update text and images in pages
2. **Add features** - Build on this foundation
3. **Integrate backend** - Connect to your API
4. **Add authentication** - Implement user login
5. **Enhance forms** - Add more interactive elements

## Support

For questions or issues:

- Check the [README.md](README.md) for detailed documentation
- Review the code comments
- Explore the existing components for examples

## Technologies

- React 18
- TypeScript
- React Router 6
- SCSS
- Vite

---

Built with 💜 using Pro-Jumpstart with Copilot
