export var ToolType;
(function (ToolType) {
    ToolType[ToolType["AddIcon"] = 0] = "AddIcon";
    ToolType[ToolType["Move"] = 1] = "Move";
    ToolType[ToolType["DrawFree"] = 2] = "DrawFree";
    ToolType[ToolType["DrawLine"] = 3] = "DrawLine";
    ToolType[ToolType["DrawCurve"] = 4] = "DrawCurve";
    ToolType[ToolType["AddText"] = 5] = "AddText";
    ToolType[ToolType["AddShape"] = 6] = "AddShape";
    ToolType[ToolType["Undo"] = 7] = "Undo";
    ToolType[ToolType["Redo"] = 8] = "Redo";
    ToolType[ToolType["Erase"] = 9] = "Erase";
    ToolType[ToolType["Ping"] = 10] = "Ping";
})(ToolType || (ToolType = {}));
;
export var LineStyle;
(function (LineStyle) {
    LineStyle[LineStyle["Normal"] = 0] = "Normal";
    LineStyle[LineStyle["Dashed"] = 1] = "Dashed";
    LineStyle[LineStyle["Dotted"] = 2] = "Dotted";
})(LineStyle || (LineStyle = {}));
;
export var LineEnd;
(function (LineEnd) {
    LineEnd[LineEnd["Normal"] = 0] = "Normal";
    LineEnd[LineEnd["Arrow"] = 1] = "Arrow";
    LineEnd[LineEnd["Flat"] = 2] = "Flat";
})(LineEnd || (LineEnd = {}));
;
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["Square"] = 0] = "Square";
    ShapeType[ShapeType["Circle"] = 1] = "Circle";
    ShapeType[ShapeType["Polygon"] = 2] = "Polygon";
})(ShapeType || (ShapeType = {}));
;
//# sourceMappingURL=tools-types.js.map