// TODO: Test if program runs
using LumenPatrons.Api.Data;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowNextJs",
            policy =>
            {
                policy.WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

// Add services to the container.
builder.Services.AddOpenApi();

builder.Services.AddControllers();


var app = builder.Build();

app.UseCors("AllowNextJs");

app.MapControllers();

app.MapGet("/api/v1/status", async (AppDbContext db) =>
{
    // Attempt to ping Supabase
    bool canConnect = await db.Database.CanConnectAsync();

    return new
    {
        service = "LumenPatrons API",
        database = canConnect ? "Connected to Supabase!" : "Database Offline",
        timestamp = DateTime.UtcNow
    };
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
