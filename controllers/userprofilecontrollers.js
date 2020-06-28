const { db } = require("../connections");
const encrypt = require("../helper/crypto");
const fs = require('fs');
const {uploader}=require('../helper/upload')


module.exports = {
  getDetailUser: (req, res) => {
    const { id, role } = req.body;
    console.log(id, role);
    var sql = "";
    if (role === 2) {
      sql = `SELECT * FROM users WHERE usersId=${id}`;
    } 
    db.query(sql, (err, result) => {
      if (err) res.status(500).send({ status: "error", err });
      // console.log(result);
      return res.status(200).send(result);
    });
  },

  // getDetailUser: (req, res) => {
  //   // const { id, role } = req.body;
  //   // console.log(id, role);
  //   var sql = `SELECT * FROM users WHERE usersId=${id}`;
  //   // if (role === "user") {
  //   //   sql = `SELECT * FROM users WHERE usersId=${id}`;
  //   // }
  //   db.query(sql, (err, result) => {
  //     if (err) res.status(500).send({ status: "error", err });
  //     // console.log(result);
  //     return res.status(200).send(result);
  //   });
  // },

  updateUser: (req, res) => {
    console.log(req.params)
    console.log(req.body)
    const iduser = parseInt(req.params.id) ;
    // const { namadepan, namabelakang, nomorhp,  } = req.body;
    var sql = `select u.email, up.*, ua.*, c.*, p.* from users u
              join userprofiles up on u.iduser=up.iduser
              join user_address ua on up.id=ua.idprofile
              left join city c on c.id_city=ua.kota
              left join province p on p.id_province=ua.provinsi
              where u.iduser=${iduser}`
    db.query(sql, (err, resselect)=>{
      if (err) res.status(500).send({ status: "get data Error", err });
      console.log(resselect, '52')
      var sql = `UPDATE userprofiles SET ? WHERE iduser = ${iduser}`;
      let data = {
        firstname: req.body.namadepan,
        lastname: req.body.namabelakang,
        phone: req.body.nomorhp,
      };
      db.query(sql, data, (err, result) => {
        if (err) res.status(500).send({ status: "update profile error Error", err });
        console.log(result , '56');
        var sql = `UPDATE user_address SET ? WHERE idprofile = ${resselect[0].idprofile}`
        let dataaddress={
          jalan: req.body.alamat,
          kota: req.body.kokab,
          kodepos: req.body.kodepos,
          provinsi: req.body.provinsi
        }
        db.query(sql, dataaddress, (err, result2) => {
          if (err) res.status(500).send({ status: "update address Error", err });
          console.log(result2 , '65');
          var sql = `select u.email, up.firstname, up.lastname, up.iduser, up.image,up.phone, ua.jalan, ua.kodepos, c.name as kota, c.id_city, p.name as provinsi from users u
                        join userprofiles up on u.iduser=up.iduser
                        join user_address ua on up.id=ua.idprofile
                        left join city c on c.id_city=ua.kota
                        left join province p on p.id_province=ua.provinsi
                      where u.iduser=${iduser}`
          db.query(sql,(err, resgetdata) => {
            console.log(resgetdata, '74')
            return res.status(200).send({...resgetdata[0], status: "Update Data Berhasil" });
          })
        })
      });

    })
    //   if (result) {
    //     return res.status(200).send({ status: "Update Data Berhasil", result });
    //   }
  },

  getRegion: (req, res) => {
    var sql = `select * from province`
    db.query(sql, (err, resprovince) => {
      if (err) res.status(500).send(err);
        var sql = `select * from city`
        db.query(sql, (err, rescity)=>{
            if (err) res.status(500).send(err);
            return res.status(200).send({resprovince, rescity});
        })
    });
  },
  
  getUser: (req, res) => {
    console.log(req.user, '63')
    var sql = `select u.email, up.firstname, up.lastname, up.iduser, up.image, up.phone, ua.jalan, ua.kodepos, c.name as kota, c.id_city, p.name as provinsi from users u
                join userprofiles up on u.iduser=up.iduser
                join user_address ua on up.id=ua.idprofile
                left join city c on c.id_city=ua.kota
                left join province p on p.id_province=ua.provinsi
              where u.iduser=${req.user.id}`
    db.query(sql, (err, result) => {
        if (err) res.status(500).send({ status: "get user Error", err });
        console.log(result);
        return res.status(200).send(result);
        });
  },

  changePassword: (req, res) => {
    console.log(req.query, 'userprofilecontrollers 114')
    const hashpass = encrypt(req.query.password)
    var sql = `select * from users where iduser =${req.user.id} and password='${hashpass}'`
    db.query(sql, (err, result) => {
      if (err) res.status(500).send({ status: "get user Error", err });
      console.log(result, 'userprofilecontrollers 119')
      if (result.length) {
        console.log('userprofilecontrollers 121 data ada')
        let data = {
          password:encrypt(req.query.newpassword),
          updateat:new Date()
        }
        var sql = `update users set ? where iduser=${req.user.id}`
        db.query(sql, data, (err, resultupdatepass) => {
          if (err) res.status(500).send({ message: "update password error", err });
          return res.status(200).send({status:true});
        })       
      }else {
        return res.status(200).send({status:false, message: 'data tidak ditemukan, password belum terganti'});
      }
    })
  },

  editimage: (req, res) => {
    console.log(req.user, 'userprofilecontrollers 138')
    const id = parseInt(req.user.id)
        // const id = parseInt(req.params.id)
        // console.log(req.body, '294')
        var sql=`select * from userprofiles where iduser=${id}`
        db.query(sql, (err,result)=>{
            if(err) res.status(500).send(err)
            if(result.length) {
                try {
                    const path='/user' //alamatnya bebas
                    const upload=uploader(path, 'USER').fields([{name: 'image'}])
                    upload (req, res, (err)=>{
                        if(err) {
                            return res.status(500).json({message: 'Upload Post Picture Failed !', error: err.message});        
                        }
                        console.log('userprofilecontrollers upload edit foto success')
                        console.log(req.files, 'userprofilecontrollers 156')
                        const { image } = req.files
                        const imagePath = image ? path + '/' + image[0].filename : null
                        console.log(imagePath,' userprofilecontrollers 159')
                        let data = {
                          image : imagePath,
                          last_update : new Date()
                        }
                        // const data = JSON.parse(req.body.data)
                        // if(imagePath) {
                        //     image:imagePath
                        // }
                        sql = `Update userprofiles set ? where iduser=${id}`
                        db.query(sql,data,(err1,result1)=>{
                            if(err1) {      //kalau gagal foto gajadi di upload
                                if(imagePath) {
                                    fs.unlinkSync('./public' + imagePath)
                                }
                                return res.status(500).json({message:"There's an error on the server", error: err1.message})
                            }
                            //cara hapus foto lama
                            if(imagePath) { //jika foto baru ada
                                if(result[0].image) { //dan jika foto lama masih ada
                                    console.log(result[0].image, 'userprofilecontrollers 173')
                                    fs.unlinkSync('./public' + result[0].image) //hapus foto lama
                                }
                            }
                            return res.status(200).send({status:true})
                            // sql=`select * from photos`
                            // db.query(sql, (err1, result3)=>{
                            //     if(err1) return res.status(500).send(err1)
                            // })
                        })
                    })
                } catch (error) {
                    console.log(error, '333')                  
                }
            }else{
                return res.status(500).send({message:'id tidak ditemukan'})
            }
        })
  }

  // changePass: (req, res) => {
  //   const { id, passlama, passbaru } = req.body;
  //   const hashpasslama = crypto(passlama);
  //   const hashpassbaru = crypto(passbaru);


  //   let sql = `SELECT * FROM users WHERE id=${id} AND password='${hashpasslama}'`;
  //   db.query(sql, (err, result) => {
  //     if (err) {
  //       console.log(err);
  //       return res.status(500).send({ message: "Get Error" });
  //     }
  //     if (result.length === '') {
  //       return res.status(200).send({ message: "Pass Lama Salah" });
  //     }
  //     if (result.length) {
  //       sql = `UPDATE users SET password='${hashpassbaru}' WHERE id=${id}`;
  //       db.query(sql, (err, resUpdate) => {
  //         if (err) {
  //           console.log(err);
  //           return res.status(500).send({ message: "Get Error" });
  //         }
  //         return res.status(200).send({ message: "Update Pass Berhasil" });
  //       });
  //     }
  //   });
  // }
};