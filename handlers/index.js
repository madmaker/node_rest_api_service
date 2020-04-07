const config = require('../config');
const dbWrapper=require('../dbWrapper');
const exec = require('child_process').exec;
const errs = require('restify-errors');
const path = require('path');
const fs = require("fs");

async function info(req, res, next) {
    res.json({userId : req.user._id});
    return next();
}
function logout(req, res, next) {
    let userId=req.user._id;
    res.json({status : 'logged out'});
    dbWrapper.deleteTokens(userId);
    return next();
}
async function latency(req, res, next) {
    exec("ping -c 1 " + config.pingHost, 
        function(err, stdout/*, stderr*/) {
            if (err) {
                next(new errs.BadRequestError(err.message));
            } else {
                res.json({pingTime : stdout.match(/time=\d+.\d+/)[0].substring(5)}); // парсим результат команды ping
                return next();
            }
        }
    );
}

async function signin(req, res, next) {
    let params;
    try {
        params = JSON.parse(JSON.stringify(req.body));
    } catch (e) {
        return next(new errs.BadRequestError('could not parse json request body'))
    }

    let salt=await dbWrapper.checkIfUserExists(params.user);
    if(salt) {
        salt=salt.toString();
        if(await dbWrapper.checkCredentials(params.user, params.password, salt)) {
            let accessToken = await dbWrapper.createAccessToken(params.user);
            let refreshToken = await dbWrapper.createRefreshToken(params.user);
            res.json({
                token_type: 'bearer',
                access_token : accessToken.toString(),
                refresh_token : refreshToken.toString()
            });
            return next();
        }
    }

    return next(new errs.ForbiddenError('User with such password does not exist!'));
}
async function refresh(req, res, next) {
    let params;
    try {
        params = JSON.parse(JSON.stringify(req.body));
    } catch (e) {
        return next(new errs.BadRequestError('could not parse json request body'))
    }

    let user=await dbWrapper.checkRefreshToken(params.token);
    if(user) {
        dbWrapper.updateRefreshToken(params.token);
        let accessToken = await dbWrapper.createAccessToken(user);
        res.json({
            token_type: 'bearer',
            access_token : accessToken.toString()
        });
        return next();
    }

    return next(new errs.ForbiddenError('Unauthorized'));
}
async function signup(req, res, next) {
    let params;
    try {
        params = JSON.parse(JSON.stringify(req.body));
    } catch (e) {
        return next(new errs.BadRequestError('could not parse json request body'))
    }

    if(!await dbWrapper.checkIfUserExists(params.user)) {
        dbWrapper.createUser(params.user,params.password);

        let accessToken = await dbWrapper.createAccessToken(params.user);
        let refreshToken = await dbWrapper.createRefreshToken(params.user);
        res.json({
            token_type: 'bearer',
            access_token : accessToken.toString(),
            refresh_token : refreshToken.toString()
        });
        return next();
    }
    else {
        return next(new errs.ForbiddenError('User already exist!'));
    }
}

async function fileUpload(req,res,next) {
    try {
        if(!req.files) {
            res.json({
                status: false,
                message: 'No file uploaded'
            });
            next();
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let uploadedFile = req.files.file;

            let uploadTimestamp=Date.now();

            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            let saveFilePath='./uploads/'+uploadTimestamp+'/' + uploadedFile.name;
            uploadedFile.mv(saveFilePath);

            let ext=path.extname(saveFilePath);

            dbWrapper.saveFile2DB(uploadedFile.name,ext,uploadedFile.mimetype,uploadedFile.size,uploadTimestamp);

            //send response
            res.json({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: uploadedFile.name,
                    extension:ext,
                    mimetype: uploadedFile.mimetype,
                    size: uploadedFile.size,
                    uploadTimestamp:uploadTimestamp
                }
            });
            next();
        }
    } catch (err) {
        res.status(500).send(err);
    }
}
async function fileUpdate(req,res,next) {
    try {
        if(!req.files) {
            res.json({
                status: false,
                message: 'No file uploaded'
            });
            next();
        } else {
            if(typeof req.params.id==="undefined") {
                return next(new errs.BadRequestError('File not found'));
            }
            let fileId=req.params.id;

            let oldFile=await dbWrapper.fileInfo(fileId);

            let oldFilePath="./uploads/"+oldFile.upload_timestamp;
            fs.rmdir(oldFilePath, { recursive: true },(err)=>{console.log(err)});

            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let uploadedFile = req.files.file;

            let uploadTimestamp=Date.now();

            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            let saveFilePath="./uploads/"+uploadTimestamp+'/' + uploadedFile.name;
            uploadedFile.mv(saveFilePath);

            let ext=path.extname(saveFilePath);

            dbWrapper.updateFileInDB(fileId,uploadedFile.name,ext,uploadedFile.mimetype,uploadedFile.size,uploadTimestamp);

            //send response
            res.json({
                status: true,
                message: 'File is updated',
                data: {
                    name: uploadedFile.name,
                    extension:ext,
                    mimetype: uploadedFile.mimetype,
                    size: uploadedFile.size,
                    uploadTimestamp:uploadTimestamp
                }
            });
            next();
        }
    } catch (err) {
        res.status(500).send(err);
    }
}
async function fileInfo(req, res, next) {
    if(typeof req.params.id==="undefined") {
        return next(new errs.BadRequestError('File not found'));
    }
    let fileId=req.params.id;

    let file=await dbWrapper.fileInfo(fileId);
    if(file) {
        res.json({
            fileName:file.fileName,
            ext:file.ext,
            mime_type:file.mime_type,
            size:file.size,
            upload_timestamp:file.upload_timestamp
        });
        return next();
    }

    return next(new errs.BadRequestError('File not found'));
}
async function fileList(req, res, next) {
    let params;
    try {
        params = JSON.parse(JSON.stringify(req.body));
    } catch (e) {
        return next(new errs.BadRequestError('could not parse json request body'))
    }

    let list_size;
    let page;

    if(typeof params.list_size!=="undefined") {
        list_size=params.list_size;
    }
    else {
        list_size=10;
    }
    if(typeof params.page!=="undefined") {
        page=params.page;
    }
    else {
        page=1;
    }


    let files=await dbWrapper.getFilesList(page,list_size);
    res.json({
        files:files
        // fileName:file.fileName,
        // ext:file.ext,
        // mime_type:file.mime_type,
        // size:file.size,
        // upload_timestamp:file.upload_timestamp
    });
    return next();
}
async function fileDelete(req, res, next) {
    if(typeof req.params.id==="undefined") {
        return next(new errs.BadRequestError('File not found'));
    }
    let fileId=req.params.id;

    let file=await dbWrapper.fileInfo(fileId);

    if(file) {
        let filePath="./uploads/"+file.upload_timestamp;
        fs.rmdir(filePath, { recursive: true },(err)=>{console.log(err)});

        dbWrapper.deleteFileFromDB(fileId);
        res.json({
            status:'deleted'
        });
        return next();
    }

    return next(new errs.BadRequestError('File not found'));
}
async function fileDownload(req, res, next) {
    if(typeof req.params.id==="undefined") {
        return next(new errs.BadRequestError('File not found'));
    }
    let fileId=req.params.id;

    let file=await dbWrapper.fileInfo(fileId);

    if(file) {
        let filePath="./uploads/"+file.upload_timestamp+'/'+file.fileName;

        console.log(filePath);

        res.download(filePath,file.fileName,(error)=>{
            console.log(error)
        }); // Set disposition and send it.
        // res.json({
        //     test:'test'
        // });

        // return next();
        return true;
    }

    return next(new errs.BadRequestError('File not found'));
}


Handlers = function() {
    return {
        info : info,
        logout : logout,
        latency : latency,
        signin : signin,
        refresh : refresh,
        signup : signup,
        fileUpload : fileUpload,
        fileUpdate : fileUpdate,
        fileInfo:fileInfo,
        fileList:fileList,
        fileDelete:fileDelete,
        fileDownload:fileDownload
    }
};

module.exports = Handlers();