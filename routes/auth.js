const express = require('express');
const User = require("../models/User")
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
const fetchUser=require("../middleWare/fetchUser")
const JWT_SECRET = 'ToDoApp';
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'vishnu846684@gmail.com',
        pass: '-'
    }
});


router.post('/createuser', [
    body('email').isEmail(),
    body('name').isLength({ min: 3 }),
    body('password').isLength({ min: 5 })
], async (req, res) => {
    let success=false;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success,errors:errors.array()})
    }
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({success, errors: "A User With the same mail id exits" });
        }
        const salt = await bcrypt.genSalt(10);
        secpass = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
            name: req.body.name,
            password: secpass,
            email: req.body.email
        })

        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET)
        console.log(authToken)

        // Send email to the registered user
        const mailOptions = {
            from: 'vishnu846684@gmail.com',
            to: req.body.email,
            subject: 'Welcome to our application!',
            text: `Hi ${req.body.name},\n\nThank you for registering with our application. Your authentication token is ${authToken}.\n\nRegards,\nYour Application Team`
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.error(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        success=true;
        res.json({success, authToken })
    } catch (error) {
        console.error(error);
        res.status(500).send(success,"Some Error Occured")
    }
})

router.post('/login', [
    body('email', 'enter a valid email').isEmail(),
    body('password', 'password cant be blank').exists(),
], async (req, res) => {
    let success=false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "please login with correct credentials" })
        }
        const passwordCompare =await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            success=false;
            return res.status(400).json({success, error: "please login with correct credentials" })
        }
        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET)
        success=true;
        res.json({ success,authToken })
    } catch (err) {
        console.error(error.message);
        res.status(500).send("Some Error Occured")
    }
})


router.post('/getUser',fetchUser, async (req, res) => {

try{
   const userId=req.user.id;
    const user=await User.findById(userId).select('-password')
    res.send(user)
}catch(error){
    console.error(error.message);
        res.status(500).send("Some Error Occured")
}
})

module.exports = router