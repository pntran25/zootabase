const http = require('http');
const { URL } = require('url');
const path = require('path');
const fs   = require('fs');

// ── MIME types for static file serving ──────────────────────────────
const MIME_TYPES = {
    '.html': 'text/html',       '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',       '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',      '.gif':  'image/gif',
    '.webp': 'image/webp',      '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',    '.txt':  'text/plain',
};

function compilePattern(routePath) {
    const paramNames = [];
    const regexStr = routePath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    return { regex: new RegExp('^' + regexStr + '$'), paramNames };
}

// ── Parse JSON body (only for application/json) ─────────────────────
function parseJsonBody(req, maxBytes) {
    return new Promise((resolve, reject) => {
        const ct = (req.headers['content-type'] || '');
        if (!ct.includes('application/json')) return resolve(undefined);

        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > maxBytes) {
                req.destroy();
                return reject(Object.assign(new Error('Request body too large'), { status: 413 }));
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (!raw) return resolve({});
            try { resolve(JSON.parse(raw)); }
            catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
        });
        req.on('error', reject);
    });
}

function augmentResponse(res) {
    res.status = function (code) {
        res.statusCode = code;
        return res;
    };
    res.json = function (data) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(data));
    };
}

function runHandlers(handlers, req, res, onError) {
    let idx = 0;
    function next(err) {
        if (err)               return onError(err, req, res);
        if (res.writableEnded) return;
        if (idx >= handlers.length) return;
        const fn = handlers[idx++];
        try {
            const result = fn(req, res, next);
            if (result && typeof result.catch === 'function') {
                result.catch((e) => onError(e, req, res));
            }
        } catch (e) {
            onError(e, req, res);
        }
    }
    next();
}

class Router {
    constructor() { this.routes = []; }
    _add(method, routePath, handlers) {
        const { regex, paramNames } = compilePattern(routePath);
        this.routes.push({ method, routePath, regex, paramNames, handlers });
    }
    get(routePath, ...handlers)    { this._add('GET',    routePath, handlers); }
    post(routePath, ...handlers)   { this._add('POST',   routePath, handlers); }
    put(routePath, ...handlers)    { this._add('PUT',    routePath, handlers); }
    patch(routePath, ...handlers)  { this._add('PATCH',  routePath, handlers); }
    delete(routePath, ...handlers) { this._add('DELETE', routePath, handlers); }
}

// ── Application factory ─────────────────────────────────────────────
function createApp() {
    const mounts       = [];   // { prefix, router }
    const directRoutes = [];   // { method, regex, paramNames, handlers }
    const staticMounts = [];   // { urlPrefix, fsRoot }
    let bodyLimit      = 1 * 1024 * 1024; // 1 MB
    let corsCheck      = null;
    let spaFallback    = null;  // path to index.html for SPA routing

    // Default error handler
    let errorHandler = (err, _req, res) => {
        console.error(err);
        if (res.writableEnded) return;
        res.statusCode = err.status || 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    };

    const app = {
        use(prefix, router) {
            if (router instanceof Router) {
                mounts.push({ prefix, router });
            }
        },

        get(routePath, ...handlers) {
            const { regex, paramNames } = compilePattern(routePath);
            directRoutes.push({ method: 'GET', regex, paramNames, handlers });
        },
        post(routePath, ...handlers) {
            const { regex, paramNames } = compilePattern(routePath);
            directRoutes.push({ method: 'POST', regex, paramNames, handlers });
        },
        put(routePath, ...handlers) {
            const { regex, paramNames } = compilePattern(routePath);
            directRoutes.push({ method: 'PUT', regex, paramNames, handlers });
        },
        patch(routePath, ...handlers) {
            const { regex, paramNames } = compilePattern(routePath);
            directRoutes.push({ method: 'PATCH', regex, paramNames, handlers });
        },
        delete(routePath, ...handlers) {
            const { regex, paramNames } = compilePattern(routePath);
            directRoutes.push({ method: 'DELETE', regex, paramNames, handlers });
        },

        setCors(fn)          { corsCheck = fn; },
        setBodyLimit(bytes)  { bodyLimit = bytes; },
        setErrorHandler(fn)  { errorHandler = fn; },
        setSpaFallback(indexPath) { spaFallback = indexPath; },
        static(urlPrefix, fsRoot) { staticMounts.push({ urlPrefix, fsRoot }); },

        /* ── Start the HTTP server ────────────────────────────────────────── */
        listen(port, cb) {
            const server = http.createServer((req, res) => handleRequest(req, res));
            server.listen(port, cb);
            return server;
        },
    };

    // ── Main request handler ────────────────────────────────────────
    async function handleRequest(req, res) {
        augmentResponse(res);

        // ── Security headers ────────────────────────────────────────
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');

        // Parse URL
        const parsed   = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsed.pathname;
        req.query      = Object.fromEntries(parsed.searchParams.entries());

        // ── CORS ────────────────────────────────────────────────────
        if (corsCheck) {
            const origin  = req.headers.origin;
            const allowed = corsCheck(origin);

            if (allowed && origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                res.setHeader('Access-Control-Allow-Headers',
                    'Content-Type,Authorization');
                res.setHeader('Vary', 'Origin');
            }

            if (req.method === 'OPTIONS') {
                res.statusCode = allowed ? 204 : 403;
                res.end();
                return;
            }
        }

        // ── Static files ────────────────────────────────────────────
        for (const { urlPrefix, fsRoot } of staticMounts) {
            let relative;
            if (urlPrefix === '/') {
                relative = pathname;
            } else if (pathname === urlPrefix || pathname.startsWith(urlPrefix + '/')) {
                relative = pathname.slice(urlPrefix.length);
            } else {
                continue;
            }
            const filePath = path.resolve(fsRoot, '.' + path.sep + relative);
            if (!filePath.startsWith(path.resolve(fsRoot) + path.sep) && filePath !== path.resolve(fsRoot)) {
                res.statusCode = 403;
                res.end('Forbidden');
                return;
            }
            try {
                const stat = await fs.promises.stat(filePath);
                if (stat.isFile()) {
                    const ext  = path.extname(filePath).toLowerCase();
                    const mime = MIME_TYPES[ext] || 'application/octet-stream';
                    res.setHeader('Content-Type', mime);
                    fs.createReadStream(filePath).pipe(res);
                    return;
                }
            } catch { /* file not found — fall through to routes */ }
        }

        // ── Parse JSON body ─────────────────────────────────────────
        try {
            req.body = await parseJsonBody(req, bodyLimit);
        } catch (err) {
            return errorHandler(err, req, res);
        }

        // ── Match direct routes ─────────────────────────────────────
        const method = req.method;
        for (const route of directRoutes) {
            if (route.method !== method) continue;
            const m = pathname.match(route.regex);
            if (m) {
                req.params = {};
                route.paramNames.forEach((n, i) => { req.params[n] = decodeURIComponent(m[i + 1]); });
                return runHandlers(route.handlers, req, res, errorHandler);
            }
        }

        // ── Match mounted routers ───────────────────────────────────
        for (const { prefix, router } of mounts) {
            let subPath;
            if (prefix === '/') {
                subPath = pathname;
            } else if (pathname === prefix || pathname.startsWith(prefix + '/')) {
                subPath = pathname.slice(prefix.length) || '/';
            } else {
                continue;
            }

            for (const route of router.routes) {
                if (route.method !== method) continue;
                const m = subPath.match(route.regex);
                if (m) {
                    req.params = {};
                    route.paramNames.forEach((n, i) => { req.params[n] = decodeURIComponent(m[i + 1]); });
                    return runHandlers(route.handlers, req, res, errorHandler);
                }
            }
        }

        // ── SPA fallback ────────────────────────────────────────────
        if (spaFallback && !pathname.startsWith('/api/') && !pathname.startsWith('/images/')) {
            const ext = path.extname(pathname);
            if (!ext || ext === '.html') {
                res.setHeader('Content-Type', 'text/html');
                fs.createReadStream(spaFallback).pipe(res);
                return;
            }
        }

        // ── 404 ─────────────────────────────────────────────────────
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
    }

    return app;
}

module.exports = { Router, createApp };
