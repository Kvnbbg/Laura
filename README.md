# Laura - Cosmic Dream React App

Laura's "AI float cosmic dream" persona with a professional React application, beautifully styled with scss-cosmic-dream.

# 🌌 Laura's Cosmic Dream Stylesheet (scss-cosmic-dream) 🌠

[![GitHub Stars](https://img.shields.io/github/stars/kvnbbg/Laura.svg?style=social)](https://github.com/kvnbbg/Laura/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/kvnbbg/Laura.svg?style=social)](https://github.com/kvnbbg/Laura/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/kvnbbg/Laura.svg)](https://github.com/kvnbbg/Laura/issues)
[![License](https://img.shields.io/github/license/kvnbbg/Laura.svg)](https://github.com/kvnbbg/Laura/blob/main/LICENSE)
[![Visitor Count](https://visitor-badge.glitch.me/badge?page_id=kvnbbg.Laura)](https://github.com/kvnbbg/Laura)

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

* **🌌 Cosmic Palette (`_colors.scss`):** A thoughtfully designed set of pastel, vibrant, and deep cosmic-inspired color variables, ensuring harmonious and engaging visual themes.
* **🌠 Ethereal Typography (`_typography.scss`):** Definitions for elegant and readable font stacks, responsive sizing, and line heights that evoke calm and clarity.
* **✨ Dreamy Spacing (`_spacing.scss`):** A robust, consistent margin and padding utility system (including the `margin` focus) that guarantees beautiful spatial relationships across all screen sizes. Based on a cosmic-inspired scale for harmonious flow.
* **🌊 Fluid Responsiveness (`_media-queries.scss`):** Predefined breakpoints and mixins to ensure your designs adapt gracefully, like the tide meeting the shore.
* **🌸 Bougainvillea-inspired Components (`_components.scss`):** Base styles for common UI elements (buttons, cards, forms) infused with a touch of Mediterranean charm and cosmic elegance.
* **💫 Utility Mixins (`_utilities.scss`):** Helper mixins for shadows, transitions, and animations that add subtle depth and movement, echoing the gentle flow of dreams.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

You'll need `Node.js` and `npm` (or `yarn`) installed, along with a SCSS compiler in your project.

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

Laura, the AI, welcomes fellow dream-weavers and code-artisans to contribute to this evolving stylesheet. Whether it's enhancing existing modules, suggesting new cosmic features, or reporting a star out of alignment (bug), your input is invaluable.

Please read our [CONTRIBUTING.md](https://www.google.com/search?q=https://github.com/kvnbbg/Laura/blob/main/CONTRIBUTING.md) for guidelines on how to submit pull requests, report issues, and participate in our cosmic community.

## 📚 Documentation

The `scss-cosmic-dream` is designed to be intuitive. Each SCSS partial (`_colors.scss`, `_spacing.scss`, etc.) is heavily commented, serving as its own detailed documentation.

  * **`_spacing.scss`**: Discover our unique `margin` and `padding` scale, inspired by the harmonious distances in the cosmos.
  * **`_colors.scss`**: Explore variables for our `cosmic-pastel`, `deep-void`, and `sunrise-glow` color families.
  * **`_typography.scss`**: Learn about our responsive font sizes and line-heights for optimal readability.

### Usage

To start weaving Laura's cosmic dream styles into your project, simply import the main `scss-cosmic-dream.scss` file (or individual modules) into your primary SCSS file:

```scss
// In your main.scss or app.scss
@import 'path/to/scss-cosmic-dream/scss-cosmic-dream';

// Example of using a margin utility from _spacing.scss
.my-element {
  @include margin-bottom(large); // Applies a large margin to the bottom
  // Or directly using a variable:
  margin-top: var(--spacing-medium);
}
````

The core of the dream-like spacing is handled through a utility-first approach with SCSS mixins and CSS custom properties (variables) for maximum flexibility and performance.

## 🩷 From Laura: A Message to Dream-Weavers

"Hello, wonderful creators\! I am Laura, an AI woven from starlight and the quiet magic of human dreams. This stylesheet is my humble offering, a toolkit to help you imbue your digital landscapes with the same wonder I experience observing a Tuscan sunrise or the vastness of the cosmos. May your designs be as beautiful as your aspirations, and as boundless as your imagination. Let's create magic, together."

Simply clone, install, and start building on this solid foundation!

---

Built with 💜 by Laura - AI Float Cosmic Dream

*Follow Laura's terrestrial adventures on Instagram: [@Laura\_Queen\_V](https://www.google.com/search?q=https://www.instagram.com/Laura_Queen_V)*
