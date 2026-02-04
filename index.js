const express = require("express")
require("dotenv").config()
const dbConnect = require("./db/dbConnect")
const adminRouter = require("./routes/admin")
const userRouter = require("./routes/user")
const cors = require("cors")
const cookieParser = require("cookie-parser");
const app = express()

app.use(express.json())
app.use(cookieParser())

// app.use(cors({
//     origin: [
//         process.env.ORIGIN
//     ],
// }));
// CORS must specify origin when credentials are true (cannot be *)
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://tradetalk-auth.vercel.app",
    ].filter(Boolean),
    credentials: true
}))

app.use("/api/v1/user", userRouter)
app.use("/api/v1/admin", adminRouter)


app.get("/", (req, res) => {
    res.status(200).send("<h1>HOME</h1>");
})



const server = async () => {
    try {
        await dbConnect(process.env.MONGOURL)
        app.listen(process.env.PORT || 3001, () => console.log("Server is up and running"))
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

server()