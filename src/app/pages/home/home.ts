import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.full_name || user?.username || 'Usuario';
  }
}
