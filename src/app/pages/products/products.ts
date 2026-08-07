import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CategoriesService } from '../../core/services/categories.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Category,
  Product,
  ProductSearchField,
  ProductType,
} from '../../core/models/api.models';
import { hideBootstrapModal, showBootstrapModal } from '../../core/utils/bootstrap-modal';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './products.html',
})
export class Products implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingProduct = signal<Product | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly searchField = signal<ProductSearchField>('all');
  protected readonly searchText = signal('');

  protected readonly pageNumbers = computed(() => {
    const current = this.page();
    const total = this.totalPages();
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (!total) return '0 resultados';
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), total);
    return `${from}-${to} de ${total}`;
  });

  protected readonly searchFields: { value: ProductSearchField; label: string }[] = [
    { value: 'all', label: 'Todos los campos' },
    { value: 'sku', label: 'SKU' },
    { value: 'name', label: 'Nombre' },
    { value: 'category', label: 'Categoría' },
    { value: 'type', label: 'Tipo' },
    { value: 'status', label: 'Estado' },
  ];

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
    this.categoriesService.list().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.error.set('No se pudieron cargar las categorías'),
    });

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchText.set(value);
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.productsService
      .listPaged({
        q: this.searchText(),
        field: this.searchField(),
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.page.set(res.meta?.page ?? 1);
          this.pageSize.set(res.meta?.pageSize ?? 10);
          this.totalPages.set(res.meta?.totalPages ?? 1);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'No se pudieron cargar los productos');
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onSearchFieldChange(value: string): void {
    this.searchField.set((value as ProductSearchField) || 'all');
    this.page.set(1);
    this.load();
  }

  clearSearch(): void {
    this.searchText.set('');
    this.searchField.set('all');
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  onPageSizeChange(value: string): void {
    const size = Number(value) || 10;
    this.pageSize.set(size);
    this.page.set(1);
    this.load();
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

  openCreate(): void {
    if (!this.canManageProducts()) return;
    this.createForm.reset({
      sku: '',
      name: '',
      category_id: '',
      product_type: 'product',
      price: 0,
      cost: 0,
    });
    this.showModal('productCreateModal');
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
    showBootstrapModal(id);
  }

  private hideModal(id: string): void {
    hideBootstrapModal(id);
  }
}
