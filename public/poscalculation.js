if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
}

/** Converts radians to numeric (signed) degrees */
if (typeof(Number.prototype.toDeg) === "undefined") {
    Number.prototype.toDeg = function() {
        return this * 180 / Math.PI;
    }
}

function LatLon(lat, lon, rad) {
    if (typeof(rad) == 'undefined') rad = 6371; // earth's mean radius in km
    // only accept numbers or valid numeric strings
    this._lat = typeof(lat) == 'number' ? lat : typeof(lat) == 'string' && lat.trim() != '' ? +lat : NaN;
    this._lon = typeof(lon) == 'number' ? lon : typeof(lon) == 'string' && lon.trim() != '' ? +lon : NaN;
    this._radius = typeof(rad) == 'number' ? rad : typeof(rad) == 'string' && trim(lon) != '' ? +rad : NaN;
}


LatLon.prototype.lat = function(format, dp) {
    if (typeof format == 'undefined') return this._lat;
    return Geo.toLat(this._lat, format, dp);
}

LatLon.prototype.lon = function(format, dp) {
    if (typeof format == 'undefined') return this._lon;
    return Geo.toLon(this._lon, format, dp);
}

function getNextLatLon(lat1, lon1, brng, dist) {
    if (dist == null) dist = 1;
    var p1 = new LatLon(lat1, lon1);
    var p2 = p1.destinationPoint(brng, dist);
    lat2 = p2.lat()
    lon2 = p2.lon()
    //drawPath(lat1, lon1, lat2, lon2);
    return {
        latitude: lat2,
        longitude: lon2
    }
}

LatLon.prototype.destinationPoint = function(brng, dist) {
    dist = typeof(dist) == 'number' ? dist : typeof(dist) == 'string' && dist.trim() != '' ? +dist : NaN;
    dist = dist / this._radius; // convert dist to angular distance in radians
    brng = brng.toRad(); //
    var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
            Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));
    var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
            Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2));
    lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180...+180
    return new LatLon(lat2.toDeg(), lon2.toDeg());
}

