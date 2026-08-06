import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { Purchase } from '../../core/models/api.models';

@Component({
  selector: 'app-purchases',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './purchases.html',
})

export class Purchases implements OnInit {
  private readonly purchasesService = inject(PurchasesService);
  private readonly auth = inject(AuthService);

  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected canCreatePurchases(): boolean {
    return this.auth.hasPermission('purchases.create');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.purchasesService.list().subscribe({
      next: (items) => {
        this.purchases.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar las compras');
      },
    });
  }
}
