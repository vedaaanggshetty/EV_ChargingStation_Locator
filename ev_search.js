const tt = window.tt // Assuming tt is a global variable available in the window object
const chargingAvailability = tt.services.chargingAvailability // Assuming chargingAvailability is a service provided by tt

const application = {
  key: "3m6aG5h2rlhWF3HoyhRSKr8PRNWVA2IO",
  name: "EV Search",
  version: "1.0",
}

const ids = {
  html: {
    map: "map",
    location: "location",
    distance: "distance",
  },
}

const properties = [
  { name: "available", label: "available" },
  { name: "occupied", label: "occupied" },
  { name: "outOfService", label: "out of service" },
  { name: "reserved", label: "reserved" },
  { name: "unknown", label: "unknown" },
]

const labels = {
  kilometers: "km",
  total: "ports",
  available: "available",
  occupied: "occupied",
  reserved: "reserved",
  unknown: "unknown",
  outOfService: "out of service",
}

const metersPerKilometer = 1000
const markerColor = "blue"
const mapPadding = 40
const limit = 100 // Must implement paging for values > 100
const markers = []
var center
var radius
var map

init()

function appendLine(element, tag, text) {
  if (element.childElementCount > 0 && element.lastChild.tagName != "H3")
    element.appendChild(document.createElement("br"))

  const child = document.createElement(tag)
  child.textContent = text
  element.appendChild(child)
}

function appendConnector(element, connector) {
  console.log(connector)
  const current = connector.availability.current
  var text = connector.type + ": "
  var firstCount = true

  properties.forEach((property) => {
    if (!current.hasOwnProperty(property.name)) return

    const count = current[property.name]
    if (count == 0) return

    if (firstCount) firstCount = false
    else text += ", "

    text += count + " " + property.label
  })

  if (firstCount) text += "no information"

  appendLine(element, "span", text)
}

function formatText(location, response) {
  // dataSources = location.dataSources;
  // const chargingAvailability = dataSources.chargingAvailability;
  // const chargingStation = dataSources.chargingStation;
  // const chargingConnector = dataSources.chargingConnector;
  const div = document.createElement("div")
  const a = document.createElement("a")
  const link = document.createTextNode(location.address.freeformAddress)
  a.href = "https://www.google.com/maps/search/?api=1&query=" + location.position.lat + "," + location.position.lng
  a.appendChild(link)
  div.appendChild(a)
  div.appendChild(document.createElement("br")) // Add a line break after the link
  appendLine(div, "h3", "Charging Station")
  appendLine(div, "span", "Address: " + location.address.freeformAddress)
  // appendLine(div, 'span', 'Distance: ' + (location.distance / metersPerKilometer).toFixed(2) + ' ' + labels.kilometers);

  // a.target="_blank";
  // // a.innerHTML=location.dataSources.chargingAvailability.url;
  // appendLine(div, 'h3', location.address.freeformAddress);
  // appendLine(div, 'span', 'URL: ');
  // div.appendChild(a);
  // appendLine(div, 'span', 'Distance: ' + location.distance.toFixed(1) + ' ' + labels.kilometers);
  // appendLine(div, 'span', 'Total: ' + location.dataSources.chargingAvailability.total + ' ' + labels.total);

  // appendLine(div, 'h3', location.address.freeformAddress);
  // div[0].appendChild('<a href="https://www.google.com/maps/dir/?api=1&destination='+location.position.lat+','+location.position.lng+'">Get Directions</a>');
  // appendLine(div,'a', 'https://www.google.com/maps/search/?api=1&query=' + location.position.lat + ',' + location.position.lng);

  console.log(response)
  if (response == null || response.connectors.length == 0) {
    appendLine(div, "span", "Ports available J1772")
    return div.innerHTML
  }

  response.connectors.forEach((connector) => {
    appendConnector(div, connector)
  })

  return div.innerHTML
}

function addMarker(location) {
  const popup = new tt.Popup({ offset: 10, maxWidth: "none" }).setHTML(formatText(location)).on("open", (e) => {
    updatePopup(popup, location)
  })

  const marker = new tt.Marker({ color: markerColor }).setLngLat(location.position).setPopup(popup).addTo(map)

  markers.push(marker)
}

function clearMarkers() {
  while (markers.length > 0) markers.pop().remove()
}

function createMarkers(results) {
  if (results == null || results.results.length == 0) {
    alert("No charging stations were found.")
    return
  }

  const bounds = new tt.LngLatBounds()

  results.results.forEach((location) => {
    addMarker(location)
    bounds.extend([location.position.lng, location.position.lat])
  })

  map.fitBounds(bounds, { padding: mapPadding })
}

function findLocation() {
  if (!map.loaded()) {
    alert("Please try again later, map is still loading.")
    return
  }

  clearMarkers()

  const queryText = getValue(ids.html.location)

  tt.services
    .fuzzySearch({ key: application.key, query: queryText })
    .go()
    .then(findStations)
    .catch((error) => {
      alert("Could not find location (" + queryText + "). " + error.message)
    })
}

function findStations(results) {
  const location = getLocation(results)
  if (location == null) return

  radius = getValue(ids.html.distance) * metersPerKilometer
  center = location.position

  tt.services
    .categorySearch({
      key: application.key,
      query: "electric vehicle station",
      center: center,
      radius: radius,
      limit: limit,
    })
    .go()
    .then(createMarkers)
    .catch((error) => {
      alert("Could not find charging stations. " + error.message)
    })
}

function getLocation(results) {
  if (results.results.length > 0) return results.results[0]

  alert("Could not find location.")
  return null
}

function getValue(elementId) {
  return document.getElementById(elementId).value
}

function init() {
  tt.setProductInfo(application.name, application.version)
  map = tt.map({ key: application.key, container: ids.html.map })
}

function updatePopup(popup, location) {
  const id = location.dataSources.chargingAvailability.id

  chargingAvailability({ key: application.key, chargingAvailability: id })
    .go()
    .then((response) => {
      popup.setHTML(formatText(location, response))
    })
    .catch((error) => {
      popup.setHTML(formatText(location))
    })
}

// This file's logic has been moved to app/ev-search/page.tsx
// and the frontend now calls the backend API.
// Keeping the file here as per original ZIP, but it's not directly used by the React app.
