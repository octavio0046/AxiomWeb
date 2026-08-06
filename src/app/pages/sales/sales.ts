import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { SalesService } from '../../core/services/sales.service';
import { Sale } from '../../core/models/api.models';

@Component({
  selector: 'app-sales',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './sales.html',
})
export class Sales implements OnInit {
  private readonly salesService = inject(SalesService);
  private readonly auth = inject(AuthService);

  protected readonly sales = signal<Sale[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected canCreateSales(): boolean {
    return this.auth.hasPermission('sales.create');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.salesService.list().subscribe({
      next: (items) => {
        this.sales.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar las ventas');
      },
    });
  }
}
