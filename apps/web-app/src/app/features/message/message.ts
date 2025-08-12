import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-message',
  imports: [MatIcon],
  templateUrl: './message.html',
  styleUrl: './message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--color]': "'var(--' + type() + ')'",
  },
})
export class Message {
  public readonly type = input.required<
    'success' | 'info' | 'warning' | 'error'
  >();
  public readonly title = input.required<string>();

  public readonly icon = computed(
    () =>
      ((
        {
          success: 'check_circle',
          info: 'info',
          warning: 'warning',
          error: 'error',
        } as const
      )[this.type()])
  );
}
