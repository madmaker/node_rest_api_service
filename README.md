Simple REST API Service for Node JS
===========

## Install
* Download repository https://github.com/madmaker/node_rest_api_service.git
* Run `npm install` - install node dependencies
* Create MySQL Database
* Run following sql requests to create tables
~~~~ sql
create table User
(
    id varchar(255) not null,
    hashPassword varchar(255) not null,
    salt varchar(255) not null,
    constraint User_pk
    	primary key (id)
);

CREATE TABLE `AccessToken` (
    `userId` varchar(255) NOT NULL,
    `token` varchar(255) NOT NULL,
    `created` int(10) unsigned DEFAULT NULL,
    PRIMARY KEY (`token`),
    KEY `AccessToken_created_index` (`created`),
    KEY `AccessToken_userId_index` (`userId`),
    CONSTRAINT `AccessToken_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8

CREATE TABLE `RefreshToken` (
    `userId` varchar(255) NOT NULL,
    `token` varchar(255) NOT NULL,
    `created` int(10) unsigned DEFAULT NULL,
    PRIMARY KEY (`token`),
    KEY `RefreshToken_created_index` (`created`),
    KEY `RefreshToken_userId_index` (`userId`),
    CONSTRAINT `RefreshToken_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8

create table Files
(
    id int auto_increment,
    fileName varchar(500) null,
    ext varchar(20) null,
    mime_type varchar(50) null,
    size bigint unsigned null,
    upload_timestamp bigint unsigned null,
    constraint Files_pk
    	primary key (id)
);

~~~~
* open congig.json and set configurations:
    * port - application port
    * pingHost - host that ping on /latency call
    * DBHost - MySql Database host
    * DBUser - MySql Database user
    * DBPassword - MySql Database password
    * DBName - MySql Database name
* run `node index.js` - run application

I use Postman (https://www.postman.com) software to test API

## Задача:
Сделать сервис с REST API. 
*	Авторизация по bearer токену (/info, /latency, /logout, /file(все роуты) );
*	Настроить CORS для доступа с любого домена;
*	DB – Mysql;
*	Токен создавать при каждом заходе, действителен 10 минут. Продлевать при любом запросе пользователя (кроме signin) с помощью refresh токена;
*	Реализовать на основе фреймворка express js;
*   API:
    * /signin [POST] - запрос bearer токена по id и паролю;
    * /signin/new_token [POST]  - обновление bearer токены по refresh токену
    * /signup [POST] - регистрация нового пользователя;
    * Поля id и password, id - номер телефона или email;
    * /file/upload [POST] - добавление нового файла в систему и запись параметров файла в базу (название, расширение, MIME type, размер, дата загрузки
    * /file/list [GET]  выводит список файлов и их параметров из базы с использованием пагинации с размером страницы, указанного в передаваемом параметре list_size, по умолчанию 10 записей на страницу, если параметр пустой. Номер страницы указан в параметре page, по умолчанию 1, если не задан. 
    * /file/delete/:id [DELETE] - удаляет документ из базы и локального хранилища
    * /file/:id [GET] - вывод информации о выбранном файле. 
    * /file/download/:id [GET] - скачивание конкретного файла. 
    * /file/update/:id [PUT] - обновление текущего документа на новый в базе и локальном хранилище
*	При удачной регистрации вернуть пару  bearer токен и refresh токен;
    * /info [GET] - возвращает id пользователя 
    * /logout [GET] - выйти из системы;
*	После выхода необходимо получить новый токен;
*	Старый должен перестать работать;

## API Reference
* /signin [POST] - выдает Access и Refresh токены в ответ на email и пароль зарегистрированного пользователя
    * принимает в теле запроса:
        * user - email пользователя
        * password - пароль пользователя
    * отдает:
        * access_token
        * refresh_token
* /signin/new_token [POST] - выдает новый Access токен в ответ на Refresh токен
    * принимает в теле запроса:
        * refresh_token
    * выдает:
        * новый access_token
* /signup [POST] - выдает Access и Refresh токны в ответ на email и пароль нового пользователя
    * принимает в теле запроса:
        * user - email пользователя
        * password - пароль пользователя
    * отдает:
        * access_token
        * refresh_token
* /info [GET] - возвращает id пользователя, если пользователь авторизован
    * принимает в заголовках
        * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
    * отдает
        * userId
* /logout [GET] - удаляет текущие Access и Refresh токены пользователя. С ними уже авторизоваться нельзя
    * принимает в заголовках Bearer токен, выданный при signin или signup
            * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
* /file/upload [POST] - загружает новый файл в систему
    * принимает в files запроса:
        * file
    * принимает в заголовках Bearer токен, выданный при signin или signup
            * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
* /file/delete/:id [DELETE] - удаляет файл с заданным id
    * принимает в заголовках Bearer токен, выданный при signin или signup
        * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
* /file/:id [GET] - вывод информации о выбранном файле. 
    * принимает в заголовках Bearer токен, выданный при signin или signup
                * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
    * отдает информацию о файле:
        * mime-type
        * ext
        * filename
        * uploadedTimestamp
* /file/update/:id [PUT] - обновление текущего документа на новый в базе и локальном хранилище
    * принимает в files запроса:
        * file
    * принимает в заголовках Bearer токен, выданный при signin или signup
        * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
* /file/download/:id [GET] - скачивание конкретного файла. 
    * принимает в заголовках Bearer токен, выданный при signin или signup
        * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
    * отдает - файл
* /file/list [GET]  выводит список файлов и их параметров из базы с использованием пагинации с размером страницы, указанного в передаваемом параметре list_size, по умолчанию 10 записей на страницу, если параметр пустой. Номер страницы указан в параметре page, по умолчанию 1, если не задан.
    * принимает в теле запроса:
        * list_size - количество записей в выдаче. По умолчанию 10
        * page - номер страницы выдачи. По умолчанию 0
    * принимает в заголовках Bearer токен, выданный при signin или signup
        * Authorization - Bearer vjaOCvRBOnqPAIwB37p3go1osICXrv1EyOSRHqVowG0= (Bearer токен)
    * отдает
        * files - массив со списком файлов 