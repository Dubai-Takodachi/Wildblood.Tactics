export type ToolType = 'AddIcon' | 'Move' | 'Resize' | 'DrawFree' | 'DrawLine' | 'DrawCurve' | 'AddText' | 'Undo' | 'Redo' | 'Clear' | 'Erase';
export type IconType = 'Azaps' | 'BlueShields' | 'CamelLancers' | 'Claymores' | 'Cocos' | 'DaggerAxeLancers' | 'DemenseSpearmen' | 'Falconetti' | 'Fortes' | 'HalberdierSergeant' | 'Halberdiers' | 'Hussars' | 'ImperialArquebusiers' | 'ImperialPikeMen' | 'ImperialSpearGuard' | 'IronReaper' | 'IroncapScouts' | 'JavSergeants' | 'Kriegsbruders' | 'Lionroarcrew' | 'MaceSergeants' | 'Martes' | 'MenAtArms' | 'Modao' | 'Monastics' | 'Myrmillos' | 'Namkahn' | 'OnnaMusha' | 'OrochiSamurai' | 'Outrider' | 'PalaceGuards' | 'Percevals' | 'PrefectureGuards' | 'PrefecturePikemen' | 'QueensKnights' | 'RattanArchers' | 'RattanMarksmen' | 'RattanPikemen' | 'Selemchids' | 'Shenji' | 'Siladars' | 'Siphonarioi' | 'SonsOfFenrir' | 'SunwardPhalanx' | 'WuweiPikes' | 'WuxingPikemen' | 'Xuanjia' | 'YanyuedaoCavalry' | 'Zweihander';
export type LineStyle = 'Normal' | 'Dashed' | 'Dotted';
export type LineEnd = 'Normal' | 'Arrow' | 'Flat';
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
    iconType: IconType;
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