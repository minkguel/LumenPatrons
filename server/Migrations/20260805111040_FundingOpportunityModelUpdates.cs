using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LumenPatrons.Api.Migrations
{
    /// <inheritdoc />
    public partial class FundingOpportunityModelUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "FundingOpportunities");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Deadline",
                table: "FundingOpportunities",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.Sql(
                "ALTER TABLE \"FundingOpportunities\" ALTER COLUMN \"Category\" TYPE text[] USING ARRAY[\"Category\"];");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "Deadline",
                table: "FundingOpportunities",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.Sql(
                "ALTER TABLE \"FundingOpportunities\" ALTER COLUMN \"Category\" TYPE text USING (\"Category\")[1];");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "FundingOpportunities",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
