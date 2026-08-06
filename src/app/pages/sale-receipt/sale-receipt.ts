import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SalesService } from '../../core/services/sales.service';
import { SaleDetail } from '../../core/models/api.models';

@Component({
  selector: 'app-sale-receipt',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './sale-receipt.html',
  styleUrl: './sale-receipt.scss',
})
export class SaleReceipt implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly salesService = inject(SalesService);

  protected readonly sale = signal<SaleDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Venta no válida');
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.salesService.getById(id).subscribe({
      next: (data) => {
        this.sale.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el recibo');
      },
    });
  }

  print(): void {
    window.print();
  }

  paymentLabel(method: string): string {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      default:
        return method;
    }
  }
}
