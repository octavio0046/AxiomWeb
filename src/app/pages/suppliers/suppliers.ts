import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SuppliersService } from '../../core/services/suppliers.service';
import { Supplier } from '../../core/models/api.models';

@Component({
  selector: 'app-suppliers',
  imports: [ReactiveFormsModule],
  templateUrl: './suppliers.html',
})
export class Suppliers implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly fb = inject(FormBuilder);

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
    address: [''],
  });

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.form.getRawValue();
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
          this.form.reset({
            name: '',
            document_number: '',
            phone: '',
            email: '',
            address: '',
          });
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el proveedor');
        },
      });
  }
}
