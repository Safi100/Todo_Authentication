const Todo = require("./models/todo")

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
module.exports.isAuthor = async (req, res, next) => {
    const id = req.params.id
    const todo = await Todo.findById(id)
    if(!todo){
        req.flash('error', 'Cannot find that todo!')
        return res.redirect('/')
    }
    if(!todo.author.equals(req.session.user)){
        req.flash('error', "You don't have permission to do that!")
        return res.redirect('/')
    }
    next()
}