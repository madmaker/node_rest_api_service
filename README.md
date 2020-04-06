uc_test_api
===========

Описание:
Сделать сервис с REST API. Авторизация по bearer токену (/info, /latency, /logout).
Настроенный CORS для доступа с любого домена. DB - MongoDB (можно взять mongolab и т.п.). Токен создавать при каждом заходе, действителен 10 минут. Продлевать при любом запросе пользователя (кроме signin)

 API:
* /signin [POST] - запрос bearer токена по id и паролю // данные принимает в json
* /signup [POST] - регистрация нового пользователя: // данные принимает в json
 * Поля id и password, id - номер телефона или email. После регистрации пометить в профиле тип id (phone/mail)
 * При удачной регистрации вернуть bearer токен.
* /info [GET] - возвращает id пользователя и тип id.
* /latency [GET] - возвращает задержку от сервиса до google.com
* /logout [GET] - с паметром all:
 * true - удаляет все bearer токены пользователя
 * false - удаляет только текущий bearer токен

Использоывал restify, т.к. посчитал express слишком жирным для такой задачи. Mongoose для БД. Passport и passport-http-bearer для токена.

### Database creations scripts

~~~~ sql
create table User
(
	id varchar(255) not null,
	hashPassword varchar(255) not null,
	salt varchar(255) not null,
	constraint User_pk
		primary key (id)
);

create table AccessToken
(
	userId varchar(255) not null,
	token varchar(255) null,
	created integer unsigned null,
	constraint AccessToken_pk
		primary key (token)
);



~~~~