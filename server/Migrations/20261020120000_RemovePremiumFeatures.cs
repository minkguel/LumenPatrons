using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LumenPatrons.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemovePremiumFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IsPremiumOnly was already dropped by hand in Supabase; IF EXISTS keeps this safe everywhere.
            migrationBuilder.Sql("""
                ALTER TABLE "FundingOpportunities" DROP COLUMN IF EXISTS "IsPremiumOnly";
                """);

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "SubscriptionTier",
                table: "UserProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPremiumOnly",
                table: "FundingOpportunities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "UserProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionTier",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "Free");
        }
    }
}
