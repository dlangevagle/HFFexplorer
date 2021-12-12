// change the displayed url
function newurl(urlName) {
    let stateObj = {
        foo: "",
    };
    history.replaceState(stateObj, "page 2", urlName);
}

function setup(first) {
    if (first == false) {
        document.getElementById("loadingBackground").style.display = "block";
        if (map.hasLayer(focusCircle)) {
            map.removeLayer(focusCircle);
        }
        for (f=0; f<filters.length; f++) {
            filter = filters[f].toLowerCase();
            if (map.hasLayer(baseMaps[filter])) {
                map.removeLayer(baseMaps[filter]);
            }
            if (filters.includes("bcgs") & filter != "seg") {
                if (map.hasLayer(baseMaps[filter+"bcgs"])) {
                    map.removeLayer(baseMaps[filter+"bcgs"]);
                }
            }
        }
        map.off();
        map.remove();
    }

    // field info JSON file, includes catalog data
    var xhReq = new XMLHttpRequest();
    var infourl = fieldName+"/JSON/info.json?version=1.53";
    xhReq.open("GET", infourl, false);
    xhReq.send(null);
    infoJSON = JSON.parse(xhReq.responseText);

    group = infoJSON.group;
    var xhReq = new XMLHttpRequest();
    var groupurl = "JSON/"+group+".json?version=1.55";
    xhReq.open("GET", groupurl, false);
    xhReq.send(null);
    groupJSON = JSON.parse(xhReq.responseText);

    // add figure containers
    mainDir = groupJSON.main;
    figures = groupJSON.figures;
    var figsContainerInnerHTML = ""
    var zoomFigsContainerInnerHTML = "<div id=\"zoomFigsLeft\" style=\"display: inline-block; width: 0px;\"></div>"
    document.getElementById("xButton").innerHTML = "&#10005";
    // size of displayed science images in native pixels
    initialxySize = infoJSON.initialxySize;
    finalxySize = infoJSON.finalxySize;
    pixscl = infoJSON.pixscl;
    filters = infoJSON.filters;
    defaultFilter = infoJSON.defaultFilter;
    // Names of columns in the catalog
    catNames = groupJSON.table.catName;
    figNames = groupJSON.figures.name;
    for (f=0; f<figNames.length; f++) {
        if (mobile | ipad | group != "grizli") {
            figsContainerInnerHTML +=
                '<img id="figure' + figNames[f] + '" class="figure lesspadding " src="none" onclick="figureZoomIn(' +
                f + ')">\n';
            zoomFigsContainerInnerHTML +=
                '<img id="zoomfigure' + figNames[f] + '" class="figure lesspadding " src="none" ' +
                'onclick="figureZoomIn(-1)">\n'
        } else {
            figsContainerInnerHTML +=
                '<img id="figure' + figNames[f] + '" class="figure" src="none" onclick="figureZoomIn(' + f + ')">\n'
            zoomFigsContainerInnerHTML +=
                '<img id="zoomfigure' + figNames[f] + '" class="figure" src="none" onclick="figureZoomIn(-1)">\n'
        }
    }
    zoomFigsContainerInnerHTML += "<div id=\"zoomFigsRight\" style=\"display: inline-block; width: 0px;\"></div>"
    document.getElementById("figuresContainer").innerHTML = figsContainerInnerHTML;
    document.getElementById("zoomFigsContainer").innerHTML = zoomFigsContainerInnerHTML;
    // User selected: Menu -> Settings -> Table
    if (first) {
        good_catNames = groupJSON.table.defaultName;
        good_figNames = groupJSON.figures.defaultName;
    }
    // Displayed names for catalog columns
    tableNames = groupJSON.table.tableName;
    tableDiscs = groupJSON.table.tableDescription;

    // last object ID number in catalog
    maxID = infoJSON.maxID;
    if (group == "hff") { maxBCG = infoJSON.bcgs; }
    else { maxBCG = 20000; }
    minRA = infoJSON.raRange[0];
    maxRA = infoJSON.raRange[1];
    minDEC = infoJSON.decRange[0];
    maxDEC = infoJSON.decRange[1];

    // find min and max for each catalog filter
    prevdata = data;
    data = {};
    for (c=0; c<catNames.length; c++) {
        filter = catNames[c];
        data[filter] = {};
        excludedValues = groupJSON.data[filter];
        if (excludedValues.includes("*")) {
            data[filter]["min"] = Number.NaN;
            data[filter]["max"] = Number.NaN;
        } else {
            tempArray = [];
            for (o=0; o<infoJSON.data.length; o++) {
                if (!excludedValues.includes(infoJSON.data[o][filter])) {
                    tempArray.push(Number(infoJSON.data[o][filter]))
                }
            }
            if (tempArray.length > 0) {
                data[filter]["min"] = Math.min.apply(null, tempArray);
                data[filter]["max"] = Math.max.apply(null, tempArray);
            } else {
                data[filter]["min"] = Number.NaN;
                data[filter]["max"] = Number.NaN;
            }
        }
    }
    if (first) { prevdata = data; }

    if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
        document.getElementById("markerDispFilter").value = groupJSON.defaultMarkerOptions.markerDisp;
        defaultMarkerZoomLevel = 2;
        document.getElementById("markerMinZoomLevel").value = defaultMarkerZoomLevel;
        markerAddFilters();
    }

    IDs = [];
    for (o=0; o<infoJSON.data.length; o++) {
        IDs.push(Number(infoJSON.data[o]["id"]));
    }

    if (first | group != "hff") {
        addFilterButtons();
        configureDataSettings();
    }

    // Read in xy JSON file
    var xhReq = new XMLHttpRequest();
    var xyurl = mainDir+fieldName+"/JSON/XY/xy.js?version=1"; // url of jsonxy
    xhReq.open("GET", xyurl, false);
    xhReq.send(null);
    xyJSON = JSON.parse(xhReq.responseText);

    // Read in ind JSON file
    if (group == "grizli") {
        var xhReq = new XMLHttpRequest();
        var indurl = mainDir+fieldName+"/JSON/flags/ind.js?version=1"; // url of jsonxy
        xhReq.open("GET", indurl, false);
        xhReq.send(null);
        indJSON = JSON.parse(xhReq.responseText);
    } else {
        indJSON = [];
        for (i=0; i<IDs.length; i++) {
            indJSON.push(i);
        }
    }

    // adjust containers using mobile device
    if (first | group != "hff") {
        if (mobile | ipad) {
            if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
                defaultMarkerZoomLevel = 2.5;
                document.getElementById("markerMinZoomLevel").value = defaultMarkerZoomLevel;
            }
            cTCCheckbox = 0;
            document.getElementById("cursorTrackerContainerCheckbox").checked = false;
            document.getElementById("cursorTrackerContainerCheckbox").disabled = true;
            if (mobile) {
                sCCheckbox = 0;
                document.getElementById("searchContainerCheckbox").checked = false;
                document.getElementById("menuButton").style.top = "8px";
                document.getElementById("menuButton").style.left = "5px";
                document.getElementById("topLeftContainer").style.top = "8px";
                document.getElementById("topLeftContainer").style.left = "5px";
                document.getElementById("topButtonsContainer").style.left = "5px";
                document.getElementById("menuContainer").style.top = "40px";
                document.getElementById("menuContainer").style.left = "5px";
                document.getElementById("filterButtonsContainer").style.marginTop = "0px";
            } else {
                sCCheckbox = 1;
                document.getElementById("searchContainerCheckbox").checked = true;
                document.getElementById("searchContainer").style.display = "block";
            }
        } else {
            document.getElementById("searchContainerCheckbox").checked = true;
            document.getElementById("cursorTrackerContainerCheckbox").checked = true;
            sCCheckbox = 1;
            cTCCheckbox = 1;
            document.getElementById("searchContainer").style.display = "block";
            document.getElementById("cursorTrackerContainer").style.display = "block";
        }
        document.getElementById("focusCircleColorBox").style.borderColor =
            document.getElementById("focusCircleColor").value;
        document.getElementById("topButtonsContainer").style.top =
            $(topLeftContainer).offset().top+$(topLeftContainer).height()+"px"

        // map buttons
        document.getElementById("zoomOutCenterButton").style.display = "inline-block";
        fcb.style.display = "inline-block";
        if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
            document.getElementById("xButton").style.display = "inline-block";
        } else {
            document.getElementById("settingsHeaderMarkers").style.background = "#c8c8c8";
            document.getElementById("settingsHeaderMarkers").style.color = "gray";
            document.getElementById("settingsHeaderMarkers").style.cursor = "default";
            document.getElementById("settingsHeaderMarkers").onclick = function(){};
        }
        asb.style.display = "inline-block";
    }

    // field specific displayed information
    document.getElementById("title").innerHTML = fieldName;
    document.getElementById("fieldinput").value = fieldName;
    if (group == "hff") {
        document.getElementById("title").innerHTML = "HFFDS | "+fieldName;
        document.getElementById("dynamic-favicon").href =
            "http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/HFFDS-icon2.png";
        document.getElementById("searchID").max = maxBCG;
        document.getElementById("searchID").placeholder = "1 to "+maxID+" (20001 to "+maxBCG+")";
    } else {
        document.getElementById("searchID").max = maxID;
        document.getElementById("searchID").placeholder = "1 to "+maxID;
    }
    placeholderRA = xra(finalxySize[0]/2.-infoJSON.xyStartingPixel[0]).toFixed(5);
    placeholderDec = ydec(finalxySize[1]/2.-infoJSON.xyStartingPixel[1]).toFixed(5);
    document.getElementById("searchRADEC").placeholder = placeholderRA + ", " + placeholderDec;

    // add and initialize Leaflet map
    // map side length will be equal to the smaller of the window dimentions
    iwHt = $(window).height();
    iwWd = $(window).width();
    wMin = Math.min(iwHt, iwWd);
    imDisp = wMin;
    y_start = (imDisp-iwHt)/2.;
    y_end = y_start+imDisp;
    x_start = (imDisp-iwWd)/2.;
    x_end = x_start+imDisp;
    bounds = [[y_start, x_start], [y_end, x_end]]; // pixel size of map
    zDelta = 0.5;
    mapMaxZoom = 5;
    map = L.map("map", {
        crs: L.CRS.Simple, // coordinate reference system. Simple is a square grid
        zoomControl: false,
        maxZoom: mapMaxZoom, // number of zoom levels, zero indexed
        zDelta: zDelta, // zoom interval
        zoomSnap: 0,
        doubleClickZoom: false,
        // edge of image cannot go past center of window
        maxBounds: [[y_start-(iwHt/2.), x_start-(iwWd/2.)], [y_end+(iwHt/2.), x_end+(iwWd/2.)]],
        attributionControl: false,
        preferCanvas: true,
    });

    map.keyboard.disable();
    map.fitBounds(bounds); //sets given bounds within max zoom level

    // creates circle, sets size, color, fill, opacity
    focusCircle = L.circleMarker([-1000, -1000], {
        radius: 0,
        color: document.getElementById("focusCircleColor").value,
        weight: 1.5,
        fillOpacity: 0,
        interactive: false
    }).addTo(map);

    if (first | group != "hff") {
        tempFilter = defaultFilter;
    } else {
        tempFilter = currentLayer;
    }

    // add base maps for each filter
    for (f=0; f<filters.length; f++) {
        filter = filters[f].toLowerCase();
        if (filter == "seg") {
            baseMapName = mainDir+fieldName+"/images/"+fieldName+"-"+filter+".png";
        } else {
            baseMapName = mainDir+fieldName+"/images/"+fieldName+"-"+filter+".jpg";
        }
        if (filter != tempFilter) {
            baseMaps[filter] = L.imageOverlay(baseMapName, bounds).addTo(map);
            map.removeLayer(baseMaps[filter]);
            if (filters.includes("bcgs") & filter != "seg") {
                baseMaps[filter+"bcgs"] =
                    L.imageOverlay(baseMapName.replace(filter, filter+"_bcgs"), bounds).addTo(map);
                map.removeLayer(baseMaps[filter+"bcgs"]);
            }
        }
    }

    filter = tempFilter;
    currentLayer = tempFilter;
    if (filter == "seg") {
        baseMapName = mainDir+fieldName+"/images/"+fieldName+"-"+filter+".png";
    } else {
        baseMapName = mainDir+fieldName+"/images/"+fieldName+"-"+filter+".jpg";
    }
    if (filters.includes("bcgs") & filter != "seg") {
        baseMaps[filter] = L.imageOverlay(baseMapName, bounds).addTo(map);
        baseMaps[filter+"bcgs"] = L.imageOverlay(baseMapName.replace(filter, filter+"_bcgs"), bounds).addTo(map);
        if (bcgsLayer) {
            baseMaps[filter+"bcgs"].bringToFront();
        } else {
            baseMaps[filter].bringToFront();
        }
    } else {
        baseMaps[filter] = L.imageOverlay(baseMapName, bounds).addTo(map);
    }

    baseMaps[tempFilter].on('load', function (event) {
        window.dispatchEvent(new Event("resize"));
        if (first) {
            document.getElementById("loadingBackground").style.zIndex = "999";
        }
        document.getElementById("loadingBackground").style.display = "none";
    });

    menuSizing();
    scaleBarUpdate();

    fCLat = focusCircle.getLatLng().lat;
    fCLng = focusCircle.getLatLng().lng;
    if (first == false) {
        fCX = Math.round(lngx(fCLng));
        fCY = Math.round(laty(fCLat));
        getid(fCX, fCY);
    }

    document.getElementById("map").focus();

    map.on('dragstart', function(e) {
        if (!fcb.style.backgroundImage.includes("gray") & fcb.style.backgroundImage != "") {
            fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
        }
        document.getElementById("zoomOutCenterButton").style.backgroundImage =
            "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
        lastCenter = "none";
    });

    map.on('zoomstart', function(e) {
        if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
            removeMarkers();
        }
    });

    // triggered after user is finished zooming in/out
    map.on('zoomend', function(e) {
        scaleBarUpdate();
        // unclick zoomoutcenter button if zoomed in or if focuscenter button is clicked
        if (map.getZoom() != 0 | fcb.style.backgroundImage.includes("blue")) {
            document.getElementById("zoomOutCenterButton").style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
        } else if (map.getZoom() != 0 && lastCenter == "image") {
            lastCenter = "none";
        }
        if (map.getZoom() == mapMaxZoom) {
            document.getElementById("zoomInButton").style.background = "#c8c8c8";
            document.getElementById("zoomInButton").style.color = "gray";
            document.getElementById("zoomInButton").style.cursor = "default";
            document.getElementById("zoomOutButton").style.background = "white";
            document.getElementById("zoomOutButton").style.color = "black";
            document.getElementById("zoomOutButton").style.cursor = "pointer";
        } else if (map.getZoom() == 0) {
            document.getElementById("zoomInButton").style.background = "white";
            document.getElementById("zoomInButton").style.color = "black";
            document.getElementById("zoomInButton").style.cursor = "pointer";
            document.getElementById("zoomOutButton").style.background = "#c8c8c8";
            document.getElementById("zoomOutButton").style.color = "gray";
            document.getElementById("zoomOutButton").style.cursor = "default";
        } else {
            document.getElementById("zoomInButton").style.background = "white";
            document.getElementById("zoomInButton").style.color = "black";
            document.getElementById("zoomInButton").style.cursor = "pointer";
            document.getElementById("zoomOutButton").style.background = "white";
            document.getElementById("zoomOutButton").style.color = "black";
            document.getElementById("zoomOutButton").style.cursor = "pointer";
        }
        document.getElementById("zoomLevel").placeholder = map.getZoom().toFixed(2);
        document.getElementById("zoomLevel").value = "";

        if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
            xButton = document.getElementById("xButton");
            if (map.getZoom() >= document.getElementById("markerMinZoomLevel").value) {
                xButton.style.cursor = "pointer";
                if (xButton.title.includes("Remove")) {
                    xButton.style.background = "#4187f5";
                    xButton.style.color = "white";
                    if (mobile | ipad) {
                        addMarkers();
                    } else {
                        // allows desktop users to zoom without it reloading the markers at every zoom level
                        setTimeout(addMarkers, 800);
                    }
                } else {
                    xButton.style.background = "white";
                    xButton.style.color = "black";
                }
            }
            if (map.getZoom() < document.getElementById("markerMinZoomLevel").value) {
                removeMarkers();
                xButton.style.cursor = "default";
                xButton.style.background = "#c8c8c8";
                xButton.style.color = "gray";
            }
        }

        addFocusCircle();
        // calculate if window still centered on focus circle
        latDif = Math.abs(map.getCenter().lat + focusOffsetLat - (focusCircle.getLatLng().lat));
        lngDif = Math.abs(map.getCenter().lng + focusOffsetLng - (focusCircle.getLatLng().lng));
        if ((latDif > 1 | lngDif > 1) &
            (!fcb.style.backgroundImage.includes("gray") & fcb.style.backgroundImage != "")) {
            fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
        }
        // resize search markers
        searches = document.getElementsByClassName("advSearch");
        for (s=searches.length-1; s>=0; s--) {
            addSearchMarkers(searches[s].id.split("search")[1]);
        }
        if (currentAdvSrch > -1) {
            addSearchMarkers(searches[currentAdvSrch].id.split("search")[1]);
        }
    });

    map.on('click', onMapClick); //adds mouseclick method to map
    map.on('mousemove', onMouseMove); //adds mousemove method to map

    slider.oninput = function() {
        mapBrightness();
    }

    autocomplete(document.getElementById("fieldinput"), fields);

    if (first == false) {
        zoomOutCenterImage();
        document.getElementById("zoomLevel").placeholder = "0.00";
        closeAdvSrch();
        searchLists = document.getElementsByClassName("advancedSearchList");
        for (al=searchLists.length-1; al>=0; al--) {
            n = searchLists[al].id.split("search")[1].split("list")[0];
            ln = searchLists[al].id.split("list")[1];
            removeList(n, ln);
        }
        advSearches = document.getElementsByClassName("advSearch");
        searchFilters = document.getElementsByClassName("advancedSearchFilter");
        for (s=advSearches.length-1; s>=0; s--) {
            n = advSearches[s].id.split("search")[1];
            for (f=0; f<searchFilters.length; f++) {
                if (searchFilters[f].id.includes(advSearches[s].id)) {
                    sFilter = "";
                    for (j=0; j<catNames.length; j++) {
                        if (searchFilters[f].id.includes(catNames[j])) {
                            sFilter = catNames[j];
                            fn = searchFilters[f].id.split(advSearches[s].id)[1].split(sFilter)[1];
                        }
                    }
                    if (sFilter == "") {
                        deleteAdvancedSearch(n);
                    } else {
                        if (document.getElementById(searchFilters[f].id+"Lower") != undefined) {
                            if (isNaN(data[sFilter].min)) {
                                removeFilter(n, sFilter, fn);
                            } else {
                                search_sFilter_Lower_value =
                                    document.getElementById("search"+n+sFilter+fn+"Lower").value
                                search_sFilter_Upper_value =
                                    document.getElementById("search"+n+sFilter+fn+"Upper").value
                                currentFocusValue = document.getElementById(searchFilters[f].id+"Lower").value;
                                filterUpdate(n, sFilter, fn,
                                             document.getElementById(searchFilters[f].id+"Lower"), false);
                                document.getElementById("search"+n+sFilter+fn).innerHTML =
                                    document.getElementById("search"+n+sFilter+fn).innerHTML.replace(
                                    "Lower\" value=\""+search_sFilter_Lower_value+"\" placeholder=\""+
                                    prevdata[sFilter].min+"\"", "Lower\" value=\""+search_sFilter_Lower_value+
                                    "\" placeholder=\""+data[sFilter].min+"\"");
                                currentFocusValue = document.getElementById(searchFilters[f].id+"Upper").value;
                                filterUpdate(n, sFilter, fn,
                                             document.getElementById(searchFilters[f].id+"Upper"), false);
                                document.getElementById("search"+n+sFilter+fn).innerHTML =
                                    document.getElementById("search"+n+sFilter+fn).innerHTML.replace(
                                        "Upper\" value=\""+search_sFilter_Upper_value+"\" placeholder=\""+
                                        prevdata[sFilter].max+"\"", "Upper\" value=\""+search_sFilter_Upper_value+
                                        "\" placeholder=\""+data[sFilter].max+"\"");
                            }
                        } else {
                            if (!isNaN(data[sFilter].min)) {
                                removeFilter(n, sFilter, fn);
                            }
                        }
                    }
                }
            }
            if (document.getElementById(advSearches[s].id) != undefined) {
                executeAdvancedSearch(n);
            }
        }
    }
}

function menuSizing() {
    subMenuContainers = document.getElementsByClassName("subMenu");
    for (m=0; m<subMenuContainers.length; m++) {
        sM = subMenuContainers[m];
        sMH = document.getElementById(sM.id+"Header");
        if (mobile) {
            if ($(window).height()>$(window).width()) {
                sMH.style.top = (42 + $(menuContainer).height())+"px";
                sMH.style.left = "5px";
                sMH.style.width = ($(window).width() - 10)+"px";
                sMH.style.maxWidth = ($(window).width() - 10)+"px";
                if ($(sMH).height() != 0) {
                    sM.style.top = (44 + $(menuContainer).height() + $(sMH).height())+"px";
                } else { sM.style.top = (42 + $(menuContainer).height())+"px"; }
                sM.style.left = "5px";
                sM.style.maxHeight = ($(window).height() - 40 - $(menuContainer).height() - $(sMH).height() - 8)+"px";
                sM.style.width = ($(window).width() - 10)+"px";
                sM.style.maxWidth = ($(window).width() - 10)+"px";
            } else {
                sMH.style.top = "8px";
                sMH.style.left = ($(topLeftContainer).width() + 5)+"px";
                sMH.style.width = Math.min(300, ($(window).width() - $(topLeftContainer).width() - 10))+"px";
                sMH.style.maxWidth = ($(window).width() - $(topLeftContainer).width() - 10)+"px";
                if ($(sMH).height() != 0) {
                    sM.style.top = (10 + $(sMH).height())+"px";
                } else { sM.style.top = "8px"; }
                sM.style.left = ($(topLeftContainer).width() + 5)+"px";
                sM.style.maxHeight = ($(window).height() - $(sMH).height() - 16)+"px";
                sM.style.width = Math.min(300, ($(window).width() - $(topLeftContainer).width() - 10))+"px";
                sM.style.maxWidth = ($(window).width() - $(topLeftContainer).width() - 10)+"px";
            }
        } else {
            sMH.style.top = "10px";
            sMH.style.left = ($(topLeftContainer).width() + 10)+"px";
            sMH.style.width = Math.min(300, ($(window).width() - $(topLeftContainer).width() - 20))+"px";
            sMH.style.maxWidth = ($(window).width() - $(topLeftContainer).width() - 20)+"px";
            if ($(sMH).height() != 0) {
                sM.style.top = (12 + $(sMH).height())+"px";
            } else { sM.style.top = "10px"; }
            sM.style.left = ($(topLeftContainer).width() + 10)+"px";
            sM.style.maxHeight = ($(window).height() - $(sMH).height() - 20)+"px";
            sM.style.width = Math.min(300, ($(window).width() - $(topLeftContainer).width() - 20))+"px";
            sM.style.maxWidth = ($(window).width() - $(topLeftContainer).width() - 20)+"px";
        }
    }
}

// Calcuates and updates the units and size of the scale bar.
function scaleBarUpdate() {
    var zoomLevel = map.getZoom();
    var units = "degrees";
    var length = 0; // in device pixels
    var minLength = 55.;
    var maxLength = 110.;
    var value = 0;
    var dispValue = "0";
    var scaleBarTargetValues =
        [60, 45, 30, 20, 15, 10, 8, 6, 4, 3, 2, 1, 0.75, 0.5, 0.3, 0.2, 0.1, 0.075, 0.05, 0.03, 0.02, 0.01];
    var thirdsValues = [45, 30, 15, 6, 3, 0.75, 0.3, 0.075, 0.03];
    var fourthsValues = [60, 20, 8, 4, 2, 1, 0.2, 0.02];
    var windowFraction = 1;
    if (!portrait) { windowFraction = $(window).width()/$(window).height(); }
    var wSkyWd = (finalxySize[0]*windowFraction)/(Math.pow(2, zoomLevel))*pixscl/60./60.; // in degrees
    var minScaleBar = (minLength/$(window).width())*wSkyWd;
    var maxScaleBar = (maxLength/$(window).width())*wSkyWd;
    // if max less than 1 degree
    if (maxScaleBar < 1.) {
        units = "arcmin";
        wSkyWd = wSkyWd*60.; // in arcmin
        minScaleBar = (minLength/$(window).width())*wSkyWd;
        maxScaleBar = (maxLength/$(window).width())*wSkyWd;
    }
    // if max less than 1 arcmin
    if (maxScaleBar < 1.) {
        units = "arcsec";
        wSkyWd = wSkyWd*60.; // in arcsec
        minScaleBar = (minLength/$(window).width())*wSkyWd;
        maxScaleBar = (maxLength/$(window).width())*wSkyWd;
    }
    var sections = 2.;
    var i = 0;
    // find target value between min and max
    while (length == 0 & i < scaleBarTargetValues.length) {
        if (scaleBarTargetValues[i] > minScaleBar && scaleBarTargetValues[i] < maxScaleBar) {
            length = (scaleBarTargetValues[i]*imDisp)/(finalxySize[0]/(Math.pow(2, zoomLevel))*pixscl);
            value = scaleBarTargetValues[i];
            if (units == "degrees") {
                length = length*60.*60.;
                dispValue = scaleBarTargetValues[i] + "&deg";
            } else if (units == "arcmin") {
                length = length*60.;
                dispValue = scaleBarTargetValues[i] + "&prime;";
            } else if (units == "arcsec") { dispValue = scaleBarTargetValues[i] + "&Prime;" }
        }
        i += 1;
    }
    if (thirdsValues.includes(value)) { sections = 3.; }
    else if (fourthsValues.includes(value) & length > 100.) { sections = 4.; }
    if (length > 0) {
        var mPScaleBarContainer = document.getElementById("mobilePortraitScaleBarContainer");
        var mPScaleBarOne = document.getElementById("mobilePortraitScaleBarOne");
        var mPScaleBarTwo = document.getElementById("mobilePortraitScaleBarTwo");
        var mPScaleBarThree = document.getElementById("mobilePortraitScaleBarThree");
        var mPScaleBarExtraTick1 = document.getElementById("mobilePortraitScaleBarExtraTick1");
        var mPScaleBarFour = document.getElementById("mobilePortraitScaleBarFour");
        var mPScaleBarExtraTick2 = document.getElementById("mobilePortraitScaleBarExtraTick2");
        var mPScaleBarValue = document.getElementById("mobilePortraitScaleBarValue");
        mPScaleBarOne.style.width = length/sections+"px";
        mPScaleBarTwo.style.width = length/sections+"px";
        mPScaleBarValue.innerHTML = dispValue;
        // divide scale bar in half or into thirds
        if (sections >= 3.) {
            mPScaleBarExtraTick1.style.display = "inline-block";
            mPScaleBarThree.style.display = "inline-block";
            mPScaleBarThree.style.width = length/sections + "px";
            if (sections == 4.) {
                mPScaleBarExtraTick2.style.display = "inline-block";
                mPScaleBarFour.style.display = "inline-block";
                mPScaleBarFour.style.width = length/sections + "px";
            } else {
                mPScaleBarExtraTick2.style.display = "none";
                mPScaleBarFour.style.display = "none";
            }
        } else {
            mPScaleBarExtraTick1.style.display = "none";
            mPScaleBarThree.style.display = "none";
            mPScaleBarExtraTick2.style.display = "none";
            mPScaleBarFour.style.display = "none";
        }
        mPScaleBarContainer.style.display = "block";
    } else {
        mPScaleBarContainer.style.display = "none";
    }
}

function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}

function markerAddFilters() {
    markerFilter = groupJSON.defaultMarkerOptions.markerFilter;
    markerColors =  groupJSON.defaultMarkerOptions.markerColors;
    markerBounds =  groupJSON.defaultMarkerOptions.markerBounds;
    mf = "";
    for (m=0; m<markerColors.length; m++) {
        mcolor = markerColors[m];
        lb = markerBounds[m];
        ub = markerBounds[m+1];
        if (lb == "min") {
            lb = data[markerFilter].min;
        }
        if (ub == "max") {
            ub = data[markerFilter].max;
        }
        mf =
            '<div id="markers' + m + '" class="markersFilter"><div style="width: 100%; font-size: 0px;"><div ' +
            'id="markers' + m + 'ColorX" style="display: inline-block; width: 15px; margin: 5px 0 0 5px; font-size: ' +
            '18px; color: ' + mcolor + '; vertical-align: top;" onclick="focusMarkerColor(' + m + ')">&#10005;</div>' +
            '<input id="markers' + m + 'Color" type="text" autocorrect="off" autocapitalize="none" class="menuInput ' +
            'menuVertClose" value="' + mcolor + '" style="width: calc(100% - 195px); margin-right: 0;" ' +
            'onkeydown="markerColorKeyDown(event, ' + m + ')" onfocus="focusMarkerColor(' + m + ')" ' +
            'onblur="updateMarkerColor(' + m + ')"><div title="Enter color" class="subMenuButton menuVertClose" ' +
            'style="width: 55px; margin: 5px 0 0 0;" onclick="updateMarkerColor(' + m + ')">ENTER</div><div ' +
            'title="Reset markers" class="subMenuButton menuVertClose" style="width: 55px; margin: 5px 0 0 0;" ' +
            'onclick="resetMarkerColor(' + m + ')">RESET</div><div id="markers' + m + 'showHide" title="Hide markers"' +
            ' class="subMenuButton menuVertClose" style="width: 55px; margin: 5px 0 0 0;" onclick="markersShowHide(' +
            m + ')">HIDE</div><input id="markers' + m + 'Lower" value="' + lb + '" type="number" ' +
            'class="menuFilterBounds menuInput" onfocus="focusMarkerBound(this)" onkeydown="markerBoundKeyDown(' +
            'event, ' + m + ', this)" onblur="blurMarkerBound(' + m + ', this)"><div id="markers' + m +
            'name" class="menuText markersFilterName" style="font-size: 14px;">&#8804;&nbsp;' + markerFilter +
            '&nbsp;&#8804;</div><input id="markers' + m + 'Upper" value="' + ub + '" type="number" ' +
            'class="menuFilterBounds menuInput" onfocus="focusMarkerBound(this)" style="margin-right: 0;" ' +
            'onkeydown="markerBoundKeyDown(event, ' + m + ', this)" onblur="blurMarkerBound(' + m +
            ', this)"></div></div>' + mf;
    }
    document.getElementById("mFilters").innerHTML = mf;
}

function updateMarkerSize(size, reload) {
    good = ["small", "medium", "large"];
    if (good.includes(size)) {
        sizes = [document.getElementById("xsmall"),document.getElementById("xmedium"),document.getElementById("xlarge")]
        for (s=0; s<sizes.length; s++) {
            sizes[s].style.backgroundColor = "white";
            sizes[s].style.color = "black";
        }
        document.getElementById("x"+size).style.backgroundColor = "#4187f5";
        document.getElementById("x"+size).style.color = "white";
        markerSize = size;
        if (reload) {
            updateMarkerDispFilter();
        }
    }
}

function focusMarkerColor(mnum) {
    mColor = document.getElementById("markers"+mnum+"Color");
    if (mobile | ipad) {
        mColor.focus();
        mColor.setSelectionRange(0, mColor.value.length);
    } else {
        $(mColor).select();
    }
}

function markerColorKeyDown(event, mnum) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        document.getElementById("markers"+mnum+"Color").blur();
    }
}

function updateMarkerColor(mnum) {
    orig = w3color(document.getElementById("markers"+mnum+"ColorX").style.color).toHexString();
    color = document.getElementById("markers"+mnum+"Color").value;
    cObj = w3color(color)
    colorhex = cObj.toHexString();
    if (color != "" & cObj.valid) {
        document.getElementById("markers"+mnum+"ColorX").style.color = colorhex;
        document.getElementById("markers"+mnum+"Color").value = colorhex;
        document.getElementById("markers"+mnum).innerHTML =
            document.getElementById("markers"+mnum).innerHTML.replace(orig, colorhex);
    } else {
        document.getElementById("markers"+mnum+"Color").value = orig;
    }
    updateMarkerDispFilter();
}

function resetMarkerColor(mnum) {
    orig = w3color(document.getElementById("markers"+mnum+"ColorX").style.color).toHexString();
    markerColor = w3color(groupJSON.defaultMarkerOptions.markerColors[mnum]).toHexString();
    document.getElementById("markers"+mnum+"ColorX").style.color = markerColor;
    document.getElementById("markers"+mnum+"Color").value = markerColor;
    document.getElementById("markers"+mnum).innerHTML =
        document.getElementById("markers"+mnum).innerHTML.replace(orig, markerColor);
    lorig = groupJSON.defaultMarkerOptions.markerBounds[mnum];
    lcurr = document.getElementById("markers"+mnum+"Lower").value;
    document.getElementById("markers"+mnum+"Lower").value = lorig;
    uorig = groupJSON.defaultMarkerOptions.markerBounds[mnum+1];
    ucurr = document.getElementById("markers"+mnum+"Upper").value;
    document.getElementById("markers"+mnum+"Upper").value = uorig;
    document.getElementById("mFilters").innerHTML =
        document.getElementById("mFilters").innerHTML.replace(mnum+"Lower\" value=\""+lcurr, mnum+"Lower\" value=\""+lorig);
    document.getElementById("mFilters").innerHTML =
        document.getElementById("mFilters").innerHTML.replace(mnum+"Upper\" value=\""+ucurr, mnum+"Upper\" value=\""+uorig);
    updateMarkerDispFilter();
}

function markersShowHide(mnum) {
    if (document.getElementById("markers"+mnum+"showHide").innerHTML == "HIDE") {
        document.getElementById("markers"+mnum+"showHide").innerHTML = "SHOW";
        document.getElementById("markers"+mnum+"showHide").title = "Show markers";
        document.getElementById("markers"+mnum).style.backgroundColor = "#c8c8c8";
        document.getElementById("markers"+mnum+"name").style.backgroundColor = "#c8c8c8";
    } else {
        document.getElementById("markers"+mnum+"showHide").innerHTML = "HIDE";
        document.getElementById("markers"+mnum+"showHide").title = "Hide markers";
        document.getElementById("markers"+mnum).style.backgroundColor = "white";
        document.getElementById("markers"+mnum+"name").style.backgroundColor = "white";
    }
    updateMarkerDispFilter();
}

function focusMarkerBound(obj) {
    if (mobile | ipad) {
        obj.focus();
        obj.setSelectionRange(0, obj.value.length);
    } else {
        $(obj).select();
    }
    currentFocusValue = document.getElementById(obj.id).value;
}

function markerBoundKeyDown(event, mnum, obj) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        document.getElementById(obj.id).blur();
    }
}

function blurMarkerBound(mnum, obj) {
    filter = groupJSON.defaultMarkerOptions.markerFilter;
    orig = currentFocusValue;
    new_v = document.getElementById(obj.id).value;
    if (new_v == "") { new_v = orig; }
    min = data[filter].min;
    max = data[filter].max;
    if (new_v < min) { new_v = min; }
    else if (new_v > max) { new_v = max; }
    document.getElementById(obj.id).value = new_v;
    if (obj.id.includes("Lower")) {
        document.getElementById("mFilters").innerHTML =
            document.getElementById("mFilters").innerHTML.replace(
                mnum+"Lower\" value=\""+orig, mnum+"Lower\" value=\""+new_v);
    } else {
        document.getElementById("mFilters").innerHTML =
            document.getElementById("mFilters").innerHTML.replace(
                mnum+"Upper\" value=\""+orig, mnum+"Upper\" value=\""+new_v);
    }
    updateMarkerDispFilter();
}

function markerDispFocus() {
    currentFocusValue = document.getElementById("markerDispFilter").value;
    if (mobile | ipad) {
        document.getElementById("markerDispFilter").focus();
        document.getElementById("markerDispFilter").setSelectionRange(
            0, document.getElementById("markerDispFilter").value.length);
    } else {
        $(document.getElementById("markerDispFilter")).select();
    }
    autocomplete(document.getElementById("markerDispFilter"), catNames);
}

function markerDispFilterKeyDown(event) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        document.getElementById("markerDispFilter").blur();
    }
}

function updateMarkerDispFilter() {
    if (catNames.includes(document.getElementById("markerDispFilter").value) |
                          document.getElementById("markerDispFilter").value == "") {
        removeMarkers();
        updateMarkers();
        if (document.getElementById("xButton").style.color == "white") {
            addMarkers();
        }
    } else {
        document.getElementById("markerDispFilter").value = currentFocusValue;
    }
}

function markerZoomLevelFocus() {
    if (mobile | ipad) {
        markerMinZoomLevel.focus();
        markerMinZoomLevel.setSelectionRange(0, markerMinZoomLevel.value.length);
    } else {
        $(markerMinZoomLevel).select();
    }
    currentFocusValue = document.getElementById("markerMinZoomLevel").value;
}

function markerZoomLevelKeyDown(event) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        document.getElementById("markerMinZoomLevel").blur();
    }
}

function updateMarkerZoomLevel() {
    if (Number(document.getElementById("markerMinZoomLevel").value) == 0) {
        document.getElementById("markerMinZoomLevel").value = 0;
    }
    if (document.getElementById("markerMinZoomLevel").value > mapMaxZoom) {
        document.getElementById("markerMinZoomLevel").value = mapMaxZoom;
    } else if (document.getElementById("markerMinZoomLevel").value < 0) {
        document.getElementById("markerMinZoomLevel").value = 0;
    }
    xButton = document.getElementById("xButton");
    if (map.getZoom() >= document.getElementById("markerMinZoomLevel").value) {
        xButton.style.cursor = "pointer";
        if (xButton.title.includes("Remove")) {
            xButton.style.background = "#4187f5";
            xButton.style.color = "white";
            addMarkers();
        } else {
            xButton.style.background = "white";
            xButton.style.color = "black";
        }
    } else if (map.getZoom() < document.getElementById("markerMinZoomLevel").value) {
        removeMarkers();
        xButton.style.cursor = "default";
        xButton.style.background = "#c8c8c8";
        xButton.style.color = "gray";
    }
}

// Creates markers from defaultMarkerOptions parameters
function createMarkers() {
    markerFilter = groupJSON.defaultMarkerOptions.markerFilter;
    markerInfoCatName = document.getElementById("markerDispFilter").value;
    filterValues = [];
    for (i=0; i < infoJSON.data.length; i++) {
        filterValues.push(Number(infoJSON.data[i][markerFilter]));
    }
    minFilterValue = Math.min.apply(null, filterValues);
    maxFilterValue = Math.max.apply(null, filterValues);
    if (groupJSON.defaultMarkerOptions.hasOwnProperty('markerColors')) {
        markerColors = groupJSON.defaultMarkerOptions.markerColors;
        if (groupJSON.defaultMarkerOptions.hasOwnProperty('markerBounds')) {
            markerBounds = groupJSON.defaultMarkerOptions.markerBounds;
            for (b=0; b<markerBounds.length; b++) {
                if (markerBounds[b] == "min") { markerBounds[b] = minFilterValue; }
                else if (markerBounds[b] == "max") { markerBounds[b] = maxFilterValue; }
            }
        } else {
            boundsRange = maxFilterValue - minFilterValue;
            markerBounds = [minFilterValue]
            for (c=0; c<markerColors.length; c++) {
                markerBounds.push(markerBounds[c]+boundsRange);
            }
        }
    } else {
        markerColors = ["white"];
    }

    markersArray = {"xArray": {}};
    markersArray[markerInfoCatName+"Array"] = {};
    for (c=0; c<markerColors.length; c++) {
        cName = "color"+(c+1)
        markersArray["xArray"][cName] = [];
        markersArray[markerInfoCatName+"Array"][cName] = [];
    }

    // detect if using retina/high-dpi device
    var query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
    if (markerSize == "small") {
        var markerFontSize = "16px";
        var markerIconSize = [16, 16];
        if (mobile | ipad) { var xIconAnchor = [7., 11.]; }
        else if (matchMedia(query).matches) { var xIconAnchor = [6., 11.]; }
        else { var xIconAnchor = [7., 11.]; }
    } else if (markerSize == "medium") {
        var markerFontSize = "19px";
        var markerIconSize = [19, 19];
        if (mobile | ipad) { var xIconAnchor = [8., 11.5]; }
        else if (matchMedia(query).matches) { var xIconAnchor = [7., 11.5]; }
        else { var xIconAnchor = [8., 11.5]; }
    } else if (markerSize == "large") {
        var markerFontSize = "22px";
        var markerIconSize = [22, 22];
        var xIconAnchor = [8., 12.];
    }

    for (i=0; i < infoJSON.data.length; i++) {
        x = infoJSON.data[i].x;
        y = infoJSON.data[i].y;
        filterValue = filterValues[i];
        mc = -1;
        j = markerColors.length-1;
        while(mc == -1 & j >= 0) {
            if (filterValue >= markerBounds[j] && filterValue <= markerBounds[j+1]) {
                mc = j;
            }
            j -= 1;
        }
        if (mc != -1) {
            markerColor = markerColors[mc];
            cName = "color"+(mc+1);
            catName = markerInfoCatName;
            markersArray["xArray"][cName].push(
                L.marker([ylat(y), xlng(x)], {icon: L.divIcon({className: "marker-div",
                    html: "<span style='color:"+markerColor+"; font-size: "+markerFontSize+";'>&#10005&nbsp"+
                    Number(infoJSON.data[i][catName]).toFixed(2)+"</span>",
                    iconSize: markerIconSize, iconAnchor: xIconAnchor}), interactive: false}));
        }
    }

    xMarkersFinalArray = [];
    for (c=0; c<markerColors.length; c++) {
        cName = "color"+(c+1);
        xMarkersFinalArray = xMarkersFinalArray.concat(markersArray["xArray"][cName]);
    }
    objectMarkers["xMarkers"] = L.featureGroup(xMarkersFinalArray);
}

function updateMarkers() {
    markerFilter = groupJSON.defaultMarkerOptions.markerFilter;
    markerInfoCatName = document.getElementById("markerDispFilter").value;
    mnum = groupJSON.defaultMarkerOptions.markerColors.length;

    markersArray = {"xArray": {}};
    for (c=0; c<mnum; c++) {
        markersArray["xArray"]["color"+c] = [];
    }

    // detect if using retina/high-dpi device
    var query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
    if (markerSize == "small") {
        var markerFontSize = "16px";
        var markerIconSize = [16, 16];
        if (mobile | ipad) { var xIconAnchor = [7., 11.]; }
        else if (matchMedia(query).matches) { var xIconAnchor = [6., 11.]; }
        else { var xIconAnchor = [7., 11.]; }
    } else if (markerSize == "medium") {
        var markerFontSize = "19px";
        var markerIconSize = [19, 19];
        if (mobile | ipad) { var xIconAnchor = [8., 11.5]; }
        else if (matchMedia(query).matches) { var xIconAnchor = [7., 11.5]; }
        else { var xIconAnchor = [8., 11.5]; }
    } else if (markerSize == "large") {
        var markerFontSize = "22px";
        var markerIconSize = [22, 22];
        var xIconAnchor = [8., 12.];
    }
    for (i=0; i < infoJSON.data.length; i++) {
        x = Number(infoJSON.data[i].x);
        y = Number(infoJSON.data[i].y);
        filterValue = Number(infoJSON.data[i][markerFilter]);
        mc = -1;
        j = markerColors.length-1;
        while(mc == -1 & j >= 0) {
            lb = Number(document.getElementById("markers"+j+"Lower").value);
            ub = Number(document.getElementById("markers"+j+"Upper").value);
            if (filterValue >= lb && filterValue <= ub) {
                mc = j;
            }
            j -= 1;
        }
        if (mc != -1) {
            clr = document.getElementById("markers"+mc+"Color").value;
            cObj = w3color(clr);
            colorhex = cObj.toHexString();
            clrrgb = hexToRgb(colorhex);
            b = 0.5 + slider.value/66.;
            if (b > 1) {
                clr = "rgb("+clrrgb.r/b+","+clrrgb.g/b+","+clrrgb.b/b+")"
                cObj = w3color(clr);
                colorhex = cObj.toHexString();
            }
            if (markerInfoCatName == "") {
                markersArray["xArray"]["color"+mc].push(
                    L.marker([ylat(y), xlng(x)], {icon: L.divIcon(
                        {className: "marker-div", html: "<span style='color:"+colorhex+"; font-size: "+markerFontSize+
                        ";'>&#10005&nbsp</span>", iconSize: markerIconSize, iconAnchor: xIconAnchor}),
                        interactive: false}));
            } else {
                markersArray["xArray"]["color"+mc].push(
                    L.marker([ylat(y), xlng(x)], {icon: L.divIcon(
                        {className: "marker-div", html: "<span style='color:"+colorhex+"; font-size: "+markerFontSize+
                        ";'>&#10005&nbsp"+Number(infoJSON.data[i][markerInfoCatName]).toFixed(2)+"</span>",
                        iconSize: markerIconSize, iconAnchor: xIconAnchor}), interactive: false}));
            }
        }
    }
    xMarkersFinalArray = [];
    for (c=0; c<mnum; c++) {
        if (document.getElementById("markers"+c+"showHide").innerHTML == "HIDE") {
            xMarkersFinalArray = xMarkersFinalArray.concat(markersArray["xArray"]["color"+c]);
        }
    }
    objectMarkers["xMarkers"] = L.featureGroup(xMarkersFinalArray);
}

function addFocusCircle() {
    map.removeLayer(focusCircle);
    clr = document.getElementById("focusCircleColor").value;
    cObj = w3color(clr);
    colorhex = cObj.toHexString();
    clrrgb = hexToRgb(colorhex);
    b = 0.5 + slider.value/66.;
    if (b > 1) {
        clr = "rgb("+clrrgb.r/b+","+clrrgb.g/b+","+clrrgb.b/b+")";
        cObj = w3color(clr);
        colorhex = cObj.toHexString();
    }
    focusCircle = L.circleMarker([fCLat, fCLng], {
        radius: 5*(map.getZoom()+1),
        color: colorhex,
        weight: 1.5,
        fillOpacity: 0,
        interactive: false
    }).addTo(map);
}

function focusCircleColorFocus() {
    fCC = document.getElementById("focusCircleColor");
    if (mobile | ipad) {
        fCC.focus();
        fCC.setSelectionRange(0, fCC.value.length);
    } else {
        $(fCC).select();
    }
}

function focusCircleColorInput(event, color) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        focusCircleColorChange(color);
    }
}

function focusCircleColorChange(color) {
    if (color == '') {
        color = document.getElementById("focusCircleColorBox").style.borderColor;
    }
    cObj = w3color(color)
    colorhex = cObj.toHexString();
    if (cObj.valid) {
        fCLat = focusCircle.getLatLng().lat;
        fCLng = focusCircle.getLatLng().lng;
        document.getElementById("focusCircleColorAlert").innerHTML = "";
        document.getElementById("focusCircleColorBox").style.borderColor = colorhex;
        document.getElementById("focusCircleColor").value = colorhex;
        addFocusCircle();
    } else {
        document.getElementById("focusCircleColor").value =
            w3color(document.getElementById("focusCircleColorBox").style.borderColor).toHexString();
        document.getElementById("focusCircleColorAlert").innerHTML = "Invalid color";
    }
}

// add filter buttons to map (F160W, RGB1, SEG, etc.)
function addFilterButtons() {
    var filterButtonsContainer = document.getElementById("filterButtonsContainer");
    // number of rows may change when using mobile device in portrait mode
    if (filters.length >= 5) {
        filtersPerRow = 5;
    } else { filtersPerRow = filters.length; }
    var numFilterRows = Math.ceil(filters.length/filtersPerRow);
    var txt = "";
    for (f=0; f<filters.length; f++) {
        filter = filters[f];
        txt += '<div id="'+filter+'ButtonContainer" class="layerButtonContainer">\n';
        if (filter == defaultFilter | filter == "bcgs") {
            txt += '<button id="' + filter + 'Button" class="layerButton" type="button" style="background: #4187f5; ' +
                'color: white;" onclick="changeBaseLayer(\'' + filter + '\')">' + filter.toUpperCase() + '</button>\n';
        } else {
            txt += '<button id="' + filter + 'Button" class="layerButton" type="button" onclick="changeBaseLayer(\'' +
            filter + '\')">' + filter.toUpperCase() + '</button>\n';
        }
    }
    filterButtonsContainer.innerHTML = txt;
    layerButtons = document.getElementsByClassName("layerButton");
    for (l=0; l<layerButtons.length; l++) {
        if (mobile & $(window).height() > $(window).width()) {
            layerButtonWidth = ($(window).width() - 10.)/filtersPerRow + "px";
        } else { layerButtonWidth = 300./filtersPerRow + "px"; }
        layerButtons[l].style.width = layerButtonWidth;
        layerButtons[l].style.backgroundSize = layerButtonWidth + " 32px";
    }
}

// changes base layer when layer button clicked
function changeBaseLayer(layer) {
    prev = currentLayer;
    if (layer == prev) { return; }
    if (filters.includes("bcgs")) {
        bcgsButton = document.getElementById("bcgsButton");
        if (layer == "bcgs") {
            if (bcgsButton.style.background == "#c8c8c8" | bcgsButton.style.background == "rgb(200, 200, 200)") {
                return;
            }
            if (bcgsLayer) {
                baseMaps[prev].bringToFront();
                bcgsButton.style.color = "black";
                bcgsButton.style.background = "white";
                bcgsLayer = false;
                qvbcgs = false;
            } else {
                baseMaps[prev+"bcgs"].bringToFront();
                bcgsButton.style.background = "#4187f5";
                bcgsButton.style.color = "white";
                bcgsLayer = true;
                qvbcgs = true;
            }
        } else {
            prevButton = document.getElementById(prev+"Button");
            currButton = document.getElementById(layer+"Button");
            prevButton.style.color = "black";
            prevButton.style.background = "white";
            currButton.style.background = "#4187f5";
            currButton.style.color = "white";
            if (layer == "seg") {
                bcgsButton.style.color = "gray";
                bcgsButton.style.background = "#c8c8c8";
                bcgsButton.style.cursor = "default";
                currButton.style.background = "#4187f5";
                currButton.style.color = "white";
                baseMaps[layer].addTo(map);
                map.removeLayer(baseMaps[prev]);
                map.removeLayer(baseMaps[prev+"bcgs"]);
            } else {
                bcgsButton.style.cursor = "pointer";
                if (bcgsLayer) {
                    bcgsButton.style.background = "#4187f5";
                    bcgsButton.style.color = "white";
                    baseMaps[layer+"bcgs"].addTo(map);
                    baseMaps[layer].addTo(map);
                    baseMaps[layer+"bcgs"].bringToFront();
                    map.removeLayer(baseMaps[prev]);
                    if (prev != "seg") {
                        map.removeLayer(baseMaps[prev+"bcgs"]);
                    }
                } else {
                    bcgsButton.style.color = "black";
                    bcgsButton.style.background = "white";
                    baseMaps[layer].addTo(map);
                    baseMaps[layer+"bcgs"].addTo(map);
                    baseMaps[layer].bringToFront();
                    map.removeLayer(baseMaps[prev]);
                    if (prev != "seg") {
                        map.removeLayer(baseMaps[prev+"bcgs"]);
                    }
                }
            }
            currentLayer= layer;
        }
    } else {
        for (f=0; f<filters.length; f++) {
            filter = filters[f].toLowerCase();
            button = document.getElementById(filter+"Button");
            if (layer == filter) {
                button.style.background = "#4187f5";
                button.style.color = "white";
                baseMaps[filter].addTo(map);
            } else {
                button.style.color = "black";
                button.style.background = "white";
                map.removeLayer(baseMaps[filter]);
            }
        }
        currentLayer= layer;
    }
    document.getElementById("map").focus();
}

function addRemoveMarkers() {
    xButton = document.getElementById("xButton");
    if (map.getZoom() >= document.getElementById("markerMinZoomLevel").value) {
        if (xButton.title.includes("Remove")) {
            removeMarkers();
            xButton.style.background = "white";
            xButton.style.color = "black";
            xButton.title = "Add object markers"
        } else { // if xButton is not pressed change color to blue and add to map
            addMarkers();
            xButton.style.background = "#4187f5";
            xButton.style.color = "white";
            xButton.title = "Remove object markers"
        }
    } else {
        tempAlert("Zoom in past "+document.getElementById("markerMinZoomLevel").value+" to view object markers.", 1500);
    }
    document.getElementById("map").focus();
}

function addMarkers() {
    if (map.getZoom() >= document.getElementById("markerMinZoomLevel").value) {
        objectMarkers.xMarkers.addTo(map);
    }
}

function removeMarkers() {
    map.removeLayer(objectMarkers.xMarkers);
}

function zoomOutCenterImageClick() {
    if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue") |
        document.getElementById("zoomOutCenterButton").style.backgroundImage == "") {
        lastCenter = "none";
        document.getElementById("zoomOutCenterButton").style.backgroundImage =
            "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
    } else {
        zoomOutCenterImage();
    }
}

function zoomOutCenterImage() {
    portrait = $(window).height()>$(window).width();
    frameRatio = $(window).height()/$(window).width();
    if (!fcb.style.backgroundImage.includes("gray") & !fcb.style.backgroundImage == "") {
        fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
    }
    lastCenter = "image";
    if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
        removeMarkers();
    }
    y = finalxySize[1]/2.-infoJSON.xyStartingPixel[1];
    lat = ylat(y);
    x = finalxySize[0]/2.-infoJSON.xyStartingPixel[0];
    lng = xlng(x);
    if (portrait) {
        frameHeight = finalxySize[1]*frameRatio; // in native image pixels
        frameWidth = finalxySize[0]; // in native image pixels
    } else {
        frameHeight = finalxySize[1];
        frameWidth = finalxySize[0]/frameRatio; // in native image pixels
    }
    topOffset = ($(topLeftContainer).height()+$(topButtonsContainer).height()/2.)/$(window).height();
    bottomOffset = $(objectInfo).height()/$(window).height();
    var chkbox = document.getElementById("objectDataCheckbox");
    if (mobile & portrait) {
        if (tableButton.style.backgroundImage.includes("blue")) {
            if (figuresButton.style.backgroundImage.includes("gray") |
                figuresButton.style.backgroundImage.includes("blue")) {
                bottomOffset =
                    Math.min(0.5, ($(objectTable).height()+$(figuresContainer).height()+
                        $(objectInfo).height())/$(window).height());
            } else {
                bottomOffset = Math.min(0.4, ($(objectTable).height()+$(objectInfo).height())/$(window).height());
            }
        } else if (figuresButton.style.backgroundImage.includes("blue")) {
            bottomOffset += $(figuresContainer).height()/$(window).height();
        }
        if (!chkbox.checked) { bottomOffset = 0; }
        newFrameHeight = (1. + topOffset - bottomOffset)*frameHeight;
        lat = ylat(y - (frameHeight - newFrameHeight)/2.);
    } else {
        topOffset = $(topLeftContainer).height()/$(window).height();
        if (chkbox.checked & tableButton.style.backgroundImage.includes("blue")) {
            if (($(window).height() - $(topLeftContainer).height() - $(objectTableContainer).height()) <
                0.5*$(window).height()) {
                newFrameWidth = (1. - ($(objectTableContainer).width() - 10.)/$(window).width())*frameWidth;
                lng = xlng(x - (frameWidth - newFrameWidth)/2.);
            }
        }
        if (figuresButton.style.backgroundImage.includes("blue")) {
            bottomOffset = $(figuresContainer).height()/$(window).height()
            if (!chkbox.checked) { bottomOffset = 0; }
            if (tableButton.style.backgroundImage.includes("blue")) {
                newFrameHeight = (1. - bottomOffset) * frameHeight;
            } else {
                if ($(window).width() <= $(topLeftContainer).width()*2.) {
                    newFrameHeight = (1. + topOffset - bottomOffset) * frameHeight;
                } else if ($(window).width() <= $(topLeftContainer).width()*4.) {
                    newFrameHeight =
                        (1. + (topOffset*(2. - $(window).width()/$(topLeftContainer).width()/2.)) - bottomOffset) *
                        frameHeight;
                } else {
                    newFrameHeight = (1. - bottomOffset) * frameHeight;
                }
            }
            lat = ylat(y - (frameHeight - newFrameHeight)/2.);
        } else if (!tableButton.style.backgroundImage.includes("blue")) {
            bottomOffset = $(objectInfo).height()/$(window).height();
            if (!chkbox.checked) { bottomOffset = 0; }
            if ($(window).width() <= $(topLeftContainer).width()*4) {
                if ($(window).width() <= $(topLeftContainer).width()*2.) {
                    newFrameHeight = (1. + topOffset - bottomOffset) * frameHeight;
                } else {
                    newFrameHeight =
                        (1. + (topOffset*(2. - $(window).width()/$(topLeftContainer).width()/2.)) - bottomOffset) *
                        frameHeight;
                }
                lat = ylat(y - (frameHeight - newFrameHeight)/2.);
            }
        }
    }
    map.setView(new L.LatLng(lat, lng), 0);
    document.getElementById("zoomOutCenterButton").style.backgroundImage =
        "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterblue.png)";
    document.getElementById("map").focus();
}

function focusCenterImageClick() {
    if (fcb.style.backgroundImage.includes("blue") & lastCenter == "focus") {
        lastCenter = "none";
        fcb.style.backgroundImage =
            "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
    } else if (fcb.style.backgroundImage.includes("white")) {
        focusCenterImage(-1);
    } else {
        tempAlert("Click on the map first.", 1500);
    }
}

function focusCenterImage(zoomLevel) {
    portrait = $(window).height()>$(window).width();
    frameRatio = $(window).height()/$(window).width();
    if (!fcb.style.backgroundImage.includes("gray") & !fcb.style.backgroundImage == "") {
        document.getElementById("zoomOutCenterButton").style.backgroundImage =
            "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
    }
    if (zoomLevel == -1) {
        zoomLevel = map.getZoom();
    } else if (zoomLevel < 0) {
        zoomLevel = 0;
    } else if (zoomLevel > mapMaxZoom) {
        zoomLevel = mapMaxZoom;
    }
    var ilat = focusCircle.getLatLng().lat;
    var ilng = focusCircle.getLatLng().lng;
    var y = laty(ilat);
    var x = lngx(ilng);
    var lat = -1;
    var lng = -1;
    if (portrait) {
        frameHeight = finalxySize[1]*frameRatio/Math.pow(2, zoomLevel); // in native image pixels
        frameWidth = finalxySize[0]/Math.pow(2, zoomLevel); // in native image pixels
    } else {
        frameHeight = finalxySize[1]/Math.pow(2, zoomLevel);
        frameWidth = finalxySize[0]/frameRatio/Math.pow(2, zoomLevel); // in native image pixels
    }
    if ((x>=0 && x<=finalxySize[0]) && (y>=0 && y<=finalxySize[1])) {
        lastCenter = "focus";
        var chkbox = document.getElementById("objectDataCheckbox");
        topOffset = ($(topLeftContainer).height()+$(topButtonsContainer).height()/2.)/$(window).height();
        bottomOffset = $(objectInfo).height()/$(window).height();
        if (mobile & portrait) {
            if (tableButton.style.backgroundImage.includes("blue")) {
                if (figuresButton.style.backgroundImage.includes("gray") |
                    figuresButton.style.backgroundImage.includes("blue")) {
                    bottomOffset =
                        Math.min(0.5, ($(objectTable).height()+$(figuresContainer).height()+
                        $(objectInfo).height())/$(window).height());
                } else {
                    bottomOffset = Math.min(0.4, ($(objectTable).height()+$(objectInfo).height())/$(window).height());
                }
            } else if (figuresButton.style.backgroundImage.includes("blue")) {
                bottomOffset += $(figuresContainer).height()/$(window).height();
            }
            if (!chkbox.checked) { bottomOffset = 0; }
            newFrameHeight = (1. + topOffset - bottomOffset)*frameHeight;
            lat = ylat(y - (frameHeight - newFrameHeight)/2.);
        } else {
            topOffset = $(topLeftContainer).height()/$(window).height();
            if (chkbox.checked & tableButton.style.backgroundImage.includes("blue")) {
                if (($(window).height() - $(topLeftContainer).height() - $(objectTableContainer).height()) <
                    0.5*$(window).height()) {
                    newFrameWidth = (1. - ($(objectTableContainer).width() - 10.)/$(window).width())*frameWidth;
                    lng = xlng(x - (frameWidth - newFrameWidth)/2.);
                }
            }
            if (figuresButton.style.backgroundImage.includes("blue")) {
                bottomOffset = $(figuresContainer).height()/$(window).height()
                if (!chkbox.checked) { bottomOffset = 0; }
                if (tableButton.style.backgroundImage.includes("blue")) {
                    newFrameHeight = (1. - bottomOffset) * frameHeight;
                } else {
                    if ($(window).width() <= $(topLeftContainer).width()*2.) {
                        newFrameHeight = (1. + topOffset - bottomOffset) * frameHeight;
                    } else if ($(window).width() <= $(topLeftContainer).width()*4.) {
                        newFrameHeight =
                            (1. + (topOffset*(2. - $(window).width()/$(topLeftContainer).width()/2.)) - bottomOffset) *
                            frameHeight;
                    } else {
                        newFrameHeight = (1. - bottomOffset) * frameHeight;
                    }
                }
                lat = ylat(y - (frameHeight - newFrameHeight)/2.);
            } else if (!tableButton.style.backgroundImage.includes("blue")) {
                bottomOffset = $(objectInfo).height()/$(window).height();
                if (!chkbox.checked) { bottomOffset = 0; }
                if ($(window).width() <= $(topLeftContainer).width()*4) {
                    if ($(window).width() <= $(topLeftContainer).width()*2.) {
                        newFrameHeight = (1. + topOffset - bottomOffset) * frameHeight;
                    } else {
                        newFrameHeight =
                            (1. + (topOffset*(2. - $(window).width()/$(topLeftContainer).width()/2.)) - bottomOffset) *
                            frameHeight;
                    }
                    lat = ylat(y - (frameHeight - newFrameHeight)/2.);
                }
            }
        }
        if (lat == -1) {lat = ilat;}
        if (lng == -1) {lng = ilng;}
        focusOffsetLat = (ilat - lat);
        focusOffsetLng = (ilng - lng);
        map.setView(new L.LatLng(lat, lng), zoomLevel);
        fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterblue.png)";
        document.getElementById("zoomOutCenterButton").style.backgroundImage =
            "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
    } else {
        fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscentergray.png)";
    }
    document.getElementById("map").focus();
}

// Zoom in/out functions
// Control the displayed +/- buttons and the zoom level of map
function zoomInMap() {
    currentZoomLevel = map.getZoom();
    if (currentZoomLevel < mapMaxZoom) {
        // round to the nearest zoom interval [zDelta = 0.5]
        var roundedZoomLevel = Math.floor((currentZoomLevel+zDelta)*2)/2.;
        if (roundedZoomLevel >= mapMaxZoom) {
            roundedZoomLevel = mapMaxZoom;
        }
        if (fcb.style.backgroundImage.includes("blue")) {
            focusCenterImage(roundedZoomLevel);
        } else {
            map.setZoom(roundedZoomLevel);
        }
        document.getElementById("zoomLevel").placeholder = roundedZoomLevel.toFixed(2);
        scaleBarUpdate();
    } else {
        document.getElementById("zoomInButton").style.cursor = "default";
    }
    document.getElementById("map").focus();
}

function zoomOutMap() {
    currentZoomLevel = map.getZoom();
    if (currentZoomLevel > 0) {
        // round to the nearest zoom interval [zDelta = 0.5]
        var roundedZoomLevel = Math.ceil((currentZoomLevel-zDelta)*2)/2.;
        if (roundedZoomLevel <= 0) {
            roundedZoomLevel = 0;
        }
        if (fcb.style.backgroundImage.includes("blue")) {
            focusCenterImage(roundedZoomLevel);
        } else {
            map.setZoom(roundedZoomLevel);
        }
        document.getElementById("zoomLevel").placeholder = roundedZoomLevel.toFixed(2);
        scaleBarUpdate();
    } else {
        document.getElementById("zoomOutButton").style.cursor = "default";
    }
    document.getElementById("map").focus();
}

function zoomInGray() {
    zoomOutWhite();
    document.getElementById("zoomInButton").style.background = "#c8c8c8";
}

function zoomInWhite() {
    if (map.getZoom() < mapMaxZoom) {
        document.getElementById("zoomInButton").style.background = "white";
        document.getElementById("zoomInButton").style.color = "black";
        document.getElementById("zoomOutButton").style.cursor = "pointer";
    }
}

function zoomOutGray() {
    zoomInWhite();
    document.getElementById("zoomOutButton").style.background = "#c8c8c8";
}

function zoomOutWhite() {
    if (map.getZoom() > 0) {
        document.getElementById("zoomOutButton").style.background = "white";
        document.getElementById("zoomOutButton").style.color = "black";
        document.getElementById("zoomOutButton").style.cursor = "pointer";
    }
}

function zoomkey(event, form) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        if (form.zoomnum.value == "") {
            document.getElementById("zoomLevel").value = "";
            document.getElementById("map").focus();
        }
        if (form.zoomnum.value != "") {
            zoomLevel = form.zoomnum.value;
            if (zoomLevel <= 0) {
                zoomLevel = 0;
                document.getElementById("zoomLevel").value = "";
                document.getElementById("zoomLevel").placeholder = "0.00";
            } else if (zoomLevel >= mapMaxZoom) {
                zoomLevel = mapMaxZoom;
                document.getElementById("zoomLevel").value = "";
                document.getElementById("zoomLevel").placeholder = mapMaxZoom.toFixed(2);
            }
            if (fcb.style.backgroundImage.includes("blue")) {
                focusCenterImage(zoomLevel);
            } else {
                map.setZoom(zoomLevel);
            }
        }
        document.getElementById("map").focus();
    }
}

function figureZoomIn(num) {
    if (num == -1) {
        document.getElementById("figureZoomInBackground").style.display = "none";
        document.getElementById("zoomFigsContainer").style.display = "none";
        document.getElementById("map").focus();
    } else {
        document.getElementById("figureZoomInBackground").style.display = "block";
        document.getElementById("zoomFigsContainer").style.display = "block";
        figs = document.getElementsByClassName("figure");
        good = [];
        minheight = $(window).height()*0.8;
        maxwidth = 0;
        for (f=0; f<figs.length; f++) {
            if (figs[f].id.includes("zoom") & figs[f].style.display == "inline-block") {
                good.push(figs[f]);
                ht = $(figs[f]).height();
                wd = $(figs[f]).width();
                if (ht < minheight) {
                    minheight = ht;
                }
                if (wd > maxwidth) {
                    maxwidth = wd;
                    if ((ht*0.9*$(window).width()/wd) < minheight) {
                        minheight = (ht*0.9*$(window).width()/wd);
                    }
                }
            }
        }
        minheight = Math.max(minheight, 0.5*$(window).height())
        document.getElementById("zoomFigsContainer").style.height = minheight + "px";
        document.getElementById("zoomFigsLeft").style.width =
            Math.max(0, ($(window).width() - $(good[0]).width())/2.) + "px";
        document.getElementById("zoomFigsRight").style.width =
            Math.max(0, ($(window).width() - $(good[good.length-1]).width())/2.) + "px";
        document.getElementById("zoomFigsContainer").style.bottom = ($(window).height() - $(good[0]).height())/2. + "px";
        document.getElementById("zoomFigsContainer").scrollLeft +=
            $(document.getElementById("zoomfigure"+figNames[num])).position().left - $(window).width()/2. +
            $(document.getElementById("zoomfigure"+figNames[num])).width()/2.;
    }
}

$(document).on("keydown", function (e) {
    if (document.getElementById("zoomFigsContainer").style.display == "block" & e.keyCode === 27) { // ESC
        figureZoomIn(-1);
    }
});

// Coordinates are in [y,x] and [lat, lng]
// Following conversions are between x,y (pixel) size of image, lng,lat bounds of map, and ra,dec coords.
// Make sure to convert back to original x and y coordinates
function lngx(lng) { // converts lng to original x
    x = (lng-(imDisp-iwWd)/2.)*(finalxySize[0]/imDisp)-(infoJSON.xyStartingPixel[0]);
    return x;
}

function xlng(x) { // converts original x to lng
    lng = (x+(infoJSON.xyStartingPixel[0]))/(finalxySize[0]/imDisp)+(imDisp-iwWd)/2.;
    return lng;
}

function laty(lat) { // converts lat to original y
    y = (lat-(imDisp-iwHt)/2.)*(finalxySize[1]/imDisp)-(infoJSON.xyStartingPixel[1]);
    return y;
}

function ylat(y) { // converts original y to lat
    lat = (y+(infoJSON.xyStartingPixel[1]))/(finalxySize[1]/imDisp)+(imDisp-iwHt)/2.;
    return lat;
}

function xra(x) { // converts original x to ra
    ra = (infoJSON.raEq[0])*x+(infoJSON.raEq[1]);
    return ra;
}

function rax(ra){ // converts ra to original x
    x = (ra-(infoJSON.raEq[1]))/(infoJSON.raEq[0]);
    return x;
}

function ydec(y) { // converts original y to dec
    dec = (infoJSON.decEq[0])*y+(infoJSON.decEq[1]);
    return dec;
}

function decy(dec) { // converts dec to original y
    y = (dec-(infoJSON.decEq[1]))/(infoJSON.decEq[0]);
    return y;
}

function getid(x, y){  // uses x and y position to find object at location
    if ((x>=0 && x<=finalxySize[0]) && (y>=0 && y<=finalxySize[1])) {
        fcb.style.cursor = "pointer";
        // Read in seg JSON file
        var xhReq = new XMLHttpRequest();
        var segurl = fieldName+"/JSON/seg/"+x+".js?version=1";
        xhReq.open("GET", segurl, false);
        xhReq.send(null);
        var segJSON = JSON.parse(xhReq.responseText);
        RA = xra(x); // converts x to RA
        DEC = ydec(y); // converts y to dec

        id = Number(segJSON[y]) // finds id number for object at location
        if (IDs.includes(id) | (id >= 1 && id <= maxID)) {
            if (group == "hff") {
                if (id > 20000) {
                    xind = maxID+id-20001; // finds x-loc of object in jsonxy
                    yind = maxID*2+(maxBCG-20000)+id-20001;  // number of objects in cat+id to get y-loc in jsonxy
                } else {
                    xind = id-1; // finds x-loc of object in jsonxy
                    yind = maxID+(maxBCG-20000)+id-1;  // number of objects in cat+id to get y-loc in jsonxy
                }
            } else {
                xind = id-1; // finds x-loc of object in jsonxy
                yind = maxID+id-1;  // number of objects in cat+id to get y-loc in jsonxy
            }
            x = xyJSON[xind] // sets x-loc
            y = xyJSON[yind] // set y-loc
            objLng = xlng(x); // converts x to lng (center of object)
            objLat = ylat(y); // converts y to lat
            xcord = Math.round(x); // rounds x to get coord to display
            ycord = Math.round(y); // rounds y to get coord to display
            RA = xra(x); // converts x to RA
            DEC = ydec(y); // converts y to dec
            if (id > 20000) {
                ind = indJSON[maxID+id-20001];
            } else {
                ind = indJSON[id-1];
            }
            if (ind != -1) {
                RA = infoJSON.data[ind].ra;
                DEC = infoJSON.data[ind].dec;
                tabletxt = '<table vertical-align="middle" width="100%" style="margin: 0px; table-layout: fixed;">';
                count = 0;
                tableCellWidth = $(objectInfo).width() * 0.25;
                for (t=0; t<catNames.length; t++) {
                    if (good_catNames.includes(catNames[t])) {
                        if (count%2 == 0) { //even
                            tabletxt += '<tr>';
                        }
                        // RA/DEC: 5 significant figures
                        if (tableNames[t] == 'RA' | tableNames[t] == 'DEC') {
                            tabletxt +=
                                '<th style="width: ' + tableCellWidth + 'px; max-width: ' + tableCellWidth + 'px;">' +
                                tableNames[t] + '</th><th style="width: ' + tableCellWidth + 'px; max-width: ' +
                                tableCellWidth + 'px; ">' + infoJSON.data[ind][catNames[t]].toFixed(5) + '</th>';
                        } else {
                            tabletxt +=
                                '<th style="width: ' + tableCellWidth + 'px; max-width: ' + tableCellWidth + 'px;">' +
                                tableNames[t] + '</th><th style="width: ' + tableCellWidth + 'px; max-width: ' +
                                tableCellWidth + 'px; ">' +
                            infoJSON.data[ind][catNames[t]] + '</th>';
                        }
                        if (count%2 != 0) { //odd
                            tabletxt += '</tr>';
                        }
                        count += 1;
                    }
                }
                // if odd number of catalog entries, add blank cell at end of table
                if (good_catNames.length%2 != 0) {
                    tabletxt += '<th width="20%"></th><th width="30%"></th></tr>';
                }
                tabletxt += '</table>';
                document.getElementById("objectTable").innerHTML=tabletxt; // changes iframe display on main page
                if (tableButton.title.includes("Hide")) {
                    tableButton.style.backgroundImage =
                        "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tableblue.png";
                }
                if (group == "grizli") {
                    idtxt = id.toString();
                    if (id < 10) {
                        idtxt = '0000'+idtxt;
                    }
                    if (id >= 10 && id < 100) {
                        idtxt = '000'+idtxt;
                    }
                    if (id >= 100 && id < 1000) {
                        idtxt = '00'+idtxt;
                    }
                    if (id >= 1000 && id < 10000) {
                        idtxt = '0'+idtxt;
                    }
                    for (f=0; f<figNames.length; f++) {
                        if (good_figNames.includes(figNames[f])) {
                            figurl =
                                figures.url[f].replace(/fieldname/g,
                                    fieldName.replace("+","%2B")).replace(/objectid/g, idtxt);
                            document.getElementById("figure"+figNames[f]).src = figurl;
                            document.getElementById("zoomfigure"+figNames[f]).src = figurl;
                            document.getElementById("figure"+figNames[f]).title = figNames[f];
                        }
                    }
                } else if (group == "hff") {
                    idtxt = id.toString();
                    idx = Math.floor(id/100)*100;
                    for (f=0; f<figNames.length; f++) {
                        if (good_figNames.includes(figNames[f])) {
                            figurl =
                                figures.url[f].replace(/fieldname/g,
                                    fieldName).replace(/objectid/g, idtxt).replace(/index/, idx.toString());
                            document.getElementById("figure"+figNames[f]).src = figurl;
                            document.getElementById("zoomfigure"+figNames[f]).src = figurl;
                            document.getElementById("figure"+figNames[f]).title = figNames[f];
                        }
                    }
                }
                if (figuresButton.title.includes("Hide")) {
                    figuresButton.style.backgroundImage =
                        "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresblue.png)";
                    for (f=0; f<figNames.length; f++) {
                        if (good_figNames.includes(figNames[f])) {
                            document.getElementById("figure"+figNames[f]).style.display = "inline-block";
                            document.getElementById("zoomfigure"+figNames[f]).style.display = "inline-block";
                        } else {
                            document.getElementById("figure"+figNames[f]).style.display = "none";
                            document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
                        }
                    }
                    if (group == "hff" & id > 20000) {
                        document.getElementById("figureDetection").style.display = "none";
                        document.getElementById("zoomfigureDetection").style.display = "none";
                        document.getElementById("figureMagnification").style.display = "none";
                        document.getElementById("zoomfigureMagnification").style.display = "none";
                    }
                    if (mobile) {
                        if (portrait) {
                            document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "block";
                            var tableDivMarginBottom = Math.max($(window).height()*0.16, 79) + 52;
                            var tableMaxHeight = Math.min(($(window).height()*0.5), ($(window).height() - 196))
                            document.getElementById("objectTableDiv").style.marginBottom = tableDivMarginBottom+"px";
                            document.getElementById("objectTableContainer").style.maxHeight = tableMaxHeight+"px";
                        }
                    }
                }
                if (map.getZoom() == 0 &&
                    document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue") &&
                    lastCenter == "image") {
                    zoomOutCenterImage();
                }
            } else {
                if (tableButton.title.includes("Hide")) {
                    tableButton.style.backgroundImage =
                        "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablegray.png)";
                }
                if (figuresButton.title.includes("Hide")) {
                    figuresButton.style.backgroundImage =
                        "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresgray.png)";
                }
                document.getElementById("objectTableDiv").style.marginBottom = "52px";
                document.getElementById("objectTable").innerHTML =
                    '<div style="height: 27px; padding: 6px; background: white;">Object data unavailable</div>';
                document.getElementById("objectTable").style.textAlign = "center";
                document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "none";
                for (f=0; f<figNames.length; f++) {
                    document.getElementById("figure"+figNames[f]).style.display = "none";
                    document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
                    document.getElementById("figure"+figNames[f]).src = "none";
                    document.getElementById("zoomfigure"+figNames[f]).src = "none";
                }
                if (map.getZoom() == 0 &&
                    document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
                    zoomOutCenterImage();
                }
            }
            if (group == "grizli") {
                if (DEC < 0) {
                    // changes text above iframe
                    txt =
                        '<big><a style="color: #2BA6CB" href="http://vizier.u-strasbg.fr/viz-bin/VizieR?-c=' + RA +
                        '-' + DEC + '&-c.rs=2" target="_blank">Object ID: ' + id + '</a></big>';
                } else {
                    // changes text above iframe
                    txt =
                        '<big><a style="color: #2BA6CB" href="http://vizier.u-strasbg.fr/viz-bin/VizieR?-c=' + RA +
                        '+' + DEC + '&-c.rs=2" target="_blank">Object ID: ' + id + '</a></big>';
                }
            } else if (group == "hff") {
                index = Math.floor(id/100)*100;
                txt =
                    '<big><a style="color: #2BA6CB" href="' + mainDir + 'object_pages/?field=' + fieldName + '&id=' +
                    id + '" target="_blank">Object ID: ' + id + '</a></big>';
            }
            document.getElementById("objectLink").innerHTML = txt; // changes object link on main page
            document.getElementById("objectLink").style.cursor = "pointer";
            zoomlevel = map.getZoom();
            focusCircle.setLatLng([objLat, objLng]); // moves circle to center of obj
            focusCircle.setRadius(5*(zoomlevel+1)); // changes radius of circle so it appears
            if (document.getElementById("searchID").value == id &&
                (document.getElementById("menuContainer").style.display != "block" |
                (document.getElementById("menuContainer").style.display == "block" &&
                fcb.style.backgroundImage.includes("blue")))) {
                fcb.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterblue.png)";
                document.getElementById("searchRADEC").value = RA.toFixed(5)+", "+DEC.toFixed(5);
                focusCenterImage(-1);
            } else {
                fcb.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
                document.getElementById("searchID").value = id;
                document.getElementById("searchRADEC").value = RA.toFixed(5)+", "+DEC.toFixed(5);
            }
        } else {
            fcb.style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
            document.getElementById("searchID").value = "";
            document.getElementById("searchRADEC").value = RA.toFixed(5)+", "+DEC.toFixed(5);
            if (tableButton.title.includes("Hide")) {
                tableButton.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablegray.png)";
            }
            if (figuresButton.title.includes("Hide")) {
                figuresButton.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresgray.png)";
            }
            document.getElementById("objectLink").innerHTML = "Click on an object";
            document.getElementById("objectLink").style.cursor = "default";
            document.getElementById("objectTableDiv").style.marginBottom = "52px";
            document.getElementById("objectTable").innerHTML = "";
            document.getElementById("objectTable").display = "none";
            document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "none";
            for (f=0; f<figNames.length; f++) {
                document.getElementById("figure"+figNames[f]).style.display = "none";
                document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
                document.getElementById("figure"+figNames[f]).src = "none";
                document.getElementById("zoomfigure"+figNames[f]).src = "none";
            }
        }
    } else {
        fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscentergray.png)";
        fcb.style.cursor = "default";
        document.getElementById("searchID").value = "";
        document.getElementById("searchRADEC").value = "";
        if (tableButton.title.includes("Hide")) {
            tableButton.style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablegray.png)";
        }
        if (figuresButton.title.includes("Hide")) {
            figuresButton.style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresgray.png)";
        }
        document.getElementById("objectLink").innerHTML = "Click on an object";
        document.getElementById("objectLink").style.cursor = "default";
        document.getElementById("objectTableDiv").style.marginBottom = "52px";
        document.getElementById("objectTable").innerHTML = "";
        document.getElementById("objectTable").display = "none";
        document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "none";
        for (f=0; f<figNames.length; f++) {
            document.getElementById("figure"+figNames[f]).style.display = "none";
            document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
            document.getElementById("figure"+figNames[f]).src = "none";
            document.getElementById("zoomfigure"+figNames[f]).src = "none";
        }
    }
    if (map.getZoom() == 0 && document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
        zoomOutCenterImage();
    }
}

function fieldFocus() {
    fieldinput = document.getElementById("fieldinput");
    if (mobile | ipad) {
        fieldinput.focus();
        fieldinput.setSelectionRange(0, fieldinput.value.length);
    } else {
        $(fieldinput).select();
    }
    document.getElementById("menuBackground").style.display = "block";
    lines = document.getElementsByClassName("topVertical");
    for (l=0; l<lines.length; l++) {
        lines[l].style.backgroundColor = "#b3b3b3";
    }
    hideMenu("fieldinput");
}

function fieldkeydown(e) {
    var key = e.keyCode;
    if (key == 13) {
        e.preventDefault();
        openFieldPage(document.getElementById("fieldinput"));
    }
}

function openFieldPage(fInput) {
    document.getElementById("menuBackground").style.display = "none";
    fName = fInput.value;
    var fieldinput = document.getElementById("fieldinput");
    if (fName == '') {
        fieldinput.value = fieldName;
    } else {
        if (!fields.includes(fName)) {
            fieldinput.value = fieldName;
            return;
        } else if (fieldName != fName) {
            fieldName = fName;
            newurl(window.location.toString().split("?")[0]+"?field="+fieldName);
            setup(false);
            trackxy =
                '<span class="cursorColOne">X</span><span class="cursorColTwo">-</span><span class="cursorColThree">Y' +
                '</span><span class="cursorColFour">-</span>';
            trackradec =
                '<span class="cursorColOne">RA</span><span class="cursorColTwo">-</span><span class="cursorColThree">' +
                'DEC</span><span class="cursorColFour">-</span>';
            document.getElementById("cursorXY").innerHTML=trackxy;
            document.getElementById("cursorRADEC").innerHTML=trackradec;
        }
    }
    $(document.getElementById("map")).focus()
}

function menuReset() {
    document.getElementById("subMenuHeaders").style.display = "none";
    document.getElementById("subMenus").style.display = "none";
    subMenuContainers = document.getElementsByClassName("subMenu");
    for (m=0; m<subMenuContainers.length; m++) {
        sM = subMenuContainers[m];
        sM.style.display = "none";
    }
    menuAlerts = document.getElementsByClassName("menuAlert");
    for (m=0; m<menuAlerts.length; m++) {
        sA = menuAlerts[m];
        sA.innerHTML = "";
    }
    menuOptions = document.getElementsByClassName("menuOption");
    for (o=0; o<menuOptions.length; o++) {
        menuOptions[o].style.display = "none";
        children = menuOptions[o].children;
        for (c=0; c<children.length; c++) {
            child = children[c];
            child.style.backgroundColor = "white";
            child.style.color = "black";
            if (child.id.includes("Blue")) {
                child.style.display = "none";
            }
        }
    }
}

function showHideMenu() {
    closeAdvSrch();
    menuOptions = document.getElementsByClassName("menuOption");
    if (!fields.includes(document.getElementById("fieldinput").value)) {
        document.getElementById("fieldinput").value = fieldName;
    }
    if (document.getElementById("menuButton").title == "Open menu") {
        document.getElementById("menuContainer").focus();
        document.getElementById("menuButton").title = "Close menu";
        document.getElementById("menuContainer").style.display = "block";
        document.getElementById("menuBackground").style.display = "block";
        for (o=0; o<menuOptions.length; o++) {
            menuOptions[o].style.display = "block";
        }
    } else {
        document.getElementById("menuButton").title = "Open menu";
        document.getElementById("menuContainer").style.display = "none";
        document.getElementById("menuBackground").style.display = "none";
        menuReset();
        document.getElementById("map").focus();
    }
}

function showSubMenu(input) {
    if (input == "UserGuide") {
        window.open("http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/HFFexplorer%20User%20Guide.pdf", '_blank');
    } else {
        document.getElementById("subMenuHeaders").style.display = "block";
        document.getElementById("subMenus").style.display = "block";
        subMenuContainers = document.getElementsByClassName("subMenu");
        for (m=0; m<subMenuContainers.length; m++) {
            sM = subMenuContainers[m];
            sMH = document.getElementById(sM.id+"Header");
            if (sM.id.includes(input)) {
                sM.style.display = "block";
                sMH.style.display = "block";
                document.getElementById(sM.id+"Text").style.backgroundColor = "#4187f5";
                document.getElementById(sM.id+"Text").style.color = "white";
                document.getElementById(sM.id+"IconBlue").style.display = "block";
            } else {
                sM.style.display = "none";
                sMH.style.display = "none";
                document.getElementById(sM.id+"Text").style.backgroundColor = "white";
                document.getElementById(sM.id+"Text").style.color = "black";
                document.getElementById(sM.id+"IconBlue").style.display = "none";
            }
        }
        menuSizing();
        if (input == "advancedSearch") {
            advancedSearchResizeFilterBounds();
        }
    }
}

function hideMenu(from) {
    document.getElementById("menuButton").title = "Open menu";
    document.getElementById("menuContainer").style.display = "none";
    menuReset();
    if (from != "fieldinput") {
        document.getElementById("menuBackground").style.display = "none";
        document.getElementById("map").focus();
        if (!fields.includes(document.getElementById("fieldinput").value)) {
            document.getElementById("fieldinput").value = fieldName;
        }
    }
}

function showSubSettings(input) {
    settingsOptions = document.getElementsByClassName("settingsOption");
    settingsPages = document.getElementsByClassName("settingsContainer");
    for (i=0; i<settingsOptions.length; i++) {
        if (settingsOptions[i].innerHTML.toLowerCase() == input) {
            settingsOptions[i].style.backgroundColor = "#4187f5";
            settingsOptions[i].style.color = "white";
        } else {
            if (settingsOptions[i].innerHTML.toLowerCase() == "markers") {
                if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
                    settingsOptions[i].style.backgroundColor = "white";
                    settingsOptions[i].style.color = "black";
                }
            } else {
                settingsOptions[i].style.backgroundColor = "white";
                settingsOptions[i].style.color = "black";
            }
        }
        if (settingsPages[i].id.includes(input)) {
            settingsPages[i].style.display = "block";
            if (settingsOptions[i].innerHTML.toLowerCase() == "markers") {
                advancedSearchResizeFilterBounds();
            }
        } else {
            settingsPages[i].style.display = "none";
        }
    }
}

function mapBrightness() {
    b = 0.5 + slider.value/66.
    document.getElementById("map").style.filter = "brightness("+b+")";
    document.getElementById("map").style.webkitFilter = "brightness("+b+")";
    addFocusCircle();
    searches = document.getElementsByClassName("advSearch");
    for (s=searches.length-1; s>=0; s--) {
        addSearchMarkers(searches[s].id.split("search")[1]);
    }
    if (groupJSON.defaultMarkerOptions.hasOwnProperty('markerColors')) {
        removeMarkers();
        updateMarkers();
        if (document.getElementById("xButton").style.color == "white") {
            addMarkers();
        }
    }
    document.getElementById("map").focus();
}

function mapSettingsCheckbox(input) {
    if (input == "objectData") {
        var chkbox = document.getElementById(input+"Checkbox");
        if (chkbox.checked) {
            document.getElementById("objectInfo").style.display = "block";
            if (tableButton.style.backgroundImage.includes("blue")) {
                document.getElementById("objectTableContainer").style.display = "block";
            }
            if (figuresButton.style.backgroundImage.includes("blue")) {
                document.getElementById("figuresContainer").style.display = "block";
                if (mobile & portrait) {
                    document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "block";
                }
            }
        } else {
            document.getElementById("objectInfo").style.display = "none";
            if (tableButton.style.backgroundImage.includes("blue")) {
                document.getElementById("objectTableContainer").style.display = "none";
            }
            if (figuresButton.style.backgroundImage.includes("blue")) {
                document.getElementById("figuresContainer").style.display = "none";
                if (mobile & portrait) {
                    document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "none";
                }
            }
        }
        if (fcb.style.backgroundImage.includes("blue")) {
            focusCenterImage(-1);
        } else if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
            zoomOutCenterImage();
        }
    } else {
        var cont = document.getElementById(input);
        var chkbox = document.getElementById(input+"Checkbox");
        if (chkbox.checked) {
            cont.style.display = "block";
        } else {
            cont.style.display = "none";
        }
        if (document.getElementById("searchContainerCheckbox").checked) {
            sCCheckbox = 1;
        } else { sCCheckbox = 0; }
        if (document.getElementById("cursorTrackerContainerCheckbox").checked) {
            cTCCheckbox = 1;
        } else { cTCCheckbox = 0; }
        if (fcb.style.backgroundImage.includes("blue")) {
            focusCenterImage(-1);
        } else if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue") |
                   document.getElementById("zoomOutCenterButton").style.backgroundImage == "") {
            zoomOutCenterImage();
        }
        if (mobile) {
            if (portrait) {
                document.getElementById("tempAlert").style.top = (136 + 32*numFilterRows + 49*sCCheckbox)+"px";
            } else {
                document.getElementById("objectTableContainer").style.maxHeight =
                    ($(window).height() - 144 - 32*numFilterRows - 49*sCCheckbox)+"px";
            }
        }
        document.getElementById("topButtonsContainer").style.top =
            $(topLeftContainer).offset().top+$(topLeftContainer).height()+"px"
    }
}

function configureDataSettings() {
    for (t=0; t<catNames.length; t++) {
        if (good_catNames.includes(catNames[t])) {
            chkd = " checked";
        } else { chkd = " unchecked"; }
        if (t%2 == 0) { //even: first column
            document.getElementById("tableSettingsColOne").innerHTML +=
                '<div class="menuCheckboxes menuLeftEdge menuVertClose" onclick="tableSettingsCheckbox(\'' +
                catNames[t] + '\')" title="' + tableDiscs[t] + '"><label for="' + catNames[t] +
                '_Checkbox"><input id="' + catNames[t] + '_Checkbox" type="checkbox"' + chkd + '><span>' +
                tableNames[t] + '</span></label></div><br>'
        } else { //odd: second column
            document.getElementById("tableSettingsColTwo").innerHTML +=
                '<div class="menuCheckboxes menuLeftEdge menuVertClose" onclick="tableSettingsCheckbox(\'' +
                catNames[t] + '\')" title="' + tableDiscs[t] + '"><label for="' + catNames[t] +
                '_Checkbox"><input id="' + catNames[t] + '_Checkbox" type="checkbox"' + chkd + '><span>' +
                tableNames[t] + '</span></label></div><br>'
        }
    }
    // update once Kalina's flags are added
    if (group == "grizli") {
        document.getElementById("K_1_Checkbox").disabled = true;
        document.getElementById("K_2_Checkbox").disabled = true;
        document.getElementById("K_1_Checkbox").style.cursor = "default";
        document.getElementById("K_2_Checkbox").style.cursor = "default";
    }

    ////////////////////////////////////////////////////////
    for (f=0; f<figNames.length; f++) {
        if (good_figNames.includes(figNames[f])) {
            chkd = " checked";
        } else { chkd = " unchecked"; }
        if (f%2 == 0) { //even: first column
            document.getElementById("figureSettingsColOne").innerHTML +=
                '<div class="menuCheckboxes menuLeftEdge menuVertClose" onclick="figureSettingsCheckbox(\'' +
                figNames[f] + '\')"><label for="' + figNames[f] + '_Checkbox"><input id="' + figNames[f] +
                '_Checkbox" type="checkbox"' + chkd + '><span>' + figNames[f] + '</span></label></div><br>'
        } else { //odd: second column
            document.getElementById("figureSettingsColTwo").innerHTML +=
                '<div class="menuCheckboxes menuLeftEdge menuVertClose" onclick="figureSettingsCheckbox(\'' +
                figNames[f] + '\')"><label for="' + figNames[f] + '_Checkbox"><input id="' + figNames[f] +
                '_Checkbox" type="checkbox"' + chkd + '><span>' + figNames[f] + '</span></label></div><br>'
        }
    }
}

function tableSettingsCheckbox(input) {
    // remove from good_catNames
    if (!document.getElementById(input+"_Checkbox").checked && good_catNames.includes(input) &&
        !document.getElementById(input+"_Checkbox").disabled) {
        var index = good_catNames.indexOf(input);
        if (index > -1) { good_catNames.splice(index, 1); }
    } else if (!good_catNames.includes(input) && !document.getElementById(input+"_Checkbox").disabled) {
        // add to good_catNames
        good_catNames.push(input);
    }
    // reload table by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
}

function figureSettingsCheckbox(input) {
    // remove from good_figNames
    if (!document.getElementById(input+"_Checkbox").checked && good_figNames.includes(input) &&
        !document.getElementById(input+"_Checkbox").disabled) {
        var index = good_figNames.indexOf(input);
        if (index > -1) { good_figNames.splice(index, 1); }
    } else if (!good_figNames.includes(input) && !document.getElementById(input+"_Checkbox").disabled) {
        // add to good_figNames
        good_figNames.push(input);
    }
    // reload figures by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
}

function checkAllTable() {
    for (t=0; t<catNames.length; t++) {
        if (!document.getElementById(catNames[t]+"_Checkbox").checked &&
            !document.getElementById(catNames[t]+"_Checkbox").disabled) {
            document.getElementById(catNames[t]+"_Checkbox").checked = true;
            good_catNames.push(catNames[t]);
        }
    }
    // reload table by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
    document.getElementById("tableCheckboxButton").onclick = function(){uncheckAllTable()};
}

function uncheckAllTable() {
    for (t=0; t<catNames.length; t++) {
        if (document.getElementById(catNames[t]+"_Checkbox").checked &&
            !document.getElementById(catNames[t]+"_Checkbox").disabled) {
            document.getElementById(catNames[t]+"_Checkbox").checked = false;
            var index = good_catNames.indexOf(catNames[t]);
            if (index > -1) { good_catNames.splice(index, 1); }
        }
    }
    // reload table by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
    document.getElementById("tableCheckboxButton").onclick = function(){checkAllTable()};
}

function checkAllFigures() {
    for (f=0; f<figNames.length; f++) {
        if (!document.getElementById(figNames[f]+"_Checkbox").checked &&
            !document.getElementById(figNames[f]+"_Checkbox").disabled) {
            document.getElementById(figNames[f]+"_Checkbox").checked = true;
            good_figNames.push(figNames[f]);
        }
    }
    // reload table by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
    document.getElementById("figureCheckboxButton").onclick = function(){uncheckAllFigures()};
}

function uncheckAllFigures() {
    for (f=0; f<figNames.length; f++) {
        if (document.getElementById(figNames[f]+"_Checkbox").checked &&
            !document.getElementById(figNames[f]+"_Checkbox").disabled) {
            document.getElementById(figNames[f]+"_Checkbox").checked = false;
            var index = good_figNames.indexOf(figNames[f]);
            if (index > -1) { good_figNames.splice(index, 1); }
        }
    }
    // reload table by executing getid function
    fCX = Math.round(lngx(focusCircle.getLatLng().lng));
    fCY = Math.round(laty(focusCircle.getLatLng().lat));
    getid(fCX, fCY);
    document.getElementById("figureCheckboxButton").onclick = function(){checkAllFigures()};
}

function newAdvancedSearch() {
    document.getElementById("tempASMessage").style.display = "none";
    advSrchCount++;
    if (advSrchCount <= advSrchColors.length) {
        color = advSrchColors[advSrchCount - 1];
        if (advSrchCount == 1) {
            asb.title = "View search results";
        }
    } else {
        color = randomColor(255, 510);
    }
    advSearchButtons = document.getElementsByClassName("advancedSearchOption");
    for (i=0; i<advSearchButtons.length; i++) {
        advSearchButtons[i].style.border = "none";
    }
    document.getElementById("advancedSearchButtons").innerHTML =
        '<button id="search' + advSrchCount + 'Button" class="advancedSearchOption" title="Search ' + advSrchCount +
        '" style="border: 2px solid #4187f5;" onclick="advancedSearch(' + advSrchCount + ')"><div id="search' +
        advSrchCount + 'ButtonCircle" class="circleContainer" style="margin: 0; border-color: ' + color +
        ';"></div></button>' + document.getElementById("advancedSearchButtons").innerHTML;
    advSearches = document.getElementsByClassName("advSearch");
    searchNames = [];
    for (i=0; i<advSearches.length; i++) {
        advSearches[i].style.display = "none";
        sName = advSearches[i].id;
        searchNames.push(document.getElementById(sName+"Name").value);
    }
    document.getElementById("advancedSearch").innerHTML =
        '<div id="search' + advSrchCount + '" class="advSearch">' + '<input id="search' + advSrchCount + 'Name" ' +
        'type="text" autocorrect="off" class="menuInput advancedSearchName menuLeftEdge menuVertClose" value="Search ' +
        advSrchCount + '" onfocus="advancedSearchNameFocus(' + advSrchCount +
        ')" onkeydown="advancedSearchNameKeyDown(event, ' + advSrchCount + ')" onblur="advancedSearchNameChange(' +
        advSrchCount + ')"><div id="search' + advSrchCount + 'ShowHide" title="Hide search" class="subMenuButton" ' +
        'style="margin: 10px 0 5px 0; width: 65px;" onclick="showHideAdvancedSearch(' + advSrchCount + ', true)">HIDE' +
        '</div><div title="Delete search" class="subMenuButton" style="margin: 10px 0 5px 0; width: 70px;" ' +
        'onclick="deleteAdvancedSearch(' + advSrchCount + ')">DELETE</div><div style="font-size: 0px;"><div ' +
        'id="search' + advSrchCount + 'Circle" class="circleContainer" style="border-color: ' + color +
        ';" onclick="advancedSearchFocusColor(' + advSrchCount + ')"></div><input id="search' + advSrchCount +
        'Color" type="text" autocorrect="off" autocapitalize="none" class="menuInput advancedSearchColor" value="' +
        color + '" onkeydown="advancedSearchColorInput(event, ' + advSrchCount +
        ', this.value)" onfocus="changeFocusValue(this)" onblur="advancedSearchColorChange(' + advSrchCount +
        ', this.value)"><div title="Enter color" class="subMenuButton" style="margin: 5px 0 0 0; width: 65px; ' +
        'vertical-align: top;" onclick="advancedSearchColorChange(' + advSrchCount + ', document.getElementById' +
        '(\'search' + advSrchCount + 'Color\').value)">ENTER</div><div title="Randomize color" class="subMenuButton" ' +
        'style="margin: 5px 0 0 0; width: 70px; vertical-align: top;" onclick="advancedSearchRandomColor(' +
        advSrchCount + ')">RANDOM</div></div><div style="margin-left: 5px; font-size: 0px;"><input id="search' +
        advSrchCount + 'ListInput" type="text" autocorrect="off" autocapitalize="none" class="menuInput" ' +
        'style="width: calc(100% - 150px); margin-right: 0; border: 1px solid #d4d4d4;" ' +
        'onfocus="this.setSelectionRange(0, this.value.length)" onkeydown="advancedSearchListInput(event, ' +
        advSrchCount + ')"><div class="subMenuButton menuVertClose" style="width: 135px; margin-left: 0;" ' +
        'onclick="advancedSearchAddList(' + advSrchCount + ')">ADD LIST OF IDS</div></div><div ' +
        'style="margin-left: 5px; font-size: 0px;"><div class="autocomplete" style="width: calc(100% - 150px); ' +
        'margin: 0; height: 30px; font-size: 0px;"><input id="search' + advSrchCount + 'FilterInput" ' +
        'class="menuInput" ' + 'type="text" autocorrect="off" autocapitalize="none" value="" style="width: 100%; ' +
        'border: 1px solid #d4d4d4;" onfocus="this.setSelectionRange(0, this.value.length)" ' +
        'onkeydown="advancedSearchFilterInput(event, ' + advSrchCount + ')"></div><div id="search' + advSrchCount +
        'FilterButton" class="subMenuButton menuVertClose" style="display: inline-block; width: 135px; ' +
        'margin: 5px 0 5px 5px;" onclick="advancedSearchAddFilter(document.getElementById(\'search' + advSrchCount +
        'FilterInput\'))">ADD FILTER</div></div><div style="width: 100%; font-size: 0px; text-align: center;">' +
        '<div id="search' + advSrchCount + 'Alert" class="menuAlert menuVertClose"></div></div><div id="search' +
        advSrchCount + 'FiltersAndLists" style="height: 100%; width: 100%; font-size: 0px;"></div>' +
        '<div style="font-size: 0px; text-align: center; margin-bottom: 5px;"><div id="search' + advSrchCount +
        'ObjectCount" class="menuText menuVertClose">Number of objects: &ndash; </div><div id="search' + advSrchCount +
        'Results" style="display: none;"></div><div id="search' + advSrchCount + 'Lngs" style="display: none;"></div>' +
        '<div id="search' + advSrchCount + 'Lats" style="display: none;"></div><div id="search' + advSrchCount +
        'CurrInd" style="display: none;">0</div></div><div style="font-size: 0px; text-align: center; ' +
        'margin-bottom: 5px;"><div class="subMenuButton" onclick="copySearchResults(' + advSrchCount +
        ')" style="width: 160px;">COPY SEARCH RESULTS</div></div><div id="search' + advSrchCount +
        'FilterInputAutocompleteContainer" style="position: absolute; top: 120px; left: 10px; height: 0px; ' +
        'width: calc(100% - 155px);"></div></div>' + document.getElementById("advancedSearch").innerHTML;
    for (i=1; i<advSearches.length; i++) {
        sName = advSearches[i].id;
        document.getElementById(sName+"Name").value = searchNames[i-1];
        autocomplete(document.getElementById(sName+"FilterInput"), catNames);
    }
    autocomplete(document.getElementById("search"+advSrchCount+"FilterInput"), catNames);
}

function advancedSearch(num) {
    advSearches = document.getElementsByClassName("advSearch");
    advSearchButtons = document.getElementsByClassName("advancedSearchOption");
    for (i=0; i<advSearches.length; i++) {
        if (advSearches[i].id != "search"+num) {
            advSearches[i].style.display = "none";
            advSearchButtons[i].style.border = "none";
        }
    }
    document.getElementById("search"+num).style.display = "block";
    document.getElementById("search"+num+"Button").style.border = "2px solid #4187f5";
}

function showHideAdvancedSearch(num, menu) {
    showHide = document.getElementById("search"+num+"ShowHide");
    advSearchButton = document.getElementById("search"+num+"Button");
    if (showHide.innerHTML == "HIDE") {
        showHide.innerHTML = "SHOW";
        showHide.title = "Show search";
        advSearchButton.style.background = "#c8c8c8";
        deleteSearchMarkers(num);
        if (menu & advSrchShow.includes("search"+num)) {
            advSrchShow.splice(advSrchShow.indexOf("search"+num), 1);
        }
    } else {
        showHide.innerHTML = "HIDE";
        showHide.title = "Hide search";
        advSearchButton.style.background = "white";
        if (document.getElementById("search"+num+"Results").innerHTML != "") {
            addSearchMarkers(num);
        }
    }
}

function deleteAdvancedSearch(num) {
    deleteSearchMarkers(num);
    advSearches = document.getElementsByClassName("advSearch");
    advSearchButtons = document.getElementsByClassName("advancedSearchOption");
    if (advSearches.length > 1) {
        for (d=0; d<advSearches.length; d++) {
            if (advSearches[d].id == "search"+num) {
                if (d == 0) {
                    newNum = advSearches[d + 1].id.split("search")[1];
                } else {
                    newNum = advSearches[d - 1].id.split("search")[1];
                }
                advancedSearch(newNum);
                advSearches[d].parentElement.removeChild(advSearches[d]);
                advSearchButtons[d].parentElement.removeChild(advSearchButtons[d]);
            }
        }
        advSearches = document.getElementsByClassName("advSearch");
        searches = advSearches[0].id.split("search")[1];
        advSrchCount = Number(searches);
    } else {
        advSearches[0].parentElement.removeChild(advSearches[0]);
        advSearchButtons[0].parentElement.removeChild(advSearchButtons[0]);
        document.getElementById("tempASMessage").style.display = "block";
        advSrchCount = 0;
        asb.title = "Advanced Search";
        document.getElementById("advSrchButtonCircle").style.border = "2px solid transparent";
        document.getElementById("advSrchButtonLeft").style.display = "none";
        document.getElementById("advSrchButtonRight").style.display = "none";
    }
}

function advancedSearchNameFocus(num) {
    sName = document.getElementById("search"+num+"Name");
    if (mobile | ipad) {
        sName.focus();
        sName.setSelectionRange(0, sName.value.length);
    } else {
        sName.select();
    }
    currentFocusValue = sName.value;
}

function advancedSearchNameKeyDown(e, num) {
    var key = e.keyCode;
    if (key == 13) {
        e.preventDefault();
        document.getElementById("search"+num+"Name").blur();
    }
}

function advancedSearchNameChange(num) {
    orig = document.getElementById("search"+num+"Button").title;
    newName = document.getElementById("search"+num+"Name").value;
    advSearches = document.getElementsByClassName("advSearch");
    match = false;
    for (s=advSearches.length-1; s>=0; s--) {
        asName = document.getElementById(advSearches[s].id+"Name").value;
        if (advSearches[s].id != "search"+num & asName == newName) {
            match = true;
        }
    }
    if (match) {
        document.getElementById("search"+num+"Name").value = orig;
        if (mobile | ipad) {
            document.getElementById("search"+num+"Name").focus();
            document.getElementById("search"+num+"Name").setSelectionRange(
                0, document.getElementById("search"+num+"Name").value.length);
        } else {
            $(document.getElementById("search"+num+"Name")).select();
        }
        document.getElementById("search"+num+"Alert").innerHTML = "Search name already taken";
    } else {
        document.getElementById("search"+num+"Button").title = newName;
        document.getElementById("search"+num).innerHTML =
            document.getElementById("search"+num).innerHTML.replace("value=\""+orig, "value=\""+newName);
        document.getElementById("search"+num+"Alert").innerHTML = "";
        document.getElementById("search"+num+"Name").value = newName;
    }
    autocomplete(document.getElementById("search"+num+"FilterInput"), catNames);
}

function advancedSearchColorInput(event, num, color) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        advancedSearchColorChange(num, color);
    }
}

function advancedSearchColorChange(num, color) {
    orig = w3color(document.getElementById("search"+num+"Circle").style.borderColor).toHexString();
    if (color == '') {
        color = document.getElementById("search"+num+"Circle").style.borderColor;
    }
    cObj = w3color(color)
    colorhex = cObj.toHexString();
    if (cObj.valid) {
        document.getElementById("search"+num+"ButtonCircle").style.borderColor = colorhex;
        document.getElementById("search"+num+"Circle").style.borderColor = colorhex;
        document.getElementById("search"+num+"Color").value = colorhex;
        document.getElementById("search"+num).innerHTML =
            document.getElementById("search"+num).innerHTML.replace(orig, colorhex);
        document.getElementById("search"+num+"Alert").innerHTML = "";
    } else {
        document.getElementById("search"+num+"Color").value = orig;
        document.getElementById("search"+num+"Alert").innerHTML = "Invalid color";
    }
    autocomplete(document.getElementById("search"+num+"FilterInput"), catNames);
    if (document.getElementById("search"+num+"Results").innerHTML != "") {
        addSearchMarkers(num);
    }
}

function advancedSearchRandomColor(num) {
    rC = randomColor(255, 510);
    advancedSearchColorChange(num, rC);
}

function randomColor(lowerBound, upperBound) {
    ctot = 0;
    while (ctot < lowerBound | ctot > upperBound) {
        r = Math.ceil(Math.random() * 255);
        g = Math.ceil(Math.random() * 255);
        b = Math.ceil(Math.random() * 255);
        ctot = r + g + b;
    }
    c = "rgb("+r+","+g+","+b+")";
    cObj = w3color(c)
    chex = cObj.toHexString();
    return chex;
}

function advancedSearchFocusColor(num) {
    aSColor = document.getElementById("search"+num+"Color");
    if (mobile | ipad) {
        aSColor.focus();
        aSColor.setSelectionRange(0, aSColor.value.length);
    } else {
        $(aSColor).select();
    }
}

function advancedSearchFilterInput(event, num) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        input = document.getElementById("search"+num+"FilterInput")
        advancedSearchAddFilter(input);
    }
}

function advancedSearchAddFilter(filterInput) {
    filterName = filterInput.value.toLowerCase();
    num = filterInput.id.split("search")[1].split("Filter")[0];
    catNamesLC = [];
    for (c=0; c<catNames.length; c++) {
        catNamesLC.push(catNames[c].toLowerCase())
    }
    if (filterName == "") {
        document.getElementById("search"+num+"Alert").innerHTML = "Enter a filter";
        if (mobile | ipad) {
            filterInput.focus();
            filterInput.setSelectionRange(0, filterInput.value.length);
        } else {
            $(filterInput).select();
        }
        return;
    } else if (!catNamesLC.includes(filterName)) {
        document.getElementById("search"+num+"Alert").innerHTML = "Invalid filter";
        if (mobile | ipad) {
            filterInput.focus();
            filterInput.setSelectionRange(0, filterInput.value.length);
        } else {
            $(filterInput).select();
        }
        return;
    } else {
        filterName = catNames[catNamesLC.indexOf(filterName)];
        document.getElementById("search"+num+"Alert").innerHTML = "";
        document.getElementById("search"+num+"CurrInd").innerHTML = "0";
        filterInput.value = "";
        // Check if the same filter has been used previously
        fnum = 1;
        good = 0;
        while (good == 0) {
            testFilter = document.getElementById("search"+num+filterName+fnum);
            // if filter already exists
            if (typeof(testFilter) != 'undefined' && testFilter != null) {
                fnum += 1;
            } else { good = 1; }
        }
        fChkOpt = groupJSON.data[filterName];
        if (fChkOpt[0] == "*" | isNaN(data[filterName].min) | isNaN(data[filterName].max)) {
            filterTxt =
            '<div id="search' + num + filterName + fnum + '" class="advancedSearchFilter"><div style="width: 100%; ' +
            'font-size: 0px;"><div id="search' + num + filterName + fnum + 'name" class="menuText ' +
            'advancedSearchFilterName menuVertClose" style="width: calc(100% - 80px); font-size: 14px;">' + filterName +
            '</div><div id="search' + num + filterName + fnum + 'and" class="subMenuButton menuVertClose" ' +
            'style="margin-right: 0px; width: 35px; font-size: 10px; background-color: #4187f5; color: white;" ' +
            'onclick="andor('+num+', this)">AND</div><div id="search' + num + filterName + fnum +
            'or" class="subMenuButton menuVertClose" style="margin-left: 0px; width: 35px; font-size: 10px;" ' +
            'onclick="andor(' + num + ', this)">OR</div></div><div style="width: 100%; font-size: 0px;"><div ' +
            'style="width: calc(100% - 85px); margin: 0px 5px 0 0; display: inline-block; font-size: 0px;">';
            for (cb=0; cb<fChkOpt.length; cb++) {
                chkOpt = fChkOpt[cb];
                if (chkOpt != "*") {
                    filterTxt =
                        filterTxt + '<div class="menuCheckboxes menuVertClose" onclick=""><label for="search' + num +
                        filterName + fnum + 'CB' + cb + '"><input id="search' + num + filterName + fnum + 'CB' + cb +
                        '" type="checkbox" checked onclick="filterCB(' + num + ', this)"><span>' + chkOpt +
                        '</span></label></div>';
                }
            }
            filterTxt =
                filterTxt + '</div><div class="subMenuButton" style="width: 70px;" onclick="removeFilter(' + num +
                ', \'' + filterName + '\', ' + fnum + ')">REMOVE</div></div></div>';
        } else {
            fLow = data[filterName].min;
            fHigh = data[filterName].max;
            filterTxt =
                '<div id="search' + num + filterName + fnum + '" class="advancedSearchFilter"><div style="width: ' +
                '100%; font-size: 0px;"><input id="search' + num + filterName + fnum + 'Lower" value="" placeholder="' +
                fLow + '" type="number" class="menuFilterBounds menuInput menuVertClose" onfocus="changeFocusValue' +
                '(this)" onkeydown="filterEnter(event, this)" onblur="filterUpdate(' + num + ', \'' + filterName +
                '\', ' + fnum + ', this, true)"><div id="search' + num + filterName + fnum + 'name" class="menuText ' +
                'advancedSearchFilterName menuVertClose" style="font-size: 14px;">&#8804;&nbsp;' + filterName +
                '&nbsp;&#8804;</div><input id="search' + num + filterName + fnum + 'Upper" value="" placeholder="' +
                fHigh + '" type="number" class="menuFilterBounds menuInput menuVertClose" onfocus="changeFocusValue' +
                '(this)" onkeydown="filterEnter(event, this)" onblur="filterUpdate(' + num + ', \'' + filterName +
                '\', ' + fnum + ', this, true)"><div id="search' + num + filterName + fnum + 'and" class="subMenu' +
                'Button menuVertClose" style="margin-right: 0px; width: 35px; font-size: 10px; background-color: ' +
                '#4187f5; color: white;" onclick="andor(' + num + ', this)">AND</div><div id="search' + num +
                filterName + fnum + 'or" class="subMenuButton menuVertClose" ' + 'style="margin-left: 0px; width: ' +
                '35px; font-size: 10px;" onclick="andor(' + num + ', this)">OR</div></div><div style="width: 100%; ' +
                'font-size: 0px;"><div style="width: calc(100% - 85px); margin: 0px 5px 0 0; display: inline-block; ' +
                'font-size: 0px;">';
            for (cb=0; cb<fChkOpt.length; cb++) {
                chkOpt = fChkOpt[cb];
                filterTxt =
                    filterTxt + '<div class="menuCheckboxes menuVertClose" onclick=""><label for="search' + num +
                    filterName + fnum + 'CB' + cb + '"><input id="search' + num + filterName + fnum + 'CB' + cb +
                    '" type="checkbox" checked onclick="filterCB(' + num + ', this)"><span>' + chkOpt +
                    '</span></label></div>';
            }
            filterTxt =
                filterTxt + '</div><div class="subMenuButton" style="width: 70px;" onclick="removeFilter(' + num +
                ', \'' + filterName + '\', ' + fnum + ')">REMOVE</div></div></div>';
        }
        document.getElementById("search"+num+"FiltersAndLists").innerHTML =
            filterTxt + document.getElementById("search"+num+"FiltersAndLists").innerHTML;
        if (!fChkOpt.includes("*") & !isNaN(data[filterName].min) & !isNaN(data[filterName].max)) {
            fWidth = $(document.getElementById("search"+num+filterName+fnum)).width();
            fNameWidth = $(document.getElementById("search"+num+filterName+fnum+"name")).width();
            document.getElementById("search"+num+filterName+fnum+"Lower").style.width = (fWidth - 101 - fNameWidth)/2.;
            document.getElementById("search"+num+filterName+fnum+"Upper").style.width = (fWidth - 101 - fNameWidth)/2.;
        }
    }
    executeAdvancedSearch(num);
}

function advancedSearchResizeFilterBounds() {
    filterBounds = document.getElementsByClassName("menuFilterBounds");
    for (fb=0; fb<filterBounds.length; fb++) {
        if (filterBounds[fb].id.includes("markers")) {
            if (filterBounds[fb].id.includes("Lower")) {
                fName = filterBounds[fb].id.split("Lower")[0];
                fWidth = $(document.getElementById(fName)).width();
                fNameWidth = $(document.getElementById(fName+"name")).width();
                document.getElementById(fName+"Lower").style.width = (fWidth - 20 - fNameWidth)/2.;
                document.getElementById(fName+"Upper").style.width = (fWidth - 20 - fNameWidth)/2.;
            }
        } else {
            if (filterBounds[fb].id.includes("Lower")) {
                fName = filterBounds[fb].id.split("Lower")[0];
                fWidth = $(document.getElementById(fName)).width();
                fNameWidth = $(document.getElementById(fName+"name")).width();
                document.getElementById(fName+"Lower").style.width = (fWidth - 101 - fNameWidth)/2.;
                document.getElementById(fName+"Upper").style.width = (fWidth - 101 - fNameWidth)/2.;
            }
        }
    }
}

function advancedSearchListInput(event, num) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        advancedSearchAddList(num);
    }
}

function advancedSearchAddList(num) {
    var listInput = document.getElementById("search"+num+"ListInput");
    var list = listInput.value.toLowerCase();
    var finalArr = [];
    var badArr = [];
    if (list == "") {
        document.getElementById("search"+num+"Alert").innerHTML = "Enter a list of IDs (e.g.: 10,15,33,100-105)";
        if (mobile | ipad) {
            listInput.focus();
            listInput.setSelectionRange(0, listInput.value.length);
        } else {
            $(listInput).select();
        }
    } else {
        document.getElementById("search"+num+"Alert").innerHTML = "";
        // Elements separated by spaces, commas, or tabs
        var arr = list.split(/\s*[\s,]\s*/);
        // Remove empty/undefined elements (",,")
        var cleanArr = arr.filter(function(el) { return el; });
        // Add elements within given ranges ("-")
        var rangeArr = [];
        for (e=0; e<cleanArr.length; e++) {
            if (cleanArr[e].includes("-") && cleanArr[e].split("-")[0] != "" && cleanArr[e].split("-")[1] != "") {
                lower = Number(cleanArr[e].split("-")[0]);
                upper = Number(cleanArr[e].split("-")[1]);
                if (Number.isInteger(lower) && Number.isInteger(upper)) {
                    for (b=Number(lower); b<Number(upper)+1; b++) {
                        rangeArr.push(b);
                    }
                }
            }
        }
        if (rangeArr != []){
            for (r=0; r<rangeArr.length; r++) {
                cleanArr.push(rangeArr[r]);
            }
        }
        // Remove multiple instances of elements
        var uniqueArr = toUnique(cleanArr);
        // Remove elements outside range of catalog
        if (group == "hff") {
            var boundArr =
            uniqueArr.filter(function(x) {
                return IDs.includes(x) | ((x >= 1 && x <= maxID) | (x >= 20001 && x <= maxBCG));
            });
        } else {
            var boundArr = uniqueArr.filter(function(x) { return IDs.includes(x) | (x >= 1 && x <= maxID); });
        }
        boundArr.sort(function(a, b) { return a - b; });
        // Remove all non-integer elements and objects without catalog data
        for (e=0; e<boundArr.length; e++) {
            if (Number.isInteger(Number(boundArr[e]))) {
                ind = indJSON[Number(boundArr[e])-1];
                if (ind != -1) {
                    finalArr.push(Number(boundArr[e]));
                } else {
                    badArr.push(Number(boundArr[e]));
                }
            }
        }
        finalStr = finalArr.join(", ");
        badStr = badArr.join(", ");
        if (finalArr.length == 0 & badArr.length == 0) {
            document.getElementById("search"+num+"Alert").innerHTML =
                "Invalid list of IDs<br>Enter a valid list (e.g.: 10,15,33,100-105)";
            if (mobile | ipad) {
                listInput.focus();
                listInput.setSelectionRange(0, listInput.value.length);
            } else {
                $(listInput).select();
            }
        } else if (finalArr.length == 0 & badArr.length != 0) {
            document.getElementById("search"+num+"Alert").innerHTML = "Data unavailable for: "+badStr;
            if (mobile | ipad) {
                listInput.focus();
                listInput.setSelectionRange(0, listInput.value.length);
            } else {
                $(listInput).select();
            }
        } else {
            if (badArr.length != 0) {
                document.getElementById("search"+num+"Alert").innerHTML = "Data unavailable for: "+badStr;
            } else {
                document.getElementById("search"+num+"Alert").innerHTML = "";
            }
            searchLists = document.getElementsByClassName("advancedSearchList");
            lnum = 1;
            good = 0;
            identicalList = 0;
            while (good == 0) {
                testList = document.getElementById("search"+num+"list"+lnum);
                // if filter already exists
                if (typeof(testList) != 'undefined' && testList != null) {
                    if (document.getElementById("search"+num+"list"+lnum+"input").value == finalStr) {
                        identicalList = lnum;
                        good = 1;
                    } else {
                        lnum += 1;
                    }
                } else { good = 1; }
            }
            if (identicalList != 0) {
                document.getElementById("search"+num+"Alert").innerHTML = "Identical list already exists";
                if (mobile | ipad) {
                    listInput.focus();
                    listInput.setSelectionRange(0, listInput.value.length);
                } else {
                    $(listInput).select();
                }
            } else {
                listTxt =
                    '<div id="search' + num + 'list' + lnum + '" class="advancedSearchList"><div style="display: ' +
                    'inline-block; height: calc(100% - 10px); width: calc(100% - 90px); margin: 5px; font-size: 0px; ' +
                    'vertical-align: top; overflow-y: scroll; border: 1px solid #d4d4d4;"><textarea id="search' + num +
                    'list' + lnum + 'input" class="textareaList" wrap="soft" readonly>' + finalStr +
                    '</textarea></div><div style="display: inline-block; width: 80px; font-size: 0px;"><div id="search'+
                    num + 'list' + lnum + 'and" class="subMenuButton menuVertClose" style="margin-right: 0px; width: ' +
                    '35px; font-size: 10px;" onclick="andor(' + num + ', this)">AND</div><div id="search' + num +
                    'list' + lnum + 'or" class="subMenuButton menuVertClose" style="margin-left: 0px; width: 35px; ' +
                    'font-size: 10px; background-color: #4187f5; color: white;" onclick="andor(' + num +
                    ', this)">OR</div><div class="subMenuButton menuVertClose" style="width: 70px;" ' +
                    'onclick="removeList(' + num + ', this.parentElement.parentElement.id.split(\'list\')[1])">REMOVE' +
                    '</div></div></div>';
                document.getElementById("search"+num+"FiltersAndLists").innerHTML =
                    listTxt + document.getElementById("search"+num+"FiltersAndLists").innerHTML;
                listInput.value = "";
            }
        }
    }
    executeAdvancedSearch(num);
}

function urlAdvancedSearches(advSearches) {
    if (advSearches.includes('},')) {
        var numAdvSearches = advSearches.split('},').length;
    } else {
        advSearches = advSearches.slice(0, -2)+'},]'
        var numAdvSearches = advSearches.split('},').length - 1;
    }
    for (var as=0; as<numAdvSearches; as++) {
        newAdvancedSearch();
        var urlASName = "";
        var urlASColor = "";
        var asValues = "";
        var asLists = "";
        var asFilters = "";
        var currAdvSrch = advSearches.split('},')[as]+'}';
        if (currAdvSrch.includes("&lists=[(")) {
            asLists = "&lists=[("+currAdvSrch.split("&lists=[(")[1].split(")]")[0]+")]";
            currAdvSrch = currAdvSrch.replace(asLists, "");
        } else if (currAdvSrch.includes("lists=[(")) {
            asLists = "lists=[("+currAdvSrch.split("lists=[(")[1].split(")]")[0]+")]";
            currAdvSrch = currAdvSrch.replace(asLists, "");
        }
        if (currAdvSrch.includes("&filters=[(")) {
            asFilters = "&filters=[("+currAdvSrch.split("&filters=[(")[1].split(")]")[0]+")]";
            currAdvSrch = currAdvSrch.replace(asFilters, "");
        } else if (currAdvSrch.includes("filters=[{")) {
            asFilters = "filters=[("+currAdvSrch.split("filters=[(")[1].split(")]")[0]+")]";
            currAdvSrch = currAdvSrch.replace(asFilters, "");
        }
        if (currentAdvSrch != "{}") {
            if (currAdvSrch.includes('&')) {
                var asInputPairs = currAdvSrch.split('{')[1].split('&');
                for (var ip=0; ip<asInputPairs.length; ip++) {
                    var asInput = asInputPairs[ip];
                    if (asInput.includes('}')) {
                        asInput = asInput.split('}')[0]
                    }
                    var asValue = asInput.split("=")[0];
                    if (asValue == "name") {
                        urlASName = asInput.split("=")[1].split("%20").join(" ");
                        if (urlASName != "") {
                            document.getElementById("search"+String(as+1)+"Name").value = urlASName;
                            advancedSearchNameChange(as+1);
                        }
                    } else if (asValue == "hide") {
                        showHideAdvancedSearch(as+1, true);
                    } else if (asValue == "color") {
                        urlASColor = asInput.split("=")[1]
                        if (urlASColor.includes("%23")) {
                            urlASColor = urlASColor.replace("%23", "#");
                        }
                        if (urlASColor.includes("#") == false) {
                            urlASColor = "#"+urlASColor;
                        }
                        advancedSearchColorChange(as+1, urlASColor);
                    }
                }
            } else {
                var asInput = currAdvSrch.split('{')[1]
                if (asInput.includes('}')) {
                    asInput = asInput.split('}')[0]
                }
                var asValue = asInput.split("=")[0];
                if (asValue == "name") {
                    urlASName = asInput.split("=")[1].split("%20").join(" ");
                    if (urlASName != "") {
                        document.getElementById("search"+String(as+1)+"Name").value = urlASName;
                        advancedSearchNameChange(as+1);
                    }
                } else if (asValue == "hide") {
                    showHideAdvancedSearch(as+1, true);
                } else if (asValue == "color") {
                    urlASColor = asInput.split("=")[1].split("%23").join("#");
                    if (urlASColor.includes("#")) {
                        urlASColor = "#"+urlASColor;
                    }
                    advancedSearchColorChange(as+1, urlASColor);
                }
            }
        }
        if (asLists != "") {
            var numLists = asLists.split(')').length - 1;
            for (var l2=0; l2<numLists; l2++) {
                currListInput = asLists.split(')')[l2].split('(')[1]
                if (currListInput.includes('&')) {
                    var listInputPairs = currListInput.split('&');
                    for (var lip=0; lip<listInputPairs.length; lip++) {
                        var listInput2 = listInputPairs[lip];
                        var listValue2 = listInput2.split("=")[0];
                        if (listValue2 == "ids") {
                            list_ids = listInput2.split("=")[1];
                            document.getElementById("search"+String(as+1)+"ListInput").value = list_ids;
                            advancedSearchAddList(as+1);
                        } else if (listValue2 == "andor") {
                            list_andor = listInput2.split("=")[1]
                            if (list_andor == "and") {
                                list_and_button =
                                    document.getElementById('search'+String(as+1)+'list'+String(l2+1)+'and');
                                andor(as+1, list_and_button);
                            }
                        }
                    }
                } else {
                    var listValue2 = currListInput.split("=")[0];
                    if (listValue2 == "ids") {
                        list_ids = currListInput.split("=")[1];
                        document.getElementById("search"+String(as+1)+"ListInput").value = list_ids;
                        advancedSearchAddList(as+1);
                    }
                }
            }
        }
        if (asFilters != "") {
            var numFilters = asFilters.split(')').length - 1;
            var filterCounts = {};
            for (var f2=0; f2<numFilters; f2++) {
                var filter_name = ""
                currFilterInput = asFilters.split(')')[f2].split('(')[1]
                if (currFilterInput.includes('&')) {
                    var filterInputPairs = currFilterInput.split('&');
                    var filter_num = 1
                    for (var fip=0; fip<filterInputPairs.length; fip++) {
                        var filterInput2 = filterInputPairs[fip];
                        var filterValue2 = filterInput2.split("=")[0];
                        if (filterValue2 == "name") {
                            filter_name = filterInput2.split("=")[1];
                            document.getElementById("search"+String(as+1)+"FilterInput").value = filter_name;
                            filter_doc = document.getElementById("search"+String(as+1)+"FilterInput")
                            advancedSearchAddFilter(filter_doc);
                            if (filterCounts == {}) {
                                filterCounts[filter_name] = filter_num
                            } else {
                                for (var key in filterCounts) {
                                    if (key == filter_name) {
                                        filter_num += filterCounts[key]
                                    }
                                }
                                filterCounts[filter_name] = filter_num
                            }
                        } else if (filterValue2 == "andor") {
                            filter_andor = filterInput2.split("=")[1]
                            if (filter_andor == "or") {
                                document.getElementById("search"+String(as+1)).innerHTML =
                                    document.getElementById("search"+String(as+1)).innerHTML.replace(
                                    'search'+String(as+1)+filter_name+filter_num+'and" class="subMenuButton '+
                                    'menuVertClose" style="margin-right: 0px; width: 35px; font-size: 10px; '+
                                    'background-color: #4187f5; color: white;',
                                    'search'+String(as+1)+filter_name+filter_num+'and" class="subMenuButton '+
                                    'menuVertClose" style="margin-right: 0px; width: 35px; font-size: 10px;')
                                document.getElementById("search"+String(as+1)).innerHTML =
                                    document.getElementById("search"+String(as+1)).innerHTML.replace(
                                    'search'+String(as+1)+filter_name+filter_num+'or" class="subMenuButton '+
                                    'menuVertClose" style="margin-left: 0px; width: 35px; font-size: 10px;',
                                    'search'+String(as+1)+filter_name+filter_num+'or" class="subMenuButton '+
                                    'menuVertClose" style="margin-left: 0px; width: 35px; font-size: 10px; '+
                                    'background-color: #4187f5; color: white;')
                            }
                        } else if (filterValue2 == "min") {
                                document.getElementById("search"+String(as+1)).innerHTML =
                                    document.getElementById("search"+String(as+1)).innerHTML.replace(
                                    'id="search'+String(as+1)+filter_name+filter_num+'Lower" value=""',
                                    'id="search'+String(as+1)+filter_name+filter_num+'Lower" value="'+
                                    filterInput2.split("=")[1]+'"')
                        } else if (filterValue2 == "max") {
                                document.getElementById("search"+String(as+1)).innerHTML =
                                    document.getElementById("search"+String(as+1)).innerHTML.replace(
                                    'id="search'+String(as+1)+filter_name+filter_num+'Upper" value=""',
                                    'id="search'+String(as+1)+filter_name+filter_num+'Upper" value="'+
                                    filterInput2.split("=")[1]+'"')
                        } else if (filterValue2 == "uncheck") {
                            var filterChkOpt = groupJSON.data[filter_name];
                            var uncheckValue = filterInput2.split("=")[1].split("[")[1].split("]")[0]
                            if (uncheckValue.includes(",")) {
                                var uncheckList = uncheckValue.split(",");
                                for (var ch=0; ch<uncheckList.length; ch++) {
                                    var chk_opt = uncheckList[ch]
                                    var cb_num = searchStringInArray(chk_opt, filterChkOpt)
                                    if (cb_num != -1) {
                                        var doc_name =
                                            'search'+String(as+1)+filter_name+filter_num+'CB'+cb_num;
                                    document.getElementById("search"+String(as+1)).innerHTML =
                                        document.getElementById("search"+String(as+1)).innerHTML.replace(
                                        doc_name+'" type="checkbox" checked',
                                        doc_name+'" type="checkbox" unchecked');
                                    }
                                }
                            } else {
                                var chk_opt = uncheckValue
                                var cb_num = searchStringInArray(chk_opt, filterChkOpt)
                                if (cb_num != -1) {
                                    var doc_name =
                                        'search'+String(as+1)+filter_name+String(filter_num)+'CB'+String(cb_num);
                                    document.getElementById("search"+String(as+1)).innerHTML =
                                        document.getElementById("search"+String(as+1)).innerHTML.replace(
                                        doc_name+'" type="checkbox" checked',
                                        doc_name+'" type="checkbox" unchecked');
                                }
                            }
                        }
                        executeAdvancedSearch(as+1);
                    }
                } else {
                    var filterValue2 = currFilterInput.split("=")[0];
                    if (filterValue2 == "name") {
                        filter_name = currFilterInput.split("=")[1];
                        document.getElementById("search"+String(as+1)+"FilterInput").value = filter_name;
                        filter_doc = document.getElementById("search"+String(as+1)+"FilterInput")
                        advancedSearchAddFilter(filter_doc);
                    }
                }
            }
        }
        executeAdvancedSearch(as+1);
        autocomplete(document.getElementById("search"+String(as+1)+"FilterInput"), catNames);
    }
}

function searchStringInArray(str, strArray) {
    for (var sa=0; sa<strArray.length; sa++) {
        if (str == 'null') {
            if (String(strArray[sa]) == str) { return sa; }
        } else {
            if (strArray[sa] == str) { return sa; }
        }
    }
    return -1
}

function toUnique(a, b, c) { //array,placeholder,placeholder
    b = a.length;
    while (c = --b)
        while (c--) a[b] !== a[c] || a.splice(c, 1);
    return a // not needed ;)
}

function removeFilter(n, fName, fn) {
    document.getElementById("search"+n+"Alert").innerHTML = "";
    document.getElementById("search"+n+"CurrInd").innerHTML = "0";
    aSfilter = document.getElementById("search"+n+fName+fn);
    if (aSfilter.parentElement.children.length > 1) {
        aSfilter.parentElement.removeChild(aSfilter);
        executeAdvancedSearch(n);
    } else {
        aSfilter.parentElement.removeChild(aSfilter);
        deleteSearchMarkers(n);
        document.getElementById("search"+n+"ObjectCount").innerHTML = "Number of objects: -";
        document.getElementById("search"+n+"Results").innerHTML = "";
        document.getElementById("search"+n+"Lngs").innerHTML = "";
        document.getElementById("search"+n+"Lats").innerHTML = "";
    }
}

function filterEnter(event, eobj) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        eobj.blur();
    }
}

function filterUpdate(n, fName, fn, obj, exec) {
    prev = currentFocusValue;
    fL = data[fName].min;
    fH = data[fName].max;
    if (!isNaN(parseFloat(obj.value))) {
        document.getElementById("search"+n+"Alert").innerHTML = "";
        if (parseFloat(obj.value) == prevdata[fName].min) { obj.value = fL; }
        else if (parseFloat(obj.value) == prevdata[fName].max) { obj.value = fH; }
        if (obj.id.includes("Lower")) {
            if (obj.value != prev) {
                document.getElementById("search"+n+fName+fn).innerHTML =
                    document.getElementById("search"+n+fName+fn).innerHTML.replace(
                    "Lower\" value=\""+prev+"\"", "Lower\" value=\""+obj.value+"\"");
            }
        } else {
            if (obj.value != prev) {
                document.getElementById("search"+n+fName+fn).innerHTML =
                    document.getElementById("search"+n+fName+fn).innerHTML.replace(
                    "Upper\" value=\""+prev+"\"", "Upper\" value=\""+obj.value+"\"");
            }
        }
        if (exec) {
            executeAdvancedSearch(n);
        }
    } else {
        if (obj.id.includes("Lower")) {
            document.getElementById("search"+n+fName+fn).innerHTML =
                document.getElementById("search"+n+fName+fn).innerHTML.replace("Lower\" value=\""+prev+"\"",
                                                                               "Lower\" value=\"\"");
        } else {
            document.getElementById("search"+n+fName+fn).innerHTML =
                document.getElementById("search"+n+fName+fn).innerHTML.replace("Upper\" value=\""+prev+"\"",
                                                                               "Upper\" value=\"\"");
        }
        if (exec) {
            executeAdvancedSearch(n);
        }
    }
}

function changeFocusValue(obj) {
    if (!obj.id.includes("list")) {
        if (mobile | ipad) {
            obj.focus();
            obj.setSelectionRange(0, obj.value.length);
        } else {
            $(obj).select();
        }
        currentFocusValue = obj.value;
    }
}

function filterCB(n, obj) {
    if (obj.checked) {
        document.getElementById(obj.id.split("CB")[0]).innerHTML =
            document.getElementById(obj.id.split("CB")[0]).innerHTML.replace(obj.id+'" type="checkbox" unchecked',
                                                                             obj.id+'" type="checkbox" checked')
    } else {
        document.getElementById(obj.id.split("CB")[0]).innerHTML =
            document.getElementById(obj.id.split("CB")[0]).innerHTML.replace(obj.id+'" type="checkbox" checked',
                                                                             obj.id+'" type="checkbox" unchecked')
    }
    executeAdvancedSearch(n);
}

function andor(n, obj) {
    if (obj.id.includes("and")) {
        obj2 = document.getElementById(obj.id.replace("and", "or"));
    } else {
        obj2 = document.getElementById(obj.id.replace("or", "and"));
    }
    if (obj2.style.color == "white") {
        obj2.style.color = "black";
        obj2.style.backgroundColor = "white";
        obj.style.color = "white";
        obj.style.backgroundColor = "#4187f5";
    }
    executeAdvancedSearch(n);
}

function removeList(n, ln) {
    document.getElementById("search"+n+"Alert").innerHTML = "";
    aSlist = document.getElementById("search"+n+"list"+ln);
    if (aSlist.parentElement.children.length > 1) {
        aSlist.parentElement.removeChild(aSlist);
        executeAdvancedSearch(n);
    } else {
        aSlist.parentElement.removeChild(aSlist);
        deleteSearchMarkers(n);
        document.getElementById("search"+n+"ObjectCount").innerHTML = "Number of objects: -";
        document.getElementById("search"+n+"Results").innerHTML = "";
        document.getElementById("search"+n+"Lngs").innerHTML = "";
        document.getElementById("search"+n+"Lats").innerHTML = "";
    }
}

function executeAdvancedSearch(n) {
    children = document.getElementById("search"+n+"FiltersAndLists").children;
    andLists = [];
    orLists = [];
    andFilters = [];
    orFilters = [];
    tempResults = [];
    finalResults = [];
    tempResults = [];
    first = true;
    for (c=0; c<children.length; c++) {
        if (document.getElementById(children[c].id+"and").style.color == "white") { a = true; }
        else { a = false; }
        if (children[c].className == "advancedSearchFilter") { f = true; }
        else { f = false; }
        if (f) {
            if (a) { andFilters.push(c); }
            else { orFilters.push(c); }
        } else {
            if (a) { andLists.push(c); }
            else { orLists.push(c); }
        }
    }
    if (andLists.length != 0) {
        for (l=0; l<andLists.length; l++) {
            list = document.getElementById(children[andLists[l]].id+"input").innerHTML.split(", ");
            tempResults = tempResults.concat(list.map(Number));
            if (first) {
                first = false;
            } else {
                tempResults = find_duplicate_in_array(tempResults);
            }
        }
    }
    if (andFilters.length != 0) {
        for (f=0; f<andFilters.length; f++) {
            if (document.getElementById(children[andFilters[f]].id+"name").innerHTML.includes("&nbsp;")) {
                fltr = document.getElementById(children[andFilters[f]].id+"name").innerHTML.split("&nbsp;")[1];
            } else { fltr = document.getElementById(children[andFilters[f]].id+"name").innerHTML; }
            fChkOpt = groupJSON.data[fltr];
            fChkd = [];
            if (fChkOpt.length == 0) {
                lb = document.getElementById(children[andFilters[f]].id+"Lower").value;
                if (lb == "") { lb = data[fltr].min; }
                ub = document.getElementById(children[andFilters[f]].id+"Upper").value;
                if (ub == "") { ub = data[fltr].max; }
            } else {
                if (fChkOpt[0] == "*" | isNaN(data[fltr].min) | isNaN(data[fltr].max)) {
                    lb = Number.NaN;
                    ub = Number.NaN;
                } else {
                    lb = document.getElementById(children[andFilters[f]].id+"Lower").value;
                    if (lb == "") { lb = data[fltr].min; }
                    ub = document.getElementById(children[andFilters[f]].id+"Upper").value;
                    if (ub == "") { ub = data[fltr].max; }
                }
                for (cb=0; cb<fChkOpt.length; cb++) {
                    chkOpt = fChkOpt[cb];
                    if (chkOpt != "*") {
                        chkd = document.getElementById(children[andFilters[f]].id+"CB"+cb).checked;
                        if (chkd) { fChkd.push(chkOpt); }
                    }
                }
            }
            if (isNaN(lb) & isNaN(ub) & fChkd.length == 0) {
                tempResults = [];
                if (first) {
                    first = false;
                }
            } else if (isNaN(lb) & isNaN(ub) & fChkOpt.length == 1 & fChkd.length == 1) {
                results = IDs;
                if (first) {
                    tempResults = results;
                    first = false;
                } else {
                    tempResults = tempResults.concat(results);
                    tempResults = find_duplicate_in_array(tempResults);
                }
            } else {
                results = catalogFilter(fltr, lb, ub, fChkd);
                if (first) {
                    tempResults = results;
                    first = false;
                } else {
                    tempResults = tempResults.concat(results);
                    tempResults = find_duplicate_in_array(tempResults);
                }
            }
        }
    }
    if (orLists.length != 0) {
        for (l=0; l<orLists.length; l++) {
            list = document.getElementById(children[orLists[l]].id+"input").innerHTML.split(", ");
            tempResults = tempResults.concat(list.map(Number));
        }
        tempResults = toUnique(tempResults);
    }
    if (orFilters.length != 0) {
        for (f=0; f<orFilters.length; f++) {
            if (document.getElementById(children[orFilters[f]].id+"name").innerHTML.includes("&nbsp;")) {
                fltr = document.getElementById(children[orFilters[f]].id+"name").innerHTML.split("&nbsp;")[1];
            } else { fltr = document.getElementById(children[orFilters[f]].id+"name").innerHTML; }
            fChkOpt = groupJSON.data[fltr];
            fChkd = [];
            if (fChkOpt.length == 0) {
                lb = document.getElementById(children[orFilters[f]].id+"Lower").value;
                if (lb == "") { lb = data[fltr].min; }
                ub = document.getElementById(children[orFilters[f]].id+"Upper").value;
                if (ub == "") { ub = data[fltr].max; }
            } else {
                if (fChkOpt[0] == "*" | isNaN(data[fltr].min) | isNaN(data[fltr].max)) {
                    lb = Number.NaN;
                    ub = Number.NaN;
                } else {
                    lb = document.getElementById(children[orFilters[f]].id+"Lower").value;
                    if (lb == "") { lb = data[fltr].min; }
                    ub = document.getElementById(children[orFilters[f]].id+"Upper").value;
                    if (ub == "") { ub = data[fltr].max; }
                }
                for (cb=0; cb<fChkOpt.length; cb++) {
                    chkOpt = fChkOpt[cb];
                    if (chkOpt != "*") {
                        chkd = document.getElementById(children[orFilters[f]].id+"CB"+cb).checked;
                        if (chkd) { fChkd.push(chkOpt); }
                    }
                }
            }
            if (isNaN(lb) & isNaN(ub) & fChkd.length == 0) {
                tempResults = [];
            } else if (isNaN(lb) & isNaN(ub) & fChkOpt.length == 1 & fChkd.length == 1) {
                results = IDs;
                tempResults = tempResults.concat(results);
                tempResults = toUnique(tempResults);
            } else {
                results = catalogFilter(fltr, lb, ub, fChkd);
                tempResults = tempResults.concat(results);
                tempResults = toUnique(tempResults);
            }
        }
    }
    if (tempResults.length == 0) {
        deleteSearchMarkers(n);
        document.getElementById("search"+n+"ObjectCount").innerHTML = "Number of objects: -";
        document.getElementById("search"+n+"Results").innerHTML = "";
    } else {
        finalResults = toUnique(tempResults);
        document.getElementById("search"+n+"ObjectCount").innerHTML = "Number of objects: " + finalResults.length;
        document.getElementById("search"+n+"Results").innerHTML = finalResults.join(", ");
        lngs = [];
        lats = [];
        for (i=0; i<finalResults.length; i++) {
            id = Number(finalResults[i]);
            if (group == "hff") {
                if (id > 20000) {
                    xind = maxID+id-20001; // finds x-loc of object in jsonxy
                    yind = maxID*2+(maxBCG-20000)+id-20001;  // number of objects in cat+id to get y-loc in jsonxy
                } else {
                    xind = id-1; // finds x-loc of object in jsonxy
                    yind = maxID+(maxBCG-20000)+id-1;  // number of objects in cat+id to get y-loc in jsonxy
                }
            } else {
                xind = id-1; // finds x-loc of object in jsonxy
                yind = maxID+id-1;  // number of objects in cat+id to get y-loc in jsonxy
            }
            x = xyJSON[xind] //gets x from jsonxy
            y = xyJSON[yind] //gets y from jsonxy
            lng = xlng(x); //converts x to lng
            lngs.push(lng);
            lat = ylat(y); //converts y to lat
            lats.push(lat);
        }
        document.getElementById("search"+n+"Lngs").innerHTML = lngs.join(", ");
        document.getElementById("search"+n+"Lats").innerHTML = lats.join(", ");
        addSearchMarkers(n);
    }
    document.getElementById("search"+n+"CurrInd").innerHTML = 0;
}

function addSearchMarkers(n) {
    deleteSearchMarkers(n);
    lngs = document.getElementById("search"+n+"Lngs").innerHTML.split(", ");
    lats = document.getElementById("search"+n+"Lats").innerHTML.split(", ");
    searchMarkers = [];
    clr = document.getElementById("search"+n+"Color").value;
    cObj = w3color(clr);
    colorhex = cObj.toHexString();
    clrrgb = hexToRgb(colorhex);
    b = 0.5 + slider.value/66.;
    if (b > 1) {
        clr = "rgb("+clrrgb.r/b+","+clrrgb.g/b+","+clrrgb.b/b+")"
        cObj = w3color(clr);
        colorhex = cObj.toHexString();
    }
    for (i=0; i<lngs.length; i++) {
        mrk = L.circleMarker([lats[i], lngs[i]], {
            radius: 5*(map.getZoom()+1)-1.5,
            color: colorhex,
            weight: 1.5,
            fillOpacity: 0,
            interactive: false
        });
        searchMarkers.push(mrk);
    }
    objectMarkers[name] = L.featureGroup(searchMarkers);
    if (document.getElementById("search"+n+"ShowHide").innerHTML == "HIDE") {
        objectMarkers[name].addTo(map);
    }
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function deleteSearchMarkers(n) {
    name = "search"+n+"markers";
    if (map.hasLayer(objectMarkers[name])) {
        map.removeLayer(objectMarkers[name]);
    }
    objectMarkers[name] = {};
}

function catalogFilter(f, l, h, chk) {
    goodArr = [];
    if (catNames.includes(f)) {
        if (!isNaN(l)) {
            for (o=0; o<infoJSON.data.length; o++) {
                if (((infoJSON.data[o][f] >= l) & (infoJSON.data[o][f] <= h)) | (chk.includes(infoJSON.data[o][f]))) {
                    goodArr.push(Number(infoJSON.data[o]["id"]));
                }
            }
        } else {
            for (o=0; o<infoJSON.data.length; o++) {
                if (chk.includes(infoJSON.data[o][f])) {
                    goodArr.push(Number(infoJSON.data[o]["id"]));
                }
            }
        }
    }
    return goodArr;
}

// https://www.w3resource.com/javascript-exercises/javascript-array-exercise-20.php
function find_duplicate_in_array(arr) {
    var object = {};
    var result = [];
    arr.forEach(function (item) {
        if (!object[item])
        object[item] = 0;
        object[item] += 1;
    })
    for (var prop in object) {
       if(object[prop] >= 2) {
           result.push(prop);
       }
    }
    return result;
}

function copySearchResults(n) {
    results = document.getElementById("search"+n+"Results").innerHTML;
    if (results != "") {
        copyToClipboard(results);
        document.getElementById("search"+n+"Alert").innerHTML = "Search results saved to clipboard"
    }
}

function advSrchButtonPress() {
    if (asb.title == "Advanced Search") {
        showHideMenu();
        showSubMenu("advancedSearch");
        document.body.style.cursor = "default";
    } else {
        searches = document.getElementsByClassName("advSearch");
        good = false;
        count = 1;
        if (currentAdvSrch == -1) {
            for (s=0; s<searches.length; s++) {
                search = searches[s];
                if (advSrchShow.includes(search.id) &
                    document.getElementById(search.id+"ShowHide").innerHTML == "SHOW") {
                    showHideAdvancedSearch(search.id.split("search")[1], false);
                }
            }
            iASlat = focusCircle.getLatLng().lat;
            iASlng = focusCircle.getLatLng().lng;
        }
        for (s=0; s<searches.length; s++) {
            search = searches[s];
            if (document.getElementById(search.id+"ShowHide").innerHTML == "HIDE") {
                lastAdvSrch = s;
            }
        }
        if (currentAdvSrch == lastAdvSrch) {
            asb.title = "Show Advanced Searches";
            document.getElementById("advSrchButtonCircle").style.border = "2px solid transparent";
            document.getElementById("advSrchButtonLeft").style.display = "none";
            document.getElementById("advSrchButtonRight").style.display = "none";
            currentAdvSrch = -1;
            good = true;
            advSrchShow = [];
            for (s=0; s<searches.length; s++) {
                search = searches[s];
                if (document.getElementById(search.id+"ShowHide").innerHTML == "HIDE") {
                    advSrchShow.push(search.id);
                    showHideAdvancedSearch(search.id.split("search")[1], false);
                }
            }
            fCLat = iASlat;
            fCLng = iASlng;
            var iASX = Math.round(lngx(iASlng));
            var iASY = Math.round(laty(iASlat));
            getid(iASX, iASY);
            focusCenterImage(-1);

        } else {
            while (good == false & count <= searches.length) {
                search = searches[(currentAdvSrch+count)%searches.length];
                if (document.getElementById(search.id+"Results").innerHTML != "") {
                    if (document.getElementById(search.id+"ShowHide").innerHTML == "SHOW") {
                        count++;
                    } else {
                        addSearchMarkers(search.id.split("search")[1]);
                        results = document.getElementById(search.id+"Results").innerHTML.split(", ");
                        currInd = Number(document.getElementById(search.id+"CurrInd").innerHTML);
                        id = results[currInd];
                        document.getElementById("searchIDForm").objid.value = id;
                        asb.title = document.getElementById(search.id+"Name").value;
                        currentAdvSrch = (currentAdvSrch+count)%searches.length;
                        clr = document.getElementById(search.id+"Color").value;
                        good = true;
                        document.getElementById("advSrchButtonCircle").style.border = "2px solid "+clr;
                        document.getElementById("advSrchButtonLeft").style.display = "inline-block";
                        document.getElementById("advSrchButtonRight").style.display = "inline-block";
                        getobj(document.getElementById("searchIDForm"), map.getZoom(), 1);
                    }
                } else {
                    count ++;
                }
            }
        }
        if (!good) {
            showHideMenu();
            showSubMenu("advancedSearch");
            document.body.style.cursor = "default";
        }
    }
}

function advSrchButtonNextPrev(val) {
    searches = document.getElementsByClassName("advSearch");
    search = searches[currentAdvSrch];
    results = document.getElementById(search.id+"Results").innerHTML.split(", ");
    currInd = (Number(document.getElementById(search.id+"CurrInd").innerHTML)+val)%results.length;
    if (currInd == -1) { currInd = results.length-1; }
    id = results[currInd];
    document.getElementById(search.id+"CurrInd").innerHTML = currInd;
    document.getElementById("searchIDForm").objid.value = id;
    getobj(document.getElementById("searchIDForm"), map.getZoom(), 1);
}

function closeAdvSrch() {
    if (document.getElementById("advSrchButtonLeft").style.display == "inline-block") {
        currentAdvSrch--;
        asb.title = "View search results";
        document.getElementById("advSrchButtonCircle").style.border = "2px solid transparent";
        document.getElementById("advSrchButtonLeft").style.display = "none";
        document.getElementById("advSrchButtonRight").style.display = "none";
    }
}

/* Show or hide the data table. */
function showHideTable() {
    var objTable = document.getElementById("objectTable");
    if (tableButton.title.includes("Show")) {
        tableButton.title = "Hide table";
        objTable.style.display = "block";
        if (objTable.innerHTML.includes("Object data unavailable") |
            (objTable.innerHTML == "" & document.getElementById("searchID").value == "")) {
            document.getElementById("objectTableDiv").style.marginBottom = "52px";
            tableButton.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablegray.png)";
        } else {
            tableButton.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tableblue.png)";
        }
        if (mobile & portrait) {
            if (figuresButton.title.includes("Hide")) {
                if (objTable.innerHTML.includes("Object data unavailable") |
                    (objTable.innerHTML == "" & document.getElementById("searchID").value == "")) {
                    document.getElementById("objectTableContainer").style.maxHeight =
                        ($(window).height() - 130 - 32*numFilterRows)+"px";
                } else {
                    var tableDivMarginBottom = Math.max($(window).height()*0.16, 79) + 52;
                    tableMaxHeight =
                        Math.min(($(window).height()*0.5), ($(window).height() -
                        (136 + 32*numFilterRows + 49*sCCheckbox)));
                    document.getElementById("objectTableDiv").style.marginBottom = tableDivMarginBottom+"px";
                    document.getElementById("objectTableContainer").style.maxHeight = tableMaxHeight+"px";
                }
            } else {
                tableMaxHeight =
                    Math.min(($(window).height()*0.4), ($(window).height() - (136 + 32*numFilterRows + 49*sCCheckbox)));
                document.getElementById("objectTableDiv").style.marginBottom = "52px";
                document.getElementById("objectTableContainer").style.maxHeight = tableMaxHeight+"px";
            }
        } else if (mobile & !portrait) {
            document.getElementById("objectTableDiv").style.marginBottom = "52px";
            document.getElementById("objectTableContainer").style.maxHeight =
                ($(window).height() - 144 - 32*numFilterRows - 49*sCCheckbox)+"px";
        } else {
            document.getElementById("objectTableContainer").style.maxHeight =
                ($(window).height() - 248 - 32*numFilterRows)+"px";
        }
    } else {
        tableButton.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablewhite.png)";
        tableButton.title = "Show table";
        objTable.style.display = "none";
    }
    if (fcb.style.backgroundImage.includes("blue")) {
        focusCenterImage(-1);
    } else if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
        zoomOutCenterImage();
    }
    document.getElementById("map").focus();
    return;
}

function showHideFigures() {
    if (figuresButton.title.includes("Show")) {
        figuresButton.title = "Hide figures";
        if (document.getElementById("figure"+good_figNames[0]).src.includes("none") |
            document.getElementById("figure"+good_figNames[0]).src == "") {
            figuresButton.style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresgray.png)";
        } else {
            figuresButton.style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresblue.png)";
            for (f=0; f<good_figNames.length; f++) {
                document.getElementById("figure"+good_figNames[f]).style.display = "inline-block";
                document.getElementById("zoomfigure"+good_figNames[f]).style.display = "inline-block";
            }
            if (group == "hff" & id > 20000) {
                document.getElementById("figureDetection").style.display = "none";
                document.getElementById("zoomfigureDetection").style.display = "none";
                document.getElementById("figureMagnification").style.display = "none";
                document.getElementById("zoomfigureMagnification").style.display = "none";
            }
        }
        if (mobile & portrait) {
            if (figuresButton.style.backgroundImage.includes("blue")) {
                document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "block";
            }
            if (tableButton.style.backgroundImage.includes("blue")) {
                tableDivMarginBottom = Math.max($(window).height()*0.16, 79) + 52;
                tableMaxHeight =
                    Math.min(($(window).height()*0.5), ($(window).height() - (136 + 32*numFilterRows + 49*sCCheckbox)));
                document.getElementById("objectTableDiv").style.marginBottom = tableDivMarginBottom+"px";
                document.getElementById("objectTableContainer").style.maxHeight = tableMaxHeight+"px";
            } else {
                document.getElementById("objectTableDiv").style.marginBottom = "52px";
            }
        }
    } else {
        figuresButton.title = "Show figures";
        figuresButton.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figureswhite.png)";
        document.getElementById("mobilePortraitFiguresContainerBackground").style.display = "none";
        for (f=0; f<figNames.length; f++) {
            document.getElementById("figure"+figNames[f]).style.display = "none";
            document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
        }
        if (mobile & portrait) {
            tableMaxHeight =
                Math.min(($(window).height()*0.4), ($(window).height() - (136 + 32*numFilterRows + 49*sCCheckbox)));
            document.getElementById("objectTableDiv").style.marginBottom = "52px";
            document.getElementById("objectTableContainer").style.maxHeight = tableMaxHeight+"px";
        }
    }
    if (fcb.style.backgroundImage.includes("blue")) {
        focusCenterImage(-1);
    } else if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
        zoomOutCenterImage();
    }
    document.getElementById("map").focus();
}

function mapkey(event){
    mapkeys[event.keyCode] = event.type == 'keydown';
    if (event.keyCode >= 37 && event.keyCode <= 40) {
        if (fcb.style.backgroundImage.includes("blue")) {
            fcb.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/focuscenterwhite.png)";
        }
        if (document.getElementById("zoomOutCenterButton").style.backgroundImage.includes("blue")) {
            document.getElementById("zoomOutCenterButton").style.backgroundImage =
                "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/zoomoutcenterwhite.png)";
        }
        if (mapkeys[37]) { // if left arrow is pressed, move map left.
            if (mapkeys[38]) {
                map.panTo(new L.latLng(map.getCenter().lat+5, map.getCenter().lng-5), map.getZoom());
            } else if (mapkeys[39]) {
            } else if (mapkeys[40]) {
                map.panTo(new L.latLng(map.getCenter().lat-5, map.getCenter().lng-5), map.getZoom());
            } else {
                map.panTo(new L.latLng(map.getCenter().lat, map.getCenter().lng-10), map.getZoom());
            }
        }
        if (mapkeys[38]) { // if up arrow is pressed, move map up.
            if (mapkeys[37]) {
                map.panTo(new L.latLng(map.getCenter().lat+5, map.getCenter().lng-5), map.getZoom());
            } else if (mapkeys[39]) {
                map.panTo(new L.latLng(map.getCenter().lat+5, map.getCenter().lng+5), map.getZoom());
            } else if (mapkeys[40]) {
            } else {
                map.panTo(new L.latLng(map.getCenter().lat+10, map.getCenter().lng), map.getZoom());
            }
        }
        if (mapkeys[39]) { // if right arrow is pressed, move map right.
            if (mapkeys[37]) {
            } else if (mapkeys[38]) {
                map.panTo(new L.latLng(map.getCenter().lat+5, map.getCenter().lng+5), map.getZoom());
            } else if (mapkeys[40]) {
                map.panTo(new L.latLng(map.getCenter().lat-5, map.getCenter().lng+5), map.getZoom());
            } else {
                map.panTo(new L.latLng(map.getCenter().lat, map.getCenter().lng+10), map.getZoom());
            }
        }
        if (mapkeys[40]) { // if down arrow is pressed, move map down.
            if (mapkeys[37]) {
                map.panTo(new L.latLng(map.getCenter().lat-5, map.getCenter().lng-5), map.getZoom());
            } else if (mapkeys[38]) {
            } else if (mapkeys[39]) {
                map.panTo(new L.latLng(map.getCenter().lat-5, map.getCenter().lng+5), map.getZoom());
            } else {
                map.panTo(new L.latLng(map.getCenter().lat-10, map.getCenter().lng), map.getZoom());
            }
        }
    } else if (event.type == 'keydown') {
        mapkeydown(event);
    } else if (event.type == 'keyup') {
        mapkeyup(event);
    }
}

function mapkeydown(event) {
    var key = event.keyCode;
    if (command) { return; }
    // if 'i' is pressed, focus on search ID input.
    if (key == 73) {
        searchID = document.getElementById("searchID");
        if (mobile | ipad) {
            searchID.focus();
            searchID.setSelectionRange(0, searchID.value.length);
        } else {
            $(searchID).select();
        }
    }
    // if 's' is pressed while on the map, quick view segmentation map.
    else if (key == 83) {
        if (!map.hasLayer(baseMaps["seg"])) {
            baseMaps["seg"].addTo(map);
            document.getElementById("segButton").style.background = "#c8c8c8";
        }
    }
    // if 'z' is pressed, turn on/off markers
    else if (key == 90) {
        event.preventDefault();
        document.getElementById("zoomLevel").focus();
    }
    // if 'x' is pressed, turn on/off markers
    else if (key == 88) {
        if (groupJSON.hasOwnProperty("defaultMarkerOptions")) {
            addRemoveMarkers();
        }
    }
    // if 'c' is pressed, copy current view to clipboard
    else if (key == 67) {
        copyViewToClipboard(event);
    }
    // if 'a' is pressed, show keyboard shortcuts
    else if (key == 65) {
        if (document.getElementById("menuContainer").style.display == "none" |
            document.getElementById("menuContainer").style.display == "") {
            showHideMenu();
            showSubMenu("advancedSearch");
        }
    }
    // if 'k' is pressed, show keyboard shortcuts
    else if (key == 75) {
        if (document.getElementById("menuContainer").style.display == "none" |
            document.getElementById("menuContainer").style.display == "") {
            showHideMenu();
            showSubMenu("keyboard");
        }
    }
    // if '0' is pressed, zoom and center image
    else if (key == 48) {
        zoomOutCenterImage();
    }
    // if 'o' is pressed, center on focus circle
    else if (key == 79) {
        focusCenterImage(-1);
    }
    // if '1-9' is pressed while on the map, quick view corresponding filter
    else if (key>=49 & (key<(49+filters.length) & key<57)) {
        filter = filters[key-49];
        if (filter == currentLayer) {
            document.getElementById("map").style.cursor = "crosshair";
            return;
        }
        if (filters.includes("bcgs")) {
            if (filter == "bcgs") {
                if (!mobile & !ipad) {
                    document.getElementById(filter+"Button").style.background = "#c8c8c8";
                    if (qvLayers.length == 0) {
                        if (!bcgsLayer) {
                            baseMaps[currentLayer+"bcgs"].bringToFront();
                            qvbcgs = true;
                        } else {
                            baseMaps[currentLayer].bringToFront();
                            qvbcgs = false;
                        }
                    } else {
                        if (!bcgsLayer) {
                            qvbcgs = true;
                            if (qvLayers[0] != "seg") {
                                baseMaps[qvLayers[0]+"bcgs"].addTo(map);
                            }
                        } else {
                            baseMaps[qvLayers[0]].addTo(map);
                            qvbcgs = false;
                        }
                    }
                } else {
                    changeBaseLayer(filter);
                }
                document.getElementById("map").style.cursor = "crosshair";
                return;
            } else if (filter == "seg") {
                if (!map.hasLayer(baseMaps[filter])) {
                    if (!mobile & !ipad) {
                        document.getElementById(filter+"Button").style.background = "#c8c8c8";
                        qvLayers.unshift(filter)
                        baseMaps[filter].addTo(map);
                    } else {
                        changeBaseLayer(filter);
                    }
                }
            } else {
                if (!mobile & !ipad) {
                    if (qvbcgs) {
                        if (!map.hasLayer(baseMaps[filter+"bcgs"])) {
                            document.getElementById(filter+"Button").style.background = "#c8c8c8";
                            qvLayers.unshift(filter)
                            baseMaps[filter+"bcgs"].addTo(map);
                        }
                    } else {
                        if (!map.hasLayer(baseMaps[filter])) {
                            document.getElementById(filter+"Button").style.background = "#c8c8c8";
                            qvLayers.unshift(filter)
                            baseMaps[filter].addTo(map);
                        }
                    }
                } else {
                    changeBaseLayer(filter);
                }
            }
        } else {
            if (!map.hasLayer(baseMaps[filter])) {
                if (!mobile & !ipad) {
                    document.getElementById(filter+"Button").style.background = "#c8c8c8";
                    baseMaps[filter].addTo(map);
                } else {
                    changeBaseLayer(filter);
                }
            }
        }
    }
    // if 't' is pressed, show/hide table
    else if (key == 84) {
        var chkbox = document.getElementById("objectDataCheckbox");
        if (chkbox.checked) {
            showHideTable();
        }
    }
    // if 'f' is pressed, show/hide figures
    else if (key == 70) {
        var chkbox = document.getElementById("objectDataCheckbox");
        if (chkbox.checked) {
            showHideFigures();
        }
    }
    // if 'b' is pressed, allow user to adjust brightness with +/- keys
    else if (key == 66) {
        bright = true;
    }
    // Command button
    else if (key == 91 | key == 93) {
        command = true;
    }
    // if 'd' is pressed, show/hide table and figures
    else if (key == 68) {
        var chkbox = document.getElementById("objectDataCheckbox");
        if (chkbox.checked) {
            showHideTable();
            showHideFigures();
        }
    }
    // if '+' is pressed, zoom in.
    else if (key == 61 | key == 187) {
        if (bright) {
            slider.value = Number(slider.value) + 11;
            mapBrightness();
        } else {
            zoomInGray();
            zoomInMap();
        }
    }
    // if '-' is pressed, zoom out.
    else if (key == 173 | key == 189) {
        if (bright) {
            slider.value = Number(slider.value) - 11;
            mapBrightness();
        } else {
            zoomOutGray();
            zoomOutMap();
        }
    }
    document.getElementById("map").style.cursor = "crosshair";
}

function mapkeyup(event) {
    var key = event.keyCode;
    // close quick view, segmentation map.
    if (key == 83) {
        if (document.getElementById("segButton").style.background.toUpperCase().includes("#c8c8c8") |
            document.getElementById("segButton").style.background.toLowerCase().includes("rgb(200, 200, 200)")) {
            map.removeLayer(baseMaps["seg"]);
            document.getElementById("segButton").style.background = "white";
        }
        document.getElementById("map").focus();
        return;
    }
    else if (key == 75) {
        showHideMenu();
        document.getElementById("map").focus();
        return;
    }
    // if 'b' is pressed, allow user to adjust brightness with +/- keys
    else if (key == 66) {
        bright = false;
        document.getElementById("map").focus();
        return;
    }
    // Command button
    else if (key == 91 | key == 93) {
        command = false;
        document.getElementById("map").focus();
        return;
    }
    // close quick view for filter buttons
    else if (key>=49 & key<(49+filters.length) & key<=57) {
        filter = filters[key-49];
        if (filter == currentLayer) {
            document.getElementById("map").focus();
        return;
        }
        if (filters.includes("bcgs")) {
            if (filter == "bcgs") {
                if (qvbcgs) {
                    document.getElementById(filter+"Button").style.background = "white";
                    if (qvLayers.length == 0) {
                        baseMaps[currentLayer].bringToFront();
                    } else {
                        if (qvLayers[0] != "seg") {
                            map.removeLayer(baseMaps[qvLayers[0]+"bcgs"]);
                        }
                    }
                    qvbcgs = false;
                } else {
                    document.getElementById(filter+"Button").style.color = "white";
                    document.getElementById(filter+"Button").style.background = "#4187f5";
                    if (qvLayers.length == 0) {
                        baseMaps[currentLayer+"bcgs"].bringToFront();
                    } else {
                        if (qvLayers[0] != "seg") {
                            map.removeLayer(baseMaps[qvLayers[0]]);
                        }
                    }
                    qvbcgs = true;
                }
                document.getElementById("map").focus();
                return;
            } else {
                qvLayers.splice(qvLayers.indexOf(filter), 1);
                document.getElementById(filter+"Button").style.background = "white";
                if (qvbcgs) {
                    if (map.hasLayer(baseMaps[filter])) {
                        map.removeLayer(baseMaps[filter]);
                    }
                    if (map.hasLayer(baseMaps[filter+"bcgs"])) {
                        map.removeLayer(baseMaps[filter+"bcgs"]);
                    }
                } else {
                    if (map.hasLayer(baseMaps[filter+"bcgs"])) {
                        map.removeLayer(baseMaps[filter+"bcgs"]);
                    }
                    if (map.hasLayer(baseMaps[filter])) {
                        map.removeLayer(baseMaps[filter]);
                    }
                }
            }
        } else {
            if (document.getElementById(filter+"Button").style.background.toUpperCase().includes("#c8c8c8") |
                document.getElementById(filter+"Button").style.background.toLowerCase().includes("rgb(200, 200, 200)")){
                map.removeLayer(baseMaps[filter]);
                document.getElementById(filter+"Button").style.background = "white";
            }
        }
        document.getElementById("map").focus();
    }
    document.getElementById("map").focus();
}

//allows user to use Enter key
function objidkey(event, form) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        getobj(form, -1, 1);
    } else if (key == 38) {
        event.preventDefault();
        document.getElementById("searchID").value = Number(document.getElementById("searchID").value) + 1;
        getobj(form, -1, 1);
        document.getElementById("searchID").focus();
    } else if (key == 40) {
        event.preventDefault();
        document.getElementById("searchID").value = Number(document.getElementById("searchID").value) - 1;
        getobj(form, -1, 1);
        document.getElementById("searchID").focus();
    }
}

function copyViewToClipboard(event) {
    event.preventDefault();
    var id = document.getElementById("searchID").value.toString();
    var radec = xra(lngx(map.getCenter().lng)).toFixed(5)+","+ydec(laty(map.getCenter().lat)).toFixed(5)
    var focusCenterButton = fcb;
    var zoomOutCenterButton = document.getElementById("zoomOutCenterButton");
    var zl = document.getElementById("zoomLevel").placeholder.toString();
    var url = window.location.href.toString()
    if (url.includes("?")) { url = url.split("?")[0]; }
    url += "?field="+fieldName;
    if (id == "") {
        if (!zoomOutCenterButton.style.backgroundImage.includes("blue")) {
            url += "&radec="+radec;
        }
    } else if (focusCenterButton.style.backgroundImage.includes("blue")) {
        url += "&id="+id;
    } else {
        url += "&id="+id+"&radec="+radec;
    }
    if (currentLayer != defaultFilter) {
        url += "&filter="+currentLayer;
    }
    if (filters.includes("bcgs") & currentLayer != "seg") {
        if (!bcgsLayer) {
        url += "&bcgs=0";
        }
    }
    if (Number(zl) != 0) {
        url += "&zl="+zl;
    }
    if (!tableButton.style.backgroundImage.includes("white") &
        tableButton.style.backgroundImage != "" &
        !figuresButton.style.backgroundImage.includes("white") &
        figuresButton.style.backgroundImage != "") {
        url += "&data=1";
    } else if (!tableButton.style.backgroundImage.includes("white") & tableButton.style.backgroundImage != "") {
        url += "&table=1";
    } else if (!figuresButton.style.backgroundImage.includes("white") & figuresButton.style.backgroundImage != "") {
        url += "&figures=1";
    }
    if (map.hasLayer(objectMarkers.xMarkers)) {
        url += "&x=1";
    }
    advSearches = document.getElementsByClassName("advSearch");
    advSearchLists = document.getElementsByClassName("advancedSearchList");
    advSearchFilters = document.getElementsByClassName("advancedSearchFilter");
    docInputs = document.getElementsByTagName("input");
    if (advSearches.length > 0) {
        var advSearchesURL = "&advancedsearch=[";
        for (var as=0; as<advSearches.length; as++) {
            if (as == 0) { advSearchesURL = advSearchesURL + "{"; }
            else { advSearchesURL = advSearchesURL + ",{"; }
            var currAdvSrch = advSearches[advSearches.length-as-1];
            var currAdvSrchId = currAdvSrch.id;
            var currAdvSrchName = document.getElementById(currAdvSrchId+"Name").value;
            advSearchesURL = advSearchesURL + "name=" + currAdvSrchName.replace(" ", "%20");
            if (document.getElementById(currAdvSrchId+"ShowHide").innerHTML == "SHOW") {
                advSearchesURL = advSearchesURL + "&hide";
            }
            var currAdvSrchColor = document.getElementById(currAdvSrchId+"Color").value;
            advSearchesURL = advSearchesURL + "&color=" + currAdvSrchColor.replace("#", "%23");
            if (advSearchLists.length > 0) {
                var firstList = true;
                var anyList = false;
                for (var asl=0; asl<advSearchLists.length; asl++) {
                    var listId = advSearchLists[asl].id;
                    if (listId.includes(currAdvSrchId)) {
                        if (firstList) {
                            advSearchesURL = advSearchesURL + "&lists=[(ids=" +
                            document.getElementById(listId+"input").innerHTML.split(" ").join("");
                            firstList = false;
                            anyList = true;
                        } else {
                            advSearchesURL = advSearchesURL + ",(ids=" +
                            document.getElementById(listId+"input").innerHTML.split(" ").join("");
                        }
                        if (document.getElementById(listId+"and").style.color == "white") {
                            advSearchesURL = advSearchesURL + "&andor=and";
                        }
                        advSearchesURL = advSearchesURL + ")";
                    }
                }
                if (anyList) { advSearchesURL = advSearchesURL + "]"; }
            }
            if (advSearchFilters.length > 0) {
                var firstFilter = true;
                var anyFilter = false;
                for (var asf=0; asf<advSearchFilters.length; asf++) {
                    var filterId = advSearchFilters[asf].id;
                    if (filterId.includes(currAdvSrchId)) {
                        var filterName2 = filterId.replace(currAdvSrchId, "").slice(0, -1)
                        var filterChkBxs = []
                        for (var tag_elem=0; tag_elem<docInputs.length; tag_elem++) {
                            if (docInputs[tag_elem].id.includes(filterId) &
                                docInputs[tag_elem].id.includes("CB")) {
                                filterChkBxs.push(docInputs[tag_elem]);
                            }
                        }
                        if (firstFilter) {
                            advSearchesURL = advSearchesURL + "&filters=[(name=" + filterName2;
                            firstFilter = false;
                            anyFilter = true;
                        } else {
                            advSearchesURL = advSearchesURL + ",(name=" +
                            filterId.replace(currAdvSrchId, "").slice(0, -1);
                        }
                        if (document.getElementById(filterId+"or").style.color == "white") {
                            advSearchesURL = advSearchesURL + "&andor=or";
                        }
                        if (filterChkBxs.length > 0) {
                            firstChkBx = true;
                            anyChkBx = false;
                            for (var cb2=0; cb2<filterChkBxs.length; cb2++) {
                                if (filterChkBxs[cb2].checked == false) {
                                    cb_num2 = filterChkBxs[cb2].id.split('CB')[1]
                                    if (firstChkBx) {
                                        chkbxname = String(groupJSON.data[filterName2][Number(cb_num2)])
                                        advSearchesURL = advSearchesURL + "&uncheck=[" + chkbxname;
                                        firstChkBx = false;
                                        anyChkBx = true;
                                    } else {
                                        chkbxname = String(groupJSON.data[filterName2][Number(cb_num2)])
                                        advSearchesURL = advSearchesURL + "," + chkbxname;
                                    }
                                }
                            }
                            if (anyChkBx) { advSearchesURL = advSearchesURL + "]"; }
                        }
                        if (groupJSON.data[filterName2][0] != '*') {
                            if (String(document.getElementById(filterId+"Lower").value) != "") {
                                advSearchesURL = advSearchesURL + "&min=" +
                                    String(document.getElementById(filterId+"Lower").value);
                            }
                            if (String(document.getElementById(filterId+"Upper").value) != "") {
                                advSearchesURL = advSearchesURL + "&max=" +
                                    String(document.getElementById(filterId+"Upper").value);
                            }
                        }
                        advSearchesURL = advSearchesURL + ")";
                    }
                }
                if (anyFilter) { advSearchesURL = advSearchesURL + "]"; }
            }
            advSearchesURL = advSearchesURL + "}";
        }
        advSearchesURL = advSearchesURL + "]";
        url = url + advSearchesURL
    }
    copyToClipboard(url);
    tempAlert("URL link for current map view copied to clipboard", 1500);
    document.getElementById("map").focus();
}

function tempAlert(msg, time) {
    tAlert = document.getElementById("tempAlert");
    tAlert.style.display = "none";
    var lines = 1
    if (msg.includes("<br>")) {
        lines = msg.split("<br>").length;
    }
    tAlert.style.height = 32*lines + "px";
    tAlert.innerHTML = msg;
    tAlert.style.display = "block";
    setTimeout(function(){
        tAlert.style.opacity = "0";
        tAlert.style.filter = "alpha(opacity: 0)";
    }, time);
    setTimeout(function(){
        tAlert.style.display = "none";
        tAlert.style.opacity = "0.95";
        tAlert.style.filter = "alpha(opacity: 95)";
        tAlert.innerHTML = "";
    }, time+500);
}

function copyToClipboard(text){
    var dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.setAttribute('value', text);
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function searchFocus() {
    lines = document.getElementsByClassName("searchHorizontal");
    for (l=0; l<lines.length; l++) {
        lines[l].style.color = "#b3b3b3";
        lines[l].style.backgroundColor = "#b3b3b3";
    }
    closeAdvSrch();
}

function searchBlur() {
    lines = document.getElementsByClassName("searchHorizontal");
    for (l=0; l<lines.length; l++) {
        lines[l].style.color = "transparent";
        lines[l].style.backgroundColor = "transparent";
    }
}

function getobj(form, zoomLevel, fci) { // moves map to object based on inputted object number
    if (Number(zoomLevel) == -1) {
        zoomLevel = map.getZoom();
    }
    id = Number(form.objid.value); // changes from string to number
    if (IDs.includes(id) | (id >= 1 && id <= maxID)) {
        if (group == "hff") {
            if (id > 20000) {
                xind = maxID+id-20001; // finds x-loc of object in jsonxy
                yind = maxID*2+(maxBCG-20000)+id-20001;  // number of objects in cat+id to get y-loc in jsonxy
            } else {
                xind = id-1; // finds x-loc of object in jsonxy
                yind = maxID+(maxBCG-20000)+id-1;  // number of objects in cat+id to get y-loc in jsonxy
            }
        } else {
            xind = id-1; // finds x-loc of object in jsonxy
            yind = maxID+id-1;  // number of objects in cat+id to get y-loc in jsonxy
        }
        x = xyJSON[xind] //gets x from jsonxy
        y = xyJSON[yind] //gets y from jsonxy
        lng = xlng(x); //converts x to lng
        lat = ylat(y); //converts y to lat
        xcord = Math.round(x); //rounds for display
        ycord = Math.round(y);
        RA = xra(x); //converts x to ra
        DEC = ydec(y); //converts y to dec
        // check if source has GRIZLI data
        if (id > 20000) {
            ind = indJSON[maxID+id-20001];
        } else {
            ind = indJSON[id-1];
        }
        if (ind != -1) {
            RA = infoJSON.data[ind].ra;
            DEC = infoJSON.data[ind].dec;
            tabletxt = '<table vertical-align="middle" width="100%" style="margin: 0px; table-layout: fixed;">';
            count = 0;
            tableCellWidth = $(objectInfo).width() * 0.25;
            for (t=0; t<catNames.length; t++) {
                if (good_catNames.includes(catNames[t])) {
                    if (count%2 == 0) { //even
                        tabletxt += '<tr>';
                    }
                    // RA/DEC: 5 significant figures
                    if (tableNames[t] == 'RA' | tableNames[t] == 'DEC') {
                        tabletxt +=
                            '<th style="width: ' + tableCellWidth + 'px; max-width: ' + tableCellWidth + 'px;">' +
                            tableNames[t] + '</th><th style="width: ' + tableCellWidth + 'px; max-width: ' +
                            tableCellWidth + 'px; ">' + infoJSON.data[ind][catNames[t]].toFixed(5) + '</th>';
                    } else {
                        tabletxt +=
                            '<th style="width: ' + tableCellWidth + 'px; max-width: ' + tableCellWidth + 'px;">' +
                            tableNames[t] + '</th><th style="width: ' + tableCellWidth + 'px; max-width: ' +
                            tableCellWidth + 'px; ">' + infoJSON.data[ind][catNames[t]] + '</th>';
                    }
                    if (count%2 != 0) { //odd
                        tabletxt += '</tr>';
                    }
                    count += 1;
                }
            }
            // if odd number of catalog entries, add blank cell at end of table
            if (good_catNames.length%2 != 0) {
                tabletxt += '<th width="20%"></th><th width="30%"></th></tr>';
            }
            tabletxt += '</table>';
            document.getElementById("objectTable").innerHTML=tabletxt; // changes iframe display on main page
            if (tableButton.title.includes("Hide")) {
                tableButton.style.backgroundImage = "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tableblue.png)";
            }
            if (group == "grizli") {
                idtxt = id.toString();
                if (id < 10) {
                    idtxt = '0000'+idtxt;
                }
                if (id >= 10 && id < 100) {
                    idtxt = '000'+idtxt;
                }
                if (id >= 100 && id < 1000) {
                    idtxt = '00'+idtxt;
                }
                if (id >= 1000 && id < 10000) {
                    idtxt = '0'+idtxt;
                }
                for (f=0; f<figNames.length; f++) {
                    if (figNames.includes(figNames[f])) {
                        figurl = figures.url[f].replace(/fieldname/g,
                            fieldName.replace("+","%2B")).replace(/objectid/g, idtxt);
                        document.getElementById("figure"+figNames[f]).src = figurl;
                        document.getElementById("zoomfigure"+figNames[f]).src = figurl;
                        document.getElementById("figure"+figNames[f]).title = figNames[f];
                    }
                }
            } else if (group == "hff") {
                idtxt = id.toString();
                idx = Math.floor(id/100)*100;
                for (f=0; f<figNames.length; f++) {
                    if (figNames.includes(figNames[f])) {
                        figurl =
                            figures.url[f].replace(
                                /fieldname/g, fieldName).replace(/objectid/g, idtxt).replace(/index/, idx.toString());
                        document.getElementById("figure"+figNames[f]).src = figurl;
                        document.getElementById("zoomfigure"+figNames[f]).src = figurl;
                        document.getElementById("figure"+figNames[f]).title = figNames[f];
                    }
                }
            }
            if (figuresButton.title.includes("Hide")) {
                figuresButton.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresblue.png)";
                for (f=0; f<good_figNames.length; f++) {
                    document.getElementById("figure"+good_figNames[f]).style.display = "inline-block";
                    document.getElementById("zoomfigure"+good_figNames[f]).style.display = "inline-block";
                }
                if (group == "hff" & id > 20000) {
                    document.getElementById("figureDetection").style.display = "none";
                    document.getElementById("zoomfigureDetection").style.display = "none";
                    document.getElementById("figureMagnification").style.display = "none";
                    document.getElementById("zoomfigureMagnification").style.display = "none";
                }
            }
        } else {
            if (tableButton.title.includes("Hide")) {
                tableButton.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/tablegray.png)";
            }
            if (figuresButton.title.includes("Hide")) {
                figuresButton.style.backgroundImage =
                    "url(http://cosmos.phy.tufts.edu/~daniellangevagle/icons/figuresgray.png)";
            }
            document.getElementById("objectTable").innerHTML =
                '<div style="height: 27px; padding: 6px; background: white;">Object data unavailable</div>';
            document.getElementById("objectTable").style.textAlign = "center";
            for (f=0; f<figNames.length; f++) {
                document.getElementById("figure"+figNames[f]).style.display = "none";
                document.getElementById("zoomfigure"+figNames[f]).style.display = "none";
                document.getElementById("figure"+figNames[f]).src = "none";
                document.getElementById("zoomfigure"+figNames[f]).src = "none";
            }
        }
        if (group == "grizli") {
            if (DEC < 0) {
                txt =
                    '<big><a style="color: #2BA6CB" href="http://vizier.u-strasbg.fr/viz-bin/VizieR?-c=' + RA + '-' +
                    DEC + '&-c.rs=2" target="_blank">Object ID: ' + id + '</a></big>'; // changes text above iframe
            } else {
                txt =
                    '<big><a style="color: #2BA6CB" href="http://vizier.u-strasbg.fr/viz-bin/VizieR?-c=' + RA + '+' +
                    DEC + '&-c.rs=2" target="_blank">Object ID: ' + id + '</a></big>'; // changes text above iframe
            }
        } else if (group == "hff") {
            index = Math.floor(id/100)*100;
            txt =
                '<big><a style="color: #2BA6CB" href="' + mainDir + 'object_pages/?field=' + fieldName + '&id=' + id +
                '" target="_blank">Object ID: ' + id + '</a></big>';
        }
        document.getElementById("objectLink").innerHTML = txt; // changes object link on main page
        document.getElementById("objectLink").style.cursor = "pointer";
        focusCircle.setRadius(5*(zoomLevel+1)); //sets radius of circle so it displays
        focusCircle.setLatLng([lat,lng]); //moves circle to object center of object
        if (fci == 1) {
            focusCenterImage(zoomLevel);
        }
        document.getElementById("searchRADEC").value = RA.toFixed(5)+", "+DEC.toFixed(5);
    } else {
        if (group == "hff") {
            //displays alert if object not in catalog
            tempAlert("Please enter an ID number between 1 and "+maxID+" (or 20001 and "+maxBCG+").", 2500);
        } else {
            //displays alert if object not in catalog
            tempAlert("Please enter an ID number between 1 and "+maxID+".", 2500);
        }
    }
    fCLat = focusCircle.getLatLng().lat;
    fCLng = focusCircle.getLatLng().lng;
}

function getobjlatlng(id) {
    id = Number(id);
    if (IDs.includes(id) | (id >= 1 && id <= maxID)) {
        if (group == "hff") {
            if (id > 20000) {
                xind = maxID+id-20001; // finds x-loc of object in jsonxy
                yind = maxID*2+(maxBCG-20000)+id-20001;  // number of objects in cat+id to get y-loc in jsonxy
            } else {
                xind = id-1; // finds x-loc of object in jsonxy
                yind = maxID+(maxBCG-20000)+id-1;  // number of objects in cat+id to get y-loc in jsonxy
            }
        } else {
            xind = id-1; // finds x-loc of object in jsonxy
            yind = maxID+id-1;  // number of objects in cat+id to get y-loc in jsonxy
        }
        x = xyJSON[xind]; //gets x from jsonxy
        y = xyJSON[yind]; //gets y from jsonxy
        lng = xlng(x); //converts x to lng
        lat = ylat(y);
        return [lat, lng];
    } else {
        return [-1,-1];
    }
}

//allows user to use Enter key
function objlistkey(event, form) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        genobjlinks(form);
    }
}

//tells map what to do when clicked on
function onMapClick(e) {
    x = lngx(e.latlng.lng); //changes x and y to location of click
    y = laty(e.latlng.lat);
    x = Math.round(x); //rounds for display
    y = Math.round(y);
    focusCircle.setLatLng(e.latlng); //moves circle to clicked location
    focusCircle.setRadius(5*(map.getZoom()+1)); //makes circle visible
    getid(x, y); //if object in location, moves circle to center of object
    fCLat = focusCircle.getLatLng().lat;
    fCLng = focusCircle.getLatLng().lng;
    closeAdvSrch();
}

//tells map what to do when mouse is moved
function onMouseMove(e) {
    document.getElementById("map").style.cursor = "crosshair";
    x = lngx(e.latlng.lng); //changes x and y to location of curson while on map
    y = laty(e.latlng.lat);
    ra = xra(x); //converts x and y to ra and dec
    dec = ydec(y);
    y = Math.round(y); //rounds x and y
    x = Math.round(x);
    if ((x>=0 && x<=initialxySize[0]) && (y>=0 && y<=initialxySize[1])) {
        //changes display text for curson position
        trackxy =
            '<span class="cursorColOne">X</span><span class="cursorColTwo">' + x + '</span><span ' +
            'class="cursorColThree">Y</span><span class="cursorColFour">' + y + '</span>';
        trackradec =
            '<span class="cursorColOne">RA</span><span class="cursorColTwo">' + ra.toFixed(5) + '</span><span ' +
            'class="cursorColThree">DEC</span><span class="cursorColFour">' + dec.toFixed(5) + '</span>';
    } else {
        trackxy =
            '<span class="cursorColOne">X</span><span class="cursorColTwo">-</span><span class="cursorColThree">Y' +
            '</span><span class="cursorColFour">-</span>'; //changes display text for curson position
        trackradec =
            '<span class="cursorColOne">RA</span><span class="cursorColTwo">-</span><span class="cursorColThree">DEC' +
            '</span><span class="cursorColFour">-</span>'; //changes display text for curson position
    }
    document.getElementById("cursorXY").innerHTML=trackxy;
    document.getElementById("cursorRADEC").innerHTML=trackradec;
}

//allows user to use Enter key
function radeckey(event, form) {
    var key = event.keyCode;
    if (key == 13) {
        event.preventDefault();
        userLocationRADEC(form.radec.value, '', -1);
    }
}

//moves map to user-specified location
function userLocationRADEC(ra, dec, zl) {
    alertMessage = '';
    ra = ra.toString();
    dec = dec.toString();
    if (ra.includes(',')) {
        RA = Number(ra.split(',')[0].replace(/\t/g, '').trim());
        DEC = Number(ra.split(',')[1].replace(/\t/g, '').trim());
    } else if (dec.includes(',')) {
        RA = Number(dec.split(',')[0].replace(/\t/g, '').trim());
        DEC = Number(dec.split(',')[1].replace(/\t/g, '').trim());
    } else if (ra.split('\t').length > 1) {
        RA = Number(ra.split('\t')[0].trim());
        DEC = Number(ra.split('\t').slice(-1)[0].trim());
    } else if (dec.split('\t').length > 1) {
        RA = Number(dec.split('\t')[0].trim());
        DEC = Number(dec.split('\t').slice(-1)[0].trim());
    } else if (ra.split(' ').length > 1) {
        RA = Number(ra.split(' ')[0].replace(/\t/g, ''));
        DEC = Number(ra.split(' ').slice(-1)[0].replace(/\t/g, ''));
    } else if (dec.split(' ').length > 1) {
        RA = Number(dec.split(' ')[0].replace(/\t/g, ''));
        DEC = Number(dec.split(' ').slice(-1)[0].replace(/\t/g, ''));
    } else {
        RA = Number(ra.trim()); //gets ra, dec, and zoom level from form
        DEC = Number(dec.trim());
    }
    if (Number(zl) < 0) {
        zl = map.getZoom();
    }
    zoomLevel = Number(zl);
    if (DEC>=minDEC && DEC<=maxDEC && RA>=minRA && RA<=maxRA) {
        xcoordinate = rax(RA); //converts ra to x
        ycoordinate = decy(DEC); //converts dec to y
        x = Math.round(xcoordinate); //rounds
        y = Math.round(ycoordinate);
        lng = xlng(xcoordinate); //converts x to lng
        lat = ylat(ycoordinate); //converts y to lat
        focusCircle.setLatLng([lat, lng]); //moves circle to location
        focusCircle.setRadius(5*(zoomLevel+1)); //displays circle
        getid(x, y); //if object in location, move circle to center of object
        focusCenterImage(zoomLevel);
    } else {
        if (RA<minRA | RA>maxRA) {
            tempMessage = "Please enter an RA coordinate between "+minRA+" and "+maxRA+".";
            alertMessage += tempMessage; // alerts if out of bounds location chosen
        }
        if (DEC<minDEC | DEC>maxDEC) {
            // alerts if out of bounds location chosen
            tempMessage = "Please enter a DEC coordinate between "+minDEC+" and "+maxDEC+".";
            if (alertMessage != '') { alertMessage += '<br>'; }
            alertMessage += tempMessage;
        }
    }
    if (alertMessage != '') {
        tempAlert(alertMessage, 1500)
    }
    fCLat = focusCircle.getLatLng().lat;
    fCLng = focusCircle.getLatLng().lng;
}

//autocomplete
function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        if (this.id.includes("search") | this.id.includes("marker")) {
            a.setAttribute("class", "search autocomplete-items");
        } else {
            a.setAttribute("class", "autocomplete-items");
        }

        /*append the DIV element as a child of the autocomplete container:*/
        document.getElementById(this.id+"AutocompleteContainer").style.display = "block";
        document.getElementById(this.id+"AutocompleteContainer").appendChild(a);
        /*for each item in the array...*/
        if (this.id.includes("search") | this.id.includes("marker")) {
            maxAC = 3;
        } else { maxAC = 6; }
        numAC = 0
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].toUpperCase().includes(val.toUpperCase()) & (numAC < maxAC)) {
                numAC += 1;
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                ind = arr[i].toUpperCase().indexOf(val.toUpperCase());
                b.innerHTML = arr[i].substr(0, ind);
                b.innerHTML += "<strong>" + arr[i].substr(ind, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(ind+val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    if (inp.value != "") {
                        inp.value = this.getElementsByTagName("input")[0].value;
                        /*close the list of autocompleted values,
                        (or any other open lists of autocompleted values:*/
                        if (b.parentElement.id.includes("field")) {
                            openFieldPage(inp);
                        } else if (b.parentElement.id.includes("search")) {
                            advancedSearchAddFilter(inp);
                        } else if (b.parentElement.id.includes("marker")) {
                            updateMarkerDispFilter();
                        }
                    }
                    closeAllLists();
                });
            a.appendChild(b);
            }
        }
    });

    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
            closeAllLists();
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function getBrowserAndVersion() {
    var objappVersion = navigator.appVersion;
    var objAgent = navigator.userAgent;
    var objbrowserName = navigator.appName;
    var objfullVersion = ''+parseFloat(navigator.appVersion);
    var objBrMajorVersion = parseInt(navigator.appVersion,10);
    var objOffsetName,objOffsetVersion,ix;
    // In Chrome
    if ((objOffsetVersion=objAgent.indexOf("Chrome"))!=-1) {
        objbrowserName = "Chrome";
        objfullVersion = objAgent.substring(objOffsetVersion+7);
    }
    // In Microsoft internet explorer
    else if ((objOffsetVersion=objAgent.indexOf("MSIE"))!=-1) {
        objbrowserName = "Microsoft Internet Explorer";
        objfullVersion = objAgent.substring(objOffsetVersion+5);
    }
    // In Firefox
    else if ((objOffsetVersion=objAgent.indexOf("Firefox"))!=-1) {
        objbrowserName = "Firefox";
    }
    // In Safari
    else if ((objOffsetVersion=objAgent.indexOf("Safari"))!=-1) {
        objbrowserName = "Safari";
        objfullVersion = objAgent.substring(objOffsetVersion+7);
        if ((objOffsetVersion=objAgent.indexOf("Version"))!=-1) {
            objfullVersion = objAgent.substring(objOffsetVersion+8);
        }
    }
    // For other browser "name/version" is at the end of userAgent
    else if ((objOffsetName=objAgent.lastIndexOf(' ')+1) < (objOffsetVersion=objAgent.lastIndexOf('/'))) {
        objbrowserName = objAgent.substring(objOffsetName,objOffsetVersion);
        objfullVersion = objAgent.substring(objOffsetVersion+1);
        if (objbrowserName.toLowerCase()==objbrowserName.toUpperCase()) {
            objbrowserName = navigator.appName;
        }
    }
    // trimming the fullVersion string at semicolon/space if present
    if ((ix=objfullVersion.indexOf(";"))!=-1) {
        objfullVersion=objfullVersion.substring(0,ix);
    }
    if ((ix=objfullVersion.indexOf(" "))!=-1) {
        objfullVersion=objfullVersion.substring(0,ix);
    }
    objBrMajorVersion = parseInt(''+objfullVersion,10);
    if (isNaN(objBrMajorVersion)) {
        objfullVersion = ''+parseFloat(navigator.appVersion);
        objBrMajorVersion = parseInt(navigator.appVersion,10);
    }
    //alert(objbrowserName+" "+objfullVersion)
}

/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
autocomplete(document.getElementById("fieldinput"), fields);
