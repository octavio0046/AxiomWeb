import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PurchasesService } from '../../core/services/purchases.service';
import { PurchaseDetail } from '../../core/models/api.models';

@Component({
  selector: 'app-purchase-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './purchase-detail.html',
})
export class PurchaseDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly purchasesService = inject(PurchasesService);

  protected readonly purchase = signal<PurchaseDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Compra no válida');
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.purchasesService.getById(id).subscribe({
      next: (data) => {
        this.purchase.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el detalle de la compra');
      },
    });
  }
}
