module.exports.isAuthenticated = (req, res, next) => {
    if(!req.session.user){
        return res.redirect('/login')
    }
    next()
}
module.exports.LoggedIn = (req, res, next) => {
    if(req.session.user){
        return res.redirect('/')
    }
    next()
}