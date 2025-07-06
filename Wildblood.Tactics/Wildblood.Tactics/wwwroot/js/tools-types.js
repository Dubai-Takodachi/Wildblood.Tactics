export var ToolType;
(function (ToolType) {
    ToolType[ToolType["AddIcon"] = 0] = "AddIcon";
    ToolType[ToolType["Move"] = 1] = "Move";
    ToolType[ToolType["Resize"] = 2] = "Resize";
    ToolType[ToolType["DrawFree"] = 3] = "DrawFree";
    ToolType[ToolType["DrawLine"] = 4] = "DrawLine";
    ToolType[ToolType["DrawCurve"] = 5] = "DrawCurve";
    ToolType[ToolType["AddText"] = 6] = "AddText";
    ToolType[ToolType["AddShape"] = 7] = "AddShape";
    ToolType[ToolType["Undo"] = 8] = "Undo";
    ToolType[ToolType["Redo"] = 9] = "Redo";
    ToolType[ToolType["Clear"] = 10] = "Clear";
    ToolType[ToolType["Erase"] = 11] = "Erase";
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
})(ShapeType || (ShapeType = {}));
;
//# sourceMappingURL=tools-types.js.map