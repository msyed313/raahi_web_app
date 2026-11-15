import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DriverAuthService } from '../../core/auth/driver-auth.service';
import { Icon } from '../../shared/icon';
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  selector: 'app-driver-shell',
  styles: ``,
  templateUrl: './driver-shell.html',
})
export class DriverShell {
  readonly auth = inject(DriverAuthService);
}