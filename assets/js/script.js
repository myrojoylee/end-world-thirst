// ====================================================== //
//                -------- VARIABLES --------             //
// ====================================================== //
const btnSubmit = document.querySelector("#submit-btn");
const userZip = document.querySelector("#zipsubmit");
const parentSection = document.querySelector(".parent-section");
const radiusCheck = document.querySelector("#radius-check");
const btnParentEl = document.querySelector(".btn-parent");
const WeatherAPIKey = "021e75b0e3380e236b4ff6031ae2dde4";
const fiveMileDistance = 8.04672;
const tenMileDistance = 16.0934;
const fifteenMileDistance = 24.1402;
let favesListEL = document.querySelector("#faves-list");
let favoritesList = [];
let breweryList = [];
let withinFiveMiles = [];
let withinTenMiles = [];
let withinFifteenMiles = [];
let breweryName, breweryAddress, breweryLat, breweryLon;
let tempObject;
let map;
let marker, circle, lat, lon;
let distanceOfTempLocation, referenceLocation, tempLocation;
let warningMessage;
let createList,
  createListItem,
  createListTen,
  createListFifteen,
  createListItemTen,
  createListItemFifteen,
  layerGroupFive,
  layerGroupTen,
  layerGroupFifteen;

// ====================================================== //
//                   -------- CODE --------               //
// ====================================================== //

/**
 * favorites list loads upon refresh
 */
function init() {
  let tempVal = localStorage.getItem("input");
  if (tempVal) {
    // if exists
    favoritesList = JSON.parse(tempVal);
  }
  renderFavorites();
}

init();

btnSubmit.addEventListener("click", function () {
  eraseOtherLists();
  withinFiveMiles = [];
  withinTenMiles = [];
  withinFifteenMiles = [];
  breweryList = [];
  radiusCheck.addEventListener("change", displayLists);
  let tempUserVal;
  // console.log(userZip.value);
  tempUserVal = parseInt(userZip.value);
  // console.log(tempUserVal);
  if (isNaN(tempUserVal)) {
    renderInvalidMessage();
  } else {
    fetchUserZipCode(tempUserVal);
    favoritesList.push(tempUserVal);
    localStorage.setItem("input", JSON.stringify(favoritesList));
    renderFavorites();
  }
});

console.log(favesListEL);
function renderFavorites() {
  favesListEL.innerHTML = "";
  for (let i = 0; i < favoritesList.length; i++) {
    let favoritesButton = document.createElement("button");
    favoritesButton.textContent = favoritesList[i];
    favoritesButton.value = favoritesList[i];
    favoritesButton.setAttribute("class", "faves-btn");
    favesListEL.appendChild(favoritesButton);

    favoritesButton.addEventListener("click", function () {
      eraseOtherLists();
      withinFiveMiles = [];
      withinTenMiles = [];
      withinFifteenMiles = [];
      breweryList = [];
      fetchUserZipCode(favoritesButton.value);
      radiusCheck.addEventListener("change", displayLists);
    });
  }
}

/**
 * user input validation
 */
function renderInvalidMessage() {
  warningMessage = document.createElement("p");
  warningMessage.setAttribute("class", "warningMsg")
  warningMessage.style.color = "red";
  warningMessage.textContent = "Please enter a valid zipcode.";
  warningMessage.style.marginTop = "0px";
  document.querySelector("#zipsubmit").style.marginBottom = "0px";
  btnParentEl.insertBefore(warningMessage, btnSubmit);
  setInterval(clearWarning, 2000);
}

function clearWarning() {
  warningMessage.remove();
  document.querySelector("#zipsubmit").style.marginBottom = "24px";
};

/**
 * fetch data using zip code
 * @param {*} userInput
 */
function fetchUserZipCode(tempUserVal) {
  let postalURL = `https://api.openweathermap.org/geo/1.0/zip?zip=${tempUserVal}&appid=${WeatherAPIKey}`;

  fetch(postalURL)
    .then((response) => response.json())
    .then(getCoordinates);
}

/**
 *  fetch data from brewery API
 * @param {*} lat
 * @param {*} lon
 */
function fetchBreweryLocation(lat, lon) {
  let breweryURL = `https://api.openbrewerydb.org/v1/breweries?by_dist=${lat},${lon}&per_page=50`;
  fetch(breweryURL)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      filteredBreweries(data);
    });
}

/**
 * filtering out necessary data for distance calculation
 * @param {*} data
 */
function filteredBreweries(data) {
  // console.log(data);
  for (let i = 0; i < data.length; i++) {
    breweryName = data[i].name;
    breweryAddress = data[i].address_1;
    breweryLat = data[i].latitude;
    breweryLon = data[i].longitude;
    tempObject = {
      name: breweryName,
      address: breweryAddress,
      lat: breweryLat,
      lon: breweryLon,
    };
    breweryList.push(tempObject);
  }
  // console.log(breweryList);
  calculateDistBtwCoordPairs();
}

/**
 * getting coordinates as a reference point
 * @param {*} allData
 */
function getCoordinates(allData) {
  let y = allData;
  console.log(y);
  lat = y.lat;
  lon = y.lon;
  console.log(lat);
  console.log(lon);
  referenceLocation = {
    lat: lat,
    lon: lon,
  };

  clearPreviousMap(10);
  fetchBreweryLocation(lat, lon);
}

/**
 * distance between 2 points calculated
 */
function calculateDistBtwCoordPairs() {
  let tempArray;

  for (let i = 0; i < breweryList.length; i++) {
    // in this case, distanceOfTempLocation is they hypotenuse (h)
    // in Pythagoras' theorem, with h^2 = x^2 + y^2
    kmY = 40000 / 360;
    kmX = Math.cos((Math.PI * referenceLocation.lat) / 180) * kmY;
    distX = Math.abs(referenceLocation.lon - breweryList[i].lon) * kmX;
    distY = Math.abs(referenceLocation.lat - breweryList[i].lat) * kmY;
    distanceOfTempLocation = Math.sqrt(distX ** 2 + distY ** 2);
    tempArray = {
      name: breweryList[i].name,
      address: breweryList[i].address,
      lat: breweryList[i].lat,
      lon: breweryList[i].lon,
      distanceFromOrigin: distanceOfTempLocation,
    };

    if (
      0 <= distanceOfTempLocation &&
      distanceOfTempLocation <= fifteenMileDistance
    ) {
      if (distanceOfTempLocation <= tenMileDistance) {
        if (distanceOfTempLocation <= fiveMileDistance) {
          withinFiveMiles.push(tempArray);
        }
        withinTenMiles.push(tempArray);
      }
      withinFifteenMiles.push(tempArray);
    }
    // distanceAndBoolean.push(tempArray);
  }
  console.log(withinFiveMiles);
  console.log(withinTenMiles);
  console.log(withinFifteenMiles);
}

/**
 * creates list within 5 mile radius
 */
function createFiveList() {
  createList = document.createElement("ul");
  createList.textContent = "Within 5 miles:";
  createList.setAttribute("id", "fiveMileList");
  createList.setAttribute("class", "has-text-weight-bold p-3");
  parentSection.appendChild(createList);
  for (let i = 0; i < withinFiveMiles.length; i++) {
    createListItem = document.createElement("li");
    createListItem.textContent = withinFiveMiles[i].name;
    createListItem.setAttribute("class", "title")
    createListItemAddy = document.createElement("p")
    createListItemAddy.setAttribute("class", "is-italic subtitle")
    createListItemAddy.textContent = withinFiveMiles[i].address;
    createList.appendChild(createListItem);
    createListItem.appendChild(createListItemAddy);
    createListItem.style.fontWeight = "400";
    marker = new L.marker([withinFiveMiles[i].lat, withinFiveMiles[i].lon])
      .bindPopup(withinFiveMiles[i].name)
      .addTo(map);
  }
}

/**
 * creates list within 10 mile radius
 */
function createTenList() {
  createListTen = document.createElement("ul");
  createListTen.textContent = "Within 10 miles:";
  createListTen.setAttribute("id", "tenMileList");
  createListTen.setAttribute("class", "has-text-weight-bold p-3");
  parentSection.appendChild(createListTen);
  for (let i = 0; i < withinTenMiles.length; i++) {
    createListItemTen = document.createElement("li");
    createListItemTen.textContent = withinTenMiles[i].name;
    createListItemTen.setAttribute("class", "title");
    createListItemTenAddy = document.createElement("p");
    createListItemTenAddy.setAttribute("class", "is-italic subtitle");
    createListItemTenAddy.textContent = withinTenMiles[i].address;
    createListTen.appendChild(createListItemTen);
    createListItemTen.appendChild(createListItemTenAddy);
    createListItemTen.style.fontWeight = "400";
    marker = new L.marker([withinTenMiles[i].lat, withinTenMiles[i].lon])
      .bindPopup(withinTenMiles[i].name)
      .addTo(map);
  }
}

/**
 * creates list within 15 mile radius
 */
function createFifteenList() {
  createListFifteen = document.createElement("ul");
  createListFifteen.textContent = "Within 15 miles:";
  createListFifteen.setAttribute("id", "fifteenMileList");
  createListFifteen.setAttribute("class", "has-text-weight-bold p-3");
  parentSection.appendChild(createListFifteen);
  for (let i = 0; i < withinFifteenMiles.length; i++) {
    createListItemFifteen = document.createElement("li");
    createListItemFifteen.textContent = withinFifteenMiles[i].name;
    createListItemFifteen.setAttribute("class", "title");
    createListItemFifteenAddy = document.createElement("p");
    createListItemFifteenAddy.setAttribute("class", "is-italic subtitle");
    createListItemFifteenAddy.textContent = withinFifteenMiles[i].address;
    createListFifteen.appendChild(createListItemFifteen);
    createListItemFifteen.appendChild(createListItemFifteenAddy);
    createListItemFifteen.style.fontWeight = "400";
    marker = new L.marker([
      withinFifteenMiles[i].lat,
      withinFifteenMiles[i].lon,
    ])
      .bindPopup(withinFifteenMiles[i].name)
      .addTo(map);
  }
}

function displayLists() {
  console.log("we changed options!!!!");
  map.eachLayer(function (layer) {
    map.removeLayer(layer);
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  eraseOtherLists();
  if (radiusCheck.value === "5 miles") {
    createFiveList();
    map.setZoom(10);
    renderSearchCircle(8500);
    document.querySelector("#fiveMileList").style.display = "block";
  } else if (radiusCheck.value === "10 miles") {
    createTenList();
    map.setZoom(9);
    renderSearchCircle(16500);
  } else {
    createFifteenList();
    map.setZoom(8);
    renderSearchCircle(25000);
    document.querySelector("#fifteenMileList").style.display = "block";
  }
}

/**
 *  clear each search list while navigating through options
 */
function eraseOtherLists() {
  let findLists = parentSection.querySelectorAll("ul");
  for (let i = 0; i < findLists.length; i++) {
    findLists[i].remove();
  }
}

/**
 * clears previous map before initializing new one
 * @param {*} zoomValue
 */
function clearPreviousMap(zoomValue) {
  if (map == undefined) {
    renderMap(zoomValue);
  } else {
    withinFiveMiles = [];
    withinTenMiles = [];
    withinFifteenMiles = [];
    map.remove();
    renderMap(zoomValue);
  }
}

/**
 * renders the map of user's zip code
 */
function renderMap(zoomValue) {
  map = L.map("map").setView([lat, lon], zoomValue);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
}

/**
 * renders search circle based on search parameters
 * @param {*} radiusInMeters
 */
function renderSearchCircle(radiusInMeters) {
  circle = L.circle([lat, lon], {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: radiusInMeters,
  }).addTo(map);
}
