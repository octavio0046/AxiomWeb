import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.full_name || user?.username || 'Usuario';
  }

  can(...codes: string[]): boolean {
    return this.auth.hasPermission(...codes);
  }
}
