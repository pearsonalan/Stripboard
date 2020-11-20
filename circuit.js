var CIRCUIT = {
    dimensions: {
        width: 4.0,
        height: 2.6
    },
    cuts: [ "A10", "E18", "H22", "I22", "J22", "K22" ],
    wires: [
        { from: "A2", to: "C2" },
        { from: "A12", to: "B12" },
        { from: "O20", to: "T22" },
        { from: "O25", to: "P32", layer: "back" }
    ],
    components: [
        {
            label: "R1",
            type: "resistor",
            from: "B5",
            to: "F5",
        },
        {
            label: "R2",
            type: "resistor",
            from: "A15",
            to: "F15",
            layer: "back"
        },
        {
            label: "C1",
            type: "capacitor",
            from: "B20",
            to: "E20"
        },
        {
            label: "C2",
            type: "capacitor",
            from: "D28",
            to: "D32"
        },
        {
            label: "D1",
            type: "diode",
            from: "M5",
            to: "Q5",
        },
        {
            type: "header",
            from: "T35",
            to: "W35"
        },
        {
            label: "LED",
            type: "led",
            from: "F3",
            to: "G3"
        },
        {
            type: "ic",
            pins: 8,
            width: 3,
            at: "H20"
        },
        {
            type: "transistor",
            at: "J32",
             orientation: "W"
        },
        {
            type: "transistor",
            at: "X17",
             orientation: "E"
        }

    ]
};
