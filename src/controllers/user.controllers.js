const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode');
const jwt =require('jsonwebtoken');


const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const {email, password,firstName,lastName,country,image,frontBaseUrl}=req.body;
    const encripted=await bcrypt.hash(password,10)
    const result = await User.create({
        email,
        password:encripted,
        firstName,
        lastName,
        country,
        image,
        
    });

const code = require('crypto').randomBytes(32).toString("hex")

await EmailCode.create({code,
userId:result.id,
})

const link = `${frontBaseUrl}/auth/verify_email/${code}`

    await sendEmail({
        to: email,
        subject:'verificate email for user app',
        html:`
        <h1>Hello ${firstName} ${lastName}</h1>
        <h2>Thanks for sing up in user app</h2>
        <br>
        <a href='${link}'>${link}</a>
    `
    }) 
      
    return res.status(201).json(result);
});
const change=catchError(async(req,res)=>{
    const{email,frontBaseUrl}=req.body;
    const user= await User.findOne({where:{email}});
   
    if(!user)return res.status(401).json({message:"invalid credentials"});
   
    const code= require('crypto').randomBytes(32).toString("hex");
    await EmailCode.create ({
        code,
        userId:user.id
    })
    const link=`${frontBaseUrl}/auth/reset_password/${code}`

    await sendEmail({
        to:`${email}`,
        subject: 'chage your password',
        html:`
        <h1> Hello</h1>
        <h2> Want to change  password </h2>
        <br>
        <a href='${link}'>${link}</a>`
    })
    return res.status(201).json(user);
   })
   const changepassword=catchError(async(req,res)=>{
    
    const {code}=req.params;
    const {password}=req.body;
    const encripted=await bcrypt.hash(password,10);
    
    const emailCode= await EmailCode.findOne({where:{code}});
    if (!emailCode) return res.status(401).json({message: "code not fount"});

    
    
    const user= await User.update({
        password:encripted
    },
    { where: {id: emailCode.userId},returning:true}
    ) ;
 
    if(user[0] === 0) return res.sendStatus(404);
    return res.json(user[1][0])
   })

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const {firstNamem, lastName,country,image}=req.params;
    const result = await User.update({
        firstNamem,lastName,country,image
    },
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});
const login =catchError (async(req,res)=>{
    const {email,password,}=req.body;
    const user = await User.findOne({where:{email}});
    if(!user) return res.status(401).json({message:"invalid credentials"});
    const isValid=await bcrypt.compare(password,  user.password);
    if(!isValid) return res.status(401).json({message: "invalid credentials"});
    if(!user.isVerified) return res.status(401).json({message:'User not verified'});

    const token =jwt.sign({user},
        process.env.TOKEN_SECRET,
        {expiresIn:'1d'},
        );
        return res.json({user,token})
})
const getme = catchError(async(req,res)=>{
    return res.json(req.user)
})

const verifyCode =catchError(async(req,res)=>{
    const {code}=req.params;
    const emailCode = await EmailCode.findOne({where: {code}});
    if(!emailCode) return res.status(401).json({message: "code not found"});
    const user =await User.findByPk(emailCode.userId)
    user.isVerified=true;
    await user.save();
    await emailCode.destroy();
    return res.json(user);
})



module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyCode,
    login,
    getme,
    change,
    changepassword
}   