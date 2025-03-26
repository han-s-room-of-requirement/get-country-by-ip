// const cluster = require("cluster")
// const os = require("os")

// if (cluster.isMaster) {
//   for (let i = 0; i < os.cpus().length; i++) {
//     cluster.fork()
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`)
//   })
// } else {
// }
const app = require("./app")

const port = process.env.PORT || 3000
app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`)
})
