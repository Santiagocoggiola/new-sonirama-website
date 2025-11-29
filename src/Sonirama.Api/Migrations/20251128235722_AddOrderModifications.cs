using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sonirama.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderModifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModificationReason",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModifiedByUserId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalTotal",
                table: "Orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginalQuantity",
                table: "OrderItems",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModificationReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ModifiedAtUtc",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ModifiedByUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OriginalTotal",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OriginalQuantity",
                table: "OrderItems");
        }
    }
}
