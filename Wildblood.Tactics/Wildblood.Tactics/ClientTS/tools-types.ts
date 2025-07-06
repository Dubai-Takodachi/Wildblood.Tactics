export type ToolType = 'AddIcon' | 'Move' | 'Resize' | 'DrawFree' | 'DrawLine' | 'DrawCurve' | 'AddText' | 'Undo' | 'Redo' | 'Clear' | 'Erase';
export enum LineStyle { Normal, Dashed, Dotted };
export enum LineEnd { Normal, Arrow, Flat };
export type ShapeType = 'Square' | 'Circle';

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