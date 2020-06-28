const {db} = require('../connections');
const {createJWTToken} = require('../helper/jwt');
const transporter = require('../helper/mailer');
const encrypt = require('../helper/crypto');
// const { query } = require('express');
// var request = require('https')
const {uploader}=require('../helper/upload')
const fs=require('fs')

const queryAsync = query => new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if(err) return reject(err)
      resolve(result)
    })
})

module.exports={
    gettransaction: (req, res) => {
        console.log(req.query, 'line 8')
        const {status, iduser} = req.query
        var sql = `select t.* from transactions t 
                    where t.isdeleted=0 and t.status='${status}' and t.iduser=${iduser}`
        db.query(sql, (err, res1) => {
            console.log({res1})
            if (err) res.status(500).send(err)
            return res.send({ res1 })
        })
    },

    posttransactions: (req, res) => {
        console.log(req.body)
        // cek data dulu dari transaction
        var sql = `select t.* from transactions t 
                    where t.isdeleted=0 and t.status='${req.body.status}' and t.iduser=${req.body.iduser}`
        db.query(sql, (err, res1) => {
            console.log(res1)
            if (err) res.status(500).send(err)
            if (res1.length) {                      //kalau sudah ada
                console.log('transaction id sudah ada')
                //cek apakah product sudah ada di cart
                var sql = `select t.*, td.* from transactions t
                            join transactiondetails td on t.idtransaction = td.idtransaction 
                            where t.isdeleted=0 and t.status='${req.body.status}' and t.iduser=${req.body.iduser} and td.idproduct=${req.body.idproduct}`
                db.query(sql, (err, restransdetail)=>{
                    if (err) res.status(500).send(err)
                    if (restransdetail.length) {    //kalau product sudah ada di cart
                        console.log('product sudah ada di cart, transaction id sudah ada')
                        //cek produk apakah sudah di delete atau belum? bisa dicek juga dari td.isdeleted
                        var sql = `select * from transactiondetails where idproduct=${restransdetail[0].idproduct} and isdeleted=0`
                        db.query(sql, (err, resprodtd) => {
                            if (err) res.status(500).send(err)
                            if(resprodtd.length) { //kalau ada update qty aja
                                console.log(resprodtd,'update qty product isdeleted=0')
                                var updateqty={
                                    qty:resprodtd[0].qty+req.body.qty
                                }
                                var sql = `update transactiondetails set ? where idproduct=${resprodtd[0].idproduct} and isdeleted=0 and idtransactiondetail=${resprodtd[0].idtransactiondetail}`
                                db.query(sql, updateqty, (err, resupdateqty)=>{
                                    if (err) res.status(500).send(err)
                                    console.log(resupdateqty)
                                    return res.status(200).send({status : true, message :'data masuk ke cart, transaction id sudah ada'})
                                })
                            }else{  //masukin produk yang sama sebagai item baru
                                console.log('produk sama, item baru masuk')
                                var sql = `insert into transactiondetails set ?`
                                var postproduct={
                                    idtransaction:res1[0].idtransaction,
                                    idproduct:restransdetail[0].idproduct,
                                    qty:req.body.qty
                                }
                                db.query(sql, postproduct, (err,respostproduct) => {
                                    if (err) res.status(500).send(err)
                                    console.log(respostproduct)
                                    return res.status(200).send({status : true, message :'data masuk ke cart, transaction id sudah ada'})                                      
                                })  
                            }
                        })

                    } else {
                        console.log('produk belum ada di cart, transaction id sudah ada')
                        console.log(restransdetail,'produk belum ada di cart, transaction id sudah ada')
                        var sql = `insert into transactiondetails set ?`
                        var postproduct={
                            idtransaction:res1[0].idtransaction,
                            idproduct:req.body.idproduct,
                            qty:req.body.qty
                        }
                        db.query(sql, postproduct, (err,respostproduct) => {
                            if (err) res.status(500).send(err)
                            console.log(respostproduct)
                            return res.status(200).send({status : true, message :'data masuk ke cart, transaction id sudah ada'})                                      
                        })      
                    }
                })

            } else {
                console.log('transaction id belum ada')
                var sql = `insert into transactions set ?`
                var datatrans={
                    status:req.body.status,
                    iduser:req.body.iduser
                }
                db.query(sql, datatrans, (err, resupdatetrans)=>{
                    if (err) res.status(500).send(err)
                    console.log(resupdatetrans, 'data transaction berhasil post')
                    
                    var sql = `insert into transactiondetails set ?`
                    var datatransdetail={
                        idtransaction:resupdatetrans.insertId,
                        idproduct:req.body.idproduct,
                        qty:req.body.qty
                    }
                    db.query(sql, datatransdetail, (err, resposttransdetail) => {
                        if (err) res.status(500).send(err)
                        console.log(resposttransdetail)
                        return res.status(200).send({status : true, message :'data masuk ke cart'})                   
                    })
                }) 
            }
        })
    },

    postwishlist: (req, res) => {
        console.log(req.body)
        // cek data dulu dari transaction
        var sql = `select t.* from transactions t 
                    where t.isdeleted=0 and t.status='${req.body.status}' and t.iduser=${req.body.iduser}`
        db.query(sql, (err, res1) => {
            console.log(res1)
            if (err) res.status(500).send(err)
            if (res1.length) {                      //kalau sudah ada
                console.log('transaction id sudah ada')
                //cek apakah product sudah ada di cart
                var sql = `select t.*, tw.* from transactions t
                            join transactionwishlists tw on t.idtransaction = tw.idtransaction 
                            where t.isdeleted=0 and t.status='${req.body.status}' and t.iduser=${req.body.iduser} and tw.idproduct=${req.body.idproduct}`
                db.query(sql, (err, restransdetail)=>{
                    if (err) res.status(500).send(err)
                    if (restransdetail.length) {    //kalau product sudah ada di wishlist
                        console.log('product sudah ada di wishlist, transaction id sudah ada')
                        return res.status(200).send({status : false, message :'data sudah ada di wishlist, transaction id sudah ada'})
                        // var updateqty={
                        //     qty:restransdetail[0].qty+req.body.qty
                        // }
                        // var sql = `update transactiondetails set ? where idproduct=${restransdetail[0].idproduct}`
                        // db.query(sql, updateqty, (err, resupdateqty)=>{
                        //     if (err) res.status(500).send(err)
                        //     console.log(resupdateqty)
                        // })
                    } else {
                        console.log('produk belum ada di wishlist, transaction id sudah ada')
                        // console.log(restransdetail,'produk belum ada di cart, transaction id sudah ada')
                        var sql = `insert into transactionwishlists set ?`
                        var postproduct={
                            idtransaction:res1[0].idtransaction,
                            idproduct:req.body.idproduct,
                            // qty:req.body.qty
                        }
                        db.query(sql, postproduct, (err,respostproduct) => {
                            if (err) res.status(500).send(err)
                            console.log(respostproduct)
                            return res.status(200).send({status : true, message :'data masuk ke wishlists, transaction id sudah ada'})                                      
                        })      
                    }
                })

            } else {
                console.log('transaction id belum ada')
                var sql = `insert into transactions set ?`
                var datatrans={
                    status:req.body.status,
                    iduser:req.body.iduser
                }
                db.query(sql, datatrans, (err, resupdatetrans)=>{
                    if (err) res.status(500).send(err)
                    console.log(resupdatetrans, 'data transaction berhasil post')
                    
                    var sql = `insert into transactionwishlists set ?`
                    var datatransdetail={
                        idtransaction:resupdatetrans.insertId,
                        idproduct:req.body.idproduct,
                        // qty:req.body.qty
                    }
                    db.query(sql, datatransdetail, (err, resposttransdetail) => {
                        if (err) res.status(500).send(err)
                        console.log(resposttransdetail)
                        return res.status(200).send({status : true, message :'data masuk ke wishlist'})                   
                    })
                }) 
            }
        })
    },

    getCartData: (req, res) => {
        console.log(req.query, 'line 91')
        const {userId, status} = req.query
        const iduser = parseInt(userId)
        var sql = `select t.*, td.*, p.name, p.image, p.price, p.description, p.stock, a.author, b.weight, b.publisher from transactions t 
                        join transactiondetails td on t.idtransaction=td.idtransaction
                        join products p on td.idproduct=p.idproduct
                        join authors a on p.author_id=a.author_id
                        join booksformat b on p.format_id=b.format_id
                        where t.isdeleted=0 and t.status='${status}' and td.isdeleted=0 and t.iduser=${iduser}`
        db.query(sql, (err,result) => {
            if (err) res.status(500).send(err)
            return res.status(200).send(result)
        })
    },

    getWishlistsData: (req, res) => {
        console.log(req.query, 'line 91')
        const {userId, status} = req.query
        const iduser = parseInt(userId)
        var sql = `select t.*, tw.*, p.name, p.image, p.price, p.description, p.stock, a.author from transactions t 
                    join transactionwishlists tw on t.idtransaction=tw.idtransaction
                    join products p on tw.idproduct=p.idproduct
                    join authors a on p.author_id=a.author_id
                    where t.isdeleted=0 and t.status='${status}' and tw.isdeleted=0 and t.iduser=${iduser}`
        db.query(sql, (err,result) => {
            if (err) res.status(500).send(err)
            return res.status(200).send(result)
        })
    },

    deleteCart: (req, res) => {
        console.log(req.params)
        const id= parseInt(req.params.id)
        var sql=`   UPDATE transactiondetails SET isdeleted=1  
                    WHERE idtransactiondetail=${id}`
        db.query(sql,(err,result)=>{
            if (err) res.status(500).send({err,message:'error update isdeleted'})
            res.status(200).send(result)
        })
    },

    plusQty: (req, res) => {
        // console.log(req.params)
        const id = parseInt(req.params.id)
        var sql = `update transactiondetails set qty=qty+1 
                    where idtransactiondetail=${id}`
        db.query(sql, (err, res1) => {
            if (err) res.status(500).send(err)
            // console.log(res)
            res.status(200).send({status:true})
        })
    },

    minQty: (req, res) => {
        // console.log(req.params)
        const id = parseInt(req.params.id)
        var sql = `update transactiondetails set qty=qty-1 
                    where idtransactiondetail=${id}`
        db.query(sql, (err, res1) => {
            if (err) res.status(500).send(err)
            // if(res1.length) {
                var sql = `select * from transactiondetails where idtransactiondetail=${id}`
                db.query(sql, (err, res2) => {
                    if (err) res.status(500).send(err)
                    // console.log(res1,'line 248')
                    res.status(200).send(res2)
                })
            // }
        })
    },

    getTotalWeight: (req, res) => {
        console.log(req.params, '258')
        var sql = `select t.*, td.*, p.name, p.image, p.price, p.description, p.stock, a.author, b.weight, b.publisher, SUM(b.weight) totalweigth  from transactions t 
                    join transactiondetails td on t.idtransaction=td.idtransaction
                    join products p on td.idproduct=p.idproduct
                    join authors a on p.author_id=a.author_id
                    join booksformat b on p.format_id=b.format_id
                    where t.isdeleted=0 and t.status='oncart' and td.isdeleted=0 and t.iduser=${req.params.id}`
        db.query(sql, (err, resweight) => {
            if (err) res.status(500).send(err)
            res.status(200).send(resweight)
        })

    },

    checkout: (req, res) => {
        console.log(req.params)
        console.log(req.body)
        const id = parseInt(req.params.id)
        const iduser = parseInt(req.body.iduser)
        var sql = `update transactions set ? where idtransaction=${id}`
        var data = {
            status:'waitingupload',
            orderdate:new Date(),
            ccnumber:req.body.ccnumber,
            courier:req.body.couriername,
            method:req.body.isPayment,
            totalpay:req.body.totalpay,
            updateat:new Date()
        }
        db.query(sql, data, (err, resupdate)=>{
            if (err) res.status(500).send(err)
            var sql = `select t.idtransaction, t.iduser, u.email from transactions t 
                        join users u on u.iduser=t.iduser
                        where t.isdeleted=0 and t.status='waitingupload' and t.idtransaction=${id} and t.iduser=${iduser};`
            db.query(sql, (err, reselect)=>{
                if (err) res.status(500).send(err)
                console.log(reselect, 'transactioncontrollers 296')
                const token=createJWTToken({idtransaction:id, email:reselect[0].email, iduser:reselect[0].iduser })    //buat token
                res.status(200).send({status:true,token})
            })
        })
    },

    uploadTransfer: (req, res)=>{
        const id = parseInt(req.user.idtransaction)
        // const id = parseInt(req.params.id)
        console.log(req.body, '294')
        var sql=`select * from transactions where idtransaction=${id}`
        db.query(sql, (err,result)=>{
            if(err) res.status(500).send(err)
            if(result.length) {
                try {
                    const path='/transfer' //alamatnya bebas
                    const upload=uploader(path, 'TRANS').fields([{name: 'image'}])
                    upload (req, res, (err)=>{
                        if(err) {
                            return res.status(500).json({message: 'Upload Post Picture Failed !', error: err.message});        
                        }
                        console.log('upload edit foto success')
                        console.log(req.files, '307')
                        const { image } = req.files
                        const imagePath = image ? path + '/' + image[0].filename : null
                        console.log(imagePath,'310')
                        // const data = JSON.parse(req.body.data)
                        // if(imagePath) {
                        //     image:imagePath
                        // }
                        sql = `Update transactions set image='${imagePath}' where idtransaction=${id}`
                        db.query(sql,(err1,result1)=>{
                            if(err1) {      //kalau gagal foto gajadi di upload
                                if(imagePath) {
                                    fs.unlinkSync('./public' + imagePath)
                                }
                                return res.status(500).json({message:"There's an error on the server", error: err1.message})
                            }
                            //cara hapus foto lama
                            if(imagePath) { //jika foto baru ada
                                if(result[0].image) { //dan jika foto lama masih ada
                                    console.log(result[0].image, 'transactioncontrollers 338')
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
    },

    failedUpload: (req, res) => {
        console.log(req.user, 'transactioncontroller 358')
        // console.log(req.body)
        const id = parseInt(req.user.idtransaction)
        var sql = `update transactions set ? where idtransaction=${id}`
        var data = {
            status:'oncart',
        }
        db.query(sql, data, (err, resupdate)=>{
            if (err) res.status(500).send(err)
            res.status(200).send({status:true})
        })
    },

    userHistory: (req, res) => {
        const {id}=req.params
        var sql= `  SELECT t.idtransaction, t.iduser, t.method, t.status, t.orderdate, t.completedate, t.no_resi
                    FROM transactions t
                        JOIN transactiondetails td
                        ON t.idtransaction=td.idtransaction
                    WHERE t.iduser = ${id} AND td.isdeleted=0
                    GROUP BY idtransaction
                    ORDER BY idtransaction DESC`
        db.query(sql,(err,result)=>{
            console.log(result, 'transactioncontrollers 388')
            if (err) res.status(500).send({err,message:'error get transaction history'})
            var arr=[]
            result.forEach(element => {
                arr.push(queryAsync(`   SELECT td.idtransactiondetail, td.idtransaction, td.qty, p.name, p.image, p.price
                                        FROM transactions t
                                            JOIN transactiondetails td
                                            ON t.idtransaction=td.idtransaction
                                            JOIN products p
                                            ON td.idproduct=p.idproduct
                                        WHERE t.idtransaction=${element.idtransaction} AND td.isdeleted=0;`))
            });
            Promise.all(arr)
            .then(result1=>{
                result1.forEach((element,index)=>{
                    result[index].transactiondetails=element
                })
                res.status(200).send(result)
            })
        })
    },

    getTotalCart:(req,res)=>{
        const {id}=req.params
        var sql= `  SELECT SUM(qty) AS totalqty
                    FROM transactions t
                        JOIN transactiondetails td
                        ON t.idtransaction=td.idtransaction
                        JOIN products p
                        ON td.idproduct=p.idproduct
                    WHERE t.iduser = ${id} AND t.status='oncart' AND td.isdeleted=0 AND t.isdeleted=0`
        db.query(sql,(err,result)=>{
            if (err) res.status(500).send({err,message:'error get totalqty'})
            res.status(200).send(result)
        })
    },

    gettransactiondetail:(req,res)=>{
        const {idtrans}=req.params
        var sql=`    SELECT t.idtransaction, p.name,p.image,p.price, p.idproduct AS productid,td.qty,td.idtransactiondetail, t.status, t.method, t.ccnumber
                        FROM transactions t
                            JOIN transactiondetails td
                            ON t.idtransaction=td.idtransaction
                            JOIN products p
                            ON td.idproduct=p.idproduct
                            JOIN users u
                            ON u.iduser=t.iduser
                        WHERE td.idtransaction = ${idtrans} AND td.isdeleted=0`
        db.query(sql,(err,result)=>{
            if (err) res.status(500).send({err,message:'error get transaction detail'})
            res.status(200).send(result)
        })
    },

    verifydelivered:(req,res)=>{
        const {idtrans}=req.params
        let data = {
            status:'delivered',
            completedate: new Date()
        }
        var sql=`   UPDATE transactions SET ?  
                    WHERE id=${transactionid}`
        db.query(sql,data,(err,result)=>{
            if (err) res.status(500).send({err,message:'error verifypayment'})
            res.status(200).send(result)
        })
    },
}