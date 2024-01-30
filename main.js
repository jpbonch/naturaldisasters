$( document ).ready(function() {

function createMap(){
  var mymap = L.map('mapid', {
    attributionControl: false,
    closePopupOnClick: false
  }).setView([0, 0], 2);
  var markers = L.layerGroup();
  mymap.addLayer(markers);

  fetch('https://naturaldisasters-backend.vercel.app/api/mapbox')
    .then((result) => result.json())
    .then((jsonResult) => L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      maxZoom: 18,
      id: 'mapbox/outdoors-v11', // or mapbox/light-v10
      tileSize: 512,
      zoomOffset: -1,
      accessToken: jsonResult.message
    }).addTo(mymap));

    return markers;
}


function updateMonthInput(markers, charities){
  $('#monthSelect').MonthPicker({ MonthFormat: "MM yy",
                                 MinMonth: "November 1981",
                                 MaxMonth: 0,
                                 SelectedMonth: -1,
                                 OnAfterChooseMonth: function(){placeMarkers(markers, charities)},
                                 ShowIcon: false });
}

function animateCloseButton(){
  document.getElementById("closebutton").addEventListener("click", () => {
  // infosection.style.right to -610px over half a second
  var newRight = -$("#infosection").width();
  $("#infosection").animate({
    right: newRight
  }, 500, () => {
    $("#infosection").hide()
  });
  }, false);
}

function createMarker(coordinates, disasterInfo, markers, charity) {
  var idleImage = disasterInfo.status + "/" + disasterInfo.disaster + ".png"; // alertEarthquake
  var marker = L.marker(coordinates, {icon: L.icon({iconUrl: idleImage, iconSize: [30, 30]})}).addTo(markers);

  marker.on('click', function(ev) {updateInfoSection(disasterInfo, idleImage, charity)});
}

function updateInfoSection(disasterInfo, image, charity){
  $("#disaster").html(disasterInfo.disaster + " <img width='30px' height='30px' src='" + image + "'/>");
  var date = new Date(disasterInfo.date).toLocaleDateString();
  $('#country').html(disasterInfo.country + " " + date);
  // $("#longName").html(disasterInfo.longName);

  try {
      $("#charityDescription").html(charity.description);
      $("#url").attr("href", charity.url);
      $("#url").html(charity.name);
  } catch (error) {
    var charityUrl = "https://www.globalgiving.org/search/?size=25&nextPage=1&sortField=sortorder&selectedCountries=00" + disasterInfo.country.substring(0,6).toLowerCase() + "&loadAllResults=true;";
    $("#url").attr("href", charityUrl);
    $("#charityDescription").html("");
    $("#url").html("GlobalGiving");
  }


  // fetch("charities.json")
  //   .then((result) => result.json())
  //   .then((charityInfo) => {
  //     var charityUrl = charityInfo[disasterInfo.country].url;
  //     $("#charityDescription").html(charityInfo[disasterInfo.country].description);
  //     $("#url").attr("href", charityUrl);
  //   })
  //   .catch(() => {
  //     var charityUrl = "https://www.globalgiving.org/search/?size=25&nextPage=1&sortField=sortorder&selectedCountries=00" + disasterInfo.country.substring(0,6).toLowerCase() + "&loadAllResults=true;";
  //     $("#url").attr("href", charityUrl);
  //     $("#charityDescription").html("");
  //   })

  $("#status").html("Status: " + disasterInfo.status);

  // infosection.style.right to 5px over half a second
  $("#infosection").show()
    .animate({right: '5px'}, 400);
}
// ADD ALL COUNTRIES TO JSON
// github

async function getDisasterData() {
  // gets number of days in month with year and date
  [monthName, year] = $("#monthSelect").val().split(" ");
  var monthNumber = ('0' + (new Date(monthName + " 1, 2020").getMonth() + 1)).slice(-2); // Get month number from long name
  var daysInMonth = new Date(year, monthNumber, 0).getDate();

  var startQueryMonth = year + "-" + monthNumber + "-01";
  var endQueryMonth = year + "-" + monthNumber + "-" + daysInMonth;

  var result = await fetch("https://naturaldisasters-backend.vercel.app/reliefweb/" + startQueryMonth + "/" + endQueryMonth);
  var reliefData = await result.json();
  var disasterData = [];
  for (disaster of reliefData.data) {
    disasterData.push({
      country: disaster.fields.country[0].name,
      disaster: disaster.fields.type[0].name,
      date: disaster.fields.date.created,
      longName: disaster.fields.name,
      url: disaster.fields.url,
      status: disaster.fields.status
    });
  }
  return disasterData;
}

async function placeMarkers(markers, charities) {
  var disasterData = await getDisasterData();
  markers.clearLayers();
  for (disaster of disasterData) {
    var k = await fetch('https://naturaldisasters-backend.vercel.app/api/mapbox');
    k = await k.json();
    var response = await fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/" + disaster.country + ".json?autocomplete=false&types=country&limit=1&access_token=" + k.message);
    response = await response.json();
    var coordinates = response.features[0].center;
    var charity = charities[disaster.country];
    createMarker([coordinates[1], coordinates[0]], disaster, markers, charity);
  }
}

async function main(){
  var markers = createMap();
  var result = await fetch("charities.json");
  var charities = await result.json();
  updateMonthInput(markers, charities);
  placeMarkers(markers, charities)
  animateCloseButton();
  $("#infosection").hide();
}
main();
});
