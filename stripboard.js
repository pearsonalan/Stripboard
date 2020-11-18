function extend(o,h) {
    Object.keys(h).forEach(function(i) {
        o[i] = h[i];
    });
    return o;
}

function bind(f,that) {
    return function() {
        return f.apply(that,arguments);
    }
}

extend(Function.prototype, {
    curry: function () {
        var args = Array.prototype.slice.apply(arguments),
            that = this;
        return function () {
            return that.apply(null,args.concat(Array.prototype.slice.apply(arguments)));
        }
    }
});

function isFunction(obj) {
  return typeof obj === "function";
}

function isArray(obj) {
    return typeof obj === "object" && obj !== null && obj.constructor === Array;
}

function $ID(x) {
    return document.getElementById(x);
}

function $CLASS(x) {
    return document.getElementsByClass(x);
}

function $Q(q) {
    return document.querySelector(q);
}

function $ALL(q) {
    return document.querySelectorAll(q);
}

var Stripboard = (function() {
    const kPixelsPerInch = 150.0;

    function toPixels(d) {
        return d * kPixelsPerInch;
    }

    function svgElement(e) {
        return document.createElementNS("http://www.w3.org/2000/svg", e);
    }

    function svgGroup(classname) {
        let group = svgElement("g");
        if (classname !== undefined) {
            group.setAttribute("class", classname);
        }
        return group;
    }

    // Make an SVG Path command to move to the absolute position (x1, y1)
    // Units: inches
    function moveAbs(x1, y1) {
        return "M " + toPixels(x1) + " " + toPixels(y1) + "\n";
    }

    // Make an SVG Path command to draw a straight line to the absolute position (x1, y1)
    // Units: inches
    function lineAbs(x1, y1) {
        return "L " + toPixels(x1) + " " + toPixels(y1) + "\n";
    }

    // Make an SVG Path command to draw a cubic Bezier curve to the absolute position (x, y)
    // with control points C1=(cx1, cy1) and C2=(cx2, cy2)
    // Units: inches
    function cubicSplineAbs(x, y, cx1, cy1, cx2, cy2) {
        return "C " 
            + toPixels(cx1) + " " + toPixels(cy1) + " "
            + toPixels(cx2) + " " + toPixels(cy2) + " "
            + toPixels(x) + " " + toPixels(y) + "\n";
    }

    // Create an SVG Path element drawing a straight line from (x1, y1) to (x2, y2)
    // Units: inches
    function svgLine(x1, y1, x2, y2, classname) {
        let path = svgElement("path");
        let commands = moveAbs(x1, y1) + lineAbs(x2, y2);
        path.setAttribute("d", commands);
        if (classname !== undefined) {
            path.setAttribute("class", classname);
        }
        return path;
    }
    
    // Create an SVG Path element drawing a cubic Bezier curve from (x1, y1) to (x2, y2)
    // with control points C1=(cx1, cy1) and C2=(cx2, cy2)
    // Units: inches
    function svgSpline(x1, y1, x2, y2, cx1, cy1, cx2, cy2, classname) {
        let path = svgElement("path");
        let commands = moveAbs(x1, y1) + cubicSplineAbs(x2, y2, cx1, cy1, cx2, cy2);
        path.setAttribute("d", commands);
        if (classname !== undefined) {
            path.setAttribute("class", classname);
        }
        return path;
    }

    // Units: Inches
    function svgRect(x, y, width, height, classname) {
        return svgRectPx(toPixels(x), toPixels(y), toPixels(width), toPixels(height), classname);
    }

    // Units: Pixels
    function svgRectPx(x, y, width, height, classname) {
        let rect = svgElement("rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        if (classname !== undefined) {
            rect.setAttribute("class", classname);
        }
        return rect;
    }
    // Units: inches
    function svgCircle(x, y, radius, classname) {
        let circle = svgElement("circle");
        circle.setAttribute("cx", toPixels(x));
        circle.setAttribute("cy", toPixels(y));
        circle.setAttribute("r", toPixels(radius));
        if (classname !== undefined) {
            circle.setAttribute("class", classname);
        }
        return circle;
    }

    // Units: inches
    function svgText(x, y, content, classname) {
        return svgTextPx(toPixels(x), toPixels(y), content, classname);
    }

    // Units: Pixels
    function svgTextPx(x, y, content, classname) {
        let text = svgElement("text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.textContent = content;
        if (classname !== undefined) {
            text.setAttribute("class", classname);
        }
        return text;
    }

    function transform(el, t) {
        el.setAttribute("transform", t);
        return el;
    }

    function translate(el, dx, dy) {
        return translatePx(el, toPixels(dx), toPixels(dy));
    }

    function translatePx(el, dx, dy) {
        return transform(el, "translate(" + dx + ", " + dy + ")");
    }

    // Draw ruler of given inches with a minor tick mark every 0.1 inches
    // and a major tick mark every 1 inch
    function makeHorizontalRuler(inches) {
        let group = svgGroup();
        for (var i = 0; i <= inches * 10; i++) {
            let len = 0.05;
            if (i % 10 == 0) len = 0.1;
            let path = svgLine(i / 10, 0, i / 10, len);
            group.appendChild(path);
        }
        group.setAttribute("class", "horizontal-ruler");
        return group;
    }

    function makeVerticalRuler(inches) {
        let group = svgGroup();
        for (var i = 0; i <= inches * 10; i++) {
            let len = 0.05;
            if (i % 10 == 0) len = 0.1;
            let path = svgLine(0, i / 10, len, i / 10);
            group.appendChild(path);
        }
        group.setAttribute("class", "vertical-ruler");
        return group;
    }

    function makeRulers() {
        let group = svgGroup("rulers");
        group.appendChild(makeHorizontalRuler(boardWidth));
        group.appendChild(makeVerticalRuler(boardHeight));
        return group;
    }

    const kStripSize = 0.1;
    const kStripWidth = 0.07, kStripPadding = (kStripSize - kStripWidth) / 2.0;
    const kHoleRadius = 0.02;
    const kFilledHoleRadius = 0.025;
    const kBoardPadding = 0.02;

    // TODO: Move all of these into a "Board" object so we can have more than one
    // board on a page.
    let boardWidth = 0;
    let boardHeight = 0;
    let rows = {};
    let strips = {};
    let wires = [];
    let legend = null;
    let board = null;
    let components = [];
    let stripCount = 0;
    let holeCount = 0;

	/******************
    * Refs
    *
    * A ref specifies the location of a hole on the board.  It can either be a string
    * ref (like "A4", "C10", "AD13") or a parsed ref, which is a JavaScript object
    * { row: "A", hole: 4 }
    * 
    * The alpha characters specify the row and the numeric characters specify the hole.
    */
    
    // Parse a string ref into a Ref object
    function parseRef(stringRef) {
        let row = "";
        let hole = 0;
        for (let i = 0; i < stringRef.length; i++) {
            let c = stringRef.charCodeAt(i);
            if (c >= 65 && c <= 91) {
                row += String.fromCharCode(c);
            } else if (c >= 48 && c <= 57) {
                hole = parseInt(stringRef.substr(i));
                break;
            }
        }
        return {
            row: row,
            hole: hole
        };
    }


	/******************
	* Rows
	*/

    function makeRowName(r) {
        if (r < 26) {
            return String.fromCharCode(65 + r);
        } else {
            return String.fromCharCode(65 + Math.floor(r / 26) - 1, 65 + (r % 26)) ;
        }
    }

    // Given a ref or a string return the row
    function getRow(ref) {
        if (typeof ref == "string") {
            return rows[ref];
        }
        return rows[ref.row];
    }

    // Given a ref or a string, return the {x,y} coordinates of the center of
    // the hole at the ref location.
    function getPoint(ref) {
        return getRow(ref).holePos(ref.hole);
    }

    let RowPrototype = {
        // Return the point {x,y} of the center of the given hole in
        // the row. Holes are centered in the row and in the columns.
        holePos: function(hole) {
            return {
                x: this.pos.x + hole * kStripSize + kStripSize / 2,
                y: this.pos.y + kStripSize / 2
            };
        }
    };

    function createRow(name, r) {
        return extend(Object.create(RowPrototype), {
            name: name,
            row: r,
            pos: { 
                x: 0,
                y: r * kStripSize
            }
        });
    }

    function makeRows(rowCount) {
        let rows = {};
        for (let r = 0; r < rowCount; r++) {
            let name = makeRowName(r);
            rows[name] = createRow(name, r);
        }
        return rows;
    }

	/******************
	* Strips
	*/

    function makeStripName(s) {
        if (s < 26) {
            return String.fromCharCode(65 + s);
        } else {
            return String.fromCharCode(65 + Math.floor(s / 26) - 1, 65 + (s % 26)) ;
        }
    }

    // Given a ref or a string return the strip
    function getStrip(ref) {
        if (typeof ref == "string") {
            return strips[ref];
        }
        return strips[ref.row];
    }

    // Hander for hover over an element
    function onHover(text, el, event) {
        legend.setHoverContent(text);
    }

    function onMouseLeave(event) {
        legend.setHoverContent("");
    }
    
    let StripPrototype = {
        addCut: function(cut) {
            this.cuts.push(cut);
        },
        holePos: function(hole) {
            return {
                x: this.pos.x + hole * kStripSize + kStripSize / 2,
                y: this.pos.y + kStripSize / 2
            };
        },
        makeSvg: function() {
            let group = svgGroup("strip"),
                rect = svgRect(kStripPadding, kStripPadding, boardWidth - 2 * kStripPadding , kStripWidth);
            rect.addEventListener("mouseover", onHover.curry("STRIP " + this.name, rect));
            rect.addEventListener("mouseleave", onMouseLeave);
            group.appendChild(rect);
            let holesGroup = svgGroup("holes");
            for (var n = 0; n < holeCount; n += 1) {
                let hole = svgCircle(n * kStripSize + kStripSize / 2, kStripSize / 2, kHoleRadius);
                hole.addEventListener("mouseover", onHover.curry("HOLE " + this.name + n, hole));
                hole.addEventListener("mouseleave", onMouseLeave);
                holesGroup.appendChild(hole);
            }
            group.appendChild(holesGroup);
            if (this.cuts.length > 0) {
                let cutsGroup = svgGroup("cuts");
                for (const cut of this.cuts) {
                    let cutPath = svgLine(this.pos.x + cut.hole * kStripSize + kStripSize/2, 0,
                                          this.pos.x + cut.hole * kStripSize + kStripSize/2, kStripSize);
                    cutsGroup.appendChild(cutPath);
                }
                group.appendChild(cutsGroup);
            }
            return translate(group, this.pos.x, this.pos.y);
        }
    }

    function createStrip(name, row) {
        let strip = Object.create(StripPrototype);
        return extend(strip, {
            name: name,
            row: row,
            pos: { 
                x: 0,
                y: row * kStripSize
            },
            cuts: []
        });
    }

    function makeStrips() {
        let strips = {};
        for (let i = 0; i < stripCount; i++) {
            let name = makeStripName(i);
            strips[name] = createStrip(name, i);
        }
        return strips;
    }

    function stripsSvg() {
        let stripGroup = svgGroup();
        stripGroup.setAttribute("class", "strips");
        for (const [key, strip] of Object.entries(strips)) {
            stripGroup.appendChild(strip.makeSvg());
        }
        return stripGroup;
    }


	/******************
	* Wires
	*/

    let WirePrototype = {
        layer: function() {
            return this.spec.layer == "back" ? "back" : "front";
        },
        makeSvg: function() {
            let group = svgGroup("wire"),
                from = this.fromPoint(),
                to = this.toPoint(),
                vertical = (from.x == to.x),
                horizontal = (from.y == to.y),
                wire = ((vertical || horizontal) ?
                            svgLine(from.x, from.y, to.x, to.y) : 
                            svgSpline(from.x, from.y, to.x, to.y,
                                      from.x, from.y + 0.1, to.x - 0.1, to.y));
            group.appendChild(svgCircle(from.x, from.y, kFilledHoleRadius));
            group.appendChild(svgCircle(to.x, to.y, kFilledHoleRadius));
            group.appendChild(wire);
            return group;
        },
        fromStrip: function() {
            return getStrip(this.fromRef);
        },
        fromPoint: function() {
            return getPoint(this.fromRef);
        },
        toStrip: function() {
            return getStrip(this.toRef);
        },
        toPoint: function() {
            return getPoint(this.toRef);
        },
    };
    
    function createWire(spec) {
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        return extend(Object.create(WirePrototype), {
            fromRef: fromRef,
            toRef: toRef,
            spec: spec
        });
    }


	/******************
	* Components
	*/

    // Given a component (e.g. capacitor, resistor, diode) that mounts from the
    // "from" point to the "to" points, return a from, to and to center that
    // represents the component position along the wire.
    function componentPosition(from, to, componentLength) {
        let deltaX = to.x - from.x,
            deltaY = to.y - from.y,
            wireLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            startWireLength = (wireLength - componentLength) / 2,
            startPercent = startWireLength / wireLength,
            endPercent = (startWireLength + componentLength) / wireLength;
        return {
            from: {
                x: from.x + (deltaX) * startPercent,
                y: from.y + (deltaY) * startPercent
            },
            center: {
                x: from.x + (deltaX) * 0.5,
                y: from.y + (deltaY) * 0.5
            },
            to: {
                x: from.x + (deltaX) * endPercent,
                y: from.y + (deltaY) * endPercent
            }
        }
    }

    let ComponentPrototype = {
        layer: function() {
            return (this.spec.layer == "back") ? "back" : "front";
        },
        fromStrip: function() {
            return getStrip(this.fromRef);
        },
        fromPoint: function() {
            return getPoint(this.fromRef);
        },
        toStrip: function() {
            return getStrip(this.toRef);
        },
        toPoint: function() {
            return getPoint(this.toRef);
        },
        labelSvg: function(componentPosition, label) {
            return svgText(componentPosition.center.x, componentPosition.center.y,
                    label, "label");
        }
    };

    function createComponent(spec) {
        let proto = undefined;
        switch (spec.type) {
        case "capacitor":
            proto = CapacitorPrototype;
            break;
        case "led":
            proto = LedPrototype;
            break;
        case "diode":
            proto = DiodePrototype;
            break;
        case "resistor":
            proto = ResistorPrototype;
            break;
        case "header":
            proto = HeaderPrototype;
            break;
        case "ic":
            // IC's are different in that they don't have a from -> to shape
            return createIC(spec);
        default:
            console.log("Undefined component type ", spec.type, " in ", spec);
            return undefined;
        }
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        return extend(Object.create(proto), {
            fromRef: fromRef,
            toRef: toRef,
            spec: spec
        });
    }


	/******************
	* Capacitors
	*/

    const kCapacitorLength = 0.12;
    let CapacitorPrototype = {
        makeSvg: function() {
            let group = svgGroup("capacitor");
            let from = this.fromPoint();
            let to = this.toPoint();
            let path = svgLine(from.x, from.y, to.x, to.y, "wire");
            let componentPos = componentPosition(from, to, kCapacitorLength);
            let capacitorPath = svgLine(componentPos.from.x, componentPos.from.y,
                    componentPos.to.x, componentPos.to.y,
                    "capacitor-body");
            group.appendChild(svgCircle(from.x, from.y, kFilledHoleRadius));
            group.appendChild(svgCircle(to.x, to.y, kFilledHoleRadius));
            group.appendChild(path);
            group.appendChild(capacitorPath);
            if (this.spec.label !== undefined) {
                group.appendChild(this.labelSvg(componentPos, this.spec.label));
            }
            return group;
        },
        ...ComponentPrototype
    };


	/******************
	* Diodes
	*/

    const kDiodeLength = 0.10;
    let DiodePrototype = {
        makeSvg: function() {
            let group = svgGroup("diode");
            let from = this.fromPoint();
            let to = this.toPoint();
            let path = svgLine(from.x, from.y, to.x, to.y, "wire");
            let componentPos = componentPosition(from, to, kDiodeLength);
            let diodePath = svgLine(componentPos.from.x, componentPos.from.y,
                    componentPos.to.x, componentPos.to.y,
                    "diode-body");
            group.appendChild(svgCircle(from.x, from.y, kFilledHoleRadius));
            group.appendChild(svgCircle(to.x, to.y, kFilledHoleRadius));
            group.appendChild(path);
            group.appendChild(diodePath);
            if (this.spec.label !== undefined) {
                group.appendChild(this.labelSvg(componentPos, this.spec.label));
            }
            return group;
        },
        ...ComponentPrototype
    };


	/******************
	* Headers
	*/

    let HeaderPrototype = {
        makeSvg: function() {
            let from = this.fromPoint();
            let to = this.toPoint();
            let group = svgGroup("header");
            let path = svgLine(from.x, from.y, to.x, to.y);
            group.appendChild(path);
            return group;
        },
        ...ComponentPrototype
    };


	/******************
	* ICs
	*/

    const kICPinRadius = 0.04;
    let ICPrototype = {
        layer: function() {
            return this.spec.layer == "back" ? "back" : "front";
        },
        makeSvg: function() {
            let group = svgGroup("ic"),
                pinsGroup = svgGroup("pins");
            for (let i = 0; i < this.pins; i++) {
                let pinPos = this.pinPos(i),
                    pinSvg = svgCircle(pinPos.x, pinPos.y, kICPinRadius);
                pinsGroup.appendChild(pinSvg);
            }
            group.appendChild(pinsGroup);
            let topLeft = this.topLeftPos(),
                rect = svgRect(topLeft.x, topLeft.y, this.width, this.height, "body");
            group.appendChild(rect);
            return group;
        },
        // The IC is defined as being "at" a location which is the top-left
        // pin.  This returns the row that the top left pin is in.
        atRow: function() {
            return getRow(this.at);
        },
        // Returns the position (in inches) of the center of the "at" pin
        atPos: function() {
            return getPoint(this.at);
        },
        // Returns the position (in inches) of the top left corner of the body.
        topLeftPos() {
            let row = this.atRow();
            return {
                x: row.pos.x + this.at.hole * kStripSize + kStripSize/2,
                y: row.pos.y
            };
        },
        // Returns the position (in inches) of the center of pin N, where pin
        // 0 is the "AT" pin and the pins are numbererd down the left side
        // then down the right side.
        pinPos: function(pin) {
            let atPos = this.atPos();
            return {
                x: (pin < this.pinsPerSide ? atPos.x : this.width + atPos.x),
                y: atPos.y + ((pin % this.pinsPerSide) * kStripSize)
            };
        }
    };

    function createIC(spec) {
        let atRef = parseRef(spec.at);
        return extend(Object.create(ICPrototype), {
            at: atRef,
            pins: spec.pins,
            pinsPerSide: spec.pins / 2,
            width: spec.width * kStripSize,
            height: (spec.pins / 2) * kStripSize,
            spec: spec
        });
    }


	/******************
	* LEDs
	*/

    const kLedLength = 0.1;
    const kLedRadius = 0.12;
    let LedPrototype = {
        makeSvg: function() {
            let group = svgGroup("led"),
                from = this.fromPoint(),
                to = this.toPoint(),
                componentPos = componentPosition(from, to, kLedLength),
                body = svgCircle(componentPos.center.x, componentPos.center.y, kLedRadius, "led-body");
            group.appendChild(svgCircle(from.x, from.y, kFilledHoleRadius));
            group.appendChild(svgCircle(to.x, to.y, kFilledHoleRadius));
            let wirePath = svgLine(from.x, from.y, componentPos.from.x, componentPos.from.y, "wire");
            group.appendChild(wirePath);
            wirePath = svgLine(componentPos.to.x, componentPos.to.y, to.x, to.y, "wire");
            group.appendChild(wirePath);
            group.appendChild(body);
            if (this.spec.label !== undefined) {
                group.appendChild(this.labelSvg(componentPos, this.spec.label));
            }
            return group;
        },
        ...ComponentPrototype
    };


	/******************
	* Resistors
	*/

    const kResistorLength = 0.17;
    let ResistorPrototype = {
        makeSvg: function() {
            let group = svgGroup("resistor"),
                from = this.fromPoint(),
                to = this.toPoint(),
                path = svgLine(from.x, from.y, to.x, to.y, "wire"),
                componentPos = componentPosition(from, to, kResistorLength),
                resistorPath = svgLine(componentPos.from.x, componentPos.from.y,
                        componentPos.to.x, componentPos.to.y,
                        "resistor-body");
            group.appendChild(svgCircle(from.x, from.y, kFilledHoleRadius));
            group.appendChild(svgCircle(to.x, to.y, kFilledHoleRadius));
            group.appendChild(path);
            group.appendChild(resistorPath);
            if (this.spec.label !== undefined) {
                group.appendChild(this.labelSvg(componentPos, this.spec.label));
            }
            return group;
        },
        ...ComponentPrototype
    };


	/******************
	* Background
	*/

    function makeBackground() {
        let backgroundGroup = svgGroup(),
            rect = svgRect(-kBoardPadding, -kBoardPadding, boardWidth + 2 * kBoardPadding, boardHeight + 2 * kBoardPadding);
        backgroundGroup.setAttribute("class", "background");
        backgroundGroup.appendChild(rect);
        backgroundGroup.appendChild(stripsSvg());
        return backgroundGroup;
    }

    function wiresSvg() {
        let wiresGroup = svgGroup("wires"),
            front = svgGroup("front"),
            back = svgGroup("back");
        wiresGroup.appendChild(front);
        wiresGroup.appendChild(back);
        for (const wire of wires) {
            if (wire.layer() == "back") {
                back.appendChild(wire.makeSvg());
            } else {
                front.appendChild(wire.makeSvg());
            }
        }
        return wiresGroup;
    }
    
    function componentsSvg() {
        let group = svgGroup("components"),
            front = svgGroup("front"),
            back = svgGroup("back");
        group.appendChild(front);
        group.appendChild(back);
        for (const component of components) {
            if (component.layer() == "back") {
                back.appendChild(component.makeSvg());
            } else {
                front.appendChild(component.makeSvg());
            }
        }
        return group;
    }

    let view = "FRONT";

    function swapView() {
        if (view == "FRONT") {
            view = "BACK";
            board.setAttribute("transform", `matrix(-1 0 0 1 ${toPixels(boardWidth)} 0)`);
            board.classList.remove("front-view");
            board.classList.add("back-view");
        } else {
            view = "FRONT";
            board.setAttribute("transform", "");
            board.classList.add("front-view");
            board.classList.remove("back-view");
        }
    }


	/******************
	* Legend
    */

    let LegendPrototype = {
        makeSvg: function() {
            let group = svgGroup("legend"),
                background = svgRectPx(0, 0, this.width, this.height, "background");
            group.appendChild(background);
            this.textSvgEl = svgTextPx(4, this.height - 4, "", "hover");
            group.appendChild(this.textSvgEl);
            let viewControl = svgTextPx(this.width - 60, this.height - 4, view, "view");
            group.appendChild(viewControl);
            viewControl.addEventListener("click", function (event) {
                swapView();
                console.log("Click view control, this = ", this);
                console.log("Event = ", event);
                event.target.textContent = view;
            }.bind(this));
            return translatePx(group, this.x, this.y);
        },
        setHoverContent: function(content) {
            this.textSvgEl.textContent = content;
        }
    };

    const kLegendHeight = 20;
    function makeLegend(x, y, width) {
        return extend(Object.create(LegendPrototype), {
            x: x,
            y: y,
            width: width,
            textSvgEl: null,
            height: kLegendHeight
        });
    }

    function initStripboard(root, circuit) {
        boardHeight = circuit.dimensions.height;
        boardWidth = circuit.dimensions.width;
        let rowCount = Math.floor(boardHeight / kStripSize);
        stripCount =  rowCount;
        holeCount = Math.floor(boardWidth / kStripSize);

        rows = makeRows(rowCount);
        strips = makeStrips();
        
        legend = makeLegend(0, root.clientHeight - kLegendHeight, root.clientWidth);
        
        // iterate cuts
        for (const cut of circuit.cuts) {
            let ref = parseRef(cut);
            let strip = getStrip(ref);
            strip.addCut(ref);
        }

        // Iterate wires
        for (const wireSpec of circuit.wires) {
            let wire = createWire(wireSpec);
            wires.push(wire);
        }

        for (const componentSpec of circuit.components) {
            let component = createComponent(componentSpec);
            if (component !== undefined) {
                components.push(component);
            }
        }

        root.appendChild(makeRulers());
        board = svgGroup("board front-view");
        board.appendChild(makeBackground());
        board.appendChild(wiresSvg());
        board.appendChild(componentsSvg());
        let view = svgGroup("view");
        view.appendChild(board);
        root.appendChild(view);
        root.appendChild(legend.makeSvg());
    }

    // Initialize all SVG elements with class "stribpoard" to show the
    // given circuit... It is probably a silly function
    function initAll(circuit) {
        $ALL("svg.stripboard").forEach((el) => {
            console.log("initializing stripboard ", el);
            initStripboard(el, circuit);
        });
    }
    
    return {
        init: initStripboard,
        initAll: initAll
    };
})();
