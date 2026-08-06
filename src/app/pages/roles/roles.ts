import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PermissionsService } from '../../core/services/permissions.service';
import { RolesService } from '../../core/services/roles.service';
import { Permission, Role } from '../../core/models/api.models';

@Component({
  selector: 'app-roles',
  imports: [RouterLink],
  templateUrl: './roles.html',
})
export class RolesPage implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly permissionsService = inject(PermissionsService);

  protected readonly roles = signal<Role[]>([]);
  protected readonly allPermissions = signal<Permission[]>([]);
  protected readonly selectedRoleId = signal<number | null>(null);
  protected readonly selectedIds = signal<Set<number>>(new Set());
  protected readonly loading = signal(false);
  protected readonly loadingRole = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly selectedRole = computed(() => {
    const id = this.selectedRoleId();
    return this.roles().find((role) => role.id === id) ?? null;
  });

  protected readonly permissionsByModule = computed(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of this.allPermissions()) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }
    return [...groups.entries()].map(([module, permissions]) => ({
      module,
      label: this.moduleLabel(module),
      permissions,
    }));
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.error.set('');

    this.permissionsService.list().subscribe({
      next: (items) => this.allPermissions.set(items),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'No se pudieron cargar los permisos');
      },
    });

    this.rolesService.list().subscribe({
      next: (items) => {
        this.roles.set(items);
        this.loading.set(false);
        if (items.length && this.selectedRoleId() == null) {
          this.selectRole(items[0].id);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los roles');
      },
    });
  }

  selectRole(roleId: number): void {
    this.selectedRoleId.set(roleId);
    this.loadingRole.set(true);
    this.error.set('');
    this.success.set('');

    this.rolesService.getPermissions(roleId).subscribe({
      next: (data) => {
        this.selectedIds.set(new Set(data.permission_ids));
        this.loadingRole.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingRole.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los permisos del rol');
      },
    });
  }

  togglePermission(permissionId: number, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(permissionId);
    } else {
      next.delete(permissionId);
    }
    this.selectedIds.set(next);
  }

  isChecked(permissionId: number): boolean {
    return this.selectedIds().has(permissionId);
  }

  isLocked(permission: Permission): boolean {
    return this.selectedRole()?.name === 'admin' && permission.code === 'users.manage';
  }

  selectAllInModule(module: string): void {
    const next = new Set(this.selectedIds());
    for (const permission of this.allPermissions()) {
      if (permission.module === module) {
        next.add(permission.id);
      }
    }
    this.selectedIds.set(next);
  }

  clearModule(module: string): void {
    const next = new Set(this.selectedIds());
    for (const permission of this.allPermissions()) {
      if (permission.module === module && !this.isLocked(permission)) {
        next.delete(permission.id);
      }
    }
    this.selectedIds.set(next);
  }

  save(): void {
    const roleId = this.selectedRoleId();
    if (roleId == null) return;

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.rolesService.updatePermissions(roleId, [...this.selectedIds()]).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(
          'Permisos guardados. Los usuarios con este rol deben volver a iniciar sesión para ver los cambios.'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'No se pudieron guardar los permisos');
      },
    });
  }

  roleLabel(roleName?: string | null): string {
    switch (roleName) {
      case 'admin':
        return 'Administrador';
      case 'cashier':
        return 'Vendedor';
      case 'purchaser':
        return 'Comprador';
      case 'supervisor':
        return 'Supervisor';
      default:
        return roleName || '—';
    }
  }

  moduleLabel(module: string): string {
    switch (module) {
      case 'dashboard':
        return 'Inicio';
      case 'products':
        return 'Productos';
      case 'customers':
        return 'Clientes';
      case 'users':
        return 'Usuarios';
      case 'suppliers':
        return 'Proveedores';
      case 'purchases':
        return 'Compras';
      case 'sales':
        return 'Ventas';
      default:
        return module;
    }
  }
}
