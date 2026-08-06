import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { CustomersService } from '../../core/services/customers.service';
import { Customer } from '../../core/models/api.models';
import { hideBootstrapModal, showBootstrapModal } from '../../core/utils/bootstrap-modal';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingCustomer = signal<Customer | null>(null);

  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
    is_active: [true],
  });

  protected canManageCustomers(): boolean {
    return this.auth.hasPermission('customers.manage');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.customersService.list().subscribe({
      next: (items) => {
        this.customers.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los clientes');
      },
    });
  }

  create(): void {
    if (!this.canManageCustomers() || this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.createForm.getRawValue();
    this.customersService
      .create({
        name: value.name,
        document_number: value.document_number || null,
        phone: value.phone || null,
        email: value.email || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Cliente creado correctamente');
          this.createForm.reset({
            name: '',
            document_number: '',
            phone: '',
            email: '',
          });
          this.hideModal('customerCreateModal');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el cliente');
        },
      });
  }

  openCreate(): void {
    if (!this.canManageCustomers()) return;
    this.createForm.reset({
      name: '',
      document_number: '',
      phone: '',
      email: '',
    });
    this.showModal('customerCreateModal');
  }

  openEdit(customer: Customer): void {
    if (!this.canManageCustomers()) return;

    this.editingCustomer.set(customer);
    this.editForm.reset({
      name: customer.name,
      document_number: customer.document_number || '',
      phone: customer.phone || '',
      email: customer.email || '',
      is_active: customer.is_active !== 0,
    });
    this.showModal('customerEditModal');
  }

  update(): void {
    const customer = this.editingCustomer();
    if (!customer || !this.canManageCustomers() || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.editForm.getRawValue();
    this.customersService
      .update(customer.id, {
        name: value.name,
        document_number: value.document_number || null,
        phone: value.phone || null,
        email: value.email || null,
        is_active: value.is_active ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Cliente actualizado correctamente');
          this.hideModal('customerEditModal');
          this.editingCustomer.set(null);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo actualizar el cliente');
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
