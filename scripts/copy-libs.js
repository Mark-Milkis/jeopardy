var fs = require('fs');
var fs = require('fs');
var path = require('path');

function copyFile(src, dest) {
    var destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest); // Assuming this line was intended to be here for actual file copying
}

// Assuming 'mappings' is defined elsewhere, e.g., as an array of objects with src and dest properties
// For the purpose of making the provided code syntactically correct, I'll define a dummy 'mappings' array.
// In a real scenario, 'mappings' would come from configuration or another part of the script.
var mappings = [
    { src: 'node_modules/angular/angular.js', dest: 'public/bower_components/angular/angular.js' },
    { src: 'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js', dest: 'public/bower_components/angular-bootstrap/ui-bootstrap-tpls.js' },
    { src: 'node_modules/angular-sanitize/angular-sanitize.js', dest: 'public/bower_components/angular-sanitize/angular-sanitize.js' },
    { src: 'node_modules/angular-socket-io/socket.js', dest: 'public/bower_components/angular-socket-io/socket.js' },
    { src: 'node_modules/angular-ui-router/release/angular-ui-router.js', dest: 'public/bower_components/angular-ui-router/release/angular-ui-router.js' },
    { src: 'node_modules/bootstrap/dist/css/bootstrap.css', dest: 'public/bower_components/bootstrap/dist/css/bootstrap.css' },
    { src: 'node_modules/jquery/dist/jquery.js', dest: 'public/bower_components/jquery/jquery.js' }
];

mappings.forEach(function (mapping) {
    try {
        copyFile(path.resolve(mapping.src), path.resolve(mapping.dest));
    } catch (e) {
        console.error('Error copying ' + mapping.src + ': ' + e.message);
    }
});
