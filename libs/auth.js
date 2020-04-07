const passport = require('passport');
const dbWrapper = require('../dbWrapper');
config = require('../config');
BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(new BearerStrategy(
    async function(accessToken, done) {
        let userId=await dbWrapper.checkAccessToken(accessToken);
        if(userId) {
            dbWrapper.updateAccessToken(accessToken);

            let user={_id:userId};
            return done(null, user);
        }

        return done(null, false);
    }
));