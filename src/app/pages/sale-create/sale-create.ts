import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersService } from '../../core/services/customers.service';
import { ProductsService } from '../../core/services/products.service';
import { SalesService } from '../../core/services/sales.service';
import { Customer, PaymentMethod, Product } from '../../core/models/api.models';

interface CartLine {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-sale-create',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './sale-create.html',
})
export class SaleCreate implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly lines = signal<CartLine[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    customer_id: [''],
    product_id: [''],
    quantity: [1, [Validators.required, Validators.min(1)]],
    payment_method: ['cash' as PaymentMethod, Validators.required],
    tax: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly subtotal = computed(() =>
    Number(
      this.lines()
        .reduce((sum, line) => sum + line.price * line.quantity, 0)
        .toFixed(2)
    )
  );

  protected readonly taxAmount = signal(0);

  protected readonly total = computed(() =>
    Number((this.subtotal() + this.taxAmount()).toFixed(2))
  );

  ngOnInit(): void {
    this.loading.set(true);

    this.customersService.list().subscribe({
      next: (items) => this.customers.set(items),
      error: () => this.error.set('No se pudieron cargar los clientes'),
    });

    this.productsService.list().subscribe({
      next: (items) => {
        this.products.set(items);
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

  addLine(): void {
    const productId = Number(this.form.controls.product_id.value);
    const quantity = Number(this.form.controls.quantity.value);

    if (!productId || !quantity || quantity <= 0) {
      this.error.set('Selecciona un producto y una cantidad válida');
      return;
    }

    const product = this.products().find((p) => p.id === productId);
    if (!product) {
      this.error.set('Producto no encontrado');
      return;
    }

    const currentQty =
      this.lines().find((line) => line.product_id === productId)?.quantity || 0;
    const requestedQty = currentQty + quantity;
    const availableStock = Number(product.stock);

    if (product.product_type !== 'service') {
      if (availableStock <= 0) {
        this.error.set(
          `Sin existencias para "${product.name}". Registra una compra antes de vender.`
        );
        return;
      }
      if (requestedQty > availableStock) {
        this.error.set(
          `Stock insuficiente para "${product.name}". Disponible: ${availableStock}`
        );
        return;
      }
    }

    this.error.set('');
    this.lines.update((current) => {
      const existing = current.find((line) => line.product_id === productId);
      if (existing) {
        return current.map((line) =>
          line.product_id === productId
            ? { ...line, quantity: line.quantity + quantity }
            : line
        );
      }
      return [
        ...current,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
        },
      ];
    });

    this.form.patchValue({ product_id: '', quantity: 1 });
  }

  removeLine(productId: number): void {
    this.lines.update((current) => current.filter((line) => line.product_id !== productId));
  }

  submit(): void {
    if (this.lines().length === 0) {
      this.error.set('Agrega al menos un producto a la venta');
      return;
    }

    const paymentMethod = this.form.controls.payment_method.value;
    const tax = Number(this.form.controls.tax.value) || 0;
    const customerRaw = this.form.controls.customer_id.value;
    const customerId = customerRaw ? Number(customerRaw) : null;
    const total = this.total();

    this.saving.set(true);
    this.error.set('');

    this.salesService
      .create({
        customer_id: customerId,
        tax,
        items: this.lines().map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
        })),
        payments: [{ method: paymentMethod, amount: total }],
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          void this.router.navigate(['/sales', res.id, 'recibo']);
        },

        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo registrar la venta');
        },
      });
  }
}
