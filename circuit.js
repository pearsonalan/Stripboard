var CIRCUIT = {
    dimensions: {
        width: 4.0,
        height: 2.6
    },
    cuts: [ "A10", "E18" ],
    wires: [
        { from: "A2", to: "C2" },
        { from: "A12", to: "B12" }
    ],
    components: [
        {
            type: "resistor",
            from: "B5",
            to: "F5",
        },
        {
            type: "resistor",
            from: "A15",
            to: "F15",
        },
        {
            type: "capacitor",
            from: "B20",
            to: "E20"
        },
        {
            type: "capacitor",
            from: "D28",
            to: "D32"
        },
        {
            type: "header",
            from: "A35",
            to: "D35"
        },
        {
            type: "led",
            from: "F3",
            to: "G3"
        }
    ]
};