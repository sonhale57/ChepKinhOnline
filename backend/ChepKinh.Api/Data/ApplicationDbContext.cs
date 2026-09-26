using Microsoft.EntityFrameworkCore;
using ChepKinh.Api.Models;

namespace ChepKinh.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<Sutra> Sutras => Set<Sutra>();
        public DbSet<SutraPage> SutraPages => Set<SutraPage>();
        public DbSet<UserSutraAttempt> UserSutraAttempts => Set<UserSutraAttempt>();
        public DbSet<UserPageStroke> UserPageStrokes => Set<UserPageStroke>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UserType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.GoogleId).HasMaxLength(100);
            });

            // 2. Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RoleName).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.RoleName).IsUnique();
            });

            // 3. Permission
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PermissionCode).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.PermissionCode).IsUnique();
                entity.Property(e => e.ModuleName).IsRequired().HasMaxLength(50);
            });

            // 4. UserRole (N-N)
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });
                entity.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId).OnDelete(DeleteBehavior.Cascade);
            });

            // 5. RolePermission (N-N)
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });
                entity.HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId).OnDelete(DeleteBehavior.Cascade);
            });

            // 6. Sutra
            modelBuilder.Entity<Sutra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ScriptType).IsRequired().HasMaxLength(30);
            });

            // 7. SutraPage
            modelBuilder.Entity<SutraPage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(p => p.Sutra).WithMany(s => s.Pages).HasForeignKey(p => p.SutraId).OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(p => new { p.SutraId, p.PageNumber }).IsUnique();
            });

            // 8. UserSutraAttempt
            modelBuilder.Entity<UserSutraAttempt>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(a => a.User).WithMany(u => u.Attempts).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Sutra).WithMany(s => s.Attempts).HasForeignKey(a => a.SutraId).OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(a => new { a.UserId, a.SutraId, a.AttemptNumber });
            });

            // 9. UserPageStroke
            modelBuilder.Entity<UserPageStroke>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(ps => ps.Attempt).WithMany(a => a.PageStrokes).HasForeignKey(ps => ps.AttemptId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(ps => ps.Page).WithMany(p => p.PageStrokes).HasForeignKey(ps => ps.PageId).OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(ps => new { ps.AttemptId, ps.PageId });
                entity.HasIndex(ps => new { ps.UserId, ps.PageId });
            });
        }
    }
}
