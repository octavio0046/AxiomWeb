import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoriesService } from '../../core/services/categories.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth.service';
import { Category, Product, ProductType } from '../../core/models/api.models';

declare const bootstrap: {
  Modal: new (el: Element) => { show: () => void; hide: () => void };
};

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingProduct = signal<Product | null>(null);

  protected readonly productTypes: { value: ProductType; label: string }[] = [
    { value: 'product', label: 'Producto' },
    { value: 'spare_part', label: 'Refacción' },
    { value: 'service', label: 'Servicio' },
  ];

  protected readonly createForm = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category_id: ['', Validators.required],
    product_type: ['product' as ProductType, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    cost: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category_id: ['', Validators.required],
    product_type: ['product' as ProductType, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    cost: [0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  protected canManageProducts(): boolean {
    return this.auth.hasPermission('products.manage');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.categoriesService.list().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.error.set('No se pudieron cargar las categorías'),
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
  }

  create(): void {
    if (!this.canManageProducts() || this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.createForm.getRawValue();
    this.productsService
      .create({
        sku: value.sku,
        name: value.name,
        category_id: Number(value.category_id),
        product_type: value.product_type,
        price: Number(value.price),
        cost: Number(value.cost),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set(
            'Producto creado con stock 0. Registra una compra para ingresar existencias.'
          );
          this.createForm.reset({
            sku: '',
            name: '',
            category_id: '',
            product_type: 'product',
            price: 0,
            cost: 0,
          });
          this.hideModal('productCreateModal');
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo crear el producto');
        },
      });
  }

  openEdit(product: Product): void {
    if (!this.canManageProducts()) return;

    this.editingProduct.set(product);
    this.editForm.reset({
      sku: product.sku,
      name: product.name,
      category_id: String(product.category_id),
      product_type: product.product_type,
      price: Number(product.price),
      cost: Number(product.cost),
      is_active: product.is_active !== 0,
    });
    this.showModal('productEditModal');
  }

  update(): void {
    const product = this.editingProduct();
    if (!product || !this.canManageProducts() || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const value = this.editForm.getRawValue();
    this.productsService
      .update(product.id, {
        sku: value.sku,
        name: value.name,
        category_id: Number(value.category_id),
        product_type: value.product_type,
        price: Number(value.price),
        cost: Number(value.cost),
        is_active: value.is_active ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Producto actualizado correctamente');
          this.hideModal('productEditModal');
          this.editingProduct.set(null);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.message || 'No se pudo actualizar el producto');
        },
      });
  }

  typeLabel(type: ProductType): string {
    return this.productTypes.find((t) => t.value === type)?.label || type;
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
