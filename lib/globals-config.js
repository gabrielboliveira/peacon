var define = require("node-constants")(exports);

// declare LEDs' GPIO number
define("INTERFACELED1", 12);
define("INTERFACELED2", 6);
define("INTERFACELED3", 5);
define("POWERLED", 22);
define("INTERNETLED", 27);
define("BEACONLED", 17);

// declare buttons' GPIO number
define("LEFTBTN", 18);
define("MIDDLEBTN", 23);
define("RIGHTBTN", 24);

// declare lcd's config
define("LCDRS", 16);
define("LCDE", 20);
define("LCDDATA1", 13);
define("LCDDATA2", 19);
define("LCDDATA3", 26);
define("LCDDATA4", 21);
define("LCDCOLS", 16);
define("LCDROWS", 2);
