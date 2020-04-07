const mysql = require('mysql');
const crypto = require('crypto');
const config = require('../config');

// mongoose.connect(config.db);
const db = mysql.createConnection({
    host     : config.DBHost,
    user     : config.DBUser,
    password : config.DBPassword,
    database : config.DBName
});

db.connect(function(err) {
    if (err) {
        console.log('error connecting: ' + err.stack);
        return false;
    }

    return true;
}.bind(this));

module.exports.createUser=(user,password)=>{
    let salt = crypto.randomBytes(128).toString('base64');
    let hashPassword = encryptPassword(password,salt);

    db.query('INSERT INTO User (id,hashPassword,salt) VALUES (?,?,?)', [user,hashPassword,salt],function (error, results, fields) {
        if (error) throw error;
        // connected!
    });
};
module.exports.createAccessToken=(user)=>{
    let token = crypto.randomBytes(32).toString('base64');
    let created=Date.now();

    return new Promise((resolve, reject) => {
        db.query('INSERT INTO AccessToken (userId,token,created) VALUES (?,?,?)', [user, token, created], function (error, results, fields) {
            if (error) throw error;

            resolve(token);
        });
    });
};
module.exports.createRefreshToken=(user)=>{
    let token = crypto.randomBytes(32).toString('base64');
    let created=Date.now();

    return new Promise((resolve, reject) => {
        db.query('INSERT INTO RefreshToken (userId,token,created) VALUES (?,?,?)', [user, token, created], function (error, results, fields) {
            if (error) throw error;

            resolve(token);
        });
    });
};
module.exports.checkIfUserExists=(user)=>{//returns salt if found or false
    return new Promise((resolve, reject) => {
        db.query('SELECT salt FROM User WHERE id=?', [user], function (error, results, fields) {
            if (error) throw error;

            if(results.length) resolve(results[0].salt);
            else resolve(false);
        });
    });
};
module.exports.userId2Token=(user)=>{//returns salt if found or false
    return new Promise((resolve, reject) => {
        db.query('SELECT token FROM AccessToken WHERE userId=?', [user], function (error, results, fields) {
            if (error) throw error;

            if(results.length) resolve(results[0].token);
            else resolve(false);
        });
    });
};
module.exports.checkCredentials=(user,password,salt)=>{
    let hashPassword = encryptPassword(password,salt);

    return new Promise((resolve, reject) => {
        db.query('SELECT id FROM User WHERE id=? AND hashPassword=?', [user,hashPassword], function (error, results, fields) {
            if (error) throw error;
            resolve(results.length > 0 );
        });
    });
};
module.exports.checkAccessToken=async (token)=>{
    let tokenValidTime=Date.now()-600000;//10 min

    return new Promise((resolve, reject) => {
        db.query('SELECT userId FROM AccessToken WHERE token=? AND created>?', [token,tokenValidTime], function (error, results, fields) {
            if (error) throw error;

            if(results.length) resolve(results[0].userId);
            else resolve(false);
        });
    });
};
module.exports.updateAccessToken=(token)=>{
    let created=Date.now();

    db.query('UPDATE AccessToken SET created=? WHERE token=?', [created,token], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.updateRefreshToken=(token)=>{
    let created=Date.now();

    db.query('UPDATE RefreshToken SET created=? WHERE token=?', [created,token], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.checkRefreshToken=(token)=>{
    let tokenValidTime=Date.now()-2592000000;//30 days
    return new Promise((resolve, reject) => {
        db.query('SELECT userId FROM RefreshToken WHERE token=? AND created>?', [token,tokenValidTime], function (error, results, fields) {
            if (error) throw error;

            if(results.length) resolve(results[0].userId);
            else resolve(false);
        });
    });
};
module.exports.deleteTokens=(userId)=>{
    db.query('DELETE FROM AccessToken WHERE userId=?', [userId], function (error, results, fields) {
        if (error) throw error;
    });
    db.query('DELETE FROM RefreshToken WHERE userId=?', [userId], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.saveFile2DB=(fileName,ext,mime_type,size,uploadTimestamp)=>{
    db.query('INSERT INTO Files (fileName,ext,mime_type,size,upload_timestamp) VALUES(?,?,?,?,?)', [fileName,ext,mime_type,size,uploadTimestamp], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.updateFileInDB=(fileId,fileName,ext,mime_type,size,uploadTimestamp)=>{
    db.query('UPDATE Files SET fileName=?,ext=?,mime_type=?,size=?,upload_timestamp=? WHERE id=?', [fileName,ext,mime_type,size,uploadTimestamp,fileId], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.deleteFileFromDB=(id)=>{
    db.query('DELETE FROM Files WHERE id=?', [id], function (error, results, fields) {
        if (error) throw error;
    });
};
module.exports.fileInfo=(id)=>{
    return new Promise((resolve, reject) => {
        db.query('SELECT fileName,ext,mime_type,size, upload_timestamp FROM Files WHERE id=?', [id], function (error, results, fields) {
            if (error) throw error;

            if(results.length) resolve(results[0]);
            else resolve(false);
        });
    });
};
module.exports.getFilesList=(page,list_size)=>{
    return new Promise((resolve, reject) => {
        db.query('SELECT id,fileName,ext,mime_type,size, upload_timestamp FROM Files LIMIT ?,?', [(page-1)*list_size,parseInt(list_size)], function (error, results, fields) {
            if (error) throw error;

            resolve(results);
        });
    });
};

encryptPassword = function(password,salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 512,'sha1').toString('base64');
};

function deleteExpiredTokens() {
    let now=Date.now();
    let AccessTokenExpirationTime=now-600000;//10 minutes;
    let RefreshTokenExpirationTime=now-2592000000;//30 days;

    db.query('DELETE FROM AccessToken WHERE created<?', [AccessTokenExpirationTime], function (error, results, fields) {
        if (error) throw error;
    });
    db.query('DELETE FROM RefreshToken WHERE created<?', [RefreshTokenExpirationTime], function (error, results, fields) {
        if (error) throw error;
    });
}


setInterval(function () {
    deleteExpiredTokens();
},3600000);//every 1 hour