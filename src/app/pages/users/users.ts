import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { RolesService } from '../../core/services/roles.service';
import { UsersService } from '../../core/services/users.service';
import { Role, UserAccount } from '../../core/models/api.models';

declare const bootstrap: {
  Modal: new (el: Element) => { show: () => void; hide: () => void };
};

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly fb = inject(FormBuilder);

  protected readonly users = signal<UserAccount[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingUser = signal<UserAccount | null>(null);

  protected readonly createForm = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role_id: ['', Validators.required],
    is_active: [true],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role_id: ['', Validators.required],
    password: [''],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.rolesService.list().subscribe({
      next: (items) => this.roles.set(items),
      error: () => this.error.set('No se pudieron cargar los roles'),
    });

    this.usersService.list().subscribe({
      next: (items) => {
        this.users.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los usuarios');
      },
    });
  }

  create(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.createForm.getRawValue();
    this.usersService
      .create({
        full_name: value.full_name,
        username: value.username,
        email: value.email,
        password: value.password,
        role_id: Number(value.role_id),
        is_active: value.is_active ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Usuario creado correctamente');
          this.createForm.reset({
            full_name: '',
            username: '',
            email: '',
            password: '',
            role_id: '',
            is_active: true,
          });
          this.hideModal('userCreateModal');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el usuario');
        },
      });
  }

  openEdit(user: UserAccount): void {
    this.editingUser.set(user);
    this.editForm.reset({
      full_name: user.full_name,
      email: user.email,
      role_id: String(user.role_id),
      password: '',
      is_active: !!user.is_active,
    });
    this.showModal('userEditModal');
  }

  update(): void {
    const user = this.editingUser();
    if (!user || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.editForm.getRawValue();
    const payload: {
      full_name: string;
      email: string;
      role_id: number;
      is_active: number;
      password?: string;
    } = {
      full_name: value.full_name,
      email: value.email,
      role_id: Number(value.role_id),
      is_active: value.is_active ? 1 : 0,
    };

    if (value.password.trim()) {
      payload.password = value.password.trim();
    }

    this.usersService.update(user.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Usuario actualizado correctamente');
        this.hideModal('userEditModal');
        this.editingUser.set(null);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'No se pudo actualizar el usuario');
      },
    });
  }

  toggleActive(user: UserAccount): void {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.usersService
      .update(user.id, { is_active: user.is_active ? 0 : 1 })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(
            user.is_active ? 'Usuario desactivado' : 'Usuario activado'
          );
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo cambiar el estado');
        },
      });
  }

  roleLabel(roleName?: string): string {
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

  private showModal(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      new bootstrap.Modal(el).show();
    }
  }

  private hideModal(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    const dismissBtn = el.querySelector<HTMLButtonElement>('[data-bs-dismiss="modal"]');
    dismissBtn?.click();
  }
}
