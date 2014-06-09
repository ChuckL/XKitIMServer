var ENUMS = new Object();

ENUMS.msgTypes = {
    none: 0,
    log: 1,
    warning: 2,
    error: 3,
    debug: 4,
    verbose: 5,
}
ENUMS.msgTypeTexts = {
    none: "NO",
    log: "LOG",
    warning: "WAR",
    error: "ERR",
    debug: "DBG",
    verbose: "VER",
}
ENUMS.CertificateMode = {
	none: 0,
	key_cert: 1,
	pfx: 2
}

var Config = new Object();

Config.path = "XKitIMConfig.cfg";

Config.WebSocket = new Object();
Config.RC = new Object();
Config.Other = new Object();
Config.Files = new Object();
Config.Log = new Object();
Config.BlacklistedModules = new Object();
Config.CPUControl = new Object();
Config.Autosave = new Object();

var Server = new Array();
Server.ProtocolVersion = 401;
Server.ProtocolMinimumRequiredVersion = 401;
Server.bannedUsers = new Array();
Server.registeredUsers = new Object();
Server.onlineUsers = new Array();
Server.sendArray = new Array();
Server.cachedMessages = new Object();
Server.RCCons = new Array();
Server.acceptConnections = true;
Server.os = os = require('os');



function getDateString() {
    try {
        var tempus = require("tempus")
        var D = new tempus();
        var rval = D.toString(Config.Other.DateFormat);
    } catch (e) {
        var D = new Date();
        rval = Config.Other.DateFormat.replace("%d", D.getDate()).replace("%m", D.getMonth()).replace("%Y", D.getFullYear()).replace("%I", D.getHours()).replace("%M", D.getMinutes()).replace("%p", "");
    }
    return rval;
}

function log(S, tag, type, special) {
    if(!(special)) {
        special = false;
    }
    if(!(tag)) {
        tag = "";
    }
    if(!(type)) {
        type = ENUMS.msgTypes.log;
    }
    var s = "[" + tag + "][" + getDateString().toLocaleString() + "]" + (S);
    switch (type) {
        case ENUMS.msgTypes.log:
            s = "[" + ENUMS.msgTypeTexts.log + "]" + s;
            break;
        case ENUMS.msgTypes.warning:
            s = "[" + ENUMS.msgTypeTexts.warning + "]" + s;
            break;
        case ENUMS.msgTypes.error:
            s = "[" + ENUMS.msgTypeTexts.error + "]" + s;
            break;
        case ENUMS.msgTypes.debug:
            s = "[" + ENUMS.msgTypeTexts.debug + "]" + s;
            break;
        case ENUMS.msgTypes.verbose:
            s = "[" + ENUMS.msgTypeTexts.verbose + "]" + s;
            break;
        default:
            s = "[DEF]" + s;
        }
    try {
        if(type <= Config.Log.File) {
            if((Config.BlacklistedModules.File.indexOf(tag.toLowerCase()) === -1 && !Config.BlacklistedModules.isWhitelist) || (Config.BlacklistedModules.File.indexOf(tag.toLowerCase()) !== -1 && Config.BlacklistedModules.isWhitelist)) {
                require("fs").appendFile(Config.Files.logFile, s + "\n", function (err) {
                    if (err) {
                        console.log(("[WAR]Error while writing log: " + err).yellow);
                    }
                });
            }
        }
        var colors = require("colors");
        switch (type) {
            case ENUMS.msgTypes.log:
                s = s;
                break;
            case ENUMS.msgTypes.warning:
                s = s.yellow;
                break;
            case ENUMS.msgTypes.error:
                s = s.red;
                break;
            case ENUMS.msgTypes.debug:
                s = s.magenta;
                break;
            case ENUMS.msgTypes.verbose:
                s = s.green;
                break;
            default:
                s = s.grey;
        }
        if(special) {
            s = s.bold;
        }
    } catch(e) {
        if(type <= Config.Log.File) {
            if((Config.BlacklistedModules.File.indexOf(tag.toLowerCase()) === -1 && !Config.BlacklistedModules.isWhitelist) || (Config.BlacklistedModules.File.indexOf(tag.toLowerCase()) !== -1 && Config.BlacklistedModules.isWhitelist)) {
                require("fs").appendFile(Config.Files.logFile, s + "\n", function (err) {
                    if (err) {
                        console.log(("[WAR]Error while writing log: " + err));
                    }
                });
            }
        }
    }
    if(type <= Config.Log.Console) {
        if((Config.BlacklistedModules.Console.indexOf(tag.toLowerCase()) === -1 && !Config.BlacklistedModules.isWhitelist) || (Config.BlacklistedModules.Console.indexOf(tag.toLowerCase()) !== -1 && Config.BlacklistedModules.isWhitelist)) {
            console.log(s);
        }
    }
    if(type <= Config.Log.RC) {
        if((Config.BlacklistedModules.RC.indexOf(tag.toLowerCase()) === -1 && !Config.BlacklistedModules.isWhitelist) || (Config.BlacklistedModules.RC.indexOf(tag.toLowerCase()) !== -1 && Config.BlacklistedModules.isWhitelist)) {
            for(var i = 0; i<Server.RCCons.length; i++) {
                if(Server.RCCons[i].loginStep === 2) {
                    Server.RCCons[i].write("[REMOTE]" + s + "\n\r");
                }
            }
        }
    }
}

function writeConfig() {
	var fs = require("fs");
	fs.writeFileSync(Config.path, 'Config.RC.Enable = true;\nConfig.RC.Port = 7238;\nConfig.RC.username = "admin";\nConfig.RC.password = "admin";\nConfig.RC.motd = "%d: Welcome %u";\n\nConfig.WebSocket.Enable = true;\nConfig.WebSocket.Secured = true;\nConfig.WebSocket.SecureMode = ENUMS.CertificateMode.key_cert;\nConfig.WebSocket.Cert = "Certificate.cert";\nConfig.WebSocket.Key = "Key.pem";\nConfig.WebSocket.PFX = "Server.pfx";\nConfig.WebSocket.Port = 7237;\n\nConfig.Files.logFile = "XIMServer.log";\nConfig.Files.PINList = "XIMPins.cfg";\nConfig.Files.BanList = "XIMBans.cfg";\nConfig.Files.CachedMessageList = "XIMCachedMessages.cfg";\n\nConfig.Log.File = ENUMS.msgTypes.verbose; \nConfig.Log.RC = ENUMS.msgTypes.error;\nConfig.Log.Console = ENUMS.msgTypes.error;\n\nConfig.BlacklistedModules.File = [];\nConfig.BlacklistedModules.RC = [];\nConfig.BlacklistedModules.Console = [];\nConfig.BlacklistedModules.isWhitelist = false;\n\nConfig.CPUControl.enabled = true;\nConfig.CPUControl.interval = 5 * 60 * 1000;\nConfig.CPUControl.acceptConnectionBasedOnCPULoad = true;\n\nConfig.Autosave.enabled = false;\nConfig.Autosave.interval = 5 * 60 * 1000;\nConfig.Autosave.saveSync = false;\n\nConfig.Other.stdinEnable = true;\nConfig.Other.maintenanceMessage = "";\nConfig.Other.maxConnections = 5000;\nConfig.Other.DateFormat = "%I:%M %p %m/%d/%Y";');
	log("Config created, loading!", "ConfigLoader");
}

console.log("\u001B[2J\u001B[0;0f");
process.title = "XKitIM Server";

function loadConfig() {
	var fs = require("fs");
	if (fs.existsSync(Config.path)) {
		log("Found Config File! Loading...", "ConfigLoader");
	} else {
		log("Config File not found, creating!", "ConfigLoader")
		writeConfig();
	}
	dString = fs.readFileSync(Config.path, {encoding: "utf8"});
	eval(dString);
	log("Loaded Config File", "ConfigLoader")
}

log("Loading Config File....", "Init");
loadConfig();

log("Setting up required functions and variables for XKit Instant Messenger Server.", "Init");
/*function isAllowedOrigin(origin) {
	log("Checking if " + origin + " is allowed to connect....", "WS_SourceCheck", ENUMS.msgTypes.debug);
	valid_origins = ['http://localhost', '127.0.0.1', 'http://www.tumblr.com'];
	if (valid_origins.indexOf(origin) != -1) {
		log('Connection accepted from ' + origin, "WS_SourceCheck", ENUMS.msgTypes.debug);
		return true;
	}
	log("Connection refused from " + origin, "WS_SourceCheck", ENUMS.msgTypes.debug);
	return false;
}*/


function saveData(sync) {
    if(!(sync)) {
        sync = false;
    }
    if(sync) {
        data = "";
        for(x in Server.registeredUsers) {
            var data = data + x + ":" + Server.registeredUsers[x] + "\n";
        }
        data = data.substring(0, data.length - 1);
        require("fs").writeFileSync(Config.Files.PINList, data);
        data = "";
        data = JSON.stringify(Server.cachedMessages);
        require("fs").writeFileSync(Config.Files.CachedMessageList, data);
        data = "";
        for(var x = 0; x<Server.bannedUsers.length;x++) {
            var data = data + Server.bannedUsers[x] + "\n";
        }
        data = data.substring(0, data.length - 1);
        require("fs").writeFileSync(Config.Files.BanList, data);
    } else {
        data = "";
        for(x in Server.registeredUsers) {
            var data = data + x + ":" + Server.registeredUsers[x] + "\n";
        }
        data = data.substring(0, data.length - 1);
        require("fs").writeFile(Config.Files.PINList, data, function (err) {
            if (err) {
                console.log("Error while writing PINList: " + err);
            }
        });
        data = "";
        data = JSON.stringify(Server.cachedMessages);
        require("fs").writeFile(Config.Files.CachedMessageList, data, function (err) {
            if (err) {
                console.log("Error while writing PINList: " + err);
            }
        });
        data = "";
        for(var x = 0; x<Server.bannedUsers.length;x++) {
            var data = data + Server.bannedUsers[x] + "\n";
        }
        data = data.substring(0, data.length - 1);
        require("fs").writeFile(Config.Files.BanList, data , function (err) {
            if (err) {
                console.log("Error while writing BanList: " + err);
            }
        });
    }
}
function IsJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function kick(user, msg) {
    if(Server.onlineUsers.indexOf(user) != -1) {
        if(!msg) {
            msg = "You have been kicked from the Server";
        }
        log("Kicking User " + user + " from Server (" + msg + ")", "Kick", ENUMS.msgTypes.debug);
        for(var i = 0; i<Server.sendArray.length; i++) {
            if(Server.sendArray[i].xim_username === user) {
                Server.sendArray[i].sendUTF("XIM_SERVICE_MSG " + msg);
                break;
            }
        }
    } else {
        log("User " + user + " is not logged in and can't be kicked", "Kick", ENUMS.msgTypes.log);
    }
}

function kickall(s) {
    var tmp = Server.onlineUsers;
    for (var i = 0; i<tmp.length;i++) {
        kick(tmp[i], s);
    }
    log(tmp.length + " Users have been kicked", "KickAll", ENUMS.msgTypes.log);
}

function loadData() {
    if(require("fs").existsSync(Config.Files.PINList)) {
        log("PINList found! Loading PINList.....", "DataLoader", ENUMS.msgTypes.debug);
        var PINList = require("fs").readFileSync(Config.Files.PINList, { encoding: "utf8" })
        var PINSplit = PINList.split("\n");
        for(var i = 0; i<PINSplit.length; i++) {
            Server.registeredUsers[PINSplit[i].split(":")[0]] = PINSplit[i].split(":")[1];
        }
        log("Restored " + (PINSplit.length - 1) + " registered Users", "DataLoader", ENUMS.msgTypes.log);
    }
    
    if(require("fs").existsSync(Config.Files.CachedMessageList)) {
        log("CachedMessageList found! Loading CachedMessageList.....", "DataLoader", ENUMS.msgTypes.debug);
        var CachedMessageList = require("fs").readFileSync(Config.Files.CachedMessageList, { encoding: "utf8" })
        if(IsJson(CachedMessageList)) {
            Server.cachedMessages = JSON.parse(CachedMessageList);
            log("Restored cached Messages", "DataLoader", ENUMS.msgTypes.log);
        }
    }
    if(require("fs").existsSync(Config.Files.BanList)) {
        log("BanList found! Loading BanList.....", "DataLoader", ENUMS.msgTypes.debug);
        var BanList = require("fs").readFileSync(Config.Files.BanList, { encoding: "utf8" })
        var BanSplit = BanList.split("\n");
        for(var i = 0; i<BanSplit.length; i++) {
            Server.bannedUsers.push(BanSplit[i]);
        }
        log("Restored " + (BanSplit.length - 1) + " banned Users", "DataLoader", ENUMS.msgTypes.log);
    }
}

function makeid(number)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < number; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function broadcast(s) {
    log("Broadcasting " + s + " to " + Server.sendArray.length + " Users", "Broadcast", ENUMS.msgTypes.debug)
    for(var i = 0; i<Server.sendArray.length;i++) {
        Server.sendArray[i].sendUTF(s);
    }
}

function utf8_encode(argString) {
      // http://kevin.vanzonneveld.net
      // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: sowberry
      // +    tweaked by: Jack
      // +   bugfixed by: Onno Marsman
      // +   improved by: Yves Sucaet
      // +   bugfixed by: Onno Marsman
      // +   bugfixed by: Ulrich
      // +   bugfixed by: Rafal Kukawski
      // +   improved by: kirilloid
      // +   bugfixed by: kirilloid
      // *     example 1: utf8_encode('Kevin van Zonneveld');
      // *     returns 1: 'Kevin van Zonneveld'

      if (argString === null || typeof argString === "undefined") {
        return "";
      }

      var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      var utftext = '',
        start, end, stringl = 0;

      start = end = 0;
      stringl = string.length;
      for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
          end++;
        } else if (c1 > 127 && c1 < 2048) {
          enc = String.fromCharCode(
             (c1 >> 6)        | 192,
            ( c1        & 63) | 128
          );
        } else if (c1 & 0xF800 != 0xD800) {
          enc = String.fromCharCode(
             (c1 >> 12)       | 224,
            ((c1 >> 6)  & 63) | 128,
            ( c1        & 63) | 128
          );
        } else { // surrogate pairs
          if (c1 & 0xFC00 != 0xD800) { throw new RangeError("Unmatched trail surrogate at " + n); }
          var c2 = string.charCodeAt(++n);
          if (c2 & 0xFC00 != 0xDC00) { throw new RangeError("Unmatched lead surrogate at " + (n-1)); }
          c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
          enc = String.fromCharCode(
             (c1 >> 18)       | 240,
            ((c1 >> 12) & 63) | 128,
            ((c1 >> 6)  & 63) | 128,
            ( c1        & 63) | 128
          );
        }
        if (enc !== null) {
          if (end > start) {
            utftext += string.slice(start, end);
          }
          utftext += enc;
          start = end = n + 1;
        }
      }

      if (end > start) {
        utftext += string.slice(start, stringl);
      }

      return utftext;
}

function md5(str) {
  // http://kevin.vanzonneveld.net
  // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // + namespaced by: Michael White (http://getsprink.com)
  // +    tweaked by: Jack
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // -    depends on: utf8_encode
  // *     example 1: md5('Kevin van Zonneveld');
  // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
  var xl;

  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  };

  var _F = function (x, y, z) {
    return (x & y) | ((~x) & z);
  };
  var _G = function (x, y, z) {
    return (x & z) | (y & (~z));
  };
  var _H = function (x, y, z) {
    return (x ^ y ^ z);
  };
  var _I = function (x, y, z) {
    return (y ^ (x | (~z)));
  };

  var _FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = new Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var wordToHexValue = "",
      wordToHexValue_temp = "",
      lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  };

  var x = [],
    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20,
    S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  str = utf8_encode(str);
  x = convertToWordArray(str);
  a = 0x67452301;
  b = 0xEFCDAB89;
  c = 0x98BADCFE;
  d = 0x10325476;

  xl = x.length;
  for (k = 0; k < xl; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

  return temp.toLowerCase();
}

log("Loading PIN and Banned-User Database.....", "Init", ENUMS.msgTypes.log);
loadData();

log("Initializing Interface Modules.... Please be patient", "Init", ENUMS.msgTypes.log);



//
//  Remote Control Server to receive commands via telnet
//
if(Config.RC.Enable) {
    var net = require('net');
    var rcServer = net.createServer(function(c) {
        log('Client ' + c.remoteAddress + ' connected to Remote Control Interface', "RC", ENUMS.msgTypes.log);
        c.w_ip = c.remoteAddress;
        c.failCount = 0;
        c.username = '';
        c.password = '';
        c.loginStep = 0;
        c.lineBuffer = '';
        Server.RCCons.push(c)
        c.on('end', function() {
            var index = Server.RCCons.indexOf(c)
            if (index > -1) {
                Server.RCCons.splice(index, 1);
            }
            log('Client ' + c.w_ip + ' has disconnected from the Remote Control Interface', "RC", ENUMS.msgTypes.log);
        });
        c.on('data', function(data) {
            log(data,"RC",ENUMS.msgTypes.debug);
            if(data.toString() === '\n' || data.toString() === '\r' || data.toString() === '\r\n' || data.toString() === '\n\r') {
                if(c.loginStep === 0) {
                    c.username = c.lineBuffer;
                    log('Client ' + c.remoteAddress + ' entered RC Username ' + c.username, "RC", ENUMS.msgTypes.debug);
                    c.loginStep = 1;
                    c.write('\n\rPassword for ' + c.username + ': ');
                } else if(c.loginStep === 1) {
                    c.password = c.lineBuffer;
                    log('Client ' + c.remoteAddress + ' entered RC Password', "RC", ENUMS.msgTypes.debug);
                    if (c.username.toLowerCase() === Config.RC.username && c.password === Config.RC.password) {
                        c.loginStep = 2;
                        c.write(Config.RC.motd.replace("%u", c.username).replace('%d', getDateString().toLocaleString()) + "\n\r")
                        log('Client ' + c.remoteAddress + ' successfully logged in.', "RC", ENUMS.msgTypes.debug);
                    } else {
                        c.failCount += 1;
                        if(c.failCount === 4) {
                            log('Client ' + c.remoteAddress + ' failed login too often', "RC", ENUMS.msgTypes.debug);
                            c.failCount = 0;
                            c.username = '';
                            c.password = '';
                            c.loginStep = 0;
                            c.end('\n\rLogin failed too many times, disconnecting...', "RC", ENUMS.msgTypes.debug);
                        } else {
                            c.write('\n\rUsername and Password invalid. Please try again.\n\r\n\rUsername: ');
                            log('Client ' + c.remoteAddress + ' used invalid login credentials', "RC", ENUMS.msgTypes.debug);
                            c.loginStep = 0;
                        }
                    }
                } else if(c.loginStep === 2) {
                    log('Client ' + c.remoteAddress + ' entered Command [' + c.lineBuffer + ']', "RC", ENUMS.msgTypes.debug);
                    switch (c.lineBuffer.toLowerCase().split(" ")[0]) {
                        case "cpu":
                            log("CPU Load: " + Server.os.loadavg()[0], "CPU", ENUMS.msgTypes.log);
                            break;
                        case "help":
                            c.write("Commands:\n\rhelp     -   Show all commands\n\rexit     -   Shutdown this Server\n\rsave     -   Save Banlist, Pinlist and Cached Messages to Disk\n\rsavesync -   Save synchronously\n\rban      -   Ban a User from the network - Usage: ban <User> [Message]\n\runban    -   Unban a banned User\n\runbanall -   Unban all Users from the network\n\rsay      -   Send Message to every connected client\n\rkick     -   Kick client from the network - Usage: kick <User> [Message]\n\rlist     -   List all online Users\n\rkickall  -   Kick all Users from the network\n\rreset    -   Completely reset the Server, remove all PINs, Bans and cached Messages\n\rdisconnect   -   Disconnect Telnet client from this server\n\rcpu      -   Show CPU Load\n\r");
                            break;
                        case "exit":
                            c.write("Kicking all Users.....\n\r");
                            Server.acceptConnections = false;
                            kickall("XKit IM Server is shutting down!");
                            setTimeout(function() {
                                if(Config.WebSocket.Enable) {
                                    c.write("Shutting down XKit Instant Messenger Server.....\n\r");
                                    wsServer.shutDown();
                                    server.close();
                                }
                                if(Config.Other.commandEnable) {
                                    c.write("Unmounting command listener.....\n\r");
                                    command.removeAllListeners('data')
                                }
                                if(Config.RC.Enable) {
                                    c.write("Stopping RC Server.....\n\r");
                                    rcServer.close();
                                }
                                c.write("Saving Data.....\n\r");
                                saveData(true);
                                c.write("Goodbye");
                                process.exit(0);
                            }, 5000);
                            break;
                        case "save":
                            c.write("Saving Ban- and Pinlist.....\n\r")
                            saveData();
                            break;
                        case "savesync":
                            c.write("Saving Ban- and Pinlist synchronously.....\n\r");
                            saveData(true);
                            break;
                        case "ban":
                            var index = Server.bannedUsers.indexOf(c.lineBuffer.toLowerCase().split(" ")[1])
                            if(index === -1) {
                                if(c.lineBuffer.toLowerCase().split(" ").length == 2) {
                                    kick(c.lineBuffer.toLowerCase().split(" ")[1], "You have been banned from this Server");
                                } else {
                                    data = "";
                                    for(var i = 2; i<c.lineBuffer.toLowerCase().split(" ").length; i++) {
                                        data = data + c.lineBuffer.split(" ")[i] + " ";
                                    }
                                    kick(c.lineBuffer.toLowerCase().split(" ")[1], data);
                                }
                                Server.bannedUsers.push(c.lineBuffer.toLowerCase().split(" ")[1]);
                                c.write("User " + c.lineBuffer.toLowerCase().split(" ")[1] + " has been banned\n\r")
                                saveData();
                            } else {
                                c.write("User " + c.lineBuffer.toLowerCase().split(" ")[1] + " already banned\n\r");
                            }
                            break;
                        case "unban":
                            var index = Server.bannedUsers.indexOf(c.lineBuffer.toLowerCase().split(" ")[1])
                            if (index > -1) {
                                Server.bannedUsers.splice(index, 1);
                                c.write("User " + c.lineBuffer.toLowerCase().split(" ")[1] + " has been unbanned\n\r");
                                saveData();
                            } else {
                                c.write("User " + c.lineBuffer.toLowerCase().split(" ")[1] + " is not banned\n\r");
                            }
                            break;
                        case "unbanall":
                            Server.bannedUsers = new Array();
                            c.write("All Users unbanned");
                            saveData();
                            break;
                        case "say":
                            c.write("Sending Message to all Users: " + c.lineBuffer.substring(4) + "\n\r");
                            broadcast("XIM_ADMIN_MSG " + c.lineBuffer.substring(4));
                            break;
                        case "kick":
                            if(c.lineBuffer.toLowerCase().split(" ").length == 2) {
                                kick(c.lineBuffer.toLowerCase().split(" ")[1], "You have been kicked from this Server");
                            } else {
                                data = "";
                                for(var i = 2; i<c.lineBuffer.toLowerCase().split(" ").length; i++) {
                                    data = data + c.lineBuffer.split(" ")[i] + " ";
                                }
                                kick(c.lineBuffer.toLowerCase().split(" ")[1], data);
                            }
                            break;
                        case "list":
                            data = Server.onlineUsers.length + " User(s) online: ";
                            for(var i = 0; i<Server.onlineUsers.length; i++) {
                                data = data + Server.onlineUsers[i] + ", ";
                            }
                            data = data.substring(0, data.length - 2);
                            c.write(data + "\n\r");
                            break;
                        case "kickall":
                            data = "";
                            for(var i = 1; i<c.lineBuffer.toLowerCase().split(" ").length; i++) {
                                data = data + c.lineBuffer.split(" ")[i] + " ";
                            }
                            kickall(data);
                            break;
                        case "disconnect":
                            c.end("Disconnected from Server");
                            break;
                        default:
                            c.write("This command was not recognized, please try again or type help for more informstion\n\r")
                    }
                }
                c.lineBuffer = '';
            } else {
                c.lineBuffer += data.toString();
            }
        });
        c.write('Please enter Login Credentials.\n\r');
        c.write('Username: ');
        c.pipe(c);
    });
    rcServer.listen(Config.RC.Port, function() { log('Remote Control is listening on Port ' + Config.RC.Port, "Interfaces", ENUMS.msgTypes.log); });
} else {
    log("RC Module disabled", "Interfaces", ENUMS.msgTypes.log);
}

//
//  Websocket Server for XIM Client to connect to.
//
if(Config.WebSocket.Enable) {
    try {
        var WebSocketServer = require('websocket').server;
    } catch (e) {
        console.log("Websocket not installed! Please run npm install websocket first!");
        process.exit(-1);
    }
    
	if (Config.WebSocket.Secured && Config.WebSocket.SecureMode !== ENUMS.CertificateMode.none) {
	
		var http = require('https');
		var fs = require('fs');
		if (Config.WebSocket.SecureMode === ENUMS.CertificateMode.key_cert) {
			log("Running an Key+Certificate encrypted Websocket Server", "WSServer");
			var options = {
				key: fs.readFileSync(Config.WebSocket.Key),
				cert: fs.readFileSync(Config.WebSocket.Cert)
			};
		} else if (Config.WebSocket.SecureMode === ENUMS.CertificateMode.pfx) {
			log("Running an PFX-File encrypted Websocket Server", "WSServer");
			var options = {
				pfx: fs.readFileSync(Config.WebSocket.PFX)
			};
		}
		var server = http.createServer(options, function(request, response) {
			log('Received request from ' + request.socket.remoteAddress, "HTTPServer", ENUMS.msgTypes.debug);
			response.writeHead(404);
			response.end();
		});
		
	} else {
		log("Running an unencrypted Websocket Server", "WSServer");
		var http = require('http');
		var server = http.createServer(function(request, response) {
			log('Received request from ' + request.socket.remoteAddress, "HTTPServer", ENUMS.msgTypes.debug);
			response.writeHead(404);
			response.end();
		});
	}

    server.listen(Config.WebSocket.Port, function() {
        log('Websocket is listening on port ' + Config.WebSocket.Port + '.', "Interfaces", ENUMS.msgTypes.log);
    });

    wsServer = new WebSocketServer({
        httpServer: server,
        disableNagleAlgorithm: true,
        autoAcceptConnections: true,// because security matters
        maxReceivedMessageSize: "4MiB"
    });
    
    wsServer.on('connect', function(connection) {
        
        //var connection = isAllowedOrigin(request.origin) ? request.accept() : request.reject();
        if (Server.acceptConnections === false) {
            connection.sendUTF("XIM_TOO_MANY");
            connection.close();
            return;
        }
        if (Config.Other.maxConnections > 0 && Server.onlineUsers.length >= Config.Other.maxConnections) {
            connection.sendUTF("XIM_TOO_MANY");
            connection.close();
            return;
        }
        connection.xim_clientVersion = Server.ProtocolVersion;
        connection.xim_username = "";
        connection.xim_pin = "";
        connection.auth = false;
        connection.nonce = makeid(127);
            connection.on('message', function(message) {
            if (message.type === "binary") {
                log("Security error, got binary", "WSServer", ENUMS.msgTypes.error);
                connection.close();
                return;
            }
            var response = '';
            log('Received Message from ' + connection.remoteAddress + ': ' + message.utf8Data, "WSServer", ENUMS.msgTypes.debug);
            var msgData = message.utf8Data.split(" ");
            if (message.type === 'utf8') {
                switch (msgData[0]) {
                    case 'XIM_OPEN':
                        if(Config.Other.maintenanceMessage === '') {
                            connection.xim_clientVersion = parseInt(msgData[1]);
                            if(connection.xim_clientVersion < Server.ProtocolMinimumRequiredVersion) {
                                log("Protocol of Client " + connection.remoteAddress + " too old! (Required Version: " + Server.ProtocolMinimumRequiredVersion + ", Client Version: " + connection.xim_clientVersion + ")", "WSServer", ENUMS.msgTypes.debug);
                                response = 'XIM_UPGRADE ' + Server.ProtocolMinimumRequiredVersion;
                            } else {
                                log("Received XIM_OPEN Package from " + connection.remoteAddress + ". Version of Client: " + connection.xim_clientVersion, "WSServer", ENUMS.msgTypes.debug);
                                response = 'XIM_AUTH ' + connection.nonce;
                            }
                        } else {
                            response = 'XIM_SERVICE_MSG ' + Config.Other.maintenanceMessage;
                        }
                        break;
                    case 'XIM_AUTH':
                        log("Received XIM_AUTH Package from " + connection.remoteAddress + ".", "WSServer", ENUMS.msgTypes.debug);
                        var data = msgData[1].split(";");
                        if(Server.bannedUsers.indexOf(data[0]) === -1) {
                            if(!(data[0] in Server.registeredUsers)) {
                                connection.xim_username = data[0];
                                log("Client " + connection.remoteAddress + " wants to log in as " + connection.xim_username + " but no PIN has been set", "WSServer", ENUMS.msgTypes.debug);
                                response = 'XIM_SET_PIN';
                            } else {
                                connection.xim_username = data[0];
                                connection.xim_pin = data[1];
                                if(Server.onlineUsers.indexOf(data[0]) === -1) {
                                    if(connection.xim_pin === md5(connection.nonce + connection.xim_username + md5(Server.registeredUsers[connection.xim_username]) + "xenixlet")) {
                                        log("Client " + connection.remoteAddress + " logged in as " + connection.xim_username, "XIMConnection", ENUMS.msgTypes.debug);
                                        response = "XIM_AUTH_STATUS 1";
                                        connection.auth = true;
                                        Server.onlineUsers.push(data[0]);
                                    } else {
                                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + ") sent wrong PIN Hash for User " + connection.xim_username, "WSServer", ENUMS.msgTypes.debug);
                                        response = 'XIM_AUTH_STATUS 0';
                                    }
                                } else {
                                    log("Client " + connection.remoteAddress + " tried to log into account " + connection.xim_username + ", which is already in use", "WSServer", ENUMS.msgTypes.debug);
                                    response = 'XIM_ONE_TAB_PLEASE';
                                }
                            }
                        } else {
                            log("Client " + connection.remoteAddress + " wants to log in as " + connection.xim_username + " but User is banned.", "WSServer", ENUMS.msgTypes.log);
                            response = 'XIM_BANNED';
                        }
                        break;
                    case 'XIM_SETP':
                        var data = msgData[1].split(";");
                        if(!(data[0] in Server.registeredUsers)) {
                            connection.xim_username = data[0];
                            log("Client " + connection.remoteAddress + " set PIN of User " + connection.xim_username + " to " + data[1], "WSServer", ENUMS.msgTypes.debug);
                            Server.registeredUsers[connection.xim_username] = data[1];
                            response = "XIM_PIN_SET_OK";
                            saveData();
                        } else {
                            connection.xim_username = data[0];
                            log("Client " + connection.remoteAddress + " set PIN of User " + connection.xim_username + " to " + data[1] + " but PIN is already set.", "WSServer", ENUMS.msgTypes.debug);
                            response = "XIM_PIN_ALREADY_SET";
                        }
                        break;
                    case 'XIM_BUDDIES':
                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + ") asks for Buddylist", "WSServer", ENUMS.msgTypes.debug);
                        var data = msgData[1].split(";");
                        response = 'XIM_BUDDY_LIST';
                        for(var i = 0; i<data.length;i++) {
                            if(Server.onlineUsers.indexOf(data[i]) != -1) {
                                response += "\n" + data[i] + ";1"
                            } else {
                                response += "\n" + data[i] + ";0"
                            }
                        }
                        broadcast("XIM_STATUS " + connection.xim_username + "\n1");
                        Server.sendArray.push(connection);
                        setTimeout(function () {
                            if(connection.xim_username in Server.cachedMessages) {
                                log("Undelivered Messages for Client " + connection.remoteAddress + " (" + connection.xim_username + ")! Delivering " + Server.cachedMessages[connection.xim_username].length + " messages!", "MsgCache", ENUMS.msgTypes.debug);
                                for(var i = 0; i<Server.cachedMessages[connection.xim_username].length; i++) {
                                    connection.sendUTF(Server.cachedMessages[connection.xim_username][i]);
                                }
                                delete Server.cachedMessages[connection.xim_username];
                                saveData();
                            }
                        }, 1000);
                        break;
                    case 'XIM_CHECK':
                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + ") asks for Status of User " + msgData[1], "WSServer", ENUMS.msgTypes.debug);
                        response = "XIM_STATUS " + msgData[1];
                        if(Server.onlineUsers.indexOf(msgData[1]) != -1) {
                            response += "\n1"
                        } else {
                            response += "\n0"
                        }
                        break;
                    case 'XIM_CLOSE':
                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + ") wants to terminate connection to network", "WSServer", ENUMS.msgTypes.debug);
                        break;
                    case "XIM_SEND":
                        data = message.utf8Data.substring(9).split("\n");
                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + ") to " + data[0] + ": " + data[1], "WSServer", ENUMS.msgTypes.debug);
                        for(var i = 0; i<Server.sendArray.length;i++) {
                            if(Server.sendArray[i].xim_username === data[0]) {
                                log("User " + data[0] + " online! Message delivered!", "WSServer", ENUMS.msgTypes.debug);
                                Server.sendArray[i].sendUTF("XIM_MSG " + connection.xim_username + "\n" + data[1]);
                                response = "XIM_MSG_STATUS " + data[0] + "\n" + "1" + "\n" + data[1] + "\n" + connection.xim_username;
                                break;
                            } else {
                                if(data[0] in Server.registeredUsers) {
                                    log("User " + data[0] + " offline! Caching message!", "WSServer", ENUMS.msgTypes.debug);
                                    response = "XIM_MSG_STATUS " + data[0] + "\n" + "2" + "\n" + data[1] + "\n" + connection.xim_username;
                                    if(!(data[0] in Server.cachedMessages)) {
                                        Server.cachedMessages[data[0]] = new Array();
                                    }
                                    Server.cachedMessages[data[0]].push("XIM_MSG " + connection.xim_username + "\n" + data[1]);
                                    saveData();
                                } else {
                                    log("User not registered on this server", "WSServer", ENUMS.msgTypes.debug);
                                    response = "XIM_MSG_STATUS " + data[0] + "\n" + "0" + "\n" + data[1] + "\n" + connection.xim_username;
                                }
                            }
                        }
                        break;
                    case "XIM_PHOTO":
                        data = msgData[1].split("\n");
                        for(var i = 0; i<Server.sendArray.length;i++) {
                            if(Server.sendArray[i].xim_username === data[0]) {
                                Server.sendArray[i].sendUTF(message.utf8Data);
                                response = "XIM_MSG_STATUS " + data[0] + "\n" + "1" + "\n" + data[1] + "\n" + connection.xim_username;
                                break;
                            }
                        }
                        break;
                    default:
                        log("Client " + connection.remoteAddress + " (" + connection.xim_username + "): Unknown Protocol Message: " + message.utf8Data, "WSServer", ENUMS.msgTypes.log);
                        response = "XIM_PROTOCOL_ERROR";
                }
              connection.sendUTF(response);
          }
        });
        connection.on('close', function(reasonCode, description) {
            log(connection.remoteAddress + ' has been disconnected. Removing from online User List', "WSServer", ENUMS.msgTypes.debug);
            var index = Server.onlineUsers.indexOf(connection.xim_username)
            if (index > -1) {
                Server.onlineUsers.splice(index, 1);
            }
            var index2 = Server.sendArray.indexOf(connection)
            if (index2 > -1) {
                Server.sendArray.splice(index2, 1);
            }
            broadcast("XIM_STATUS " + connection.xim_username + "\n0");
        });
    });
} else {
    log("WebSocket Module disabled", "Interfaces", ENUMS.msgTypes.log);
}


//
//  stdin Listener to receive commands on runtime
//
if(Config.Other.stdinEnable) {
    var stdin = process.openStdin();


    var clearDataMode = 0;
    var clearCode = "";
    var stdinLocked = false;
    stdin.addListener("data", function(d) {
        if(!(stdinLocked)) {
            if(clearDataMode === 0) {
                log("Entered console command: [" + d.toString().substring(0, d.length-1) + "]", "stdin", ENUMS.msgTypes.debug);
                switch (d.toString().substring(0, d.length-1).toLowerCase().split(" ")[0]) {
                    case "cpu":
                        log("CPU Load: " + Server.os.loadavg()[0], "CPU", ENUMS.msgTypes.log);
                        break;
                    case "help":
                        log("Commands:\n\rhelp     -   Show all commands\n\rexit     -   Shutdown this Server\n\rsave     -   Save Banlist, Pinlist and Cached Messages to Disk\n\rsavesync -   Save synchronously\n\rban      -   Ban a User from the network - Usage: ban <User> [Message]\n\runban    -   Unban a banned User\n\runbanall -   Unban all Users from the network\n\rsay      -   Send Message to every connected client\n\rkick     -   Kick client from the network - Usage: kick <User> [Message]\n\rlist     -   List all online Users\n\rkickall  -   Kick all Users from the network\n\rreset    -   Completely reset the Server, remove all PINs, Bans and cached Messages\n\rcpu      -   Show CPU Load\n\r", "stdin", ENUMS.msgTypes.log, true);
                        
                        break;
                    case "exit":
                        stdinLocked = true;
                        log("Kicking all Users.....", "stdin", ENUMS.msgTypes.debug);
                        Server.acceptConnections = false;
                        kickall("XKit IM Server is shutting down!");
                        setTimeout(function() {
                            if(Config.WebSocket.Enable) {
                                log("Shutting down XKit Instant Messenger Server.....", "stdin", ENUMS.msgTypes.log, true);
                                wsServer.shutDown();
                                server.close();
                            }
                            if(Config.Other.stdinEnable) {
                                log("Unmounting stdin listener.....", "stdin", ENUMS.msgTypes.log, true);
                                stdin.removeAllListeners('data')
                            }
                            if(Config.RC.Enable) {
                                log("Stopping RC Server.....", "stdin", ENUMS.msgTypes.log, true);
                                rcServer.close();
                            }
                            log("Saving Data.....", "stdin", ENUMS.msgTypes.log, true);
                            saveData(true);
                            log("Goodbye", "stdin", ENUMS.msgTypes.log, true);
                            process.exit(0);
                        }, 5000);
                        break;
                    case "save":
                        log("Saving Ban- and Pinlist.....", "stdin", ENUMS.msgTypes.log, true)
                        saveData();
                        break;
                    case "savesync":
                        log("Saving Ban- and Pinlist synchronously.....", "stdin", ENUMS.msgTypes.log, true);
                        saveData(true);
                        break;
                    case "ban":
                        var index = Server.bannedUsers.indexOf(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1])
                        if(index === -1) {
                            if(d.toString().substring(0, d.length-1).toLowerCase().split(" ").length == 2) {
                                kick(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1], "You have been banned from this Server");
                            } else {
                                data = "";
                                for(var i = 2; i<d.toString().substring(0, d.length-1).toLowerCase().split(" ").length; i++) {
                                    data = data + d.toString().substring(0, d.length-1).split(" ")[i] + " ";
                                }
                                kick(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1], data);
                            }
                            Server.bannedUsers.push(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1]);
                            log("User " + d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1] + " has been banned", "stdin", ENUMS.msgTypes.log, true)
                            saveData();
                        } else {
                            log("User " + d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1] + " already banned", "stdin", ENUMS.msgTypes.log, true);
                        }
                        break;
                    case "unban":
                        var index = Server.bannedUsers.indexOf(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1])
                        if (index > -1) {
                            Server.bannedUsers.splice(index, 1);
                            log("User " + d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1] + " has been unbanned", "stdin", ENUMS.msgTypes.log, true);
                            saveData();
                        } else {
                            log("User " + d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1] + " is not banned", "stdin", ENUMS.msgTypes.log, true);
                        }
                        break;
                    case "unbanall":
                        Server.bannedUsers = new Array();
                        log("All Users unbanned", "stdin", ENUMS.msgTypes.log, true);
                        saveData();
                        break;
                    case "say":
                        log("Sending Message to all Users: " + d.toString().substring(4, d.length-1), "stdin", ENUMS.msgTypes.log, true);
                        broadcast("XIM_ADMIN_MSG " + d.toString().substring(4, d.length-1));
                        break;
                    case "kick":
                        if(d.toString().substring(0, d.length-1).toLowerCase().split(" ").length == 2) {
                            kick(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1], "You have been kicked from this Server");
                        } else {
                            data = "";
                            for(var i = 2; i<d.toString().substring(0, d.length-1).toLowerCase().split(" ").length; i++) {
                                data = data + d.toString().substring(0, d.length-1).split(" ")[i] + " ";
                            }
                            kick(d.toString().substring(0, d.length-1).toLowerCase().split(" ")[1], data);
                        }
                        break;
                    case "list":
                        data = Server.onlineUsers.length + " User(s) online: ";
                        for(var i = 0; i<Server.onlineUsers.length; i++) {
                            data = data + Server.onlineUsers[i] + ", ";
                        }
                        data = data.substring(0, data.length - 2);
                        log(data, "stdin", ENUMS.msgTypes.log, true);
                        break;
                    case "kickall":
                        data = "";
                        for(var i = 1; i<d.toString().substring(0, d.length-1).toLowerCase().split(" ").length; i++) {
                            data = data + d.toString().substring(0, d.length-1).split(" ")[i] + " ";
                        }
                        kickall(data);
                        break;
                    case "reset":
                        log("You are about to delete all data and reset the Server! Do you really want to do this?\n(y/n)", "stdin", ENUMS.msgTypes.log, true)
                        clearDataMode = 1;
                        break;
                    default:
                        log("This command was not recognized, please try again or type help for more informstion", "stdin", ENUMS.msgTypes.log, true)
                }        
            } else if (clearDataMode === 1) {
                if(d.toString().substring(0, d.length-1).toLowerCase() == "y" || d.toString().substring(0, d.length-1).toLowerCase() == "yes") {
                    clearCode = makeid(10);
                    log("Exit with wrong input or continue by entering the following code: " + clearCode, "stdin", ENUMS.msgTypes.log, true)
                    clearDataMode = 2;
                } else {
                    log("Data Reset has been cancelled", "stdin", ENUMS.msgTypes.log, true);
                    clearCode = "";
                    clearDataMode = 0;
                }
            } else if (clearDataMode === 2) {
                if(d.toString().substring(0, d.length-1) == clearCode) {
                    log("Resetting Data, please wait.", "stdin", ENUMS.msgTypes.log, true);
                    kickall("The Server is going to be reset.");
                    Server.bannedUsers = new Array();
                    Server.registeredUsers = new Object();
                    Server.cachedMessages = new Object();
                    setTimeout(function() {saveData(true);}, 2000);
                    log("Data has been reset", "stdin", ENUMS.msgTypes.log, true);
                    clearCode = "";
                    clearDataMode = 0;
                } else {
                    log("Data Reset has been cancelled", "stdin", ENUMS.msgTypes.log, true);
                    clearCode = "";
                    clearDataMode = 0;
                }
            }
        }
    });
    log("stdin Interface running", "Interfaces", ENUMS.msgTypes.log);
} else {
    log("stdin Module disabled", "Interfaces", ENUMS.msgTypes.log);
}


if(Config.CPUControl.enabled) {
    log("Enabling CPU Load Controller", "Init", ENUMS.msgTypes.log);
    setInterval(function() {
            var loads = Server.os.loadavg();
            log("CPU Load: " + loads[0], "CPU", ENUMS.msgTypes.debug);
            if (loads[0] >= 90) {
                    // Too much CPU usage!
                    log("Too much CPU usage! Blocking new connections", "CPU", ENUMS.msgTypes.warning);
                    if(Config.CPUControl.acceptConnectionBasedOnCPULoad) {
                        Server.acceptConnections = false;
                    }
            } else {
                if(Config.CPUControl.acceptConnectionBasedOnCPULoad && !Server.acceptConnections) {
                    log("CPU usage free! Allowing incoming connections", "CPU", ENUMS.msgTypes.warning);
                    Server.acceptConnections = true;
                }
            }
    }, Config.CPUControl.interval);
    log("CPU Load Controller enabled. Interval: " + Config.CPUControl.interval / 1000 + "s. Disable connections if load is too high: " + Config.CPUControl.acceptConnectionBasedOnCPULoad + ".", "CPU", ENUMS.msgTypes.log);
}

if (Config.Autosave.enabled) {
    log("Enabling Autosave", "Init", ENUMS.msgTypes.log);
    setInterval(function() {
        log("Saving Data......", "Autosave", ENUMS.msgTypes.log);
        saveData(Config.Autosave.saveSync);
    }, Config.Autosave.interval);
    log("Autosave enabled. Interval: " + Config.Autosave.interval / 1000 + "s. Sync: " + Config.Autosave.saveSync + ".", "Autosave", ENUMS.msgTypes.log);
}
