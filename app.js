const express = require('express')
const morgan = require('morgan')
const methodOverRide = require('method-override')

const app = express()

app.use(morgan('dev'))
app.use(methodOverRide("_method"))

app.listen(3000, ()=> console.log("Serving on port 3000"))