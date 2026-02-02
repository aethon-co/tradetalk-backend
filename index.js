const express = require("express")
require("dotenv").config()
const dbConnect = require("./db/dbConnect")
const adminRouter = require("./routes/admin")
const userRouter = require("./routes/user")
const cors = require("cors")
const app = express()

app.use(express.json())
// app.use(cors({
//     origin: [
//         process.env.ORIGIN
//     ],
// }));
app.use(cors())

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