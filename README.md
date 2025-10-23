# Wildblood.Tactics

## Dependencies

### Frontend Libraries

This project uses [PixiJS](https://pixijs.com/) for canvas rendering, loaded from CDN via import maps.

**PixiJS Version:** 8.11.0  
**CDN Source:** [jsDelivr](https://cdn.jsdelivr.net/npm/pixi.js@8.11.0/dist/pixi.mjs)

The PixiJS library is loaded via an import map defined in `Components/App.razor`, which maps the `pixi.js` import to the CDN URL. This approach:
- Reduces repository size by ~1.9MB
- Leverages browser caching across sites
- Ensures faster downloads via CDN
- Simplifies dependency updates

If you need to update the PixiJS version, edit the import map in `Components/App.razor` and update the version in `package.json` for TypeScript type definitions.