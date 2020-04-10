Documentation

Any dom modification must happen after server.onstart() not on window.onload. why?
* user info is not parsed unitill server.onstart callback
* dom modification will also get hosted