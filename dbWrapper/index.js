const mysql = require('mysql');
const crypto = require('crypto');
const logger = require('../libs/logger')(module);

// mongoose.connect(config.db);
const db = mysql.createConnection({
    host     : 'localhost',
    user     : '365dev_dbuser',
    password : 'ZtyIyGSf',
    database : '365dev_pages'
});

db.connect(function(err) {
    if (err) {
        logger.error('error connecting: ' + err.stack);
        return false;
    }

    logger.info('connected as id ' + this.threadId);
    return true;
}.bind(this));

module.exports.createUser=(user,password)=>{
    let salt = crypto.randomBytes(128).toString('base64');
    let hashPassword = this.encryptPassword(password);

    db.query('INSERT INTO User (id,hashPassword,salt) (?,?,?)', [user,hashPassword,salt],function (error, results, fields) {
        if (error) throw error;
        // connected!
    });
};
module.exports.checkIfUserExists=(user)=>{
    return db.query('SELECT FROM User (id) WHERE id=?', [user],function (error, results, fields) {
        if (error) throw error;
        return results.length>0;
    });
};

// User.virtual('user')
//     .set(function(user) {
//         logger.info(user);
//         this._id = user;
//         this.emailType = user.indexOf('@') >= 0; // не стал заморачиваться с регуляркой c email или телефон
//     });
//
// User.virtual('password')
//     .set(function(password) {
//         this.salt = crypto.randomBytes(128).toString('base64');
//         this.hashPassword = this.encryptPassword(password);
//     });

// User.methods.encryptPassword = function(password) {
//     return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('base64');
// };
//
// User.methods.checkPassword = function(password) {
//     return this.encryptPassword(password) === this.hashPassword;
// };
//
// AccessToken.virtual('user')
//     .set(function(user) {
//         this.userId = user;
//         this.token = crypto.randomBytes(32).toString('base64');
//     });