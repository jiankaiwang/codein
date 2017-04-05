/*
 * plat : typescript 1.8.9
 */
/*
 * impl : tsc network.ts
 * desc : a class implementing IPv4 network addresses
 * inpt :
 * |- IPaddr : e.g. xxx.xxx.xxx.xxx
 * |- mask : e.g. 255.255.255.0
 * e.g. :
 * |- var net = new RangeOfIPv4Addr("192.168.99.100","255.255.255.0",true);
 * |- net.showAvailIPv4Addr();  // 254
 * |- net.showNetworkType();  // "Class C"
 * |- net.showWildcard("decstr");  // "0.0.0.255"
 * |- net.showWildcard("");  // [0, 0, 0, 255]
 * |- net.showIPv4AvailList();  // Object {0: Object, 1: Object, 2: Object, 3: {start : 0, end : 255}}
 * |- net.showAllIPAddress();  // Object {status: 0, info: "Show all available IPv4 addresses.", data: Array[254]}
 */
var RangeOfIPv4Addr = (function () {
    function RangeOfIPv4Addr(getIPv4Addr, getMask, getSubsetEnabled) {
        // assignment
        this.IPv4Addr = getIPv4Addr;
        this.mask = getMask;
        this.subsetEnabled = getSubsetEnabled;
        // initial
        this.IPAvailList = {};
        this.retnMsg = {};
        this.retnMsg["status"] = 0;
        this.retnMsg["info"] = "Initialization";
        this.retnMsg["data"] = {};
        // config
        if (this.checkIPv4Mask()) {
            this.IPv4Num();
            this.eachIPv4Range();
        }
    }
    // returned messages
    RangeOfIPv4Addr.prototype.setRetMsg = function (getStatus, getInfo, getData) {
        this.retnMsg["status"] = getStatus;
        this.retnMsg["info"] = getInfo;
        this.retnMsg["data"] = getData;
    };
    // pre-checked input data
    RangeOfIPv4Addr.prototype.checkIPv4Mask = function () {
        this.IPv4Comp = this.IPv4Addr.split('.');
        this.MaskComp = this.mask.split('.');
        if ((this.IPv4Comp.length != 4) || (this.IPv4Comp.length != this.MaskComp.length)) {
            this.setRetMsg(1, "IPv4 or mask is not correct.", "");
            return false;
        }
        if ([true, false].indexOf(this.subsetEnabled) < 0) {
            this.setRetMsg(1, "Subset enabled flag is not correct.", "");
            return false;
        }
        return true;
    };
    // fixed binary number string length to 8 bit
    RangeOfIPv4Addr.prototype.fixed8bitLength = function (get2BitStr) {
        var fixedStr = get2BitStr;
        for (var i = get2BitStr.length; i < 8; i++) {
            fixedStr = '0' + fixedStr;
        }
        return fixedStr;
    };
    // get total unmask bit number
    RangeOfIPv4Addr.prototype.countUnmaskedBit = function (num1, num2) {
        var objNum = 0;
        this.fixed8bitLength((num1 & num2).toString(2)).split('').forEach(function (ele) {
            if (Number(ele) == 0) {
                objNum += 1;
            }
        });
        return objNum;
    };
    // calculate available IPv4 addresses
    RangeOfIPv4Addr.prototype.IPv4Num = function () {
        var totalIPv4AddrBitNum = 0;
        for (var i = 0; i < this.IPv4Comp.length; i++) {
            totalIPv4AddrBitNum += this.countUnmaskedBit(255, this.MaskComp[i]);
        }
        // whether to preserve both all zero and all one subset
        if (this.subsetEnabled) {
            this.IPv4Len = Math.pow(2, totalIPv4AddrBitNum) - 2;
        }
        else {
            this.IPv4Len = Math.pow(2, totalIPv4AddrBitNum);
        }
    };
    // show all available IPv4 addresses
    RangeOfIPv4Addr.prototype.showAvailIPv4Addr = function () {
        return this.IPv4Len;
    };
    // show network class
    RangeOfIPv4Addr.prototype.showNetworkType = function () {
        var rawClassIP = this.fixed8bitLength(Number(this.IPv4Comp[0]).toString(2)).split('');
        if (rawClassIP[0] == "0") {
            return "Class A";
        }
        else if (rawClassIP[0] + rawClassIP[1] == "10") {
            return "Class B";
        }
        else if (rawClassIP[0] + rawClassIP[1] + rawClassIP[2] == "110") {
            return "Class C";
        }
        else if (rawClassIP[0] + rawClassIP[1] + rawClassIP[2] + rawClassIP[3] == "1110") {
            return "Class D";
        }
        else if (rawClassIP[0] + rawClassIP[1] + rawClassIP[2] + rawClassIP[3] + rawClassIP[4] == "11110") {
            return "Class E";
        }
        else {
            return "Undefined Class";
        }
    };
    // calculate wild card
    // solve different returning type by giving an explicit type, "string | number[]"
    RangeOfIPv4Addr.prototype.showWildcard = function (showType) {
        var wcd = [];
        var tmp8bit;
        for (var i = 0; i < this.MaskComp.length; i++) {
            tmp8bit = parseInt(Number(255 & Number(this.MaskComp[i])).toString(2), 2);
            wcd.push(parseInt((Number(tmp8bit) ^ 255).toString(2), 2));
        }
        switch (showType) {
            case "decstr":
                return wcd.join('.');
            default:
                return wcd;
        }
    };
    // calculate beginning : ending number of each sections of IPv4
    RangeOfIPv4Addr.prototype.eachIPv4Range = function () {
        var getWcd = this.showWildcard("default");
        var start;
        var end;
        for (var i = 0; i < this.IPv4Comp.length; i++) {
            start = Number(this.IPv4Comp[i]) & Number(this.MaskComp[i]);
            end = start + getWcd[i];
            this.IPAvailList[i] = { "start": start, "end": end };
        }
    };
    // show beginning : ending number of each sections of IPv4
    RangeOfIPv4Addr.prototype.showIPv4AvailList = function () {
        this.eachIPv4Range();
        return this.IPAvailList;
    };
    // prepare a object showing beginning and ending index of IPv4
    RangeOfIPv4Addr.prototype.concatRangeOfIPv4 = function () {
        var IPv4Range = { "start": "", "end": "" };
        for (var i = 0; i < 4; i++) {
            if (i != 0) {
                IPv4Range["start"] += '.';
                IPv4Range["end"] += '.';
            }
            if (i == 3 && this.subsetEnabled) {
                IPv4Range["start"] += this.IPAvailList[i]["start"] + 1;
                IPv4Range["end"] += this.IPAvailList[i]["end"] - 1;
            }
            else {
                IPv4Range["start"] += this.IPAvailList[i]["start"];
                IPv4Range["end"] += this.IPAvailList[i]["end"];
            }
        }
        return IPv4Range;
    };
    // concat each IPv4 parts
    RangeOfIPv4Addr.prototype.concatEachIPSection = function (p1, p2, p3, p4) {
        return p1 + "." + p2 + "." + p3 + "." + p4;
    };
    // find all IPv4 addresses
    RangeOfIPv4Addr.prototype.listAllIPAddr = function () {
        var allIPList = [];
        for (var i = this.IPAvailList[0]["start"]; i <= this.IPAvailList[0]["end"]; i++) {
            for (var j = this.IPAvailList[1]["start"]; j <= this.IPAvailList[1]["end"]; j++) {
                for (var k = this.IPAvailList[2]["start"]; k <= this.IPAvailList[2]["end"]; k++) {
                    for (var m = this.IPAvailList[3]["start"]; m <= this.IPAvailList[3]["end"]; m++) {
                        if (this.subsetEnabled && (m == 0 || m == 255)) {
                            continue;
                        }
                        allIPList.push(this.concatEachIPSection(i, j, k, m));
                    }
                }
            }
        }
        return allIPList;
    };
    // show all available IPv4 addresses
    RangeOfIPv4Addr.prototype.showAllIPAddress = function () {
        if (this.IPv4Len > 512) {
            // show a range of available IPv4 address list
            this.setRetMsg(0, "Show the available IPv4 range.", this.concatRangeOfIPv4());
        }
        else {
            // show all available IPv4 address
            // transform each sections in Mask address
            this.setRetMsg(0, "Show all available IPv4 addresses.", this.listAllIPAddr());
        }
        return this.retnMsg;
    };
    return RangeOfIPv4Addr;
}());
