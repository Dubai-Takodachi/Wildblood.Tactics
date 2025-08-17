namespace Wildblood.Tactics.Data
{
    using System.Text.Json;
    using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.ChangeTracking;
    using Wildblood.Tactics.Entities;
    using Wildblood.Tactics.Mappings;

    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
    {
        public DbSet<PlayerSetup> PlayerSetups { get; set; }

        public DbSet<RaidSetup> RaidSetups { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure PlayerSetup entity
            modelBuilder.Entity<PlayerSetup>(entity =>
            {
                entity.Property(e => e.Index).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
                entity.Property(e => e.Class).HasConversion<int>();
                entity.Property(e => e.Influence).IsRequired();
                entity.HasKey(e => new { e.Index, e.RaidId });

                // Configure Units as JSON - Fixed column type
                entity.Property(e => e.Units)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v.Select(u => (int)u.Name).ToList(), (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                            .Select(unitName => UnitDataSet.Entries.First(u => (int)u.Name == unitName))
                            .ToList())
                    .Metadata.SetValueComparer(new ValueComparer<List<Unit>>(
                            (c1, c2) => c1.SequenceEqual(c2),
                            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                            c => c.ToList()));

                // Link to ApplicationUser
                entity.Property(e => e.RaidId).IsRequired();
                entity.HasOne<RaidSetup>()
                    .WithMany()
                    .HasForeignKey(e => e.RaidId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RaidSetup>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.UserId).IsRequired();
                entity.HasOne<ApplicationUser>()
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
