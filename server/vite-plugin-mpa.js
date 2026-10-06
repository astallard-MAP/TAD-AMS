export function mpaDevMiddleware() {
  return {
    name: 'mpa-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const { getDynamicContent } = await import('./dynamic-content.js');
          let reqPath = req.url.split('?')[0];
          const dynamicContent = await getDynamicContent(reqPath);
          if (dynamicContent) {
            res.setHeader('Content-Type', dynamicContent.contentType);
            res.end(dynamicContent.content);
            return;
          }
        } catch (err) {
          // Silent catch to let Vite handle the rest if dynamic content fails locally
        }
        next();
      });
    }
  };
}
