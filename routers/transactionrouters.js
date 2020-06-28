const express=require('express')
const {Transactioncontrollers}=require('./../controllers')
const {auth}=require('./../helper/jwtauth')

const router=express.Router()

router.get('/trans',Transactioncontrollers.gettransaction)
router.post('/addtrans',Transactioncontrollers.posttransactions)
router.post('/addwishlists',Transactioncontrollers.postwishlist)
router.get('/cart',Transactioncontrollers.getCartData)
router.get('/wishlists',Transactioncontrollers.getWishlistsData)
router.put('/deletecart/:id',Transactioncontrollers.deleteCart)
router.get('/plusqty/:id',Transactioncontrollers.plusQty)
router.get('/minqty/:id',Transactioncontrollers.minQty)
router.get('/totalweight/:id',Transactioncontrollers.getTotalWeight)
router.put('/checkout/:id', Transactioncontrollers.checkout)
router.put('/uploadtransfer', auth, Transactioncontrollers.uploadTransfer)
router.get('/failedupload',auth, Transactioncontrollers.failedUpload)
router.get('/history/:id', Transactioncontrollers.userHistory)
router.get('/totalcart/:id', Transactioncontrollers.getTotalCart)
router.get('/transdetail/:idtrans', Transactioncontrollers.gettransactiondetail)
router.get('/delivered/:idtrans', Transactioncontrollers.verifydelivered)



module.exports=router