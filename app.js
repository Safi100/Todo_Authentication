const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const methodOverRide = require('method-override')
const session = require('express-session')
const {isAuthenticated, LoggedIn, isAuthor} = require('./middleware')
const flash = require('connect-flash')
const moment = require('moment')
const bcrypt = require('bcrypt')
const User = require('./models/user')
const Todo = require('./models/todo')
const app = express()
mongoose.set('strictQuery', true)
mongoose.connect('mongodb://localhost:27017/Todos_auth', {
    useNewUrlParser: true,  
    useUnifiedTopology: true,
    family:4
})
.then(()=> console.log('db connected'))
.catch((err)=> console.log(err))
app.use(morgan('dev'))
app.use(methodOverRide("_method"))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(session({
    name: 'session',
    secret: 'thisShouldBeAbetterSecret',
    resave: false,
    saveUninitialized: false,
    cookie : {
        maxAge : 1000 * 60 * 60 * 24 * 7,
        expires : Date.now() + 1000 * 60 * 60 * 24 * 7
    }
}))
app.use(flash())

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/', isAuthenticated, async (req, res) => {
    const id = req.session.user
    const user = await User.findById(id)
    const todos = await Todo.find({author: {$in: id}})
    res.render('index', {user, todos, moment})
})
app.post('/', isAuthenticated, async (req, res) => {
    const {body} = req.body.todo
    const todo = new Todo({
        body,
        createdAt: new Date()
    })
    todo.author = req.session.user
    await todo.save()
    req.flash('success', "todo added successfully!")
    res.redirect('/')
})
app.put('/:id', isAuthenticated, isAuthor, async (req, res) => {
    const id = req.params.id
    const todo = await Todo.findById(id)
    todo.isCompleted = !todo.isCompleted
    await todo.save()
    res.redirect('/')
})
app.get('/login', LoggedIn, (req, res) => {
    res.render('login')
})
app.post('/login', LoggedIn, async (req, res) => {
    const {username, password} = req.body
    const user = await User.findOne({username})
    if(user){
        const match = await bcrypt.compare(password, user.password)
        if(match) {
            req.session.user = user._id
            return res.redirect('/')
        }
        req.flash('error', "username/password wrong")
        return res.redirect('/login')
    }else{
        req.flash('error', "username/password wrong")
        return res.redirect('/login')
    }
})
app.get('/register', LoggedIn, async (req, res) => {
    res.render('register')
})
app.post('/register', LoggedIn, async (req, res) => {
    const {username, email, password} = req.body
    const users = await User.find({})
    const UsernameisUsed = users.some(user => user.username === username)
    const EmailisUsed = users.some(user => user.email === email)
    if(UsernameisUsed && EmailisUsed){
        req.flash('error', "Username and email already used")
        res.redirect('/register')
    }else if(UsernameisUsed){
        req.flash('error', "Username already used")
        res.redirect('/register')
    }else if(EmailisUsed){
        req.flash('error', "email is already used")
        res.redirect('/register')
    }else{
        const hashedPass = await bcrypt.hash(password.trim(), 10)
        const user = new User({
            username : username.trim(),
            email : email.trim(),
            password: hashedPass
        })
        await user.save()
        req.session.user = user._id
        res.redirect('/')
    }  
})
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})
app.all('*', (req, res)=>{
    res.status(404).render('notFound')
})

app.listen(3000, ()=> console.log("Serving on port 3000"))