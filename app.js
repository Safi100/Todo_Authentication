const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const methodOverRide = require('method-override')
const session = require('express-session')
const {isAuthenticated, LoggedIn} = require('./middleware')
const flash = require('connect-flash')
const bcrypt = require('bcrypt')
const User = require('./models/user')
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
    console.log(req.session);
    res.locals.currentUser = req.session.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/', isAuthenticated, (req, res) => {
    res.render('index')
})
app.get('/login', LoggedIn, (req, res) => {
    res.render('login')
})
app.post('/login', LoggedIn, async (req, res) => {
    const {username, password} = req.body
    const user = await User.findOne({username})
    if(user){
        const match = await bcrypt.compare(password, user.password)
        console.log(match);
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

app.listen(3000, ()=> console.log("Serving on port 3000"))