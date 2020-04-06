const restify = require('restify');
const server = restify.createServer();
const config = require('./config');
const Handlers = require('./handlers');
const logger = require('./libs/logger')(module);
const passport = require('passport');
const corsMiddleware = require('restify-cors-middleware');

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],//['http://api.myapp.com', 'http://web.myapp.com'],
    allowHeaders: ['*'],//['API-Token'],
    exposeHeaders: ['*'],//['API-Token-Expiry']
});

logger.info("test");

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.queryParser());
server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());
server.use(passport.initialize());

require('./libs/auth');


server.get('/info', passport.authenticate('bearer', { session: false }), Handlers.info);
server.get('/logout', passport.authenticate('bearer', { session: false }), Handlers.logout);
server.get('/latency', passport.authenticate('bearer', { session: false }), Handlers.latency);

server.post('/signin', Handlers.signin);
server.post('/signup', Handlers.signup);

server.listen(config.port, function() {
    logger.info('server up & listening at %s', server.url);
});