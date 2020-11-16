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

    function moveAbs(x1, y1) {
        return "M " + toPixels(x1) + " " + toPixels(y1) + "\n";
    }

    function lineAbs(x1, y1) {
        return "L " + toPixels(x1) + " " + toPixels(y1) + "\n";
    }

    function toPixels(d) {
        return d * kPixelsPerInch;
    }

    // Units: inches
    function svgPath(x1, y1, x2, y2, classname) {
        let path = svgElement("path");
        let commands = moveAbs(x1, y1) + lineAbs(x2, y2);
        path.setAttribute("d", commands);
        if (classname !== undefined) {
            path.setAttribute("class", classname);
        }
        return path;
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

    // Units: inches
    function svgRect(x, y, width, height) {
        let rect = svgElement("rect");
        rect.setAttribute("x", toPixels(x));
        rect.setAttribute("y", toPixels(y));
        rect.setAttribute("width", toPixels(width));
        rect.setAttribute("height", toPixels(height));
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

    function transform(el, t) {
        el.setAttribute("transform", t);
        return el;
    }

    function translate(el, dx, dy) {
        return transform(el, "translate(" + toPixels(dx) + ", " + toPixels(dy) + ")");
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
            let path = svgPath(i / 10, 0, i / 10, len);
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
            let path = svgPath(0, i / 10, len, i / 10);
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

    let boardWidth = 0;
    let boardHeight = 0;
    let strips = {};
    let wires = [];
    let components = [];
    let stripCount = 0;
    let holeCount = 0;

    // A string ref is a string like "A4", "C10", "AD13" that refers
    // to a hole location. The alpha characters define the strip and
    // the numeric characters define the hole.
    function parseRef(stringRef) {
        let stripRef = "";
        let hole = 0;
        for (let i = 0; i < stringRef.length; i++) {
            let c = stringRef.charCodeAt(i);
            if (c >= 65 && c <= 91) {
                stripRef += String.fromCharCode(c);
            } else if (c >= 48 && c <= 57) {
                hole = parseInt(stringRef.substr(i));
                break;
            }
        }
        return {
            strip: stripRef,
            hole: hole
        };
    }

    // Given a ref or a string return the strip
    function getStrip(ref) {
        if (typeof ref == "string") {
            return strips[ref];
        }
        return strips[ref.strip];
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
            group.appendChild(rect);
            let holesGroup = svgGroup("holes");
            for (var x = 0; x < boardWidth; x += kStripSize) {
                let hole = svgCircle(x + kStripSize / 2, kStripSize / 2, kHoleRadius);
                holesGroup.appendChild(hole);
            }
            group.appendChild(holesGroup);
            if (this.cuts.length > 0) {
                let cutsGroup = svgGroup("cuts");
                for (const cut of this.cuts) {
                    let cutPath = svgPath(this.pos.x + cut.hole * kStripSize + kStripSize/2, 0,
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

    let WirePrototype = {
        makeSvg: function() {
            let group = svgGroup("wire");
            let fromPos = this.fromStrip().holePos(this.from.hole);
            let toPos = this.toStrip().holePos(this.to.hole);
            let wire = svgPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
            group.appendChild(svgCircle(fromPos.x, fromPos.y, kFilledHoleRadius));
            group.appendChild(svgCircle(toPos.x, toPos.y, kFilledHoleRadius));
            group.appendChild(wire);
            return group;
        },
        fromStrip: function() {
            return getStrip(this.from);
        },
        toStrip: function() {
            return getStrip(this.to);
        }
    };
    
    function createWire(spec) {
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        return extend(Object.create(WirePrototype), {
            from: fromRef,
            to: toRef,
            spec: spec
        });
    }


    // Given a component (e.g. capacitor, resistor) that mounts from the
    // component.fromPos to component.toPos, return a fromPos and toPos
    // that represents the component position along the wire.
    function componentPosition(fromPos, toPos, componentLength) {
        let deltaX = toPos.x - fromPos.x,
            deltaY = toPos.y - fromPos.y,
            wireLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            startWireLength = (wireLength - componentLength) / 2,
            startPercent = startWireLength / wireLength,
            endPercent = (startWireLength + componentLength) / wireLength;
        return {
            fromPos: {
                x: fromPos.x + (deltaX) * startPercent,
                y: fromPos.y + (deltaY) * startPercent
            },
            centerPos: {
                x: fromPos.x + (deltaX) * 0.5,
                y: fromPos.y + (deltaY) * 0.5
            },
            toPos: {
                x: fromPos.x + (deltaX) * endPercent,
                y: fromPos.y + (deltaY) * endPercent
            }
        }
    }

    const kResistorLength = 0.17;
    const kCapacitorLength = 0.12;
    const kLedLength = 0.1;
    const kLedRadius = 0.12;

    let ComponentPrototype = {
        fromStrip: function() {
            return getStrip(this.from);
        },
        toStrip: function() {
            return getStrip(this.to);
        }
    };

    let ResistorPrototype = {
        makeSvg: function() {
            let group = svgGroup("resistor");
            let fromPos = this.fromStrip().holePos(this.from.hole);
            let toPos = this.toStrip().holePos(this.to.hole);
            let path = svgPath(fromPos.x, fromPos.y, toPos.x, toPos.y, "wire");
            let componentPos = componentPosition(fromPos, toPos, kResistorLength);
            let resistorPath = svgPath(componentPos.fromPos.x, componentPos.fromPos.y,
                    componentPos.toPos.x, componentPos.toPos.y,
                    "resistor-body");
            group.appendChild(svgCircle(fromPos.x, fromPos.y, kFilledHoleRadius));
            group.appendChild(svgCircle(toPos.x, toPos.y, kFilledHoleRadius));
            group.appendChild(path);
            group.appendChild(resistorPath);
            return group;
        },
        ...ComponentPrototype
    };

    let CapacitorPrototype = {
        makeSvg: function() {
            let group = svgGroup("capacitor");
            let fromPos = this.fromStrip().holePos(this.from.hole);
            let toPos = this.toStrip().holePos(this.to.hole);
            let path = svgPath(fromPos.x, fromPos.y, toPos.x, toPos.y, "wire");
            let componentPos = componentPosition(fromPos, toPos, kCapacitorLength);
            let capacitorPath = svgPath(componentPos.fromPos.x, componentPos.fromPos.y,
                    componentPos.toPos.x, componentPos.toPos.y,
                    "capacitor-body");
            group.appendChild(svgCircle(fromPos.x, fromPos.y, kFilledHoleRadius));
            group.appendChild(svgCircle(toPos.x, toPos.y, kFilledHoleRadius));
            group.appendChild(path);
            group.appendChild(capacitorPath);
            return group;
        },
        ...ComponentPrototype
    };

    let LedPrototype = {
        makeSvg: function() {
            let fromPos = this.fromStrip().holePos(this.from.hole);
            let toPos = this.toStrip().holePos(this.to.hole);
            let componentPos = componentPosition(fromPos, toPos, kLedLength);
            let body = svgCircle(componentPos.centerPos.x, componentPos.centerPos.y, kLedRadius, "led-body");
            let group = svgGroup("led");
            group.appendChild(svgCircle(fromPos.x, fromPos.y, kFilledHoleRadius));
            group.appendChild(svgCircle(toPos.x, toPos.y, kFilledHoleRadius));
            let wirePath = svgPath(fromPos.x, fromPos.y, componentPos.fromPos.x, componentPos.fromPos.y, "wire");
            group.appendChild(wirePath);
            wirePath = svgPath(componentPos.toPos.x, componentPos.toPos.y, toPos.x, toPos.y, "wire");
            group.appendChild(wirePath);
            group.appendChild(body);
            return group;
        },
        ...ComponentPrototype
    };

    let HeaderPrototype = {
        makeSvg: function() {
            let fromPos = this.fromStrip().holePos(this.from.hole);
            let toPos = this.toStrip().holePos(this.to.hole);
            let group = svgGroup("header");
            let path = svgPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
            group.appendChild(path);
            return group;
        },
        ...ComponentPrototype
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
        case "resistor":
            proto = ResistorPrototype;
            break;
        case "header":
            proto = HeaderPrototype;
            break;
        default:
            console.log("Undefined component type ", spec.type, " in ", spec);
            return undefined;
        }
        let fromRef = parseRef(spec.from);
        let toRef = parseRef(spec.to);
        return extend(Object.create(proto), {
            from: fromRef,
            to: toRef,
            spec: spec
        });
    }

    function makeStripName(s) {
        if (s < 26) {
            return String.fromCharCode(65 + s);
        } else {
            return String.fromCharCode(65 + Math.floor(s / 26) - 1, 65 + (s % 26)) ;
        }
    }

    function makeStrips() {
        let strips = {};
        for (let i = 0; i < stripCount; i++) {
            let name = makeStripName(i);
            strips[name] = createStrip(name, i);
        }
        return strips;
    }

    function makeBackground() {
        let backgroundGroup = svgGroup(),
            rect = svgRect(-kBoardPadding, -kBoardPadding, boardWidth + 2 * kBoardPadding, boardHeight + 2 * kBoardPadding);
        backgroundGroup.setAttribute("class", "background");
        backgroundGroup.appendChild(rect);
        let stripGroup = svgGroup();
        stripGroup.setAttribute("class", "strips");
        for (const [key, strip] of Object.entries(strips)) {
            stripGroup.appendChild(strip.makeSvg());
        }
        backgroundGroup.appendChild(stripGroup);
        return backgroundGroup;
    }

    function wiresSvg() {
        let wiresGroup = svgGroup("wires");
        for (const wire of wires) {
            wiresGroup.appendChild(wire.makeSvg());
        }
        return wiresGroup;
    }
    
    function componentsSvg() {
        let group = svgGroup("components");
        for (const component of components) {
            group.appendChild(component.makeSvg());
        }
        return group;
    }
    function initStripboard(root, circuit) {
        boardHeight = circuit.dimensions.height;
        boardWidth = circuit.dimensions.width;
        stripCount = Math.floor(boardHeight / kStripSize);
        holeCount = Math.floor(boardWidth / kStripSize);
        strips = makeStrips();
        
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
        let board = svgGroup("board");
        board.appendChild(makeBackground());
        board.appendChild(wiresSvg());
        board.appendChild(componentsSvg());
        root.appendChild(board);
    }

    return {
        getStrips: function() { return strips; },
        getStrip: getStrip,
        getWires: function() { return wires; },
        parseRef: parseRef,
        init: function(circuit) {
            $ALL("svg.stripboard").forEach((el) => {
                console.log("initializing stripboard ", el);
                initStripboard(el, circuit);
            });
        }
    };
})();
