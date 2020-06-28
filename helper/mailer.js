const nodemailer=require('nodemailer')

let transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'irzza.pwdk@gmail.com',    //email masing2
        pass:'ilcsxgoobexrsezo'         //password yang diberikan dari nodemailer
    },
    tls:{
        rejectUnauthorized:false
    }
})

module.exports=transporter