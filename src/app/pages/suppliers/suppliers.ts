import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { SuppliersService } from '../../core/services/suppliers.service';
import { Supplier } from '../../core/models/api.models';
import { hideBootstrapModal, showBootstrapModal } from '../../core/utils/bootstrap-modal';

@Component({
  selector: 'app-suppliers',
  imports: [ReactiveFormsModule],
  templateUrl: './suppliers.html',
})
export class Suppliers implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingSupplier = signal<Supplier | null>(null);

  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
    address: [''],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
    address: [''],
    is_active: [true],
  });

  protected canManageSuppliers(): boolean {
    return this.auth.hasPermission('suppliers.manage');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.suppliersService.list().subscribe({
      next: (items) => {
        this.suppliers.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los proveedores');
      },
    });
  }

  create(): void {
    if (!this.canManageSuppliers() || this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.createForm.getRawValue();
    this.suppliersService
      .create({
        name: value.name,
        document_number: value.document_number || null,
        phone: value.phone || null,
        email: value.email || null,
        address: value.address || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Proveedor creado correctamente');
          this.createForm.reset({
            name: '',
            document_number: '',
            phone: '',
            email: '',
            address: '',
          });
          this.hideModal('supplierCreateModal');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el proveedor');
        },
      });
  }

  openCreate(): void {
    if (!this.canManageSuppliers()) return;
    this.createForm.reset({
      name: '',
      document_number: '',
      phone: '',
      email: '',
      address: '',
    });
    this.showModal('supplierCreateModal');
  }

  openEdit(supplier: Supplier): void {
    if (!this.canManageSuppliers()) return;

    this.editingSupplier.set(supplier);
    this.editForm.reset({
      name: supplier.name,
      document_number: supplier.document_number || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      is_active: supplier.is_active !== 0,
    });
    this.showModal('supplierEditModal');
  }

  update(): void {
    const supplier = this.editingSupplier();
    if (!supplier || !this.canManageSuppliers() || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.editForm.getRawValue();
    this.suppliersService
      .update(supplier.id, {
        name: value.name,
        document_number: value.document_number || null,
        phone: value.phone || null,
        email: value.email || null,
        address: value.address || null,
        is_active: value.is_active ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Proveedor actualizado correctamente');
          this.hideModal('supplierEditModal');
          this.editingSupplier.set(null);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo actualizar el proveedor');
        },
      });
  }

  private showModal(id: string): void {
    showBootstrapModal(id);
  }

  private hideModal(id: string): void {
    hideBootstrapModal(id);
  }
}
