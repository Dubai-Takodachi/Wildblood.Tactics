using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wildblood.Tactics.Migrations
{
    /// <inheritdoc />
    public partial class CreateRaidSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerSetups_AspNetUsers_UserId",
                table: "PlayerSetups");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PlayerSetups",
                table: "PlayerSetups");

            migrationBuilder.DropIndex(
                name: "IX_PlayerSetups_UserId",
                table: "PlayerSetups");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "PlayerSetups");

            migrationBuilder.AddColumn<int>(
                name: "RaidId",
                table: "PlayerSetups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_PlayerSetups",
                table: "PlayerSetups",
                columns: new[] { "Index", "RaidId" });

            migrationBuilder.CreateTable(
                name: "RaidSetups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaidSetups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaidSetups_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSetups_RaidId",
                table: "PlayerSetups",
                column: "RaidId");

            migrationBuilder.CreateIndex(
                name: "IX_RaidSetups_UserId",
                table: "RaidSetups",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerSetups_RaidSetups_RaidId",
                table: "PlayerSetups",
                column: "RaidId",
                principalTable: "RaidSetups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerSetups_RaidSetups_RaidId",
                table: "PlayerSetups");

            migrationBuilder.DropTable(
                name: "RaidSetups");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PlayerSetups",
                table: "PlayerSetups");

            migrationBuilder.DropIndex(
                name: "IX_PlayerSetups_RaidId",
                table: "PlayerSetups");

            migrationBuilder.DropColumn(
                name: "RaidId",
                table: "PlayerSetups");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "PlayerSetups",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PlayerSetups",
                table: "PlayerSetups",
                column: "Index");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSetups_UserId",
                table: "PlayerSetups",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerSetups_AspNetUsers_UserId",
                table: "PlayerSetups",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
