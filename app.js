const cors = require("cors")
const express = require("express")
const morgan = require("morgan")
const { readFileSync } = require("fs")
const maxmind = require("maxmind")

const lookup = new maxmind.Reader(readFileSync("./GeoLite2-Country.mmdb"), {
  watchForUpdates: true,
  watchForUpdatesHook: () => {
    console.log("Database updated")
  },
})
const findCountry = (ip) => {
  const location = lookup.get(ip)
  if (location && location.country) {
    return location.country.iso_code
  }
}

const app = express()

app.use(
  morgan("combined", { skip: (req, res) => process.env.NODE_ENV === "test" }),
)
app.enable("trust proxy")

app.use(cors())

app.enable("etag")

app.use((req, res, next) => {
  if (req.path == "/") {
    res.set("Cache-Control", "no-cache")
  } else {
    res.set("Cache-Control", "public, max-age=3600")
  }
  next()
})

app.use(express.static("public"))

function handler(req, res) {
  {
    let country
    const ip =
      req.params.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.ip

    if (req.params.ip) {
      if (!maxmind.validate(ip)) {
        return res
          .status(422)
          .json({ error: { code: 422, message: "Unprocessable Entity" } })
      }
    } else {
      if (req.headers["cf-ipcountry"] && req.headers["cf-ipcountry"] != "XX") {
        country = req.headers["cf-ipcountry"]
      }
    }

    if (!country) {
      country = findCountry(ip)
    }

    if (country) {
      res.json({ ip: ip, country: country })
    } else {
      res.status(404).json({ error: { code: 404, message: "Not Found" } })
    }
  }
}

app.get("/ip/:ip?", handler)

app.get("/test", handler)

app.get("*", function (req, res) {
  return res
    .status(422)
    .json({ error: { code: 422, message: "Unprocessable Entity" } })
})

module.exports = app
