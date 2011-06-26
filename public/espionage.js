var mapLoaded = false;
var myPosition = null;
var mainMap = null;
var currentTargetArea = null;
var currentTimeout = null;
var weaponPrimed = false;
var agent_code_name = null;
var agent_id = null

function loadMap() {
    if (!mapLoaded) {
        if (navigator.geolocation) {
            watch = navigator.geolocation.getCurrentPosition(
                function(position) {
                    myPosition = getLatLng(position);

                    $('#map_canvas_2').gmap({ 'center': myPosition,'zoom': 14, 'streetViewControl': false, 'mapTypeControl': false, 'navigationControl': false, 'callback': function (map) {
                        mainMap = map;
                        $('#map_canvas_2').gmap('clearMarkers');
                        $('#map_canvas_2').gmap('addMarker', { 'bound': true, icon: 'images/me.png', 'position':new google.maps.LatLng(position.coords.latitude, position.coords.longitude) }, function(map, marker) {
                            map.panTo(marker.getPosition());
                            getAgentLocations();
                        });
                    }
                    });
                }
            );

            mapLoaded = true;
        }

    }
}

function getAgentLocations() {
    $.ajax({
        url: "http://scubaholic.co.uk/agents.php?callback=?",
        dataType: 'json',
        success: loadAgents,
        error: function() {alert("Error")}
    });
}

function drawTargetArea(bearing1, bearing2) {
    if (currentTargetArea) currentTargetArea.setMap(null);
    var pos1 = getNextLatLon(myPosition.lat(), myPosition.lng(), bearing1);
    var pos2 = getNextLatLon(myPosition.lat(), myPosition.lng(), bearing2);
    var triangleCoords = [
        myPosition,
        new google.maps.LatLng(pos1.latitude, pos1.longitude),
        new google.maps.LatLng(pos2.latitude, pos2.longitude)
    ];
    currentTargetArea = new google.maps.Polygon({
        paths: triangleCoords,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35
    });
    currentTargetArea.setMap(mainMap);
}

function rotateTargetArea(bearing) {
    if (bearing < 360) {
        console.log(bearing);
        drawTargetArea(bearing, bearing+30);
        currentTimeout = setTimeout('rotateTargetArea(' + (bearing+5) + ')', 50);
    } else {
        setTimeout('currentTargetArea.setMap(null)')
        weaponPrimed = false;
    }
}

function primeWeapon(marker) {
    clearTimeout(currentTimeout);
    rotateTargetArea(0)
}

function hit(marker) {
    clearTimeout(currentTimeout);
    if (currentTargetArea.containsLatLng(marker.position)) {
        $("#hit").removeClass("hidden").addClass("visible");
    }
    else {
        alert("miss");
    }
    currentTargetArea.setMap(null);
}

function loadAgents(data) {
    $.each(data, function(key, value) {
        var icon = (value.status === "friend") ? "friend" : "enemy";
       $('#map_canvas_2').gmap('addMarker', { 'title': value.id, 'bound': true, icon: 'images/' + icon + '.png', 'position':new google.maps.LatLng(value.position.lat, value.position.lng) }, function(map, marker) {
            $(marker).click(function() {
                aimAndFire(marker);
            });
            map.panTo(marker.getPosition());
       });
    });
    $("#close").click(function() {
        $("#hit").removeClass("visible").addClass("hidden");
    });
}

function aimAndFire(marker) {
    if (!weaponPrimed) {
        primeWeapon(marker);
        weaponPrimed = true;
    } else {
        hit(marker);
        weaponPrimed = false;
    }
}

function getLatLng(position) {
    return new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
}

function loginOrCreateAgent() {
    var agentCodeName = $("#agent_code_name").val();
    $.ajax({
        url: "http://localhost:3000/agents",
        type: "POST",
        data: "agent[code_name]=" + agentCodeName,
    });
    $.getJSON("http://localhost:3000/agents/find?code_name=" + agentCodeName + "&callback=?", function(data) {
        $.each(data, function(key, value) {
            agent_id = value.id;
            $.mobile.changePage("streetmap");
        });
    });
}

$(document).ready(function() {
    $("#login_button").click(function() {
        loginOrCreateAgent();
    });
});