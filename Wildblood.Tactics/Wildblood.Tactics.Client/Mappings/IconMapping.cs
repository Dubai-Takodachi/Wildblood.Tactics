namespace Wildblood.Tactics.Mappings;

using Wildblood.Tactics.Models.Tools;

public static class IconMapping
{
    public static readonly string BlazorBasePath = "ConquerorsBladeData/Units/";

    public static Dictionary<IconType, string> FileNameByIconType { get; } =
        new()
        {
            [IconType.Azaps] = "Azaps.png",
            [IconType.BlueShields] = "Blue-Shields.png",
            [IconType.CamelLancers] = "Camel-Lancers.png",
            [IconType.Claymores] = "Claymores.png",
            [IconType.Cocos] = "Cocos.png",
            [IconType.DaggerAxeLancers] = "Dagger-Axe-Lancers.png",
            [IconType.DemenseSpearmen] = "Demense-Spearmen.png",
            [IconType.Falconetti] = "Falconetti.png",
            [IconType.Fortes] = "Fortes.png",
            [IconType.HalberdierSergeant] = "Halberdier-Sergeant.png",
            [IconType.Halberdiers] = "Halberdiers.png",
            [IconType.Hussars] = "Hussars.png",
            [IconType.ImperialArquebusiers] = "Imperial-Arquebusiers.png",
            [IconType.ImperialPikeMen] = "Imperial-Pike-Men.png",
            [IconType.ImperialSpearGuard] = "Imperial-Spear-Guard.png",
            [IconType.IronReaper] = "Iron-Reaper.png",
            [IconType.IroncapScouts] = "Ironcap-Scouts.png",
            [IconType.JavSergeants] = "Jav-Sergeants.png",
            [IconType.Kriegsbruders] = "Kriegsbruders.png",
            [IconType.Lionroarcrew] = "Lionroar-crew.png",
            [IconType.MaceSergeants] = "Mace-Sergeants.png",
            [IconType.Martes] = "Martes.png",
            [IconType.MenAtArms] = "Men-At-Arms.png",
            [IconType.Modao] = "Modao.png",
            [IconType.Monastics] = "Monastics.png",
            [IconType.Myrmillos] = "Myrmillos.png",
            [IconType.Namkahn] = "Namkahn.png",
            [IconType.OnnaMusha] = "Onna-Musha.png",
            [IconType.OrochiSamurai] = "Orochi-Samurai.png",
            [IconType.Outrider] = "Outrider.png",
            [IconType.PalaceGuards] = "Palace-Guards.png",
            [IconType.Percevals] = "Percevals.png",
            [IconType.PrefectureGuards] = "Prefecture-Guards.png",
            [IconType.PrefecturePikemen] = "Prefecture-Pikemen.png",
            [IconType.QueensKnights] = "Queens-Knights.png",
            [IconType.RattanArchers] = "Rattan-Archers.png",
            [IconType.RattanMarksmen] = "Rattan-Marksmen.png",
            [IconType.RattanPikemen] = "Rattan-Pikemen.png",
            [IconType.Selemchids] = "Selemchids.png",
            [IconType.Shenji] = "Shenji.png",
            [IconType.Siladars] = "Siladars.png",
            [IconType.Siphonarioi] = "Siphonarioi.png",
            [IconType.SonsOfFenrir] = "sons-of-fenrir.png",
            [IconType.SunwardPhalanx] = "Sunward-Phalanx.png",
            [IconType.WuweiPikes] = "Wuwei-Pikes.png",
            [IconType.WuxingPikemen] = "Wuxing-Pikemen.png",
            [IconType.Xuanjia] = "Xuanjia.png",
            [IconType.YanyuedaoCavalry] = "Yanyuedao-Cavalry.png",
            [IconType.Zweihander] = "Zweihander.png",
        };
}
