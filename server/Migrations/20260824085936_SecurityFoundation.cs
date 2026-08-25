using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LumenPatrons.Api.Migrations
{
    /// <inheritdoc />
    public partial class SecurityFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SavedOpportunities_UserId",
                table: "SavedOpportunities");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_Email",
                table: "UserProfiles",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedOpportunities_UserId_FundingOpportunityId",
                table: "SavedOpportunities",
                columns: new[] { "UserId", "FundingOpportunityId" },
                unique: true);

            migrationBuilder.Sql("""
                ALTER TABLE "FundingOpportunities" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE "SavedOpportunities" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY "funding_opportunities_are_publicly_readable"
                    ON "FundingOpportunities" FOR SELECT TO anon, authenticated
                    USING (true);

                CREATE POLICY "users_can_read_own_profile"
                    ON "UserProfiles" FOR SELECT TO authenticated
                    USING ((SELECT auth.uid()) = "Id");
                CREATE POLICY "users_can_insert_own_profile"
                    ON "UserProfiles" FOR INSERT TO authenticated
                    WITH CHECK ((SELECT auth.uid()) = "Id");
                CREATE POLICY "users_can_update_own_profile"
                    ON "UserProfiles" FOR UPDATE TO authenticated
                    USING ((SELECT auth.uid()) = "Id")
                    WITH CHECK ((SELECT auth.uid()) = "Id");
                CREATE POLICY "users_can_delete_own_profile"
                    ON "UserProfiles" FOR DELETE TO authenticated
                    USING ((SELECT auth.uid()) = "Id");

                CREATE POLICY "users_can_read_own_saved_opportunities"
                    ON "SavedOpportunities" FOR SELECT TO authenticated
                    USING ((SELECT auth.uid()) = "UserId");
                CREATE POLICY "users_can_insert_own_saved_opportunities"
                    ON "SavedOpportunities" FOR INSERT TO authenticated
                    WITH CHECK ((SELECT auth.uid()) = "UserId");
                CREATE POLICY "users_can_update_own_saved_opportunities"
                    ON "SavedOpportunities" FOR UPDATE TO authenticated
                    USING ((SELECT auth.uid()) = "UserId")
                    WITH CHECK ((SELECT auth.uid()) = "UserId");
                CREATE POLICY "users_can_delete_own_saved_opportunities"
                    ON "SavedOpportunities" FOR DELETE TO authenticated
                    USING ((SELECT auth.uid()) = "UserId");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP POLICY IF EXISTS "funding_opportunities_are_publicly_readable" ON "FundingOpportunities";
                DROP POLICY IF EXISTS "users_can_read_own_profile" ON "UserProfiles";
                DROP POLICY IF EXISTS "users_can_insert_own_profile" ON "UserProfiles";
                DROP POLICY IF EXISTS "users_can_update_own_profile" ON "UserProfiles";
                DROP POLICY IF EXISTS "users_can_delete_own_profile" ON "UserProfiles";
                DROP POLICY IF EXISTS "users_can_read_own_saved_opportunities" ON "SavedOpportunities";
                DROP POLICY IF EXISTS "users_can_insert_own_saved_opportunities" ON "SavedOpportunities";
                DROP POLICY IF EXISTS "users_can_update_own_saved_opportunities" ON "SavedOpportunities";
                DROP POLICY IF EXISTS "users_can_delete_own_saved_opportunities" ON "SavedOpportunities";
                ALTER TABLE "FundingOpportunities" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE "UserProfiles" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE "SavedOpportunities" DISABLE ROW LEVEL SECURITY;
                """);

            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_Email",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_SavedOpportunities_UserId_FundingOpportunityId",
                table: "SavedOpportunities");

            migrationBuilder.CreateIndex(
                name: "IX_SavedOpportunities_UserId",
                table: "SavedOpportunities",
                column: "UserId");
        }
    }
}
