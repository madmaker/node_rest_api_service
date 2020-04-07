const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const config = require('./config');
const Handlers = require('./handlers');
const passport = require('passport');
const bodyParser = require('body-parser');
const _ = require('lodash');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(passport.initialize());

// enable files upload
app.use(fileUpload({createParentPath: true}));

require('./libs/auth');

app.get('/info', passport.authenticate('bearer', { session: false }), Handlers.info);
app.get('/logout', passport.authenticate('bearer', { session: false }), Handlers.logout);
app.get('/latency', passport.authenticate('bearer', { session: false }), Handlers.latency);

app.get('/file/list', passport.authenticate('bearer', { session: false }), Handlers.fileList);
app.get('/file/download/:id', passport.authenticate('bearer', { session: false }), Handlers.fileDownload);
app.delete('/file/delete/:id', passport.authenticate('bearer', { session: false }), Handlers.fileDelete);
app.post('/file/upload', passport.authenticate('bearer', { session: false }), Handlers.fileUpload);
app.put('/file/update/:id', passport.authenticate('bearer', { session: false }), Handlers.fileUpdate);
app.get('/file/:id', passport.authenticate('bearer', { session: false }), Handlers.fileInfo);


app.post('/signin', Handlers.signin);
app.post('/signin/new_token', Handlers.refresh);
app.post('/signup', Handlers.signup);


app.listen(config.port, ()=>{
    console.log('server up & listening at '+config.port);
});