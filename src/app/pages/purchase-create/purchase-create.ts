import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductsService } from '../../core/services/products.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { SuppliersService } from '../../core/services/suppliers.service';
import { Product, Supplier } from '../../core/models/api.models';

interface PurchaseLine {
  product_id: number;
  name: string;
  quantity: number;
  unit_cost: number;
}

@Component({
  selector: 'app-purchase-create',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './purchase-create.html',
})
export class PurchaseCreate implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly productsService = inject(ProductsService);
  private readonly purchasesService = inject(PurchasesService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly lines = signal<PurchaseLine[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    supplier_id: ['', Validators.required],
    product_id: [''],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    unit_cost: [0, [Validators.required, Validators.min(0)]],
    tax: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  protected readonly subtotal = computed(() =>
    Number(
      this.lines()
        .reduce((sum, line) => sum + line.unit_cost * line.quantity, 0)
        .toFixed(2)
    )
  );

  protected readonly taxAmount = signal(0);

  protected readonly total = computed(() =>
    Number((this.subtotal() + this.taxAmount()).toFixed(2))
  );

  ngOnInit(): void {
    this.loading.set(true);

    this.suppliersService.list().subscribe({
      next: (items) => this.suppliers.set(items.filter((s) => s.is_active !== 0)),
      error: () => this.error.set('No se pudieron cargar los proveedores'),
    });

    this.productsService.list().subscribe({
      next: (items) => {
        this.products.set(
          items.filter((p) => p.is_active !== 0 && p.product_type !== 'service')
        );
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar los productos');
      },
    });

    this.form.controls.tax.valueChanges.subscribe((value) => {
      this.taxAmount.set(Number(value) || 0);
    });
  }

  onProductChange(): void {
    const productId = Number(this.form.controls.product_id.value);
    const product = this.products().find((p) => p.id === productId);
    if (product) {
      this.form.patchValue({ unit_cost: Number(product.cost) || 0 });
    }
  }

  addLine(): void {
    const productId = Number(this.form.controls.product_id.value);
    const quantity = Number(this.form.controls.quantity.value);
    const unitCost = Number(this.form.controls.unit_cost.value);

    if (!productId || !quantity || quantity <= 0) {
      this.error.set('Selecciona un producto y una cantidad válida');
      return;
    }

    if (Number.isNaN(unitCost) || unitCost < 0) {
      this.error.set('El costo unitario debe ser mayor o igual a 0');
      return;
    }

    const product = this.products().find((p) => p.id === productId);
    if (!product) {
      this.error.set('Producto no encontrado');
      return;
    }

    this.error.set('');
    this.lines.update((current) => {
      const existing = current.find((line) => line.product_id === productId);
      if (existing) {
        return current.map((line) =>
          line.product_id === productId
            ? {
                ...line,
                quantity: line.quantity + quantity,
                unit_cost: unitCost,
              }
            : line
        );
      }

      return [
        ...current,
        {
          product_id: product.id,
          name: product.name,
          quantity,
          unit_cost: unitCost,
        },
      ];
    });

    this.form.patchValue({ product_id: '', quantity: 1 });
  }

  removeLine(productId: number): void {
    this.lines.update((current) => current.filter((line) => line.product_id !== productId));
  }

  submit(): void {
    if (this.form.controls.supplier_id.invalid) {
      this.form.controls.supplier_id.markAsTouched();
      this.error.set('Selecciona un proveedor');
      return;
    }

    if (this.lines().length === 0) {
      this.error.set('Agrega al menos un producto a la compra');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.purchasesService
      .create({
        supplier_id: Number(this.form.controls.supplier_id.value),
        tax: Number(this.form.controls.tax.value) || 0,
        notes: this.form.controls.notes.value || null,
        items: this.lines().map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
        })),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          void this.router.navigate(['/purchases', res.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo registrar la compra');
        },
      });
  }
}
