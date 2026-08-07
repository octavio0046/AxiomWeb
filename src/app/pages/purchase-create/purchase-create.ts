import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
  styleUrl: './purchase-create.scss',
})
export class PurchaseCreate implements OnInit, OnDestroy {
  private readonly suppliersService = inject(SuppliersService);
  private readonly productsService = inject(ProductsService);
  private readonly purchasesService = inject(PurchasesService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroy$ = new Subject<void>();
  private readonly productSearch$ = new Subject<string>();

  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly productResults = signal<Product[]>([]);
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly productQuery = signal('');
  protected readonly showProductMenu = signal(false);
  protected readonly searchingProducts = signal(false);
  protected readonly lines = signal<PurchaseLine[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    supplier_id: ['', Validators.required],
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
      next: (items) => {
        this.suppliers.set(items.filter((s) => s.is_active !== 0));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los proveedores');
      },
    });

    this.productSearch$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.productQuery.set(value);
        this.searchProducts(value);
      });

    this.searchProducts('');

    this.form.controls.tax.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.taxAmount.set(Number(value) || 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.showProductMenu.set(false);
    }
  }

  onProductSearchInput(value: string): void {
    if (this.selectedProduct() && value !== this.selectedProductLabel(this.selectedProduct()!)) {
      this.selectedProduct.set(null);
    }
    this.showProductMenu.set(true);
    this.productSearch$.next(value);
  }

  openProductMenu(): void {
    this.showProductMenu.set(true);
    if (!this.productResults().length) {
      this.searchProducts(this.productQuery());
    }
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.productQuery.set(this.selectedProductLabel(product));
    this.form.patchValue({ unit_cost: Number(product.cost) || 0 });
    this.showProductMenu.set(false);
    this.error.set('');
  }

  clearSelectedProduct(): void {
    this.selectedProduct.set(null);
    this.productQuery.set('');
    this.showProductMenu.set(false);
    this.searchProducts('');
  }

  addLine(): void {
    const product = this.selectedProduct();
    const quantity = Number(this.form.controls.quantity.value);
    const unitCost = Number(this.form.controls.unit_cost.value);

    if (!product || !quantity || quantity <= 0) {
      this.error.set('Selecciona un producto y una cantidad válida');
      return;
    }

    if (product.product_type === 'service') {
      this.error.set('No se puede comprar stock de un servicio');
      return;
    }

    if (Number.isNaN(unitCost) || unitCost < 0) {
      this.error.set('El costo unitario debe ser mayor o igual a 0');
      return;
    }

    this.error.set('');
    this.lines.update((current) => {
      const existing = current.find((line) => line.product_id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product_id === product.id
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

    this.form.patchValue({ quantity: 1 });
    this.clearSelectedProduct();
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

  private searchProducts(query: string): void {
    this.searchingProducts.set(true);
    this.productsService
      .listPaged({
        q: query.trim(),
        field: 'all',
        page: 1,
        pageSize: 15,
        active: 1,
      })
      .subscribe({
        next: (res) => {
          // Compras: solo productos/refacciones (no servicios), máx 10
          const stockable = (res.data ?? [])
            .filter((p) => p.product_type !== 'service')
            .slice(0, 10);
          this.productResults.set(stockable);
          this.searchingProducts.set(false);
        },
        error: () => {
          this.productResults.set([]);
          this.searchingProducts.set(false);
        },
      });
  }

  private selectedProductLabel(product: Product): string {
    return `${product.sku} — ${product.name}`;
  }
}
