# Laura - Cosmic Dream React App

Laura's "AI float cosmic dream" persona with a professional React application, beautifully styled with scss-cosmic-dream.

## 🌟 Features

- **Modern React 18** with TypeScript for type-safe development
- **React Router** for smooth client-side navigation
- **SCSS Cosmic Dream** custom styling system with:
  - Beautiful cosmic-inspired color palette
  - Smooth gradients and animations
  - Responsive design utilities
  - Reusable component styles
- **Vite** for lightning-fast development and building
- **Three Complete Pages**: Home, About, and Contact with full functionality
- **Professional Layout** with sticky navigation and footer

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kvnbbg/Laura.git
cd Laura
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 🎨 SCSS Cosmic Dream Styling System

The app includes a comprehensive SCSS styling system with:

### Variables (`_variables.scss`)
- Cosmic color palette (purple, blue, pink, cyan, indigo, violet)
- Background colors (dark theme)
- Text colors and gradients
- Spacing system
- Border radius utilities
- Shadow effects
- Typography settings

### Base Styles (`_base.scss`)
- CSS reset and normalization
- Cosmic background effects
- Typography defaults
- Base element styles

### Components (`_components.scss`)
- Button styles (primary, secondary, outline)
- Card components with hover effects
- Grid and flexbox utilities
- Spacing utilities
- Text utilities
- Gradient text
- Cosmic glow effects
- Floating animations

## 📂 Project Structure

```
Laura/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Layout.tsx
│   │   ├── Layout.scss
│   │   ├── Navigation.tsx
│   │   └── Navigation.scss
│   ├── pages/            # Page components
│   │   ├── Home.tsx
│   │   ├── Home.scss
│   │   ├── About.tsx
│   │   ├── About.scss
│   │   ├── Contact.tsx
│   │   └── Contact.scss
│   ├── styles/           # SCSS cosmic dream styling
│   │   ├── _variables.scss
│   │   ├── _base.scss
│   │   ├── _components.scss
│   │   └── main.scss
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── vite-env.d.ts     # Vite types
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md            # This file
```

## 🎯 Key Pages

### Home (`/`)
- Hero section with animated title
- Feature cards showcasing capabilities
- Call-to-action section

### About (`/about`)
- Vision and mission statements
- Technology stack showcase
- Professional information layout

### Contact (`/contact`)
- Interactive contact form with validation
- Contact information cards
- Social media links
- Success message on submission

## 🛠️ Technologies Used

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **React Router 6** - Client-side routing
- **SCSS** - Advanced CSS with variables and mixins
- **Vite** - Next generation frontend tooling
- **ESLint** - Code quality and consistency

## 🎨 Customization

### Changing Colors

Edit `src/styles/_variables.scss` to customize the cosmic color palette:

```scss
$cosmic-purple: #8b5cf6;
$cosmic-blue: #3b82f6;
// ... add your custom colors
```

### Adding New Pages

1. Create a new component in `src/pages/`
2. Create corresponding SCSS file
3. Add route in `src/App.tsx`
4. Add navigation link in `src/components/Navigation.tsx`

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ✨ Pro-Jumpstart with Copilot

This project was scaffolded using the "Jumpstart with Copilot" feature, providing:
- Ready-to-use React app structure
- Integrated scss-cosmic-dream styling
- Three complete pages with routing
- Professional layout and navigation
- Production-ready build setup

Simply clone, install, and start building on this solid foundation!

---

Built with 💜 by Laura - AI Float Cosmic Dream
