export enum ToolType { AddIcon, Move, DrawFree, DrawLine, DrawCurve, AddText, AddShape, Undo, Redo, Erase, Ping };
export enum LineStyle { Normal, Dashed, Dotted };
export enum LineEnd { Normal, Arrow, Flat };
export enum ShapeType { Circle, Square, Polygon };

export type Point = {
    x: number;
    y: number;
};

export interface Entity {
    id: string;
    toolType: ToolType;
    position: Point;
    path?: Point[];
    iconType?: string;
    lineStyle?: LineStyle;
    lineEnd?: LineEnd;
    shapeType?: ShapeType;
    primarySize?: number;
    secondarySize?: number;
    primaryColor?: string;
    secondaryColor?: string;
    text?: string;
    hasBackground?: boolean;
}

export interface ToolOptions {
    tool?: ToolType;
    iconOptions?: IconOptions;
    freeDrawOptions?: LineOptions;
    lineDrawOptions?: LineOptions;
    curveDrawOptions?: LineOptions;
    shapeOptions?: ShapeOptions;
    textOptions?: TextOptions;
}

export interface IconOptions {
    iconType: string;
    iconSize: number;
    labelOptions: TextOptions;
}

export interface LineOptions {
    color: string;
    thickness: number;
    endSize: number;
    lineStyle: LineStyle;
    lineEnd: LineEnd;
}

export interface ShapeOptions {
    shapeType: ShapeType;
    outlineColor: string;
    outlineTransparancy: number;
    outlineThickness: number;
    outlineStyle: LineStyle;
    fillColor: string;
    fillTransparancy: number;
}

export interface TextOptions {
    text: string;
    size: number;
    color: string;
    hasBackground: boolean;
    backgroundColor: string;
}