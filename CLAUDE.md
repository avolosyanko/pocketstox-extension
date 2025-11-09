# PocketStox Extension Development Guide

## Build Process

**IMPORTANT: Always run the build after making code changes!**

### Build Command
```bash
cd ui-react && npm run build
```

### Build Location
- Source files: `ui-react/src/`
- Built files: `../dist/` (outside ui-react directory)

### After Making Changes
1. Edit files in `ui-react/src/components/`
2. **Always run**: `cd ui-react && npm run build`
3. Test the extension with the updated build

## Project Structure

- `ui-react/` - React UI components and build system
- `dist/` - Built extension files (generated)
- `src/` - Legacy JavaScript files
- `manifest.json` - Extension manifest

## Key Files

- `ui-react/src/components/ArticlesTab.jsx` - Main articles component
- `ui-react/src/components/ArticleDrawer.jsx` - Article detail view
- `ui-react/postcss.config.js` - PostCSS configuration (CommonJS format)

## Notes

- PostCSS config uses CommonJS (`module.exports`) due to package.json `"type": "commonjs"`
- Build outputs to `../dist/` directory outside project root
- Some Tailwind CSS warnings are expected but don't prevent successful build