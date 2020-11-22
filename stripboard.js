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

    function toInches(p) {
        return p / kPixelsPerInch;
    }

    function svgElement(e, classname) {
        let elt = document.createElementNS("http://www.w3.org/2000/svg", e);
        if (classname !== undefined) {
            elt.setAttribute("class", classname);
        }
        return elt;
    }

    function svgGroup(classname) {
        return svgElement("g", classname);
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

    // Units: inches
    function arcAbs(rx, ry, rotationAngle, largeArcFlag, sweepFlag, x, y) {
        return "A " + toPixels(rx) + " " + toPixels(ry) + " "
                    + rotationAngle + " "
                    + (largeArcFlag ? "1" : "0") + " "
                    + (sweepFlag ? "1" : "0")  + " "
                    + toPixels(x) + " " + toPixels(y) + "\n";
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

    function svgPath(commands, classname) {
        let path = svgElement("path", classname);
        path.setAttribute("d", commands);
        return path;
    }

    // Create an SVG Path element drawing a straight line from (x1, y1) to (x2, y2)
    // Units: inches
    function svgLine(x1, y1, x2, y2, classname) {
        let commands = moveAbs(x1, y1) + lineAbs(x2, y2);
        return svgPath(commands, classname);
    }

    // Create an SVG Path element drawing a cubic Bezier curve from (x1, y1) to (x2, y2)
    // with control points C1=(cx1, cy1) and C2=(cx2, cy2)
    // Units: inches
    function svgSpline(x1, y1, x2, y2, cx1, cy1, cx2, cy2, classname) {
        let commands = moveAbs(x1, y1) + cubicSplineAbs(x2, y2, cx1, cy1, cx2, cy2);
        return svgPath(commands, classname);
    }

    // Units: Inches
    function svgRect(x, y, width, height, classname) {
        return svgRectPx(toPixels(x), toPixels(y), toPixels(width), toPixels(height), classname);
    }

    // Units: Pixels
    function svgRectPx(x, y, width, height, classname) {
        let rect = svgElement("rect", classname);
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        return rect;
    }

    // Units: inches
    function svgCircle(x, y, radius, classname) {
        let circle = svgElement("circle", classname);
        circle.setAttribute("cx", toPixels(x));
        circle.setAttribute("cy", toPixels(y));
        circle.setAttribute("r", toPixels(radius));
        return circle;
    }

    // Units: inches
    function svgText(x, y, content, classname) {
        return svgTextPx(toPixels(x), toPixels(y), content, classname);
    }

    // Units: Pixels
    function svgTextPx(x, y, content, classname) {
        let text = svgElement("text", classname);
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.textContent = content;
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
            if (i % 5 == 0) len = 0.065;
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
            if (i % 5 == 0) len = 0.065;
            if (i % 10 == 0) len = 0.1;
            let path = svgLine(0, i / 10, len, i / 10);
            group.appendChild(path);
        }
        group.setAttribute("class", "vertical-ruler");
        return group;
    }

    function makeRulers(width, height) {
        let group = svgGroup("rulers");
        group.appendChild(makeHorizontalRuler(width));
        group.appendChild(makeVerticalRuler(height));
        return group;
    }

    // This constant defines the spacing between holes.
    const kStripSize = 0.1;
    const kStripWidth = 0.07, kStripPadding = (kStripSize - kStripWidth) / 2.0;
    const kHoleRadius = 0.02;
    const kFilledHoleRadius = 0.025;
    const kBoardPadding = 0.02;

    // TODO: Move all of these into a "Board" object so we can have more than one
    // board on a page.

    // A mapping from text ref (e.g. "A0") to the strip that contains that ref
    let g_refToStrip = {};

    // A mapping from text ref (e.g. "A0") to the span that contains that ref
    let g_refToSpan = {};

    let g_legend = null;

    /******************
    * Refs
    *
    * A ref specifies the location of a hole on the board.  It can either be a string
    * ref (like "A4", "C10", "AD13") or a parsed ref, which is a JavaScript object
    * { row: "A", hole: 4, r: 0 }
    *
    * The alpha characters specify the row and the numeric characters specify the hole.
    */

    // Parse a string ref into a Ref object
    function parseRef(stringRef) {
        let row = "";
        let r = 0;
        let hole = 0;
        for (let i = 0; i < stringRef.length; i++) {
            let c = stringRef.charCodeAt(i);
            if (c >= 65 && c <= 91) {
                row += String.fromCharCode(c);
                r = (r * 26) + (c - 65 + 1);
            } else if (c >= 48 && c <= 57) {
                hole = parseInt(stringRef.substr(i));
                break;
            }
        }
        return {
            row: row,
            r: r - 1,
            hole: hole
        };
    }

    // Return a parsed ref for the given ref
    function REF(ref) {
        if (ref === undefined || ref == null) return ref;
        if (typeof ref == "string") {
            return parseRef(ref);
        }
        return ref;
    }

    // Return a text ref for the given ref
    function TREF(ref) {
        if (ref === undefined || ref == null) return ref;
        if (typeof ref == "string") {
            return ref;
        }
        return ref.row + ref.hole;
    }

    // Given a ref, return a ref which is offset a given number of rows or
    // columns
    function offsetRef(ref, rows, cols) {
        if (ref === undefined || ref == null) return ref;
        let newref = {...REF(ref)};
        newref.r += rows;
        newref.hole += cols;
        newref.row = makeRowName(newref.r);
        return newref;
    }


    /******************
    * Rows
    */

    function makeRowName(r) {
        if (r < 0 || r >= 26*26) {
            throw `Invalid row ${r} in makeRowName`;
        }
        if (r < 26) {
            return String.fromCharCode(65 + r);
        } else {
            return String.fromCharCode(65 + Math.floor(r / 26) - 1, 65 + (r % 26)) ;
        }
    }

    let RowPrototype = {
        // Return the point {x,y} of the center of the hole in column c of
        // the row. Holes are centered in the row and in the columns.
        holePos: function(c) {
            return {
                x: this.pos.x + c * kStripSize + kStripSize / 2,
                y: this.pos.y + kStripSize / 2
            };
        },
        // Return the point {x,y} of the top-left corner of column c of
        // the row.
        getPos: function(c) {
            return {
                x: this.pos.x + c * kStripSize,
                y: this.pos.y
            };
        },
        // Return a ref representing the first (left-most) hole in the row
        startRef: function() {
            return {
                row: this.name,
                r: this.row,
                hole: 0
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


    /******************
    * Strips - A strip represents a strip of copper on the breadboad / protoboard with
    *           holes in it for inserting components or wires.  The strip can be
    *           oriented horizontally or vertically but can only be 1 space wide.
    *           Normally all the holes on a strip are connected but a strip can
    *           include "cuts" which separate the strip into "spans" which are
    *           conntected and at the same voltage.
    */

    // Hander for hover over an element
    function g_onHover(text, el, event) {
        g_legend.setHoverContent(text);
    }

    function g_onMouseLeave(event) {
        g_legend.setHoverContent("");
    }

    let StripPrototype = {
        addCut: function(cut) {
            this.cuts.push(cut);
        },
        makeSpans: function() {
            let defineSpan = function(start, end) {
                // console.log(`Defining span on strip ${this.name} from ${TREF(start)} to ${TREF(end)}.`);
                this.board.addSpan(makeSpan(this, start, end));
            }.bind(this);

            if (this.cuts.length == 0) {
                // If the strip has no cuts, the whole strip is a single span
                defineSpan(this.startRef, this.endRef);
            } else {
                // Put the text refs of the cuts into a map for quick lookup
                let cuts = {};
                for (let cut of this.cuts) {
                    cuts[TREF(cut)] = true;
                }
                let inSpan = false,
                    spanStartRef = undefined,
                    lastRef = undefined;
                for (let ref = this.startRef; ref !== undefined; ref = this.nextRef(ref)) {
                    let tref = TREF(ref),
                        isCut = cuts[tref] || false;
                    if (!inSpan && !isCut) {
                        spanStartRef = ref;
                        inSpan = true;
                    } else if (inSpan && isCut) {
                        defineSpan(spanStartRef, lastRef);
                        inSpan = false;
                        spanStartRef = undefined;
                    }
                    lastRef = ref;
                }
                if (inSpan) {
                    defineSpan(spanStartRef, lastRef);
                }
            }
        }
    };

    let HorizontalStripPrototype = {
        // Given a ref on the strip, return the "next" ref or undefined if the ref is
        // not on the strip the ref is the end ref
        nextRef: function(ref) {
            let pref = REF(ref),
                sref = REF(this.startRef),
                eref = REF(this.endRef);
            if (pref.row !== sref.row) return undefined;
            if (pref.hole < sref.hole || pref.hole == eref.hole) return undefined;
            return {
                row: pref.row,
                r: pref.r,
                hole: pref.hole + 1
            };
        },
        makeSvg: function() {
            let group = svgGroup("strip"),
                rect = svgRect(kStripPadding,
                               kStripPadding,
                               this.holes * kStripSize - 2 * kStripPadding,
                               kStripWidth);
            rect.addEventListener("mouseover", g_onHover.curry(`STRIP ${this.name}`, rect));
            rect.addEventListener("mouseleave", g_onMouseLeave);
            group.appendChild(rect);

            let holesGroup = svgGroup("holes");
            for (var n = 0; n < this.holes; n += 1) {
                let hole = svgCircle(n * kStripSize + kStripSize / 2, kStripSize / 2, kHoleRadius);
                hole.addEventListener("mouseover", g_onHover.curry(`HOLE ${TREF(offsetRef(this.startRef, 0, n))}`, hole));
                hole.addEventListener("mouseleave", g_onMouseLeave);
                holesGroup.appendChild(hole);
            }
            group.appendChild(holesGroup);
            if (this.cuts.length > 0) {
                let cutsGroup = svgGroup("cuts");
                for (const cut of this.cuts) {
                    let cutPos = this.board.POS(cut);
                    let cutPath = svgLine(cutPos.x - this.pos.x + kStripSize/2,
                                          0,
                                          cutPos.x - this.pos.x + kStripSize/2,
                                          kStripSize);
                    cutsGroup.appendChild(cutPath);
                }
                group.appendChild(cutsGroup);
            }
            return translate(group, this.pos.x, this.pos.y);
        },
        ...StripPrototype
    }

    function createHorizontalStrip(board, startRef, holes) {
        let endRef = offsetRef(startRef, 0, holes - 1);
        let strip = extend(Object.create(HorizontalStripPrototype), {
            board: board,
            name: `${TREF(startRef)}:${TREF(endRef)}`,
            startRef: REF(startRef),
            endRef: endRef,
            holes: holes,
            pos: board.POS(startRef),
            cuts: [],
            spans: []
        });

        for (let i = 0; i < holes; i++) {
            let ref = TREF(offsetRef(startRef, 0, i));
            board.refToStrip[ref] = strip;
            g_refToStrip[ref] = strip;
        }

        return strip;
    }

    let VerticalStripPrototype = {
        // Given a ref on the strip, return the "next" ref or undefined if the ref is
        // not on the strip the ref is the end ref
        nextRef: function(ref) {
            let pref = REF(ref),
                sref = REF(this.startRef),
                eref = REF(this.endRef);
            if (pref.hole !== sref.hole) return undefined;
            if (pref.r < sref.r || pref.r == eref.r) return undefined;
            return {
                row: makeRowName(pref.r + 1),
                r: pref.r + 1,
                hole: pref.hole
            };
        },
        makeSvg: function() {
            let group = svgGroup("strip"),
                rect = svgRect(kStripPadding,
                               kStripPadding,
                               kStripWidth,
                               this.holes * kStripSize - 2 * kStripPadding);
            rect.addEventListener("mouseover", g_onHover.curry(`STRIP ${this.name}`, rect));
            rect.addEventListener("mouseleave", g_onMouseLeave);
            group.appendChild(rect);

            let holesGroup = svgGroup("holes");
            for (var n = 0; n < this.holes; n += 1) {
                let hole = svgCircle(kStripSize / 2, n * kStripSize + kStripSize / 2, kHoleRadius);
                hole.addEventListener("mouseover", g_onHover.curry(`HOLE ${TREF(offsetRef(this.startRef, n, 0))}`, hole));
                hole.addEventListener("mouseleave", g_onMouseLeave);
                holesGroup.appendChild(hole);
            }
            group.appendChild(holesGroup);
            if (this.cuts.length > 0) {
                let cutsGroup = svgGroup("cuts");
                for (const cut of this.cuts) {
                    let cutPos = this.board.POS(cut);
                    let cutPath = svgLine(0,
                                          cutPos.y - this.pos.y + kStripSize/2,
                                          kStripSize,
                                          cutPos.y - this.pos.y + kStripSize/2);
                    cutsGroup.appendChild(cutPath);
                }
                group.appendChild(cutsGroup);
            }
            return translate(group, this.pos.x, this.pos.y);
        },
        ...StripPrototype
    }

    function createVerticalStrip(board, startRef, holes) {
        let endRef = offsetRef(startRef, holes - 1, 0);
        let strip = extend(Object.create(VerticalStripPrototype), {
            board: board,
            name: `${TREF(startRef)}:${TREF(endRef)}`,
            startRef: REF(startRef),
            endRef: endRef,
            holes: holes,
            pos: board.POS(startRef),
            cuts: [],
            spans: []
        });

        for (let i = 0; i < holes; i++) {
            let ref = TREF(offsetRef(startRef, i, 0));
            board.refToStrip[ref] = strip;
            g_refToStrip[ref] = strip;
        }

        return strip;
    }

    function g_getStripAtRef(ref) {
        let tref = TREF(ref);
        return g_refToStrip[tref];
    }

    function stripsSvg(strips) {
        let stripGroup = svgGroup("strips");
        for (const strip of strips) {
            stripGroup.appendChild(strip.makeSvg());
        }
        return stripGroup;
    }


    /**************************************************************************
    * Spans - A span is a section of strip that is connected. The whole strip
    *         may be a single span if there are no cuts.  If there are cuts
    *         on the strip, it may be separated into two or more spans.
    *         If a span has wires or components connected to it, it will be
    *         part of a net. A span with no connections is not part of the
    *         circuit so is not assigned to a net.
    */

    let SpanPrototype = {
        // Return the next ref in the span.
        nextRef: function(ref) {
            let pref = REF(ref);
            if (pref.r == this.endRef.r && pref.hole == this.endRef.hole) {
                // At the end of the span
                return undefined;
            }
            return this.strip.nextRef(ref);
        },
        addComponent: function(component) {
            this.components.push(component);
        },
        addWire: function(wire) {
            this.wires.push(wire);
        },
        makeSvg: function() {
            let from = this.strip.board.HOLE(this.startRef),
                to = this.strip.board.HOLE(this.endRef);
            return svgLine(from.x, from.y, to.x, to.y);
        }
    };

    function makeSpan(strip, startRef, endRef) {
        let span = extend(Object.create(SpanPrototype), {
            name: `${TREF(startRef)}:${TREF(endRef)}`,
            strip: strip,
            startRef: REF(startRef),
            endRef: REF(endRef),
            wires: [],
            components: [],
            net: undefined
        });

        return span;
    }

    function spansSvg(spans) {
        let group = svgGroup("spans");
        for (const span of spans) {
            group.appendChild(span.makeSvg());
        }
        return group;
    }

    function g_getSpanAtRef(ref) {
        let tref = TREF(ref);
        return g_refToSpan[tref];
    }


    /**************************************************************************
    * Nets  - A net is a single span or a group of spans which are connected
    *         together by wires. A net is essentially a "node" in a circuit
    *         with all of the spans at the same voltage.
    */

    let NetPrototype = {
        addSpan: function(span) {
            this.spans.push(span);
        }
    };

    // Creates a net
    function makeNet(name) {
        return extend(Object.create(NetPrototype), {
            name: name,
            spans: [],
        });
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
            return g_getStripAtRef(this.fromRef);
        },
        fromSpan: function() {
            return g_getSpanAtRef(this.fromRef);
        },
        fromPoint: function() {
            return this.board.getPoint(this.fromRef);
        },
        toStrip: function() {
            return g_getStripAtRef(this.toRef);
        },
        toSpan: function() {
            return g_getSpanAtRef(this.toRef);
        },
        toPoint: function() {
            return this.board.getPoint(this.toRef);
        },
    };

    function createWire(board, spec) {
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        let wire = extend(Object.create(WirePrototype), {
            board: board,
            fromRef: fromRef,
            toRef: toRef,
            spec: spec
        });

        // Add the wire to the spans it is connected to
        wire.fromSpan().addWire(wire);
        wire.toSpan().addWire(wire);

        return wire;
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
        addToSpans: function() {
            if (this.getSpans === undefined) {
                console.log("getSpans is not defined on ", this);
                return;
            }
            for (const span of this.getSpans()) {
                span.addComponent(this);
            }
        },
        labelSvg: function(componentPosition, label) {
            return svgText(componentPosition.center.x, componentPosition.center.y,
                    label, "label");
        }
    };

    // Prototype for compnents that connect two Refs (such as a Resistor or Capacitor)
    let PointToPointComponentPrototype = {
        fromStrip: function() {
            return g_getStripAtRef(this.fromRef);
        },
        fromSpan: function() {
            return g_getSpanAtRef(this.fromRef);
        },
        fromPoint: function() {
            return this.board.getPoint(this.fromRef);
        },
        toStrip: function() {
            return g_getStripAtRef(this.toRef);
        },
        toSpan: function() {
            return g_getSpanAtRef(this.toRef);
        },
        toPoint: function() {
            return this.board.getPoint(this.toRef);
        },
        getSpans: function() {
            return [this.fromSpan(), this.toSpan()];
        },
        ...ComponentPrototype
    };

    function createComponent(board, spec) {
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
            return createIC(board, spec);
        case "transistor":
            // Transistors are also different
            return createTransistor(board, spec);
        case "hole":
            return createHole(board, spec);
        default:
            console.log("Undefined component type ", spec.type, " in ", spec);
            return undefined;
        }
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        return extend(Object.create(proto), {
            board: board,
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
        ...PointToPointComponentPrototype
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
        ...PointToPointComponentPrototype
    };


    /******************
    * Headers
    */

    let HeaderPrototype = {
        nextRef: function(ref) {
            let pref = REF(ref),
                sref = REF(this.fromRef),
                eref = REF(this.toRef);
            if (sref.row == eref.row) {
                // header is horzontal -- increment hole
                if (pref.row !== sref.row) return undefined;
                if (pref.hole < sref.hole || pref.hole == eref.hole) return undefined;
                return {
                    row: pref.row,
                    r: pref.r,
                    hole: pref.hole + 1
                };
            } else {
                // header is vertical -- increment row
                if (pref.hole !== sref.hole) return undefined;
                if (pref.r < sref.r || pref.r == eref.r) return undefined;
                return {
                    row: makeRowName(pref.r + 1),
                    r: pref.r + 1,
                    hole: pref.hole
                };
            }
        },
        getPins: function() {
            let pins = [];
            for (let ref = REF(this.fromRef); ref !== undefined; ref = this.nextRef(ref)) {
                pins.push(ref);
            }
            return pins;
        },
        getSpans: function() {
            return this.getPins().reduce(function(acc, value) {
                 acc.push(g_getSpanAtRef(value));
                 return acc;
            }, []);
        },
        fromPoint: function() {
            return this.board.getPoint(this.fromRef);
        },
        toPoint: function() {
            return this.board.getPoint(this.toRef);
        },
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
        makeSvg: function() {
            let group = svgGroup("ic"),
                pinsGroup = svgGroup("pins");
            for (let i = 0; i < this.pinCount; i++) {
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
            return this.board.getRow(this.at);
        },
        // Returns the position (in inches) of the center of the "at" pin
        atPos: function() {
            return this.board.getPoint(this.at);
        },
        getPins: function() {
            let pins = [];
            for (let i = 0; i < this.pinCount; i++) {
                pins.push(this.pinRef(i));
            }
            return pins;
        },
        getSpans: function() {
            return this.getPins().reduce(function(acc, value) {
                 acc.push(g_getSpanAtRef(value));
                 return acc;
            }, []);
        },
        // Returns the position (in inches) of the top left corner of the body.
        topLeftPos() {
            let row = this.atRow();
            return {
                x: row.pos.x + this.at.hole * kStripSize + kStripSize/2,
                y: row.pos.y
            };
        },
        pinRef: function(pin) {
            return offsetRef(this.at, 
                             pin % this.pinsPerSide,
                             pin < this.pinsPerSide ? 0 : this.spec.width);
        },
        // Returns the position (in inches) of the center of pin N, where pin
        // 0 is the "AT" pin and the pins are numbererd down the left side
        // then down the right side.
        pinPos: function(pin) {
            // let atPos = this.atPos();
            // return {
            //     x: (pin < this.pinsPerSide ? atPos.x : this.width + atPos.x),
            //     y: atPos.y + ((pin % this.pinsPerSide) * kStripSize)
            // };
            return this.board.HOLE(this.pinRef(pin));
        },
        ...ComponentPrototype
    };

    function createIC(board, spec) {
        let atRef = parseRef(spec.at);
        return extend(Object.create(ICPrototype), {
            board: board,
            at: atRef,
            pinCount: spec.pins,
            pinsPerSide: spec.pins / 2,
            width: spec.width * kStripSize,
            height: (spec.pins / 2) * kStripSize,
            spec: spec
        });
    }


    /******************
    * Transistors
    */

    const kTransistorRadius = 0.13;
    let TransistorPrototype = {
        // Returns the position (in inches) of the center of the "at" pin
        atPos: function() {
            return this.board.getPoint(this.at);
        },
        getSpans: function() {
            return this.pins.reduce(function(acc, value) {
                 acc.push(g_getSpanAtRef(value));
                 return acc;
            }, []);
        },
        makeSvg: function() {
            let group = svgGroup("transistor"),
                pinsGroup = svgGroup("pins"),
                at = this.atPos();
            for (const pin of this.pins) {
                let pinPos = this.board.HOLE(pin);
                pinsGroup.appendChild(svgCircle(pinPos.x, pinPos.y, kFilledHoleRadius));
            }
            group.appendChild(pinsGroup);
            let commands = moveAbs(at.x - 0.1, at.y - 0.1) +
                           lineAbs(at.x + 0.1, at.y - 0.1) +
                           arcAbs(kTransistorRadius, kTransistorRadius, 0,
                                true, true, at.x - 0.1, at.y - 0.1);
            var rotateTransform;
            switch (this.orientation) {
            case "N":
                rotateTransform = `rotate(0,${toPixels(at.x)},${toPixels(at.y)})`;
                break;
            case "S":
                rotateTransform = `rotate(180,${toPixels(at.x)},${toPixels(at.y)})`;
                break;
            case "E":
                rotateTransform = `rotate(90,${toPixels(at.x)},${toPixels(at.y)})`;
                break;
            case "W":
                rotateTransform = `rotate(270,${toPixels(at.x)},${toPixels(at.y)})`;
                break;
            }
            group.appendChild(transform(svgPath(commands), rotateTransform));
            return group;
        },
        ...ComponentPrototype
    };

    function createTransistor(board, spec) {
        let atRef = parseRef(spec.at),
            orientation = spec.orientation || "N";
        var pins;
        switch (orientation) {
        case "N":
            pins = [offsetRef(atRef, 0, -1), atRef, offsetRef(atRef, 0, 1)];
            break;
        case "S":
            pins = [offsetRef(atRef, 0, 1), atRef, offsetRef(atRef, 0, -1)];
            break;
        case "E":
            pins = [offsetRef(atRef, -1, 0), atRef, offsetRef(atRef, 1, 0)];
            break;
        case "W":
            pins = [offsetRef(atRef, 1, 0), atRef, offsetRef(atRef, -1, 0)];
            break;
        }
        return extend(Object.create(TransistorPrototype), {
            board: board,
            at: atRef,
            orientation: orientation,
            pins: pins,
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
        ...PointToPointComponentPrototype
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
        ...PointToPointComponentPrototype
    };


    /******************
    * Hole - a drilled hole in the board
    */
    let HolePrototype = {
        makeSvg: function() {
            let group = svgGroup("hole");
            group.appendChild(svgCircle(this.pos.x, this.pos.y, this.radius));
            return group;
        }
    };

    function createHole(board, spec) {
        let pos = undefined;
        if (spec.ref !== undefined) {
            pos = board.HOLE(spec.ref);
        }
        if (spec.x !== undefined && spec.y !== undefined) {
            pos = {
                x: spec.x,
                y: spec.y
            };
        }
        return extend(Object.create(HolePrototype), {
            pos: pos,
            radius: spec.radius
        });
    }

    /******************
    * Background
    */

    function wiresSvg(wires) {
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

    function componentsSvg(components) {
        let group = svgGroup("components"),
            front = svgGroup("front"),
            back = svgGroup("back");
        group.appendChild(front);
        group.appendChild(back);
        for (const component of components) {
            if (component.layer !== undefined && component.layer() == "back") {
                back.appendChild(component.makeSvg());
            } else {
                front.appendChild(component.makeSvg());
            }
        }
        return group;
    }

    /******************
    * Legend
    */

    let LegendPrototype = {
        makeSvg: function() {
            let group = svgGroup("legend"),
                background = svgRectPx(0, 0, this.width, this.height, "background");
            this.hoverTextElt = svgTextPx(4, this.height - 4, "", "hover");
            this.posTextElt = svgTextPx(124, this.height - 4, "", "pos");
            this.netTextElt = svgTextPx(258, this.height - 4, "", "net");
            let viewControl = svgTextPx(this.width - 60, this.height - 4,
                                        this.board.viewOrientation, "view");
            group.appendChild(background);
            group.appendChild(this.hoverTextElt);
            group.appendChild(this.posTextElt);
            group.appendChild(this.netTextElt);
            group.appendChild(viewControl);
            viewControl.addEventListener("click", function (event) {
                this.board.swapView();
                event.target.textContent = this.board.viewOrientation;
            }.bind(this));
            let legendContainer = svgGroup("legend-container");
            legendContainer.appendChild(group);
            return translatePx(legendContainer, this.x, this.y);
        },
        setHoverContent: function(content) {
            this.hoverTextElt.textContent = content;
        },
        setPositionContent: function(content) {
            this.posTextElt.textContent = content;
        },
        setNetContent: function(content) {
            this.netTextElt.textContent = content;
        }
    };

    const kLegendHeight = 20;
    function makeLegend(board, x, y, width) {
        return extend(Object.create(LegendPrototype), {
            board: board,
            x: x,
            y: y,
            width: width,
            hoverTextElt: null,
            posTextElt: null,
            netTextElt: null,
            height: kLegendHeight
        });
    }


    /******************
     * Board
     */
    
    let BoardPrototype = {
        init: function() {
            g_boardHeight = this.height;
            g_boardWidth = this.width;

            this.initRows();
            g_rows = this.rows;

            this.initStrips();
        },

        initRows: function() {
            this.rows = {};
            for (let r = 0; r < this.rowCount; r++) {
                let name = makeRowName(r);
                this.rows[name] = createRow(name, r);
            }
        },

        // Stripboard strips are horizontal strips, one per row
        makeStripboardStrips: function() {
            let strips = [];
            for (const [key, row] of Object.entries(this.rows)) {
                strips.push(createHorizontalStrip(this, row.startRef(), this.holeCount));
            }
            return strips;
        },

        // Protoboard strips have vertical busses on each side with horizontal strips
        // in the middle.
        makeProtoboardStrips: function() {
            let strips = [];
            strips.push(createVerticalStrip(this, "A0", this.rowCount));
            strips.push(createVerticalStrip(this, offsetRef("A0", 0, this.holeCount-1), this.rowCount));
            for (const [key, row] of Object.entries(this.rows)) {
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 1), this.holeCount - 2));
            }
            return strips;
        },

        // Protoboard strips have 2 vertical busses on each side with horizontal strips
        // in the middle and a gap.
        makeBreadboardStrips: function() {
            let strips = [];
            strips.push(createVerticalStrip(this, "A0", this.rowCount));
            strips.push(createVerticalStrip(this, "A1", this.rowCount));
            for (const [key, row] of Object.entries(this.rows)) {
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 2), 5));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 9), 5));
            }
            strips.push(createVerticalStrip(this, "A14", this.rowCount));
            strips.push(createVerticalStrip(this, "A15", this.rowCount));
            return strips;
        },

        makeSB4Strips: function(fullboard) {
            let strips = [];
            strips.push(createVerticalStrip(this, "A0", 19));
            strips.push(createVerticalStrip(this, "A11", 19));
            strips.push(createVerticalStrip(this, "A12", 19));
            strips.push(createVerticalStrip(this, "A23", 19));
            if (fullboard) {
                strips.push(createVerticalStrip(this, "T0", 19));
                strips.push(createVerticalStrip(this, "T11", 19));
                strips.push(createVerticalStrip(this, "T12", 19));
                strips.push(createVerticalStrip(this, "T23", 19));
            }
            for (const [key, row] of Object.entries(this.rows)) {
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 1), 4));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 5), 2));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 7), 4));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 13), 2));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 15), 2));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 17), 2));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 19), 2));
                strips.push(createHorizontalStrip(this, offsetRef(row.startRef(), 0, 21), 2));
            }
            return strips;
        },

        makeSB4HorizStrips: function(fullboard) {
            let strips = [];
            strips.push(createHorizontalStrip(this, "A0", 19));
            strips.push(createHorizontalStrip(this, "L0", 19));
            strips.push(createHorizontalStrip(this, "M0", 19));
            strips.push(createHorizontalStrip(this, "X0", 19));
            if (fullboard) {
                strips.push(createHorizontalStrip(this, "A19", 19));
                strips.push(createHorizontalStrip(this, "L19", 19));
                strips.push(createHorizontalStrip(this, "M19", 19));
                strips.push(createHorizontalStrip(this, "X19", 19));
            }
            for (let c = 0; c < this.holeCount; c++) {
                strips.push(createVerticalStrip(this, "B"+c, 4));
                strips.push(createVerticalStrip(this, "F"+c, 2));
                strips.push(createVerticalStrip(this, "H"+c, 4));
                strips.push(createVerticalStrip(this, "N"+c, 2));
                strips.push(createVerticalStrip(this, "P"+c, 2));
                strips.push(createVerticalStrip(this, "R"+c, 2));
                strips.push(createVerticalStrip(this, "T"+c, 2));
                strips.push(createVerticalStrip(this, "V"+c, 2));
            }
            return strips;
        },

        initStrips: function() {
            if (this.circuit.layout == "protoboard") {
                this.strips = this.makeProtoboardStrips();
            } else if (this.circuit.layout == "breadboard") {
                this.strips = this.makeBreadboardStrips();
            } else if (this.circuit.layout == "sb4") {
                this.strips = this.makeSB4Strips(true);
            } else if (this.circuit.layout == "sb4-horiz") {
                this.strips = this.makeSB4HorizStrips(true);
            } else if (this.circuit.layout == "sb4half") {
                this.strips = this.makeSB4Strips(false);
            } else {
                this.strips = this.makeStripboardStrips();
            }
        },

        loadCuts: function() {
            if (this.circuit.cuts === undefined) return;

            // Iterate cuts and add them to the strips
            for (const cut of this.circuit.cuts) {
                let ref = parseRef(cut);
                let strip = g_getStripAtRef(ref);
                strip.addCut(ref);
            }
        },

        // Iterates the strips after cuts have been assigned and builds spans
        // from the un-cut sections
        makeSpans: function() {
            for (const strip of this.strips) {
                strip.makeSpans();
            }
        },

        addSpan: function(span) {
            this.spans.push(span);

            // Update the ref -> span map for all the refs in the span
            for (let ref = span.startRef; ref !== undefined; ref = span.nextRef(ref)) {
                let tref = TREF(ref);
                // console.log(`setting span at ${tref} to ${span.name}`);
                this.refToSpan[tref] = span;
                g_refToSpan[tref] = span;
            }
        },

        // Iterates the spans after strips have been split into spans to create nets
        makeNets: function() {
            let n = 0;
            let visited = new Map();
            for (const span of this.spans) {
                // If the span has any wires or components connected to it and the span is
                // not already in a net, make a net
                if ((span.wires.length > 0 || span.components.length > 0) && span.net === undefined) {
                    let net = makeNet(`N${n}`);
                    let searchSpans = [],
                        s = undefined;

                    // Add the starting span to the searchSpans array
                    searchSpans.push(span);
                    while ((s = searchSpans.shift()) !== undefined) {
                        if (visited.get(s)) continue;
                        visited.set(s, true);
                        net.addSpan(s);
                        s.net = net;
                        // Add any spans connected by wires to s to the searchSpans array if they have
                        // not been visited.
                        for (const wire of s.wires) {
                            if (!visited.get(wire.fromSpan())) searchSpans.push(wire.fromSpan());
                            if (!visited.get(wire.toSpan())) searchSpans.push(wire.toSpan());
                        }
                    }
                    n++;
                }
            }
            console.log(`Created ${n} nets.`);

            // Update the ref -> net map for all the refs in spans that have nets
            for (const span of this.spans) {
                if (span.net !== undefined) {
                    for (let ref = span.startRef; ref !== undefined; ref = span.nextRef(ref)) {
                        let tref = TREF(ref);
                        this.refToNet[tref] = span.net;
                    }
                }
            }
        },

        loadWires: function() {
            if (this.circuit.wires === undefined) return;

            // Iterate wires
            for (const wireSpec of this.circuit.wires) {
                let wire = createWire(this, wireSpec);
                this.wires.push(wire);
            }
        },

        loadComponents: function() {
            if (this.circuit.components === undefined) return;

            for (const componentSpec of this.circuit.components) {
                let component = createComponent(this, componentSpec);
                if (component !== undefined) {
                    this.components.push(component);
                    if (component.addToSpans !== undefined) {
                        component.addToSpans();
                    }
                }
            }
        },

        loadNets: function() {
            this.makeNets();

            // Use the nets map in the circuit to give names to some nets.
            if (this.circuit.nets !== undefined) {
                for (const [ref, netname] of Object.entries(this.circuit.nets)) {
                    let net = this.getNetAtRef(ref);
                    if (net !== undefined) {
                        net.name = netname;
                    }
                }
            }
        },

        loadCircuit: function() {
            this.loadCuts();
            this.makeSpans();
            this.loadWires();
            this.loadComponents();
            this.loadNets();
        },

        makeBackground: function() {
            let backgroundGroup = svgGroup(),
                rect = svgRect(-kBoardPadding, -kBoardPadding,
                               this.width + 2 * kBoardPadding, this.height + 2 * kBoardPadding);
            backgroundGroup.setAttribute("class", "background");
            backgroundGroup.appendChild(rect);
            backgroundGroup.appendChild(stripsSvg(this.strips));
            return backgroundGroup;
        },

        swapView: function() {
            if (this.viewOrientation == "FRONT") {
                this.viewOrientation = "BACK";
                this.svgElement.setAttribute("transform", `matrix(-1 0 0 1 ${toPixels(this.width)} 0)`);
                this.svgElement.classList.remove("front-view");
                this.svgElement.classList.add("back-view");
            } else {
                this.viewOrientation = "FRONT";
                this.svgElement.setAttribute("transform", "");
                this.svgElement.classList.add("front-view");
                this.svgElement.classList.remove("back-view");
            }
        },

        makeLegend: function() {
            this.legend = makeLegend(this, 0, this.root.clientHeight - kLegendHeight, this.root.clientWidth);
            return this.legend;
        },

        // Given a position with {x,y} in inches, return the ref at that position
        // or undefined
        refAtPos: function(pos) {
            if (pos.x === undefined || pos.y === undefined ||
                pos.x < 0 || pos.x > this.width ||
                pos.y < 0 || pos.y > this.height) {
                return undefined;
            }
            let hole = Math.floor(pos.x / kStripSize),
                r = Math.floor(pos.y / kStripSize),
                row = makeRowName(r);
            return {
                row: row,
                r: r,
                hole: hole
            };
        },

        // Given a ref or a string return the row
        getRow: function(ref) {
            let pref = REF(ref);
            return this.rows[pref.row];
        },

        // Given a ref or a string, return the {x,y} coordinates of the center of
        // the hole at the ref location.
        getPoint: function(ref) {
            let pref = REF(ref);
            return this.getRow(pref).holePos(pref.hole);
        },

        HOLE: function(ref) {
            let pref = REF(ref);
            return this.getRow(pref).holePos(pref.hole);
        },

        POS: function(ref) {
            let pref = REF(ref);
            return this.getRow(pref).getPos(pref.hole);
        },

        getNetAtRef: function(ref) {
            let tref = TREF(ref);
            return this.refToNet[tref];
        }
    };

    function makeBoard(root, circuit) {
        let height = circuit.dimensions.height;
        let width = circuit.dimensions.width;
        let board = extend(Object.create(BoardPrototype), {
            root: root,
            circuit: circuit,
            height: height,
            width: width,
            rowCount: Math.floor(height / kStripSize + kStripSize / 2),
            holeCount: Math.floor(width / kStripSize + kStripSize / 2),
            viewOrientation: "FRONT",
            svgElement: null,
            
            // Legend object to manage the Legend view at the bottom of
            // the board SVG
            legend: null,

            // A mapping from row name (e.g. "A" or "AC") to a row object
            rows: {},

            // An array of all the strips on the board
            strips: [],

            // Array of all the spans on the board
            spans: [],

            // Arrays of wires and components on the board
            wires: [],
            components: [],

            // A mapping from text ref (e.g. "A0") to the strip that contains that ref
            refToStrip: {},

            // A mapping from text ref (e.g. "A0") to the span that contains that ref
            refToSpan: {},

            // A mapping from text ref (e.g. "A0") to the net that contains that ref
            refToNet: {}
        });
        board.init();
        return board;
    }

    // When called, this is bound to board object
    function onMouseMove(event) {
        let rect = this.svgElement.getBoundingClientRect(),
            x = event.clientX - rect.left,
            y = event.clientY - rect.top;
        let pos = {
            x: toInches(x),
            y: toInches(y)
        }
        if (this.viewOrientation == "BACK") {
            // handle view being flipped
            pos.x = this.width - pos.x;
        }
        let posText = `[${pos.x.toFixed(2)},${pos.y.toFixed(2)}]`;
        let ref = this.refAtPos(pos);
        let net = undefined;
        if (ref !== undefined) {
            let tref = TREF(ref);
            posText = posText + " " + tref;
            net = this.getNetAtRef(tref);
        }
        this.legend.setPositionContent(posText);
        if (net === undefined) {
            this.legend.setNetContent("");
        } else {
            this.legend.setNetContent(`NET: ${net.name}`);
        }
    }

    // Some circuits have pre-defined dimensions. Set the dimensions if a
    // standard layout is specified.
    function setCircuitDimensions(circuit) {
        if (circuit.layout == "sb4") {
            circuit.dimensions = {
                width: 2.4,
                height: 3.8
            };
        }
        if (circuit.layout == "sb4-horiz") {
            circuit.dimensions = {
                width: 3.8,
                height: 2.4 
            };
        }
        if (circuit.layout == "sb4half") {
            circuit.dimensions = {
                width: 2.4,
                height: 1.9
            };
        }
    }

    function initStripboard(root, circuit) {
        setCircuitDimensions(circuit);
       
        let board = makeBoard(root, circuit);

        board.loadCircuit();

        root.appendChild(makeRulers(board.width, board.height));

        g_legend = board.makeLegend();

        board.svgElement = svgGroup("board front-view");
        board.svgElement.appendChild(board.makeBackground());
        board.svgElement.appendChild(spansSvg(board.spans));
        board.svgElement.appendChild(wiresSvg(board.wires));
        board.svgElement.appendChild(componentsSvg(board.components));
        let view = svgGroup("view");
        view.appendChild(board.svgElement);
        root.appendChild(view);
        root.appendChild(board.legend.makeSvg());

        board.svgElement.addEventListener("mousemove", onMouseMove.bind(board));

        view.addEventListener("mouseleave", function (event) {
            this.legend.setPositionContent("");
            this.legend.setNetContent("");
        }.bind(board));

        return board;
    }

    return {
        init: initStripboard
    };
})();
