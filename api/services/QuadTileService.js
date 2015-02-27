// Converts between lat/lon and quadtile indexing
// http://wiki.openstreetmap.org/wiki/QuadTiles
// Based on https://github.com/openstreetmap/openstreetmap-website/blob/master/lib/quad_tile.rb

module.exports = {
    xy2tile: function(x, y) {
        var tile = 0;

        for (var i = 15; i >= 0; --i) {
            tile = (tile << 1) | ((x >> i) & 1);
            tile = (tile << 1) | ((y >> i) & 1);
        }
        return tile;
    },

    lon2x: function(lon) {
        return Math.round((lon + 180.0) * 65535.0 / 360.0);
    },

    lat2y: function(lat) {
        return Math.round((lat + 90.0) * 65535.0 / 180.0);
    },

    tilesForArea: function(minlat, minlon, maxlat, maxlon) {
        var minx = this.lon2x(minlon);
        var maxx = this.lon2x(maxlon);
        var miny = this.lat2y(minlat);
        var maxy = this.lat2y(maxlat);

        var tiles = [];
        for (var x = minx; x <= maxx; x++) {
            for (var y = miny; y <= maxy; y++) {
                tiles.push(xy2tile(x, y));
            }
        }
    }
}