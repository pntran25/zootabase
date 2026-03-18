const express = require('express');
const router = express.Router();

const signup = require('./SignUp');
const login = require('./Login');

router.post('/signup', signup);
router.post('/login', login);

module.exports = router;