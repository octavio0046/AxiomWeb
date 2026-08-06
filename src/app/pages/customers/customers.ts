import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersService } from '../../core/services/customers.service';
import { Customer } from '../../core/models/api.models';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly fb = inject(FormBuilder);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    document_number: [''],
    phone: [''],
    email: [''],
  });

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.form.getRawValue();
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
          this.form.reset({
            name: '',
            document_number: '',
            phone: '',
            email: '',
          });
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el cliente');
        },
      });
  }
}
