var scriptUrls = [
    '/socket.io/socket.io.js',
    '/jquery.js',
    '/jquery.svg.js',
    '/eeprom-web.js',
    '/slidy.js',                    // http://www.w3.org/Talks/Tools/Slidy2/scripts/slidy.js
    '/autoadvance.js'
];

// based loosely on http://stackoverflow.com/questions/950087/include-javascript-file-inside-javascript-file
for(url in scriptUrls) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrls[url];
    head.appendChild(script);
}

// Todo: These 4 should come from bonescript as well
var gpio0 = 0;
var gpio1 = gpio0+32;
var gpio2 = gpio1+32;
var gpio3 = gpio2+32;

// Placeholder to get filled in from bonescript via socket.io
bone =
{
    P8_1: { name: "DGND" },
    P8_2: { name: "DGND" },
};

function printPin(pinname) {
    $("#" + pinname).css("background-color", "#000000");
}

function clearPin(pinname) {
    $("#" + pinname).css("background-color", "#EAF2D3");
}

// based loosely on https://github.com/itchyny/browsershell/blob/master/main.js
var init = function() {
    try {
        $, io;
        var socket = new io.connect('');
        var $result = $('#result');
        var $textarea = $('textarea').focus();
        var view = function(s) {
            $textarea.val($textarea.val() + s);
            $textarea.scrollTop($textarea[0].scrollHeight);
            $textarea[0].selectionStart = $textarea[0].textLength;
        };
        var state = 'disconnected';
        socket.on('connect', function() {
            state = 'connected';
            view('connected\n');
        });
        socket.on('disconnect', function(m) {
            view('disconnected\n');
            init();
        });
        socket.on('shell', function(m) {
            view(m + '\n');
        });
        $textarea.keydown(function(e) {
            if(e.keyCode === 13) {
                var $textarea = $(this);
                if($textarea[0].selectionStart != $textarea[0].textLength) {
                    e.preventDefault();
                    $textarea.val($textarea.val() + '\n');
                    $textarea[0].selectionStart = $textarea[0].textLength;
                }
                setTimeout(function () {
                    var c = $textarea.val().split('\n').slice(-2)[0];
                    if(c.replace(/( |\n)+/g, '') === '') {
                        view('\n');
                    } else if(c.replace(/( |\n)+/g, '') === 'clear') {
                        $textarea.val('');
                        view('\n');
                    } else if(c.replace(/( |\n)+/g, '') === 'connect') {
                        init();
                    } else {
                        socket.emit('shell', c);
                    }
                }, 20);
            } else {
                $textarea.scrollTop($textarea[0].scrollHeight);
            }
        });

        //setup handler for receiving the strict with all the expansion pins from the server
        socket.on('muxstruct', function (data) {
            bone = data;
            for(var pinname in bone) {
                $("#" + pinname + "_name").html(bone[pinname].name);
                if (bone[pinname].mux) {
                    socket.emit("listMux", pinname, function(muxReadout, pinname) {
                        // The format read from debugfs looks like this:
                        // name: mcasp0_axr0.spi1_d1 (0x44e10998/0x998 = 0x0023), b NA, t NA
                        // mode: OMAP_PIN_OUTPUT | OMAP_MUX_MODE3
                        // signals: mcasp0_axr0 | ehrpwm0_tripzone | NA | spi1_d1 | mmc2_sdcd_mux1 | NA | NA | gpio3_16
                        if (muxReadout != "0") {
                            muxBreakdown = muxReadout.split("\n");
                            // The muxmode number, '3' in the above example
                            pinMode = muxBreakdown[1].split("|")[1].substr(-1);

                            muxSelect = "<select style='width: 10em'>\n";
                            for (muxOption in muxBreakdown[2].split("|")) {
                                pinFunction = muxBreakdown[2].split("|")[muxOption].replace('signals:', '');
                                // Select the signal the pin is currently muxed to
                                if (muxOption == pinMode) {
                                    muxSelected = "selected=true";
                                }
                                else {
                                    muxSelected = "";
                                }
                                muxSelect += "<option " + muxSelected + ">" + muxOption + ": " + pinFunction + "</option>";
                            }
                            muxSelect += "</select>\n";

                            $("#" + pinname + "_name").html(muxSelect);
                            //console.log(pinname + ": " + pinMode);
                        }
                    });
                }
            }
        });

        $("#i2c1").hover(
            function () {
                printPin("P9_17");
                printPin("P9_18");
            },
            function () {
                clearPin("P9_17");
                clearPin("P9_18");
            }
        );

        $("#i2c2").hover(
            function () {
                printPin("P9_19");
                printPin("P9_20");
            },
            function () {
                clearPin("P9_19");
                clearPin("P9_20");
            }
        );

        $("#spi1").hover(
            function () {
                printPin("P9_28");
                printPin("P9_29");
                printPin("P9_30");
            },
            function () {
                clearPin("P9_28");
                clearPin("P9_29");
                clearPin("P9_30");
            }
        );

    } catch(ex) {
        setTimeout(init, 100);
    }
};

$(document).ready(function() {
    init();
};

