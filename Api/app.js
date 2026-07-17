const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const { createServer } = require('http');

const response = require('./middlewares/response');
const passport = require('./middlewares/passport');
const trimmer = require('./middlewares/trimmer');
const limiter = require('./middlewares/limiter');
const tswagger = require('./middlewares/tswagger');
const { validator } = require('./middlewares/validator');

const { SendData, NotFound } = require('./helpers/response');
const swaggerSpec = require('./helpers/swagger');
const checkCompany = require('./middlewares/checkCompany');
const { isAuth } = require('./middlewares/isAuth');

const app = express();

const server = createServer(app);

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Allow same-origin / non-browser tools (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['x-total-count', 'x-next-key'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 0 // avoid browsers caching a stale preflight during local development
};

// Explicit preflight handler first — guarantees PATCH/PUT are advertised
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

if (process.env.LIMITER === '1') app.use(limiter());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(trimmer());
app.use(tswagger());
app.use(passport());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.get('/', (req, res, next) => next(SendData({ message: 'RestAPI is alive!' })));

const excludedPaths = [];

// dynamic routes for express
fs.readdirSync(path.join(__dirname, '/routes'))
  .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js')
  .forEach(file => {
    const f = path.parse(file).name;
    if (f.startsWith('c_'))
      app.use(
        `/companies/:companyId/${f.slice(2)}`,
        validator({ params: 'companyId' }),
        (req, res, next) => isAuth(req, res, next, { excludedPaths }),
        checkCompany({ excludedPaths }),
        require(`./routes/${f}`)
      );
    else app.use(`/${f}`, require(`./routes/${f}`));
  });

app.all('*', (req, res, next) => next(NotFound()));

app.use((toSend, req, res, next) => response(toSend, res));

module.exports = server;
