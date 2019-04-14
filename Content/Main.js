$(function () {
    var bounds = new L.LatLngBounds(new L.LatLng(-49.875, 34.25), new L.LatLng(-206, 221));

    var map = L.map('MapContainer', {
        crs: L.CRS.Simple,
        attributionControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
    }).setView([0, 0], 2);

    var layer = L.tileLayer('Content/Map/{z}_{x}_{y}.png', {
        attribution: '&copy; David',
        minZoom: 2,
        maxZoom: 7,
        noWrap: true,
        bounds: bounds
    }).addTo(map);


    var markerStyle = {};
    var visibleMarker = {};
    var css = "";
    var typeChinese = {
        "quest": "任务",
        "miniboss": "头目",
        "treasure": "宝箱",
        "shrine": "神庙",
        "stable": "马宿",
        "tower": "塔",
        "town": "城镇",
        "great-fairy-fountain": "大精灵",
        "korok-seed": "种子",
        "memory": "记忆",
    }
    var listContainer = $("#TypeSwitch ul");
    $("<li>").attr("data-type", "all").text("全部").appendTo(listContainer);
    $("<li>").attr("data-type", "none").text("无").appendTo(listContainer);
    $.each(MarkerCatalog, function () {
        var name = this.name;
        $("<li>").text(typeChinese[name] || name).appendTo(listContainer).addClass("title");
        $.each(this.children, function () {
            var name = this.name;
            $("<li>").attr("data-type", this.id).text(typeChinese[name] || name).appendTo(listContainer).addClass("icon-" + this.img);
            markerStyle[this.id] = this.img;
            visibleMarker[this.id] = false;
            css += '.icon-' + this.img + ', .icon-' + this.img + ':after {background-color:' + this.color + ';}';
        });
    });
    $("<style>").text(css).insertBefore($("head").find("*")[0]);

    $("#TypeSwitch li").click(function () {
        if ($(this).attr("data-type")) toggleVisible($(this).attr("data-type"));
    });

    function toggleVisible(type) {
        if (type === "all" || type === "none") {
            for (var o in visibleMarker) {
                if (visibleMarker.hasOwnProperty(o)) {
                    visibleMarker[o] = (type === "all" ? true : false);
                }
            }
        } else {
            if (event.ctrlKey) {
                if (visibleMarker[type]) {
                    visibleMarker[type] = false;
                } else {
                    visibleMarker[type] = true;
                }
            } else {
                for (var p in visibleMarker) {
                    if (visibleMarker.hasOwnProperty(p)) {
                        visibleMarker[p] = false;
                    }
                }
                visibleMarker[type] = true;
            }
        }
        refreshFilter();
        refreshMarker("filter");
    }

    function refreshFilter() {
        var allVisible = true;
        var allHidden = true;
        for (var o in visibleMarker) {
            if (visibleMarker.hasOwnProperty(o)) {
                if (!visibleMarker[o]) {
                    allVisible = false;
                } else {
                    allHidden = false;
                }
            }
        }
        $("#TypeSwitch li").removeClass("current");
        if (allVisible) {
            $("#TypeSwitch li[data-type=all]").addClass("current");
        } else if (allHidden) {
            $("#TypeSwitch li[data-type=none]").addClass("current");
        } else {
            for (var p in visibleMarker) {
                if (visibleMarker.hasOwnProperty(p)) {
                    if (visibleMarker[p]) {
                        $("#TypeSwitch li[data-type='" + p + "']").addClass("current");
                    }
                }
            }
        }
    }

    var cacheMarker = [];
    function refreshMarker(from) {
        $.each(cacheMarker, function () {
            this.remove();
        });
        cacheMarker = [];

        $.each(MarkerData, function () {
            var visible = false;
            if (from === "filter" && visibleMarker[this.markerCategoryId]) visible = true;
            if (from === "search") {
                var keyword = $("#KeyWords").val();
                if (this.name.toLowerCase().replace(/^\s+|\s+$/g, "").indexOf(keyword.toLowerCase().replace(/^\s+|\s+$/, "")) !== -1) visible = true;
                if (this.description.toLowerCase().replace(/^\s+|\s+$/g, "").indexOf(keyword.toLowerCase().replace(/^\s+|\s+$/, "")) !== -1) visible = true;
            }
            if (visible) {
                var key = this.markerCategoryId + "-" + this.id + "-" + this.name.replace(/[^A-Z]/gi, "-");
                var popupHtml = '<div class="popupContainer">';
                popupHtml += '<strong class="name">' + this.name + '</strong>';
                popupHtml += '<div class="buttonContainer">';
                popupHtml += '<span class="markButton" onclick="MarkPoint(this)" data-key="' + key + '">标记</span>';
                popupHtml += '<a class="markButton" target="_blank" href="http://www.ign.com/search?q=' + encodeURIComponent(this.name) + '">IGN</a>';
                popupHtml += '<a class="markButton" target="_blank" href="http://www.polygon.com/search?q=' + encodeURIComponent(this.name) + '">Polygon</a>';
                popupHtml += '<a class="markButton" target="_blank" href="https://c.gufen.ga/#q=' + encodeURIComponent(this.name) + '">Google</a>';
                popupHtml += '<a class="markButton" target="_blank" href="http://www.baidu.com/baidu?word=' + encodeURIComponent(this.name) + '">百度</a>';
                popupHtml += '</div>';

                if (this.markerCategoryId === "1925") {
                    if (ShrinesToJapanese[this.name]) {
                        var jName = ShrinesToJapanese[this.name];
                        popupHtml += '<strong class="name">' + jName + '</strong>';
                        popupHtml += '<div class="buttonContainer">';
                        popupHtml += '<a class="markButton" target="_blank" href="https://zelda-bow.gamepedia.jp/?s=' + jName + '">GamePedia</a>';
                        popupHtml += '<a class="markButton" target="_blank" href="http://wiki2.h1g.jp/zelda_bow/index.php?' + jName + '">H1G</a>';
                        popupHtml += '<a class="markButton" target="_blank" href="https://c.gufen.ga/#q=' + jName + '">Google</a>';
                        popupHtml += '<a class="markButton" target="_blank" href="http://www.baidu.com/baidu?word=' + jName + '">百度</a>';
                        popupHtml += '</div>';
                    } else {
                        console.log("no find shrine janpanese: " + this.name);
                    }
                }

                popupHtml += '</div>';

                var className = "mark-" + key;
                if (localStorage.getItem(key)) {
                    className += " marked";
                }
                className += " markIcon";
                className += " icon-" + markerStyle[this.markerCategoryId];

                var marker = L.marker([this.y, this.x], {
                    title: this.name,
                    icon: L.divIcon({
                        className: className,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                        popupAnchor: [0, -10],
                    })
                }).addTo(map).bindPopup(popupHtml);
                cacheMarker.push(marker);
            }
        });
    }

    toggleVisible("1925");

    var lastKeyworld = "";
    setInterval(function () {
        var newKeyword = $("#KeyWords").val();
        if (newKeyword !== lastKeyworld) {
            if (newKeyword) {
                lastKeyworld = newKeyword;
                refreshMarker("search");
            } else {
                refreshMarker("filter");
            }
        }
    }, 500);
    $("#ClearKeyword").click(function () {
        $("#KeyWords").val("");
    });

});

function MarkPoint(element) {
    var that = $(element);
    var key = that.attr("data-key");

    var oldValue = localStorage.getItem(key);
    var newValue = !oldValue;
    localStorage.setItem(key, newValue ? "1" : "");

    $('#MapContainer .leaflet-marker-pane .mark-' + key).toggleClass("marked", newValue);

}


//$(function () {
//    localStorage.clear();

//    var saveData = "\r\n\
//shrine-akh-vaquot-shrine\r\n\
//shrine-bareeda-naag-shrine\r\n\
//shrine-bosh-kala-shrine\r\n\
//shrine-chaas-qeta-shrine\r\n\
//shrine-dagah-keek-shrine\r\n\
//shrine-dah-hesho-shrine\r\n\
//shrine-dah-kaso-shrine\r\n\
//shrine-daka-tuss-shrine\r\n\
//shrine-dako-tah-shrine\r\n\
//shrine-daqo-chisay-shrine\r\n\
//shrine-dow-naeh-shrine\r\n\
//shrine-dunba-taag-shrine\r\n\
//shrine-gorae-torr-shrine\r\n\
//shrine-ha-dahamar-shrine\r\n\
//shrine-hawa-koth-shrine\r\n\
//shrine-hidden-shrine\r\n\
//shrine-hila-rao-shrine4\r\n\
//shrine-ishto-soh-shrine\r\n\
//shrine-ja-baij-shrine\r\n\
//shrine-jee-noh-shrine\r\n\
//shrine-jitan-sami-shrine\r\n\
//shrine-joloo-nah-shrine\r\n\
//shrine-kaam-yatak-shrine\r\n\
//shrine-kah-mael-shrine\r\n\
//shrine-kah-okeo-shrine\r\n\
//shrine-kam-urog-shrine\r\n\
//shrine-kao-muakagh-shrine\r\n\
//shrine-katah-chuki-shrine\r\n\
//shrine-katosa-aug-shrine\r\n\
//shrine-kay-noh-shrine\r\n\
//shrine-kaya-wan-shrine\r\n\
//shrine-keeha-yoog-shrine\r\n\
//shrine-keh-namut-shrine\r\n\
//shrine-kema-kosassa-shrine\r\n\
//shrine-kema-zoos-shrine\r\n\
//shrine-kenai-shakah-shrine\r\n\
//shrine-keo-ruug-shrine\r\n\
//shrine-korsh-ohu-shrine\r\n\
//shrine-kuh-takkar-shrine\r\n\
//shrine-lanka-rokee-shrine\r\n\
//shrine-lanno-kooh-shrine\r\n\
//shrine-maag-norah-shrine\r\n\
//shrine-maka-rah-shrine\r\n\
//shrine-mezza-lo-srhine\r\n\
//shrine-mirro-shaz-shrine\r\n\
//shrine-misae-suma-shrine\r\n\
//shrine-moa-keet-shrine\r\n\
//shrine-mogg-latan-shrine\r\n\
//shrine-monya-toma-shrine\r\n\
//shrine-muwo-jeem-shrine\r\n\
//shrine-myahm-agana-shrine\r\n\
//shrine-namika-ozz-shrine\r\n\
//shrine-neez-yohma-shrine\r\n\
//shrine-noya-neha-shrine\r\n\
//shrine-oman-au-shrine\r\n\
//shrine-owa-daim-shrine\r\n\
//shrine-pumaag-nitae-shrine\r\n\
//shrine-qua-raym-shrine\r\n\
//shrine-qukah-nata-shrine\r\n\
//shrine-ree-dahee-shrine\r\n\
//shrine-rin-oyaa-shrine\r\n\
//shrine-rona-kachta-shrine\r\n\
//shrine-rota-ooh-shrine\r\n\
//shrine-rucco-maag-shrine\r\n\
//shrine-sah-dahaj-shrine\r\n\
//shrine-sasa-kai-shrine\r\n\
//shrine-sha-warvo-shrine\r\n\
//shrine-shae-katha-shrine\r\n\
//shrine-shae-loya-shrine\r\n\
//shrine-shai-utoh-shrine\r\n\
//shrine-shai-yota-shrine3\r\n\
//shrine-shee-vaneer-shrine\r\n\
//shrine-shee-venath-shrine\r\n\
//shrine-sheem-dagoze-shrine\r\n\
//shrine-sheh-rata-shrine\r\n\
//shrine-sho-dantu-shrine\r\n\
//shrine-shoda-sah-shrine\r\n\
//shrine-shoqa-tatone-shrine\r\n\
//shrine-shrine-toto-isa\r\n\
//shrine-soh-kofi-shrine\r\n\
//shrine-suma-sahma-shrine\r\n\
//shrine-tah-muhl-shrine\r\n\
//shrine-tahno-oah-shrine\r\n\
//shrine-taloh-naeg-shrine\r\n\
//shrine-tawa-jinn-shrine\r\n\
//shrine-tena-kosah-shrine\r\n\
//shrine-tho-kayu-shrine\r\n\
//shrine-toh-yahsa-shrine\r\n\
//shrine-tutsuwa-nima-shrine\r\n\
//shrine-voo-lota-shrine\r\n\
//shrine-wahgo-katta-shrine\r\n\
//shrine-ya-naga-shrine\r\n\
//shrine-yah-rin-shrine\r\n\
//shrine-zalta-wa-shrine\r\n\
//shrine-ze-kasho-shrine\r\n\
//shrine-zuna-kai-shrine\r\n\
//";

//    $.each(MarkerData, function () {
//        if (this.markerCategoryId === "1925") {
//            if (saveData.toLowerCase().indexOf(this.name.toLowerCase().replace(/\s+/g, "-")) != -1) {
//                var key = this.markerCategoryId + "-" + this.id + "-" + this.name.replace(/[^A-Z]/gi, "-");
//                localStorage.setItem(key, 1);
//            }
//        }
//    });


//});