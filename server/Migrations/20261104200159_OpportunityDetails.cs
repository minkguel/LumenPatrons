using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LumenPatrons.Api.Migrations
{
    /// <inheritdoc />
    public partial class OpportunityDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MinimumAmount",
                table: "FundingOpportunities",
                newName: "EstimatedAmount");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "FundingOpportunities",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "FundingOpportunities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Eligibility",
                table: "FundingOpportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "FundingOpportunities",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Open");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "FundingOpportunities");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "FundingOpportunities");

            migrationBuilder.DropColumn(
                name: "Eligibility",
                table: "FundingOpportunities");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "FundingOpportunities");

            migrationBuilder.RenameColumn(
                name: "EstimatedAmount",
                table: "FundingOpportunities",
                newName: "MinimumAmount");
        }
    }
}
