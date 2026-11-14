using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LumenPatrons.Api.Migrations
{
    /// <inheritdoc />
    public partial class SavedStatusSimplify : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"SavedOpportunities\" SET \"Status\" = 'Submitted' WHERE \"Status\" = 'Applied';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
