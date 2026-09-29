const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".json": "application/json",
};
http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const target = path.resolve(root, "." + pathname);
    if (!target.startsWith(root + path.sep) && target !== root) {
      response.writeHead(403);
      response.end();
      return;
    }
    const file =
      fs.existsSync(target) && fs.statSync(target).isFile()
        ? target
        : path.join(root, "index.html");
    response.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    response.setHeader("Cache-Control", "no-store");
    fs.createReadStream(file).pipe(response);
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("QuoteFlow preview: http://127.0.0.1:4173"),
  );
