var mapLoaded = false;
var myPosition = null;
var mainMap = null;
var currentTargetArea = null;
var currentTimeout = null;
var weaponPrimed = false;
var agent_code_name = null;
var agent_id = null;
var all_markers = [];

var weapons = {
    knife : {
        angle : 110,
        range : 0.3
    },
    rifle : {
        angle : 15,
        range : 2
    },
    grenade : {
        angle : 90,
        range : 0.6
    },
    gun : {
        angle : 30,
        range : 1
    }
};

var current_weapon = weapons.gun;

function loadMap() {
    if (!mapLoaded) {
        if (navigator.geolocation) {
            watch = navigator.geolocation.getCurrentPosition(
                function(position) {
                    uploadMyPosition(position);
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
                });
            mapLoaded = true;
        }
    }
    setTimeout("loadMap", 60000);
}



function checkForAgentID() {
    if (agent_id == null) {
        $.mobile.changePage("login")
        return false;
    } else {
        return true;
    }
}

function uploadMyPosition(position) {
    positionText = "lat:" + position.coords.latitude + ",lng:" + position.coords.longitude;
    $.ajax({
        url: "http://espionage.heroku.com/agents/" + agent_id,
        type: "POST",
        data: "_method=put&agent[position]=" + positionText
    });
}

function getAgentLocations() {
    $.ajax({
        url: "http://espionage.heroku.com/agents?callback=?",
        dataType: 'json',
        success: loadAgents
    });
}

function drawTargetArea(bearing1, bearing2, dist) {
    if (currentTargetArea) currentTargetArea.setMap(null);
    var pos1 = getNextLatLon(myPosition.lat(), myPosition.lng(), bearing1, dist);
    var pos2 = getNextLatLon(myPosition.lat(), myPosition.lng(), bearing2, dist);
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

function rotateTargetArea(bearing, angle, dist) {
    if (angle == null) angle = 30;
    if (bearing >= 360) bearing = 0;
    drawTargetArea(bearing, bearing + angle, dist);
    currentTimeout = setTimeout('rotateTargetArea(' + (bearing + 5) + ', ' + angle + ', ' + dist + ')', 50);
}

function primeWeapon(marker) {
    clearTimeout(currentTimeout);
    $(".attack-button").removeClass("hidden").addClass("visible");
    rotateTargetArea(0, current_weapon.angle, current_weapon.range);
}

function hit() {
    clearTimeout(currentTimeout);
    var hits = [];
    for(var i=0;i<all_markers.length;i++) {
        var marker = all_markers[i];
        if (currentTargetArea.containsLatLng(marker.position)) {
            hits.push(marker);
        }
    }

    if (hits.length > 0) {
        $("#hit").removeClass("hidden").addClass("visible");
    }
    else {
        $("#miss").removeClass("hidden").addClass("visible");
    }
    currentTargetArea.setMap(null);
    weaponPrimed = false;
    $(".attack-button").removeClass("visible").addClass("hidden");    
}

function loadAgents(data) {
    all_markers = [];
    $.each(data, function(key, value) {
        if (value.agent.updated_at && isUpdatedWithinLastTenMinutes(value.agent.updated_at)) {
            if (value.agent.position && value.agent.id != agent_id) {
                var coords = value.agent.position.split(',');
                var latStrings = coords[0].split(":");
                var lngStrings = coords[1].split(":");
                var icon = (value.status && value.status === "friend") ? "friend" : "enemy";
                $('#map_canvas_2').gmap('addMarker', { 'title': value.id, 'bound': true, icon: 'images/' + icon + '.png', 'position':new google.maps.LatLng(latStrings[1], lngStrings[1]) }, function(map, marker) {
                    $(marker).click(function() {
                        aimAndFire(marker);
                    });
                    all_markers.push(marker);
                });
            }
        }
    });
    $("#close").click(function() {
        $("#hit").removeClass("visible").addClass("hidden");
    });
    $("#closemiss").click(function() {
        $("#miss").removeClass("visible").addClass("hidden");
    });
}

function isUpdatedWithinLastTenMinutes(lastUpdatedDateString) {
    var endDate = new Date();
    var startDate = new Date(lastUpdatedDateString);
    var difference = (endDate - startDate);
    if (difference > 4200000) {
        return false;
    } else {
        return true;
    }
}

function aimAndFire(marker) {
    if (!weaponPrimed) {
        primeWeapon(marker);
        weaponPrimed = true;
    }
}

function getLatLng(position) {
    return new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
}

function loginOrCreateAgent() {
    var agentCodeName = $("#agent_code_name").val();
    $.ajax({
        url: "http://espionage.heroku.com/agents",
        type: "POST",
        data: "agent[code_name]=" + agentCodeName
    });
    $.getJSON("http://espionage.heroku.com/agents/find?code_name=" + agentCodeName + "&callback=?", function(data) {
        $.each(data, function(key, value) {
            agent_id = value.id;
            $.mobile.changePage("streetmap");
        });
    });
}

$(document).ready(function() {
    $("#login_button").live("tap", function() {
        loginOrCreateAgent();
    });
    $("#login_button").live("click", function() {
        loginOrCreateAgent();
    });

    $("#attack_button").live("tap", function() {
        hit();
    });
    $("#attack_button").live("click", function() {
        hit();
    });
    $("#reset_button").live("click", function() {
        alert("test")
        loadMap();
    });
    $("#reset_button").live("tap", loadMap);


    $("#set_handgun").click(function() {
        current_weapon = weapons.gun;
        removeBloodSplat();
        $("#set_handgun").addClass("bloodsplat");
    });
    $("#set_knife").click(function() {
        current_weapon = weapons.knife;
        removeBloodSplat();
        $("#set_knife").addClass("bloodsplat");
    });
    $("#set_ak47").click(function() {
        current_weapon = weapons.rifle;
        removeBloodSplat();
        $("#set_ak47").addClass("bloodsplat");

    });
    $("#set_grenade").click(function() {
        current_weapon = weapons.grenade;
        removeBloodSplat();
        $("#set_grenade").addClass("bloodsplat");
    });
});

function removeBloodSplat() {
    $("#set_handgun").removeClass("bloodsplat");
    $("#set_knife").removeClass("bloodsplat");
    $("#set_ak47").removeClass("bloodsplat");
    $("#set_grenade").removeClass("bloodsplat");
}