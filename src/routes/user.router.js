const { getAll, create, getOne, remove, update, verifyCode, login, getme, change, changepassword } = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT=require('../utils/verifyJWT')

const userRouter = express.Router();

userRouter.route('/')
    .get( verifyJWT,getAll)
    .post(create);


userRouter.route('/login')
        .post(login);

userRouter.route('/me')
     .get(verifyJWT,getme)

userRouter.route('/reset_password')
    .post(change)

userRouter.route('/reset_password/:code')
    .post(changepassword)

userRouter.route('/verify/:code')
     .get(verifyCode);

userRouter.route('/:id')
    .get(verifyJWT,getOne)
    .delete(verifyJWT,remove)
    .put(verifyJWT,update);

module.exports = userRouter;