// This file's logic has been moved to backend/routes/stations.js
// and the frontend now calls the backend API.
// Keeping the file here as per original ZIP, but it's not directly used by the React app.
function ChargingAvailabilityOptions(options) {
  this.options = options
}

ChargingAvailabilityOptions.prototype.go = function () {
  const options = this.options

  return new Promise((fulfill, reject) => {
    if (!hasOwnProperties(options, ["chargingAvailability", "key"])) {
      reject("chargingAvailability call is missing required properties.")
      return
    }

    fetchResponse(formatUrl(options), fulfill, reject)
  })
}

function fetchResponse(url, fulfill, reject) {
  fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      parseResponse(response, fulfill, reject)
    })
    .catch((error) => {
      reject(error)
    })
}

function formatUrl(options) {
  return (
    "https://api.tomtom.com/search/2/chargingAvailability.json?" +
    "chargingAvailability=" +
    encodeURIComponent(options.chargingAvailability) +
    "&" +
    "key=" +
    encodeURIComponent(options.key)
  )
}

function hasOwnProperties(options, properties) {
  if (options == null) return false

  for (const property of properties) if (!options.hasOwnProperty(property)) return false

  return true
}

function parseResponse(response, fulfill, reject) {
  response
    .json()
    .then((obj) => {
      if (!obj.hasOwnProperty("error")) fulfill(obj)
      else reject(obj.error.description)
    })
    .catch((error) => {
      reject(error)
    })
}

function chargingAvailability(options) {
  return new ChargingAvailabilityOptions(options)
}
