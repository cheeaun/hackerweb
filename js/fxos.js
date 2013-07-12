// support install of Firefox / Firefox OS apps
function installFFapp(ev) {
  if (ev && ev.preventDefault)
    ev.preventDefault();
  // define the manifest URL
  var manifest_url = "http://cheeaun.github.io/hackerweb/manifest.webapp";
  // install the app
  var myapp = navigator.mozApps.install(manifest_url);
  myapp.onsuccess = function(data) {
    // App is installed, remove button
    if (ev)
      this.parentNode.removeChild(this);
  };
  myapp.onerror = function() {
    // App wasn't installed, info is in this.error.name
    console.log('Install failed, error: ' + this.error.name);
   };
};

